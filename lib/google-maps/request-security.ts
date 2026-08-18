import "server-only";
import {
  acquireRatePermit,
  applySecureJsonHeaders,
  readBoundedRequestJson,
  secureJsonHeaders,
} from "@/lib/logestechs/request-security";

export { acquireRatePermit, applySecureJsonHeaders, readBoundedRequestJson, secureJsonHeaders };

export type GoogleMapsRequestValidation =
  | { ok: true }
  | { ok: false; status: 400 | 403 | 413 | 415; error: string; message: string };

export function validateLocationRequest(request: Request): GoogleMapsRequestValidation {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("application/json")) {
    return {
      ok: false,
      status: 415,
      error: "UNSUPPORTED_MEDIA_TYPE",
      message: "يجب إرسال الطلب بصيغة JSON",
    };
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > 32 * 1024) {
    return { ok: false, status: 413, error: "PAYLOAD_TOO_LARGE", message: "حجم الطلب أكبر من المسموح" };
  }

  if (request.headers.get("x-qbl-integration-request") !== "location-check-v1") {
    return { ok: false, status: 403, error: "REQUEST_MARKER_REQUIRED", message: "طلب غير مصرح" };
  }

  const requestOrigin = new URL(request.url).origin;
  const origin = request.headers.get("origin");
  if (origin && origin !== requestOrigin) {
    return { ok: false, status: 403, error: "CROSS_ORIGIN_REQUEST", message: "طلب عابر للمواقع مرفوض" };
  }

  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return { ok: false, status: 403, error: "CROSS_SITE_REQUEST", message: "طلب عابر للمواقع مرفوض" };
  }

  return { ok: true };
}
