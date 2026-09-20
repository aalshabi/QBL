import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";

const MIN_SECRET_LENGTH = 32;
const MAX_REQUEST_BYTES = 16 * 1024;
const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/;
const SENSOR_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,99}$/;
const MIN_CELSIUS = -40;
const MAX_CELSIUS = 40;

export class ColdChainTelemetryConfigurationError extends Error {
  constructor(public readonly variable: "COLD_CHAIN_TELEMETRY_API_KEY") {
    super(`Missing or weak cold-chain telemetry configuration: ${variable}`);
    this.name = "ColdChainTelemetryConfigurationError";
  }
}

/**
 * Payload is intentionally provider-agnostic: no specific refrigeration/IoT
 * vendor is integrated yet, so the shape here is the minimal common contract
 * (vehicle identifier + reading) any future provider's webhook can be
 * normalized into before calling processColdChainTelemetry.
 */
const telemetryPayloadSchema = z
  .object({
    vehiclePlate: z.string().optional(),
    vehicleId: z.string().optional(),
    orderPublicCode: z.string().optional(),
    orderReference: z.string().optional(),
    celsius: z.number(),
    sensorId: z.string().optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    speedKph: z.number().min(0).max(300).optional(),
    heading: z.number().min(0).max(359).optional(),
    recordedAt: z.union([z.string(), z.number()]).optional(),
  })
  .passthrough();

export type NormalizedColdChainTelemetry = {
  vehiclePlate: string | null;
  vehicleId: string | null;
  orderPublicCode: string | null;
  orderReference: string | null;
  celsius: number;
  sensorId: string | null;
  hasLocation: boolean;
  latitude: number | null;
  longitude: number | null;
  speedKph: number | null;
  heading: number | null;
  recordedAt: Date;
};

export type WebhookTransportValidation =
  | { ok: true; rateKey: string }
  | { ok: false; status: 401 | 413 | 415; error: string };

function webhookSecret(): string {
  const value = process.env.COLD_CHAIN_TELEMETRY_API_KEY?.trim();
  if (!value || value.length < MIN_SECRET_LENGTH) {
    throw new ColdChainTelemetryConfigurationError("COLD_CHAIN_TELEMETRY_API_KEY");
  }
  return value;
}

function secureEquals(left: string, right: string): boolean {
  const leftHash = createHash("sha256").update(left, "utf8").digest();
  const rightHash = createHash("sha256").update(right, "utf8").digest();
  return timingSafeEqual(leftHash, rightHash);
}

export function validateTelemetryTransport(request: Request): WebhookTransportValidation {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!/^application\/json(?:\s*;|$)/i.test(contentType)) {
    return { ok: false, status: 415, error: "UNSUPPORTED_MEDIA_TYPE" };
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return { ok: false, status: 413, error: "PAYLOAD_TOO_LARGE" };
  }

  const provided = request.headers.get("x-api-key")?.trim() ?? "";
  const expected = webhookSecret();
  if (!provided || !secureEquals(provided, expected)) {
    return { ok: false, status: 401, error: "UNAUTHORIZED" };
  }

  return {
    ok: true,
    rateKey: createHash("sha256").update(expected, "utf8").digest("hex").slice(0, 16),
  };
}

function boundedIdentifier(value: string | undefined): string | null {
  if (value === undefined) return null;
  const text = value.normalize("NFKC").trim();
  return text && IDENTIFIER_PATTERN.test(text) ? text : null;
}

function boundedSensorId(value: string | undefined): string | null {
  if (value === undefined) return null;
  const text = value.normalize("NFKC").trim();
  return text && SENSOR_ID_PATTERN.test(text) ? text : null;
}

function parseRecordedAt(value: string | number | undefined): Date {
  if (value === undefined) return new Date();
  const raw = typeof value === "number" ? value : /^\d+$/.test(value.trim()) ? Number(value) : NaN;
  const milliseconds = Number.isFinite(raw) ? (raw < 10_000_000_000 ? raw * 1_000 : raw) : Date.parse(String(value));
  if (!Number.isFinite(milliseconds)) throw new TypeError("INVALID_TELEMETRY_PAYLOAD");
  const date = new Date(milliseconds);
  if (Number.isNaN(date.getTime())) throw new TypeError("INVALID_TELEMETRY_PAYLOAD");
  return date;
}

export function normalizeColdChainTelemetryPayload(input: unknown): NormalizedColdChainTelemetry {
  const parsed = telemetryPayloadSchema.safeParse(input);
  if (!parsed.success) throw new TypeError("INVALID_TELEMETRY_PAYLOAD");

  const data = parsed.data;
  const vehiclePlate = boundedIdentifier(data.vehiclePlate);
  const vehicleId = boundedIdentifier(data.vehicleId);
  if (!vehiclePlate && !vehicleId) throw new TypeError("INVALID_TELEMETRY_PAYLOAD");

  if (!Number.isFinite(data.celsius) || data.celsius < MIN_CELSIUS || data.celsius > MAX_CELSIUS) {
    throw new TypeError("INVALID_TELEMETRY_PAYLOAD");
  }

  const hasLatitude = data.latitude !== undefined;
  const hasLongitude = data.longitude !== undefined;
  if (hasLatitude !== hasLongitude) throw new TypeError("INVALID_TELEMETRY_PAYLOAD");

  return {
    vehiclePlate,
    vehicleId,
    orderPublicCode: boundedIdentifier(data.orderPublicCode),
    orderReference: boundedIdentifier(data.orderReference),
    celsius: Math.round(data.celsius * 100) / 100,
    sensorId: boundedSensorId(data.sensorId),
    hasLocation: hasLatitude && hasLongitude,
    latitude: hasLatitude ? data.latitude! : null,
    longitude: hasLongitude ? data.longitude! : null,
    speedKph: data.speedKph ?? null,
    heading: data.heading ?? null,
    recordedAt: parseRecordedAt(data.recordedAt),
  };
}

export function telemetryEventId(event: NormalizedColdChainTelemetry): string {
  const canonical = [
    event.vehiclePlate ?? event.vehicleId ?? "",
    event.sensorId ?? "",
    event.celsius.toString(),
    event.recordedAt.toISOString(),
  ].join("|");
  return `cctm_${createHash("sha256").update(canonical, "utf8").digest("hex")}`;
}

export function safeTelemetryMetadata(event: NormalizedColdChainTelemetry) {
  const identifier = event.vehiclePlate ?? event.vehicleId ?? "";
  return {
    source: "COLD_CHAIN_TELEMETRY_WEBHOOK",
    celsius: event.celsius,
    hasLocation: event.hasLocation,
    sensorId: event.sensorId,
    recordedAt: event.recordedAt.toISOString(),
    identifierHash: createHash("sha256").update(identifier, "utf8").digest("hex"),
    identifierSuffix: identifier.slice(-4),
  };
}
