import { NextRequest, NextResponse } from "next/server";
import { acquireRatePermit, readBoundedRequestJson, secureJsonHeaders } from "@/lib/logestechs/request-security";
import {
  ColdChainTelemetryConfigurationError,
  normalizeColdChainTelemetryPayload,
  validateTelemetryTransport,
  type WebhookTransportValidation,
} from "@/lib/cold-chain/telemetry";
import { processColdChainTelemetry } from "@/lib/cold-chain/telemetry-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const webhookHeaders = {
  ...secureJsonHeaders,
  Vary: "X-API-Key",
} as const;

function json(body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return NextResponse.json(body, {
    status,
    headers: { ...webhookHeaders, ...extraHeaders },
  });
}

/**
 * Provider-agnostic ingestion endpoint for vehicle temperature (and optional
 * GPS) telemetry. No specific refrigeration/IoT vendor is connected yet — this
 * accepts the minimal common payload shape (see lib/cold-chain/telemetry.ts)
 * so whichever provider is contracted later can be pointed at this URL,
 * with a small adapter added only if their payload format differs.
 */
export async function POST(request: NextRequest) {
  let transport: WebhookTransportValidation;
  try {
    transport = validateTelemetryTransport(request);
  } catch (error) {
    if (error instanceof ColdChainTelemetryConfigurationError) {
      return json({ ok: false, error: "WEBHOOK_NOT_CONFIGURED" }, 503);
    }
    return json({ ok: false, error: "WEBHOOK_CONFIGURATION_ERROR" }, 503);
  }

  if (!transport.ok) {
    return json(
      { ok: false, error: transport.error },
      transport.status,
      transport.status === 401 ? { "WWW-Authenticate": "X-API-Key" } : {},
    );
  }

  const permit = acquireRatePermit(`cold-chain-telemetry:${transport.rateKey}`, 600, 16);
  if (!permit.ok) {
    return json({ ok: false, error: "RATE_LIMITED" }, 429, { "Retry-After": String(permit.retryAfterSeconds) });
  }

  try {
    let payload: unknown;
    try {
      payload = await readBoundedRequestJson(request);
    } catch (error) {
      return json(
        { ok: false, error: error instanceof RangeError ? "PAYLOAD_TOO_LARGE" : "INVALID_JSON" },
        error instanceof RangeError ? 413 : 400,
      );
    }

    let event;
    try {
      event = normalizeColdChainTelemetryPayload(payload);
    } catch {
      return json({ ok: false, error: "INVALID_TELEMETRY_PAYLOAD" }, 400);
    }

    const result = await processColdChainTelemetry(event);
    console.info("cold_chain_telemetry_processed", {
      outcome: result.outcome,
      duplicate: result.duplicate,
      eventIdPrefix: result.eventId.slice(0, 17),
    });
    return json({ ok: true, accepted: result.accepted, duplicate: result.duplicate, outcome: result.outcome });
  } catch (error) {
    const databaseMissing = error instanceof Error && error.message === "DATABASE_NOT_CONFIGURED";
    console.warn("cold_chain_telemetry_failed", {
      code: databaseMissing ? "DATABASE_NOT_CONFIGURED" : "PROCESSING_FAILED",
    });
    return json(
      { ok: false, error: databaseMissing ? "DATABASE_NOT_CONFIGURED" : "PROCESSING_FAILED", retryable: true },
      503,
    );
  } finally {
    permit.release();
  }
}
