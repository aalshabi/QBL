import { NextResponse } from "next/server";
import { authorizeAdmin } from "@/lib/admin/guard";
import { GoogleMapsApiError, probeGoogleMaps } from "@/lib/google-maps/client";
import { GoogleMapsConfigurationError } from "@/lib/google-maps/config";
import {
  acquireRatePermit,
  applySecureJsonHeaders,
  secureJsonHeaders,
} from "@/lib/google-maps/request-security";

export const dynamic = "force-dynamic";

export async function GET() {
  const authorization = await authorizeAdmin();
  if (!authorization.ok) return applySecureJsonHeaders(authorization.response);

  const permit = acquireRatePermit(`google-health:${authorization.session.userId}`, 10, 1);
  if (!permit.ok) {
    return NextResponse.json(
      { ok: false, error: "RATE_LIMITED", message: "تجاوزت حد فحص Google Maps المؤقت" },
      {
        status: 429,
        headers: { ...secureJsonHeaders, "Retry-After": String(permit.retryAfterSeconds) },
      },
    );
  }

  try {
    const result = await probeGoogleMaps();
    console.info("google_maps_health_check", {
      ok: true,
      latencyMs: result.latencyMs,
      searchStatus: result.upstreamStatus.search,
      detailsStatus: result.upstreamStatus.details,
    });
    return NextResponse.json(result, { headers: secureJsonHeaders });
  } catch (error) {
    if (error instanceof GoogleMapsConfigurationError) {
      return NextResponse.json(
        {
          ok: false,
          error: "GOOGLE_MAPS_CONFIGURATION",
          message: "مفتاح Google Maps غير موجود في بيئة الخادم",
          variable: error.variable,
        },
        { status: 503, headers: secureJsonHeaders },
      );
    }

    if (error instanceof GoogleMapsApiError) {
      const status = error.code === "TIMEOUT" ? 504 : error.code === "NO_RESULTS" ? 502 : 502;
      console.warn("google_maps_health_check", {
        ok: false,
        code: error.code,
        upstreamStatus: error.upstreamStatus ?? null,
      });
      return NextResponse.json(
        {
          ok: false,
          error: `GOOGLE_MAPS_${error.code}`,
          message: "تعذر التحقق من اتصال Google Maps",
          upstreamStatus: error.upstreamStatus ?? null,
        },
        { status, headers: secureJsonHeaders },
      );
    }

    console.warn("google_maps_health_check", { ok: false, code: "UNKNOWN" });
    return NextResponse.json(
      { ok: false, error: "GOOGLE_MAPS_UNKNOWN", message: "حدث خطأ غير متوقع أثناء فحص Google Maps" },
      { status: 502, headers: secureJsonHeaders },
    );
  } finally {
    permit.release();
  }
}
