import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { findSilentSensors, sweepTelemetrySilence } from "@/lib/cold-chain/alerts";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * كشف صمت سلسلة التبريد. لا مزود يُبلغ عن انقطاعه، فالانقطاع يُستنتج من غياب
 * القراءات — وهو الحالة التي تبدو على الشاشة كأن كل شيء بخير.
 *
 * مهمة مجدولة لا عملية خلفية: دالة الخادم لا تعيش بعد إرسال استجابتها، فأي
 * مؤقّت داخلها يموت بصمت ويترك الشحنات بلا مراقب.
 */
function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  return header === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const prisma = getPrisma();
    const result = await sweepTelemetrySilence(prisma);
    const silentSensors = await findSilentSensors(prisma);
    return NextResponse.json({
      ok: true,
      ...result,
      silentSensors: silentSensors.map((sensor) => ({
        sensorId: sensor.sensorId,
        provider: sensor.provider,
        minutesSilent: sensor.minutesSilent,
      })),
    });
  } catch {
    return NextResponse.json({ ok: false, error: "SWEEP_FAILED" }, { status: 500 });
  }
}
