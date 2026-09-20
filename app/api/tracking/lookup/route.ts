import { NextResponse } from "next/server";
import { z } from "zod";
import { acquireRatePermit, readBoundedRequestJson, secureJsonHeaders } from "@/lib/logestechs/request-security";
import { getPublicTrackingSnapshotByCode } from "@/lib/tracking";

const schema = z.object({
  publicCode: z.string().trim().min(4).max(64),
  phoneLast4: z.string().regex(/^\d{4}$/),
});

const GENERIC_ERROR = { error: "NOT_FOUND", message: "رقم الشحنة أو آخر 4 أرقام من الجوال غير صحيحة." };

function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

/**
 * تتبع عام بلا تسجيل دخول: رقم الشحنة + آخر 4 أرقام من الجوال بدل رابط موقّع.
 * محدود المعدل على مستوى IP وعلى مستوى رقم الشحنة نفسه لمنع تخمين آخر 4 أرقام
 * بالتجربة المتكررة؛ الرد موحّد في كل حالات الفشل لعدم كشف أي معلومة إضافية.
 */
export async function POST(request: Request) {
  const ip = clientIp(request);
  const ipPermit = acquireRatePermit(`tracking-lookup:ip:${ip}`, 10, 4);
  if (!ipPermit.ok) {
    return NextResponse.json(
      { error: "RATE_LIMITED", message: "محاولات كثيرة، حاول لاحقًا." },
      { status: 429, headers: { ...secureJsonHeaders, "Retry-After": String(ipPermit.retryAfterSeconds) } },
    );
  }

  try {
    let body: unknown;
    try {
      body = await readBoundedRequestJson(request);
    } catch {
      return NextResponse.json({ error: "PAYLOAD_TOO_LARGE" }, { status: 413, headers: secureJsonHeaders });
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 422, headers: secureJsonHeaders });
    }

    const publicCode = parsed.data.publicCode.toUpperCase();

    const codePermit = acquireRatePermit(`tracking-lookup:code:${publicCode}`, 8, 2);
    if (!codePermit.ok) {
      return NextResponse.json(
        { error: "RATE_LIMITED", message: "محاولات كثيرة على هذا الرقم، حاول لاحقًا." },
        { status: 429, headers: { ...secureJsonHeaders, "Retry-After": String(codePermit.retryAfterSeconds) } },
      );
    }

    try {
      const snapshot = await getPublicTrackingSnapshotByCode(publicCode, parsed.data.phoneLast4);
      if (!snapshot) {
        return NextResponse.json(GENERIC_ERROR, { status: 404, headers: secureJsonHeaders });
      }
      return NextResponse.json({ snapshot }, { status: 200, headers: secureJsonHeaders });
    } finally {
      codePermit.release();
    }
  } finally {
    ipPermit.release();
  }
}
