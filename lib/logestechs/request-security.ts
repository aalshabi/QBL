import "server-only";

const MAX_REQUEST_BYTES = 32 * 1024;
const RATE_WINDOW_MS = 60_000;

type RateEntry = {
  count: number;
  resetAt: number;
  active: number;
};

type RateStore = Map<string, RateEntry>;

const globalRateStore = globalThis as typeof globalThis & {
  __qblLogesTechsRateStore?: RateStore;
};

const rateStore = (globalRateStore.__qblLogesTechsRateStore ??= new Map());

export const secureJsonHeaders = {
  "Cache-Control": "private, no-store, max-age=0, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  Vary: "Cookie",
} as const;

export function applySecureJsonHeaders<T extends Response>(response: T): T {
  for (const [name, value] of Object.entries(secureJsonHeaders)) {
    response.headers.set(name, value);
  }
  return response;
}

export type RequestValidation =
  | { ok: true }
  | { ok: false; status: 400 | 403 | 413 | 415; error: string; message: string };

export function validateStatusRequest(request: Request): RequestValidation {
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
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return { ok: false, status: 413, error: "PAYLOAD_TOO_LARGE", message: "حجم الطلب أكبر من المسموح" };
  }

  if (request.headers.get("x-qbl-integration-request") !== "status-check-v1") {
    return { ok: false, status: 403, error: "REQUEST_MARKER_REQUIRED", message: "طلب غير مصرح" };
  }

  const requestOrigin = new URL(request.url).origin;
  const origin = request.headers.get("origin");
  if (origin && origin !== requestOrigin) {
    return { ok: false, status: 403, error: "CROSS_ORIGIN_REQUEST", message: "طلب عابر للمواقع مرفوض" };
  }

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") {
    return { ok: false, status: 403, error: "CROSS_SITE_REQUEST", message: "طلب عابر للمواقع مرفوض" };
  }

  return { ok: true };
}

export async function readBoundedRequestJson(request: Request): Promise<unknown> {
  if (!request.body) return null;

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > MAX_REQUEST_BYTES) {
      await reader.cancel();
      throw new RangeError("REQUEST_BODY_TOO_LARGE");
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
}

export type RatePermit =
  | { ok: true; release: () => void }
  | { ok: false; retryAfterSeconds: number };

export function acquireRatePermit(
  key: string,
  maxRequests: number,
  maxConcurrent: number,
  now = Date.now(),
): RatePermit {
  if (rateStore.size > 1_000) {
    for (const [storedKey, storedEntry] of rateStore) {
      if (storedEntry.resetAt <= now && storedEntry.active === 0) rateStore.delete(storedKey);
    }
  }

  const current = rateStore.get(key);
  const entry = !current || current.resetAt <= now
    ? { count: 0, active: 0, resetAt: now + RATE_WINDOW_MS }
    : current;

  if (entry.count >= maxRequests || entry.active >= maxConcurrent) {
    rateStore.set(key, entry);
    return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1_000)) };
  }

  entry.count += 1;
  entry.active += 1;
  rateStore.set(key, entry);

  let released = false;
  return {
    ok: true,
    release: () => {
      if (released) return;
      released = true;
      entry.active = Math.max(0, entry.active - 1);
    },
  };
}
