import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import type { AdminOrderStatus } from "@/lib/admin/types";

const MIN_SECRET_LENGTH = 32;
const MAX_REQUEST_BYTES = 32 * 1024;
const BARCODE_PATTERN = /^[A-Za-z0-9._-]{3,100}$/;
const STATUS_PATTERN = /^[A-Za-z0-9_ -]{2,100}$/;

export class LogesTechsWebhookConfigurationError extends Error {
  constructor(public readonly variable: "LOGESTECHS_WEBHOOK_API_KEY") {
    super(`Missing or weak LogesTechs webhook configuration: ${variable}`);
    this.name = "LogesTechsWebhookConfigurationError";
  }
}

const webhookPayloadSchema = z
  .object({
    packageId: z.union([z.string(), z.number()]).optional(),
    bundledId: z.union([z.string(), z.number()]).optional(),
    newStatus: z.string().optional(),
    status: z.string().optional(),
    barcode: z.string().optional(),
    Barcode: z.string().optional(),
    packageBarcode: z.string().optional(),
    invoiceNumber: z.union([z.string(), z.number()]).optional(),
    time: z.union([z.string(), z.number()]).optional(),
    postponedDate: z.string().optional(),
    postponedDeliveryDate: z.string().optional(),
  })
  .passthrough();

export type NormalizedLogesTechsWebhook = {
  kind: "LAST_MILE" | "FULFILLMENT";
  barcode: string;
  externalStatus: string;
  packageId: string | null;
  invoiceNumber: string | null;
  externalTime: Date | null;
};

export type WebhookTransportValidation =
  | { ok: true; rateKey: string }
  | { ok: false; status: 401 | 413 | 415; error: string };

function webhookSecret(): string {
  const value = process.env.LOGESTECHS_WEBHOOK_API_KEY?.trim();
  if (!value || value.length < MIN_SECRET_LENGTH) {
    throw new LogesTechsWebhookConfigurationError("LOGESTECHS_WEBHOOK_API_KEY");
  }
  return value;
}

function secureEquals(left: string, right: string): boolean {
  const leftHash = createHash("sha256").update(left, "utf8").digest();
  const rightHash = createHash("sha256").update(right, "utf8").digest();
  return timingSafeEqual(leftHash, rightHash);
}

export function validateWebhookTransport(request: Request): WebhookTransportValidation {
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

function boundedText(value: string | number | undefined, maxLength: number): string | null {
  if (value === undefined) return null;
  const text = String(value).normalize("NFKC").trim();
  return text && text.length <= maxLength ? text : null;
}

function parseExternalTime(value: string | number | undefined): Date | null {
  if (value === undefined) return null;
  const raw = typeof value === "number" ? value : /^\d+$/.test(value.trim()) ? Number(value) : NaN;
  const milliseconds = Number.isFinite(raw)
    ? raw < 10_000_000_000
      ? raw * 1_000
      : raw
    : Date.parse(String(value));
  if (!Number.isFinite(milliseconds)) return null;
  const date = new Date(milliseconds);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function normalizeLogesTechsWebhookPayload(input: unknown): NormalizedLogesTechsWebhook {
  const parsed = webhookPayloadSchema.safeParse(input);
  if (!parsed.success) throw new TypeError("INVALID_WEBHOOK_PAYLOAD");

  const data = parsed.data;
  const kind = data.newStatus ? "LAST_MILE" : "FULFILLMENT";
  const barcode = boundedText(data.barcode ?? data.Barcode ?? data.packageBarcode, 100);
  const externalStatus =
    boundedText(data.newStatus ?? data.status, 100)?.toUpperCase().replace(/[\s-]+/g, "_") ?? null;

  if (!barcode || !BARCODE_PATTERN.test(barcode) || !externalStatus || !STATUS_PATTERN.test(externalStatus)) {
    throw new TypeError("INVALID_WEBHOOK_PAYLOAD");
  }

  return {
    kind,
    barcode,
    externalStatus,
    packageId: boundedText(data.packageId, 100),
    invoiceNumber: boundedText(data.invoiceNumber, 150),
    externalTime: parseExternalTime(data.time),
  };
}

export function webhookEventId(event: NormalizedLogesTechsWebhook): string {
  const canonical = [
    event.kind,
    event.barcode,
    event.externalStatus,
    event.packageId ?? "",
    event.invoiceNumber ?? "",
    event.externalTime?.toISOString() ?? "",
  ].join("|");
  return `ltwh_${createHash("sha256").update(canonical, "utf8").digest("hex")}`;
}

export function safeWebhookMetadata(event: NormalizedLogesTechsWebhook) {
  return {
    source: "LOGESTECHS_WEBHOOK",
    eventKind: event.kind,
    externalStatus: event.externalStatus,
    externalTime: event.externalTime?.toISOString() ?? null,
    identifierHash: createHash("sha256").update(event.barcode, "utf8").digest("hex"),
    identifierSuffix: event.barcode.slice(-4),
  };
}

export type TransitionDecision = "UPDATE" | "NO_CHANGE" | "BLOCK_STALE";

const TERMINAL_STATUSES = new Set<AdminOrderStatus>(["DELIVERED", "RETURNED", "CANCELLED"]);
const RETRYABLE_FAILURES = new Set<AdminOrderStatus>(["FAILED", "POSTPONED"]);
const RETRY_TARGETS = new Set<AdminOrderStatus>(["OUT_FOR_DELIVERY", "DELIVERED", "RETURNED", "CANCELLED"]);
const STATUS_RANK: Partial<Record<AdminOrderStatus, number>> = {
  CREATED: 10,
  PENDING_APPROVAL: 20,
  ASSIGNED: 30,
  OUT_FOR_DELIVERY: 40,
  ARRIVED: 50,
  POSTPONED: 60,
  FAILED: 70,
  DELIVERED: 100,
  RETURNED: 100,
  CANCELLED: 100,
};

export function decideWebhookTransition(
  current: AdminOrderStatus,
  incoming: AdminOrderStatus,
): TransitionDecision {
  if (current === incoming) return "NO_CHANGE";
  if (TERMINAL_STATUSES.has(current)) return "BLOCK_STALE";
  if (RETRYABLE_FAILURES.has(current) && RETRY_TARGETS.has(incoming)) return "UPDATE";
  if (TERMINAL_STATUSES.has(incoming)) return "UPDATE";
  return (STATUS_RANK[incoming] ?? 0) >= (STATUS_RANK[current] ?? 0) ? "UPDATE" : "BLOCK_STALE";
}

export function webhookStatusTimestamps(status: AdminOrderStatus, now: Date) {
  return {
    assignedAt: status === "ASSIGNED" ? now : undefined,
    outForDeliveryAt: status === "OUT_FOR_DELIVERY" ? now : undefined,
    arrivedAt: status === "ARRIVED" ? now : undefined,
    deliveredAt: status === "DELIVERED" ? now : undefined,
    postponedAt: status === "POSTPONED" ? now : undefined,
    failedAt: status === "FAILED" ? now : undefined,
  };
}
