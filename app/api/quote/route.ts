import { NextResponse } from "next/server";
import { z } from "zod";
import { saveLead } from "@/lib/leads";
import {
  acquireRatePermit,
  readBoundedRequestJson,
  secureJsonHeaders,
} from "@/lib/logestechs/request-security";
import { notifyNewLead } from "@/lib/notifications/lead-alert";

const schema = z.object({
  name: z.string().min(2),
  company: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  message: z.string().min(10),
});

function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

/**
 * نموذج «اطلب عرض سعر» — مسار عام بلا مصادقة، ويُطلق الآن بريداً صادراً عند كل طلب.
 * لذلك يلزمه حدّ معدل على مستوى IP: بدونه يتحول النموذج إلى مضخة إرسال مجانية
 * (إغراق صندوق المبيعات، واستهلاك حصة مزوّد البريد، وتلويث جدول العملاء المحتملين).
 */
export async function POST(request: Request) {
  const permit = acquireRatePermit(`quote:ip:${clientIp(request)}`, 5, 2);
  if (!permit.ok) {
    return NextResponse.json(
      { error: "RATE_LIMITED", message: "محاولات كثيرة، حاول بعد قليل." },
      { status: 429, headers: { ...secureJsonHeaders, "Retry-After": String(permit.retryAfterSeconds) } },
    );
  }

  try {
    let payload: unknown;
    try {
      payload = await readBoundedRequestJson(request);
    } catch {
      return NextResponse.json({ error: "Invalid quote request." }, { status: 422, headers: secureJsonHeaders });
    }

    const body = schema.safeParse(payload);
    if (!body.success) {
      return NextResponse.json({ error: "Invalid quote request." }, { status: 422, headers: secureJsonHeaders });
    }

    try {
      await saveLead(body.data);
    } catch (error) {
      console.error("[quote] failed to persist lead", error);
      return NextResponse.json({ error: "Could not save the request." }, { status: 500, headers: secureJsonHeaders });
    }

    // الطلب محفوظ. فشل التنبيه يُسجَّل ولا يُفشل استجابة الزائر.
    await notifyNewLead(body.data);

    return NextResponse.json(
      { ok: true, message: "Quote request received." },
      { status: 201, headers: secureJsonHeaders },
    );
  } finally {
    permit.release();
  }
}
