import { NextRequest, NextResponse } from "next/server";
import { acquireRatePermit, readBoundedRequestJson, secureJsonHeaders } from "@/lib/logestechs/request-security";
import {
  LogesTechsWebhookConfigurationError,
  normalizeLogesTechsWebhookPayload,
  validateWebhookTransport,
  type WebhookTransportValidation,
} from "@/lib/logestechs/webhook";
import { processLogesTechsWebhook } from "@/lib/logestechs/webhook-store";

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

export async function POST(request: NextRequest) {
  let transport: WebhookTransportValidation;
  try {
    transport = validateWebhookTransport(request);
  } catch (error) {
    if (error instanceof LogesTechsWebhookConfigurationError) {
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

  const permit = acquireRatePermit(`logestechs-webhook:${transport.rateKey}`, 120, 8);
  if (!permit.ok) {
    return json(
      { ok: false, error: "RATE_LIMITED" },
      429,
      { "Retry-After": String(permit.retryAfterSeconds) },
    );
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
      event = normalizeLogesTechsWebhookPayload(payload);
    } catch {
      return json({ ok: false, error: "INVALID_WEBHOOK_PAYLOAD" }, 400);
    }

    const result = await processLogesTechsWebhook(event);
    console.info("logestechs_webhook_processed", {
      outcome: result.outcome,
      duplicate: result.duplicate,
      eventIdPrefix: result.eventId.slice(0, 17),
    });
    return json({
      ok: true,
      accepted: result.accepted,
      duplicate: result.duplicate,
      outcome: result.outcome,
    });
  } catch (error) {
    const databaseMissing = error instanceof Error && error.message === "DATABASE_NOT_CONFIGURED";
    console.warn("logestechs_webhook_failed", {
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
