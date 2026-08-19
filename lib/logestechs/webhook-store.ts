import "server-only";

import type { AdminOrderStatus } from "@/lib/admin/types";
import { getPrisma } from "@/lib/prisma";
import { mapLogesTechsStatus } from "@/lib/logestechs/status-map";
import {
  decideWebhookTransition,
  safeWebhookMetadata,
  webhookEventId,
  webhookStatusTimestamps,
  type NormalizedLogesTechsWebhook,
} from "@/lib/logestechs/webhook";

export type LogesTechsWebhookOutcome =
  | "UPDATED"
  | "NO_CHANGE"
  | "IGNORED_UNMAPPED"
  | "IGNORED_ORDER_NOT_FOUND"
  | "IGNORED_STALE"
  | "DUPLICATE";

export type LogesTechsWebhookResult = {
  accepted: true;
  duplicate: boolean;
  outcome: LogesTechsWebhookOutcome;
  eventId: string;
};

function mappedStatus(event: NormalizedLogesTechsWebhook): AdminOrderStatus | null {
  if (event.kind === "FULFILLMENT") {
    return event.externalStatus === "CREATED" ? "CREATED" : null;
  }
  return mapLogesTechsStatus(event.externalStatus);
}

function isUniqueConstraintError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: unknown }).code === "P2002",
  );
}

export async function processLogesTechsWebhook(
  event: NormalizedLogesTechsWebhook,
): Promise<LogesTechsWebhookResult> {
  if (!process.env.DATABASE_URL?.trim()) throw new Error("DATABASE_NOT_CONFIGURED");

  const prisma = getPrisma();
  const eventId = webhookEventId(event);
  const baseMetadata = safeWebhookMetadata(event);

  try {
    return await prisma.$transaction(async (tx) => {
      await tx.auditLog.create({
        data: {
          id: eventId,
          action: "STATUS_CHANGED",
          reason: "LogesTechs webhook received",
          metadata: { ...baseMetadata, outcome: "RECEIVED" },
        },
      });

      const identifiers = [
        { barcode: event.barcode },
        { publicCode: event.barcode },
        { reference: event.barcode },
        ...(event.invoiceNumber
          ? [{ reference: event.invoiceNumber }, { publicCode: event.invoiceNumber }]
          : []),
      ];
      const order = await tx.deliveryOrder.findFirst({
        where: { OR: identifiers },
        select: { id: true, status: true },
      });

      if (!order) {
        const outcome = "IGNORED_ORDER_NOT_FOUND" as const;
        await tx.auditLog.update({
          where: { id: eventId },
          data: {
            reason: "LogesTechs webhook ignored: order not found",
            metadata: { ...baseMetadata, outcome },
          },
        });
        return { accepted: true, duplicate: false, outcome, eventId };
      }

      const targetStatus = mappedStatus(event);
      if (!targetStatus) {
        const outcome = "IGNORED_UNMAPPED" as const;
        await tx.auditLog.update({
          where: { id: eventId },
          data: {
            orderId: order.id,
            reason: "LogesTechs webhook ignored: unmapped status",
            metadata: { ...baseMetadata, outcome, currentStatus: order.status },
          },
        });
        return { accepted: true, duplicate: false, outcome, eventId };
      }

      const decision = decideWebhookTransition(order.status as AdminOrderStatus, targetStatus);
      if (decision !== "UPDATE") {
        const outcome: "NO_CHANGE" | "IGNORED_STALE" =
          decision === "NO_CHANGE" ? "NO_CHANGE" : "IGNORED_STALE";
        await tx.auditLog.update({
          where: { id: eventId },
          data: {
            orderId: order.id,
            reason: decision === "NO_CHANGE"
              ? "LogesTechs webhook matched current status"
              : "LogesTechs webhook ignored: stale transition",
            metadata: {
              ...baseMetadata,
              outcome,
              currentStatus: order.status,
              requestedStatus: targetStatus,
            },
          },
        });
        return { accepted: true, duplicate: false, outcome, eventId };
      }

      const now = new Date();
      await tx.deliveryOrder.update({
        where: { id: order.id },
        data: { status: targetStatus, ...webhookStatusTimestamps(targetStatus, now) },
      });
      await tx.auditLog.update({
        where: { id: eventId },
        data: {
          orderId: order.id,
          reason: "Status synchronized from LogesTechs webhook",
          metadata: {
            ...baseMetadata,
            outcome: "UPDATED",
            from: order.status,
            to: targetStatus,
          },
        },
      });

      return { accepted: true, duplicate: false, outcome: "UPDATED", eventId };
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { accepted: true, duplicate: true, outcome: "DUPLICATE", eventId };
    }
    throw error;
  }
}
