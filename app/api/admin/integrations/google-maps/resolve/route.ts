import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authorizeAdmin } from "@/lib/admin/guard";
import {
  GoogleMapsApiError,
  verifyOperationalAddress,
  type GoogleLocationVerification,
} from "@/lib/google-maps/client";
import { GoogleMapsConfigurationError } from "@/lib/google-maps/config";
import {
  acquireRatePermit,
  applySecureJsonHeaders,
  readBoundedRequestJson,
  secureJsonHeaders,
  validateLocationRequest,
} from "@/lib/google-maps/request-security";

export const dynamic = "force-dynamic";

const requestSchema = z.object({
  locations: z
    .array(
      z.object({
        id: z.string().trim().min(1).max(100).regex(/^[A-Za-z0-9._-]+$/),
        address: z.string().trim().min(4).max(500),
      }),
    )
    .min(1)
    .max(20),
});

type LocationResult =
  | ({ ok: true; id: string } & GoogleLocationVerification)
  | { ok: false; id: string; error: string; upstreamStatus: number | null };

async function inspectLocation(location: { id: string; address: string }): Promise<LocationResult> {
  try {
    return { ok: true, id: location.id, ...(await verifyOperationalAddress(location.address)) };
  } catch (error) {
    if (error instanceof GoogleMapsApiError) {
      return {
        ok: false,
        id: location.id,
        error: `GOOGLE_MAPS_${error.code}`,
        upstreamStatus: error.upstreamStatus ?? null,
      };
    }
    throw error;
  }
}

async function inspectInBatches(
  locations: Array<{ id: string; address: string }>,
): Promise<LocationResult[]> {
  const results: LocationResult[] = [];
  for (let index = 0; index < locations.length; index += 4) {
    results.push(...(await Promise.all(locations.slice(index, index + 4).map(inspectLocation))));
  }
  return results;
}

export async function POST(request: NextRequest) {
  const authorization = await authorizeAdmin();
  if (!authorization.ok) return applySecureJsonHeaders(authorization.response);

  const requestValidation = validateLocationRequest(request);
  if (!requestValidation.ok) {
    return NextResponse.json(
      { ok: false, error: requestValidation.error, message: requestValidation.message },
      { status: requestValidation.status, headers: secureJsonHeaders },
    );
  }

  const permit = acquireRatePermit(`google-resolve:${authorization.session.userId}`, 8, 1);
  if (!permit.ok) {
    return NextResponse.json(
      { ok: false, error: "RATE_LIMITED", message: "تجاوزت حد فحص المواقع المؤقت" },
      {
        status: 429,
        headers: { ...secureJsonHeaders, "Retry-After": String(permit.retryAfterSeconds) },
      },
    );
  }

  try {
    let body: unknown;
    try {
      body = await readBoundedRequestJson(request);
    } catch (error) {
      const tooLarge = error instanceof RangeError;
      return NextResponse.json(
        {
          ok: false,
          error: tooLarge ? "PAYLOAD_TOO_LARGE" : "INVALID_JSON",
          message: tooLarge ? "حجم الطلب أكبر من المسموح" : "تعذر قراءة JSON المرسل",
        },
        { status: tooLarge ? 413 : 400, headers: secureJsonHeaders },
      );
    }

    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "VALIDATION",
          message: "حدد من 1 إلى 20 عنوانًا تشغيليًا صالحًا دون بيانات العميل",
        },
        { status: 400, headers: secureJsonHeaders },
      );
    }

    const uniqueLocations = [
      ...new Map(parsed.data.locations.map((location) => [location.id, location])).values(),
    ];
    const results = await inspectInBatches(uniqueLocations);
    const completed = results.filter((result) => result.ok);
    const summary = {
      requested: results.length,
      resolved: completed.length,
      verified: completed.filter((result) => result.status === "VERIFIED").length,
      needsReview: completed.filter((result) => result.status === "NEEDS_REVIEW").length,
      failed: results.length - completed.length,
    };

    console.info("google_maps_location_check", summary);

    if (!completed.length) {
      const timedOut = results.every(
        (result) => !result.ok && result.error === "GOOGLE_MAPS_TIMEOUT",
      );
      return NextResponse.json(
        {
          ok: false,
          failClosed: true,
          error: timedOut ? "GOOGLE_MAPS_TIMEOUT" : "GOOGLE_MAPS_BATCH_FAILED",
          message: "تعذر التحقق من جميع المواقع المحددة",
          checkedAt: new Date().toISOString(),
          summary,
          results,
        },
        { status: timedOut ? 504 : 502, headers: secureJsonHeaders },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        failClosed: true,
        checkedAt: new Date().toISOString(),
        summary,
        results,
      },
      { headers: secureJsonHeaders },
    );
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

    console.warn("google_maps_location_check", { ok: false, code: "UNKNOWN" });
    return NextResponse.json(
      { ok: false, error: "GOOGLE_MAPS_UNKNOWN", message: "تعذر فحص المواقع المحددة" },
      { status: 502, headers: secureJsonHeaders },
    );
  } finally {
    permit.release();
  }
}
