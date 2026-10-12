import { NextRequest, NextResponse } from "next/server";
import { readBoundedRequestJson, secureJsonHeaders } from "@/lib/logestechs/request-security";
import {
  LogesTechsWebhookConfigurationError,
  normalizeLogesTechsWebhookPayload,
  validateWebhookTransport,
  type WebhookTransportValidation,
} from "@/lib/logestechs/webhook";
import { ingestLogesTechsWebhook } from "@/lib/logestechs/webhook-store";

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

  // لا حدّ معدل هنا عمدًا: LogesTechs لا تعيد الإرسال تلقائيًا، فكل 429 حدثٌ ضائع.
  // الطلب وصل بعد التحقق من X-API-Key، فلا يرسل إلى هذه النقطة إلا حامل المفتاح.
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

  try {
    // الحفظ يسبق المعالجة؛ بعد الحفظ يُرد 200 حتى لو فشلت المعالجة، فالحدث لم يضع.
    const result = await ingestLogesTechsWebhook(event);
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
      code: databaseMissing ? "DATABASE_NOT_CONFIGURED" : "STORE_FAILED",
    });
    return json(
      { ok: false, error: databaseMissing ? "DATABASE_NOT_CONFIGURED" : "STORE_FAILED", retryable: true },
      503,
    );
  }
}
