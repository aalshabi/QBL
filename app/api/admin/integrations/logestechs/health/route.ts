import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import { probeLogesTechs, LogesTechsApiError } from "@/lib/logestechs/client";
import { LogesTechsConfigurationError } from "@/lib/logestechs/config";

export const dynamic = "force-dynamic";

const noStoreHeaders = { "Cache-Control": "no-store" };

export async function GET() {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;

  try {
    return NextResponse.json(await probeLogesTechs(), { headers: noStoreHeaders });
  } catch (error) {
    if (error instanceof LogesTechsConfigurationError) {
      return NextResponse.json(
        {
          ok: false,
          error: "LOGESTECHS_CONFIGURATION",
          message: "إعدادات تكامل LogesTechs غير مكتملة",
          variable: error.variable,
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    if (error instanceof LogesTechsApiError) {
      const status = error.code === "TIMEOUT" ? 504 : 502;
      return NextResponse.json(
        {
          ok: false,
          error: `LOGESTECHS_${error.code}`,
          message: "تعذر التحقق من اتصال LogesTechs",
          upstreamStatus: error.upstreamStatus ?? null,
        },
        { status, headers: noStoreHeaders },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: "LOGESTECHS_UNKNOWN",
        message: "حدث خطأ غير متوقع أثناء فحص التكامل",
      },
      { status: 502, headers: noStoreHeaders },
    );
  }
}
