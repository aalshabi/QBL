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
  orderId?: string;
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
        return { accepted: true, duplicate: false, outcome, eventId, orderId: order.id };
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
        return { accepted: true, duplicate: false, outcome, eventId, orderId: order.id };
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

      return { accepted: true, duplicate: false, outcome: "UPDATED", eventId, orderId: order.id };
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { accepted: true, duplicate: true, outcome: "DUPLICATE", eventId };
    }
    throw error;
  }
}

export type LogesTechsWebhookIngestOutcome = LogesTechsWebhookOutcome | "PROCESSING_FAILED";

export type LogesTechsWebhookIngestResult = {
  accepted: true;
  duplicate: boolean;
  outcome: LogesTechsWebhookIngestOutcome;
  eventId: string;
};

/**
 * يحفظ الحدث في صندوق الوارد أولًا ثم يعالجه.
 *
 * LogesTechs لا تعيد الإرسال تلقائيًا، فأي حدث لا يُحفظ لحظة وصوله يضيع. لذلك:
 * - فشل الحفظ نفسه (القاعدة غير متاحة) هو الحالة الوحيدة التي تُرمى للمسار فيرد 503.
 * - بعد الحفظ، فشل المعالجة لا يُرمى: الحدث محفوظ بلا processedAt ويمكن إعادة معالجته.
 * - إعادة إرسال حدث محفوظ لم يُعالَج بعد تعيد محاولة معالجته؛ والمعالَج يُعاد DUPLICATE.
 */
export async function ingestLogesTechsWebhook(
  event: NormalizedLogesTechsWebhook,
): Promise<LogesTechsWebhookIngestResult> {
  if (!process.env.DATABASE_URL?.trim()) throw new Error("DATABASE_NOT_CONFIGURED");

  const prisma = getPrisma();
  const eventId = webhookEventId(event);

  try {
    await prisma.logesTechsWebhookEvent.create({
      data: {
        id: eventId,
        kind: event.kind,
        barcode: event.barcode,
        externalStatus: event.externalStatus,
        packageId: event.packageId,
        invoiceNumber: event.invoiceNumber,
        externalTime: event.externalTime,
        notes: event.notes,
        codAmount: event.codAmount,
      },
    });
  } catch (error) {
    if (!isUniqueConstraintError(error)) throw error;
    const existing = await prisma.logesTechsWebhookEvent.findUnique({
      where: { id: eventId },
      select: { processedAt: true },
    });
    if (existing?.processedAt) {
      return { accepted: true, duplicate: true, outcome: "DUPLICATE", eventId };
    }
  }

  let result: LogesTechsWebhookResult;
  try {
    result = await processLogesTechsWebhook(event);
  } catch {
    await prisma.logesTechsWebhookEvent
      .update({ where: { id: eventId }, data: { outcome: "PROCESSING_FAILED" } })
      .catch(() => undefined);
    return { accepted: true, duplicate: false, outcome: "PROCESSING_FAILED", eventId };
  }

  try {
    await prisma.logesTechsWebhookEvent.update({
      where: { id: eventId },
      data: { outcome: result.outcome, orderId: result.orderId ?? null, processedAt: new Date() },
    });
  } catch {
    // المعالجة تمت؛ بقاء processedAt فارغًا يعني أن إعادة الإرسال ستعيد المعالجة،
    // وهي آمنة لأن سجل التدقيق بالمعرّف نفسه يجعلها DUPLICATE.
  }

  return { accepted: true, duplicate: result.duplicate, outcome: result.outcome, eventId };
}
