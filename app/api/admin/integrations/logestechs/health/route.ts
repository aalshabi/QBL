import { NextResponse } from "next/server";
import { authorizeAdmin } from "@/lib/admin/guard";
import { probeLogesTechs, LogesTechsApiError } from "@/lib/logestechs/client";
import { LogesTechsConfigurationError } from "@/lib/logestechs/config";
import {
  acquireRatePermit,
  applySecureJsonHeaders,
  secureJsonHeaders,
} from "@/lib/logestechs/request-security";

export const dynamic = "force-dynamic";

export async function GET() {
  const authorization = await authorizeAdmin();
  if (!authorization.ok) return applySecureJsonHeaders(authorization.response);

  const permit = acquireRatePermit(`health:${authorization.session.userId}`, 20, 2);
  if (!permit.ok) {
    return NextResponse.json(
      { ok: false, error: "RATE_LIMITED", message: "تجاوزت حد فحص الاتصال المؤقت" },
      {
        status: 429,
        headers: { ...secureJsonHeaders, "Retry-After": String(permit.retryAfterSeconds) },
      },
    );
  }

  try {
    return NextResponse.json(await probeLogesTechs(), { headers: secureJsonHeaders });
  } catch (error) {
    if (error instanceof LogesTechsConfigurationError) {
      return NextResponse.json(
        {
          ok: false,
          error: "LOGESTECHS_CONFIGURATION",
          message: "إعدادات تكامل LogesTechs غير مكتملة",
          variable: error.variable,
        },
        { status: 503, headers: secureJsonHeaders },
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
        { status, headers: secureJsonHeaders },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: "LOGESTECHS_UNKNOWN",
        message: "حدث خطأ غير متوقع أثناء فحص التكامل",
      },
      { status: 502, headers: secureJsonHeaders },
    );
  } finally {
    permit.release();
  }
}
