import "server-only";
import { getLogesTechsConfig } from "@/lib/logestechs/config";

const DEFAULT_TIMEOUT_MS = 10_000;

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

export class LogesTechsApiError extends Error {
  constructor(
    public readonly code: "TIMEOUT" | "NETWORK" | "UPSTREAM_STATUS" | "INVALID_RESPONSE",
    public readonly upstreamStatus?: number,
  ) {
    super(`LogesTechs API request failed: ${code}`);
    this.name = "LogesTechsApiError";
  }
}

export type LogesTechsProbeResult = {
  ok: true;
  service: "logestechs";
  operation: "cities-read";
  upstreamStatus: number;
  latencyMs: number;
  checkedAt: string;
  response: {
    shape: "array" | "object";
    itemCount: number | null;
  };
};

function summarizePayload(payload: unknown): LogesTechsProbeResult["response"] {
  if (Array.isArray(payload)) {
    return { shape: "array", itemCount: payload.length };
  }

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    const collection = [record.data, record.items, record.cities, record.results].find(Array.isArray);
    return { shape: "object", itemCount: Array.isArray(collection) ? collection.length : null };
  }

  throw new LogesTechsApiError("INVALID_RESPONSE");
}

export async function probeLogesTechs(): Promise<LogesTechsProbeResult> {
  // تحميل الإعداد الكامل يثبت أن بيانات حساب التكامل الأربع متاحة، من دون إرسال
  // البريد أو كلمة المرور إلى endpoint المدن الذي لا يحتاجهما.
  const config = getLogesTechsConfig();
  const url = new URL(`${config.baseUrl}/addresses/cities`);
  url.searchParams.set("returnAll", "true");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  const startedAt = Date.now();

  try {
    let response: Response;
    try {
      response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "company-id": config.companyId,
        },
        cache: "no-store",
        signal: controller.signal,
      });
    } catch (error) {
      if (isAbortError(error)) {
        throw new LogesTechsApiError("TIMEOUT");
      }
      throw new LogesTechsApiError("NETWORK");
    }

    if (!response.ok) {
      throw new LogesTechsApiError("UPSTREAM_STATUS", response.status);
    }

    const payload = await response.json().catch((error: unknown) => {
      if (isAbortError(error)) {
        throw new LogesTechsApiError("TIMEOUT");
      }
      throw new LogesTechsApiError("INVALID_RESPONSE", response.status);
    });

    return {
      ok: true,
      service: "logestechs",
      operation: "cities-read",
      upstreamStatus: response.status,
      latencyMs: Date.now() - startedAt,
      checkedAt: new Date().toISOString(),
      response: summarizePayload(payload),
    };
  } finally {
    clearTimeout(timeout);
  }
}
