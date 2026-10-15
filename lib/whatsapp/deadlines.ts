import "server-only";
import { getPrisma } from "@/lib/prisma";
import { getWhatsAppConfig } from "@/lib/whatsapp/config";
import { sha256 } from "@/lib/whatsapp/security";

const minutesBefore = (now: Date, minutes: number) => new Date(now.getTime() - minutes * 60_000);

export async function evaluateWhatsAppDeadlines(now = new Date()) {
  const prisma = getPrisma();
  const config = getWhatsAppConfig();
  const pending = await prisma.whatsAppConfirmation.findMany({
    where: { status: "PENDING", respondedAt: null, communicationStatus: { in: ["SENT", "DELIVERED", "FAILED"] } },
    include: { order: { select: { id: true, courierId: true } } },
    take: 500,
  });
  const created: Array<{ confirmationId: string; kind: string }> = [];

  for (const confirmation of pending) {
    let kind: "DELIVERY_UNKNOWN" | "EARLY_WARNING" | "NO_RESPONSE" | "SEND_FAILED" | null = null;
    let dueAt: Date | null = null;
    if (confirmation.communicationStatus === "FAILED") {
      kind = "SEND_FAILED";
    } else if (!confirmation.deliveredAt && confirmation.sentAt && confirmation.sentAt <= minutesBefore(now, config.deliveryUnknownMinutes)) {
      kind = "DELIVERY_UNKNOWN";
      dueAt = new Date(confirmation.sentAt.getTime() + config.deliveryUnknownMinutes * 60_000);
    } else if (confirmation.deliveredAt && confirmation.responseDeadlineAt && confirmation.responseDeadlineAt <= now) {
      kind = "NO_RESPONSE";
      dueAt = confirmation.responseDeadlineAt;
    } else if (confirmation.deliveredAt && confirmation.earlyWarningAt && confirmation.earlyWarningAt <= now) {
      kind = "EARLY_WARNING";
      dueAt = confirmation.earlyWarningAt;
    }
    if (!kind) continue;

    const wasCreated = await prisma.$transaction(async (tx) => {
      const existingAlert = await tx.whatsAppOpsAlert.findUnique({ where: { confirmationId_kind: { confirmationId: confirmation.id, kind } }, select: { id: true } });
      if (existingAlert) return false;
      const detailsHash = sha256(`${confirmation.id}:${kind}:${dueAt?.toISOString() ?? "immediate"}`);
      const alert = await tx.whatsAppOpsAlert.create({ data: { confirmationId: confirmation.id, orderId: confirmation.orderId, kind, dueAt, courierIdSnapshot: confirmation.order.courierId ?? confirmation.courierIdSnapshot, detailsHash } });
      if (kind === "NO_RESPONSE") {
        await tx.whatsAppConfirmation.update({ where: { id: confirmation.id }, data: { status: "NO_REPLY", manualReviewAt: now } });
        await tx.deliveryOrder.update({ where: { id: confirmation.orderId }, data: { requiresIntervention: true } });
      }
      await tx.auditLog.create({ data: { orderId: confirmation.orderId, action: "WHATSAPP_OPS_ALERT_CREATED", reason: kind, metadata: { alertId: alert.id, dueAt: dueAt?.toISOString() ?? null } } });
      return true;
    });
    if (wasCreated) created.push({ confirmationId: confirmation.id, kind });
  }
  return { evaluated: pending.length, created };
}

export async function resolveOpenAlerts(confirmationId: string, now = new Date()) {
  const prisma = getPrisma();
  return prisma.whatsAppOpsAlert.updateMany({ where: { confirmationId, status: { in: ["OPEN", "ACKNOWLEDGED"] } }, data: { status: "RESOLVED", resolvedAt: now } });
}
