import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
  LogesTechsWebhookConfigurationError,
  decideWebhookTransition,
  normalizeLogesTechsWebhookPayload,
  safeWebhookMetadata,
  validateWebhookTransport,
  webhookEventId,
} from "@/lib/logestechs/webhook";

const originalSecret = process.env.LOGESTECHS_WEBHOOK_API_KEY;
const secret = "unit-test-logestechs-webhook-secret-123456";

afterEach(() => {
  if (originalSecret === undefined) delete process.env.LOGESTECHS_WEBHOOK_API_KEY;
  else process.env.LOGESTECHS_WEBHOOK_API_KEY = originalSecret;
});

function request(apiKey = secret, contentType = "application/json") {
  return new Request("https://qbl-logistics.vercel.app/api/webhooks/logestechs/status", {
    method: "POST",
    headers: { "content-type": contentType, "x-api-key": apiKey },
  });
}

test("webhook transport fails closed and accepts only the configured X-API-Key", () => {
  delete process.env.LOGESTECHS_WEBHOOK_API_KEY;
  assert.throws(() => validateWebhookTransport(request()), LogesTechsWebhookConfigurationError);

  process.env.LOGESTECHS_WEBHOOK_API_KEY = secret;
  assert.equal(validateWebhookTransport(request()).ok, true);
  assert.deepEqual(validateWebhookTransport(request("wrong-secret")), {
    ok: false,
    status: 401,
    error: "UNAUTHORIZED",
  });
  assert.deepEqual(validateWebhookTransport(request(secret, "text/plain")), {
    ok: false,
    status: 415,
    error: "UNSUPPORTED_MEDIA_TYPE",
  });
});

test("normalizes only operational fields and drops customer and driver PII", () => {
  const event = normalizeLogesTechsWebhookPayload({
    packageId: 711,
    newStatus: "delivered_to_recipient",
    barcode: "QBL-10001",
    invoiceNumber: "INV-4",
    time: 1_762_347_300_095,
    driverName: "Private Driver",
    driverPhone: "+966500000000",
    notes: "private note",
    attachmentUrls: ["https://example.invalid/private.jpg"],
  });

  assert.equal(event.kind, "LAST_MILE");
  assert.equal(event.externalStatus, "DELIVERED_TO_RECIPIENT");
  assert.equal(event.externalTime?.toISOString(), "2025-11-05T12:55:00.095Z");
  assert.equal(JSON.stringify(event).includes("Private Driver"), false);
  assert.equal(JSON.stringify(event).includes("966500000000"), false);
  assert.equal(JSON.stringify(safeWebhookMetadata(event)).includes("QBL-10001"), false);
});

test("creates deterministic event ids and identifies fulfillment payloads", () => {
  const event = normalizeLogesTechsWebhookPayload({
    status: "CREATED",
    packageBarcode: "QBL_20002",
  });
  assert.equal(event.kind, "FULFILLMENT");
  assert.equal(webhookEventId(event), webhookEventId({ ...event }));
  assert.notEqual(webhookEventId(event), webhookEventId({ ...event, externalStatus: "PACKED" }));
});

test("transition gate blocks terminal rollback and permits documented recovery paths", () => {
  assert.equal(decideWebhookTransition("DELIVERED", "OUT_FOR_DELIVERY"), "BLOCK_STALE");
  assert.equal(decideWebhookTransition("FAILED", "OUT_FOR_DELIVERY"), "UPDATE");
  assert.equal(decideWebhookTransition("POSTPONED", "DELIVERED"), "UPDATE");
  assert.equal(decideWebhookTransition("ASSIGNED", "ASSIGNED"), "NO_CHANGE");
  assert.equal(decideWebhookTransition("OUT_FOR_DELIVERY", "ASSIGNED"), "BLOCK_STALE");
});
