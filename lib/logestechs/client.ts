import "server-only";
import { getLogesTechsConfig } from "@/lib/logestechs/config";

const DEFAULT_TIMEOUT_MS = 10_000;
const PACKAGE_STATUS_TIMEOUT_MS = 6_000;

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

export type LogesTechsPackageStatus = {
  barcode: string;
  status: string;
  packageId: number | null;
  cost: number | null;
  cod: number | null;
  notes: string | null;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function nullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parsePackageStatus(payload: unknown, barcode: string): LogesTechsPackageStatus {
  const envelope = asRecord(payload);
  const record = asRecord(envelope?.data) ?? envelope;
  const status = record?.status;

  if (!record || typeof status !== "string" || !status.trim()) {
    throw new LogesTechsApiError("INVALID_RESPONSE");
  }

  return {
    barcode,
    status: status.trim(),
    packageId: nullableNumber(record.id ?? record.packageId),
    cost: nullableNumber(record.cost),
    cod: nullableNumber(record.cod),
    notes: typeof record.notes === "string" && record.notes.trim() ? record.notes.trim() : null,
  };
}

async function fetchJson(
  url: URL,
  companyId: string,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<{ payload: unknown; status: number }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let response: Response;
    try {
      response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "company-id": companyId,
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

    try {
      return { payload: await response.json(), status: response.status };
    } catch (error) {
      if (isAbortError(error)) {
        throw new LogesTechsApiError("TIMEOUT");
      }
      throw new LogesTechsApiError("INVALID_RESPONSE", response.status);
    }
  } finally {
    clearTimeout(timeout);
  }
}

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

  const startedAt = Date.now();
  const response = await fetchJson(url, config.companyId);

  return {
    ok: true,
    service: "logestechs",
    operation: "cities-read",
    upstreamStatus: response.status,
    latencyMs: Date.now() - startedAt,
    checkedAt: new Date().toISOString(),
    response: summarizePayload(response.payload),
  };
}

/**
 * قراءة حالة شحنة واحدة من LogesTechs. لا يغيّر هذا الاستدعاء أي بيانات محلية
 * ولا يرسل بيانات الدخول إلى الواجهة الأمامية.
 */
export async function getLogesTechsPackageStatus(barcode: string): Promise<LogesTechsPackageStatus> {
  const normalizedBarcode = barcode.trim();
  if (!normalizedBarcode || normalizedBarcode.length > 100) {
    throw new LogesTechsApiError("INVALID_RESPONSE");
  }

  const config = getLogesTechsConfig();
  const url = new URL(`${config.baseUrl}/guests/packages/status`);
  url.searchParams.set("barcode", normalizedBarcode);

  const response = await fetchJson(url, config.companyId, PACKAGE_STATUS_TIMEOUT_MS);
  return parsePackageStatus(response.payload, normalizedBarcode);
}
