import "server-only";
import { normalizeColdChainTelemetryPayload } from "@/lib/cold-chain/telemetry";
import { processColdChainTelemetry } from "@/lib/cold-chain/telemetry-store";
import { applyProviderMappingBatch, resolveProviderMapping } from "@/lib/cold-chain/providers";

/**
 * سحب القراءات من مزوّد لا يدفعها.
 *
 * كثير من مزوّدي التتبع لا يملكون Webhooks أصلاً؛ يعرضون REST يُستعلم منه.
 * بلا هذا المسار كان إدخال مثل هذا المزوّد مستحيلاً مهما كان الاستقبال جاهزاً.
 *
 * يُنفَّذ من مهمة مجدولة لا من عملية دائمة: الدالة لا تعيش بعد استجابتها.
 * ويمر الناتج على المحوّل نفسه ثم على التحقق نفسه الذي يمر به الويبهوك —
 * مسار الدخول يختلف، وحدود العقل والأمان واحدة.
 */

const REQUEST_TIMEOUT_MS = 10_000;
const MAX_RESPONSE_BYTES = 512 * 1024;
const MAX_ENTRIES = 200;

export class ColdChainPollNotConfiguredError extends Error {
  constructor() {
    super("COLD_CHAIN_POLL_NOT_CONFIGURED");
    this.name = "ColdChainPollNotConfiguredError";
  }
}

export type PollConfig = { url: string; providerId: string; token: string | null };

export function getPollConfig(): PollConfig {
  const url = process.env.COLD_CHAIN_POLL_URL?.trim();
  const providerId = process.env.COLD_CHAIN_POLL_PROVIDER?.trim();
  if (!url || !providerId) throw new ColdChainPollNotConfiguredError();

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new ColdChainPollNotConfiguredError();
  }
  // لا سحب عبر HTTP: قراءات الأسطول ومواقعه لا تُنقل بنص صريح.
  if (parsed.protocol !== "https:") throw new ColdChainPollNotConfiguredError();

  return { url: parsed.toString(), providerId, token: process.env.COLD_CHAIN_POLL_TOKEN?.trim() || null };
}

export type PollResult = {
  fetched: number;
  recorded: number;
  duplicates: number;
  rejected: number;
};

export async function pollColdChainProvider(
  options: { fetchImpl?: typeof fetch } = {},
): Promise<PollResult> {
  const config = getPollConfig();
  const mapping = resolveProviderMapping(config.providerId);
  if (!mapping) throw new ColdChainPollNotConfiguredError();

  const fetchImpl = options.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let payload: unknown;
  try {
    const response = await fetchImpl(config.url, {
      headers: {
        Accept: "application/json",
        ...(config.token ? { Authorization: `Bearer ${config.token}` } : {}),
      },
      cache: "no-store",
      credentials: "omit",
      redirect: "error",
      signal: controller.signal,
    });
    if (!response.ok) throw new Error("POLL_UPSTREAM_STATUS");

    const text = await response.text();
    if (text.length > MAX_RESPONSE_BYTES) throw new Error("POLL_RESPONSE_TOO_LARGE");
    payload = JSON.parse(text);
  } finally {
    clearTimeout(timeout);
  }

  const entries = applyProviderMappingBatch(payload, mapping).slice(0, MAX_ENTRIES);
  const result: PollResult = { fetched: entries.length, recorded: 0, duplicates: 0, rejected: 0 };

  for (const entry of entries) {
    let event;
    try {
      event = normalizeColdChainTelemetryPayload(entry);
    } catch {
      result.rejected += 1;
      continue;
    }

    const processed = await processColdChainTelemetry(event);
    if (processed.duplicate) result.duplicates += 1;
    else if (processed.outcome === "RECORDED" || processed.outcome === "RECORDED_WITH_LOCATION") result.recorded += 1;
    else result.rejected += 1;
  }

  return result;
}
