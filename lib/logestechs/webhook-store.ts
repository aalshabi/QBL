import "server-only";
import type { AdminOrderStatus } from "@/lib/admin/types";
import { getPrisma } from "@/lib/prisma";
import { mapLogesTechsStatus } from "./status-map";
import { eventDecision } from "./event-policy";
import {
  safeWebhookMetadata,
  webhookEventId,
  webhookStatusTimestamps,
  type NormalizedLogesTechsWebhook,
} from "./webhook";

const TERMINAL = new Set(["PROCESSED", "REVIEW_REQUIRED"]);
export type LogesTechsWebhookResult = {
  accepted: true;
  duplicate: boolean;
  outcome: string;
  eventId: string;
};

function errorCode(error: unknown): string | undefined {
  return error && typeof error === "object" && "code" in error
    ? String(error.code)
    : undefined;
}

export async function reconcileLogesTechsEvent(
  eventId: string,
): Promise<string> {
  const prisma = getPrisma();
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const event = await tx.logesTechsEvent.findUniqueOrThrow({
            where: { id: eventId },
          });
          if (TERMINAL.has(event.state)) return event.outcome ?? event.state;
          const now = new Date();
          const normalized: NormalizedLogesTechsWebhook = {
            kind: event.kind as NormalizedLogesTechsWebhook["kind"],
            barcode: event.barcode,
            externalStatus: event.externalStatus,
            packageId: event.packageId,
            invoiceNumber: event.invoiceNumber,
            externalTime: event.eventOccurredAt,
          };
          const orders = await tx.deliveryOrder.findMany({
            where: {
              OR: [
                { barcode: event.barcode },
                { barcode: null, publicCode: event.barcode },
              ],
            },
            take: 2,
            select: { id: true, status: true, logestechsOccurredAt: true },
          });
          let outcome: string;
          let state = "PROCESSED";
          const order = orders.length === 1 ? orders[0] : null;
          const target =
            event.kind === "FULFILLMENT"
              ? event.externalStatus === "CREATED"
                ? "CREATED"
                : null
              : mapLogesTechsStatus(event.externalStatus);
          if (!orders.length) {
            outcome = "PENDING_ORDER";
            state = "PENDING";
          } else if (!order) {
            outcome = "AMBIGUOUS_ORDER";
            state = "REVIEW_REQUIRED";
          } else if (!target) {
            outcome = "UNMAPPED_STATUS";
            state = "REVIEW_REQUIRED";
          } else {
            outcome = eventDecision({
              current: order.status as AdminOrderStatus,
              incoming: target,
              occurredAt: event.eventOccurredAt,
              receivedAt: event.eventReceivedAt,
              lastOccurredAt: order.logestechsOccurredAt,
            });
            if (outcome === "REVIEW_REQUIRED") state = "REVIEW_REQUIRED";
            if (outcome === "UPDATE" || outcome === "NO_CHANGE") {
              await tx.deliveryOrder.update({
                where: { id: order.id },
                data: {
                  ...(outcome === "UPDATE"
                    ? {
                        status: target,
                        ...webhookStatusTimestamps(
                          target,
                          event.eventOccurredAt!,
                        ),
                      }
                    : {}),
                  logestechsOccurredAt: event.eventOccurredAt,
                },
              });
            }
          }
          const attempts = event.attempts + 1;
          if (state === "PENDING" && attempts >= 96) {
            state = "REVIEW_REQUIRED";
            outcome = "ORDER_RECONCILIATION_EXHAUSTED";
          }
          await tx.logesTechsEvent.update({
            where: { id: event.id },
            data: {
              state,
              outcome,
              orderId: order?.id,
              attempts,
              lastAttemptAt: now,
              nextAttemptAt: new Date(
                now.getTime() +
                  Math.min(3_600_000, 60_000 * 2 ** Math.min(attempts, 6)),
              ),
              processedAt: state === "PROCESSED" ? now : null,
              lastError: null,
            },
          });
          await tx.auditLog.upsert({
            where: { id: event.id },
            create: {
              id: event.id,
              orderId: order?.id,
              action: "STATUS_CHANGED",
              reason: "LogesTechs event reconciliation",
              metadata: { ...safeWebhookMetadata(normalized), outcome },
            },
            update: {
              orderId: order?.id,
              metadata: { ...safeWebhookMetadata(normalized), outcome },
            },
          });
          return outcome;
        },
        { isolationLevel: "Serializable" },
      );
    } catch (error) {
      if (errorCode(error) === "P2034" && attempt < 2) continue;
      // Inbox insertion was committed separately. A processing outage cannot erase it.
      try {
        await prisma.logesTechsEvent.updateMany({
          where: { id: eventId, state: "PENDING" },
          data: {
            lastError: "PROCESSING_FAILED",
            nextAttemptAt: new Date(Date.now() + 60_000),
          },
        });
      } catch {
        /* preserve original failure */
      }
      throw error;
    }
  }
  throw new Error("RECONCILIATION_FAILED");
}

export async function processLogesTechsWebhook(
  event: NormalizedLogesTechsWebhook,
): Promise<LogesTechsWebhookResult> {
  const prisma = getPrisma(),
    eventId = webhookEventId(event);
  const created = await prisma.logesTechsEvent.createMany({
    data: [
      {
        id: eventId,
        kind: event.kind,
        barcode: event.barcode,
        externalStatus: event.externalStatus,
        packageId: event.packageId,
        invoiceNumber: event.invoiceNumber,
        eventOccurredAt: event.externalTime,
      },
    ],
    skipDuplicates: true,
  });
  const duplicate = created.count === 0;
  if (duplicate) {
    const existing = await prisma.logesTechsEvent.findUniqueOrThrow({
      where: { id: eventId },
    });
    if (TERMINAL.has(existing.state) || existing.nextAttemptAt > new Date())
      return {
        accepted: true,
        duplicate: true,
        outcome: existing.outcome ?? existing.state,
        eventId,
      };
  }
  try {
    return {
      accepted: true,
      duplicate,
      outcome: await reconcileLogesTechsEvent(eventId),
      eventId,
    };
  } catch {
    return { accepted: true, duplicate, outcome: "PENDING_RETRY", eventId };
  }
}

export async function retryPendingLogesTechsEvents(limit = 50) {
  const prisma = getPrisma(),
    name = "logestechs-reconciliation",
    now = new Date();
  await prisma.integrationJobRun.upsert({
    where: { name },
    create: { name, lastStartedAt: now },
    update: { lastStartedAt: now },
  });
  try {
    const events = await prisma.logesTechsEvent.findMany({
      where: { state: "PENDING", nextAttemptAt: { lte: now } },
      orderBy: { nextAttemptAt: "asc" },
      take: Math.max(1, Math.min(limit, 100)),
      select: { id: true },
    });
    let failed = 0;
    for (const event of events) {
      try {
        await reconcileLogesTechsEvent(event.id);
      } catch {
        failed++;
      }
    }
    await prisma.integrationJobRun.update({
      where: { name },
      data: {
        ...(failed ? {} : { lastSucceededAt: new Date() }),
        lastError: failed ? "PROCESSING_FAILED" : null,
        processedCount: events.length - failed,
      },
    });
    return { processed: events.length - failed, failed };
  } catch (error) {
    await prisma.integrationJobRun
      .update({ where: { name }, data: { lastError: "JOB_FAILED" } })
      .catch(() => {});
    throw error;
  }
}
