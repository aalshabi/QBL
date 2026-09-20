import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
  ColdChainTelemetryConfigurationError,
  normalizeColdChainTelemetryPayload,
  validateTelemetryTransport,
  telemetryEventId,
} from "@/lib/cold-chain/telemetry";

const originalSecret = process.env.COLD_CHAIN_TELEMETRY_API_KEY;
const secret = "unit-test-cold-chain-telemetry-secret-123456";

afterEach(() => {
  if (originalSecret === undefined) delete process.env.COLD_CHAIN_TELEMETRY_API_KEY;
  else process.env.COLD_CHAIN_TELEMETRY_API_KEY = originalSecret;
});

function request(apiKey = secret, contentType = "application/json") {
  return new Request("https://qbl-logistics.vercel.app/api/webhooks/cold-chain-telemetry", {
    method: "POST",
    headers: { "content-type": contentType, "x-api-key": apiKey },
  });
}

test("telemetry transport fails closed and accepts only the configured X-API-Key", () => {
  delete process.env.COLD_CHAIN_TELEMETRY_API_KEY;
  assert.throws(() => validateTelemetryTransport(request()), ColdChainTelemetryConfigurationError);

  process.env.COLD_CHAIN_TELEMETRY_API_KEY = secret;
  assert.equal(validateTelemetryTransport(request()).ok, true);
  assert.deepEqual(validateTelemetryTransport(request("wrong-secret")), {
    ok: false,
    status: 401,
    error: "UNAUTHORIZED",
  });
  assert.deepEqual(validateTelemetryTransport(request(secret, "text/plain")), {
    ok: false,
    status: 415,
    error: "UNSUPPORTED_MEDIA_TYPE",
  });
});

test("payload normalization requires a vehicle identifier and a plausible celsius value", () => {
  assert.throws(() => normalizeColdChainTelemetryPayload({ celsius: 4 }), TypeError);
  assert.throws(
    () => normalizeColdChainTelemetryPayload({ vehiclePlate: "ABC-123", celsius: 999 }),
    TypeError,
  );

  const normalized = normalizeColdChainTelemetryPayload({
    vehiclePlate: "ABC-123",
    celsius: 4.567,
    sensorId: "sensor-01",
  });
  assert.equal(normalized.vehiclePlate, "ABC-123");
  assert.equal(normalized.celsius, 4.57);
  assert.equal(normalized.hasLocation, false);
});

test("payload normalization requires both latitude and longitude together", () => {
  assert.throws(
    () => normalizeColdChainTelemetryPayload({ vehiclePlate: "ABC-123", celsius: 4, latitude: 24.7 }),
    TypeError,
  );

  const normalized = normalizeColdChainTelemetryPayload({
    vehiclePlate: "ABC-123",
    celsius: 4,
    latitude: 24.7136,
    longitude: 46.6753,
  });
  assert.equal(normalized.hasLocation, true);
  assert.equal(normalized.latitude, 24.7136);
  assert.equal(normalized.longitude, 46.6753);
});

test("telemetry event id is deterministic for identical readings", () => {
  const a = normalizeColdChainTelemetryPayload({
    vehiclePlate: "ABC-123",
    celsius: 4,
    sensorId: "s1",
    recordedAt: "2026-09-20T10:00:00Z",
  });
  const b = normalizeColdChainTelemetryPayload({
    vehiclePlate: "ABC-123",
    celsius: 4,
    sensorId: "s1",
    recordedAt: "2026-09-20T10:00:00Z",
  });
  assert.equal(telemetryEventId(a), telemetryEventId(b));
});
