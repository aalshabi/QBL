import "server-only";
import { getPrisma } from "@/lib/prisma";
import { safeText } from "@/lib/whatsapp/security";

const DECISIONS = ["CONTACTED", "CONFIRMED_READY", "RESCHEDULED", "HOLD_REORDER", "PROCEED_WITH_REASON"] as const;
export type OpsDecision = (typeof DECISIONS)[number];

export async function reviewWhatsAppConfirmation(input: { confirmationId: string; actorId: string; decision: OpsDecision; reason: string; now?: Date }) {
  if (!DECISIONS.includes(input.decision)) throw new Error("INVALID_OPS_DECISION");
  const reason = safeText(input.reason, 240);
  if (input.decision === "PROCEED_WITH_REASON" && reason.length < 8) throw new Error("PROCEED_REASON_REQUIRED");
  const now = input.now ?? new Date();
  const prisma = getPrisma();
  return prisma.$transaction(async (tx) => {
    const confirmation = await tx.whatsAppConfirmation.findUnique({ where: { id: input.confirmationId }, include: { order: { select: { status: true } } } });
    if (!confirmation) throw new Error("CONFIRMATION_NOT_FOUND");
    const nextStatus = input.decision === "CONFIRMED_READY" ? "CONFIRMED" : input.decision === "RESCHEDULED" ? "RESCHEDULE_REQUESTED" : confirmation.status;
    await tx.whatsAppConfirmation.update({ where: { id: confirmation.id }, data: { status: nextStatus, opsReviewedAt: now, opsDecision: input.decision, opsReason: reason || null } });
    await tx.whatsAppOpsAlert.updateMany({ where: { confirmationId: confirmation.id, status: { in: ["OPEN", "ACKNOWLEDGED"] } }, data: { status: "RESOLVED", resolvedAt: now } });
    if (input.decision === "CONFIRMED_READY") await tx.deliveryOrder.update({ where: { id: confirmation.orderId }, data: { requiresIntervention: false } });
    await tx.auditLog.create({ data: { orderId: confirmation.orderId, actorId: input.actorId, action: "WHATSAPP_OPS_REVIEWED", reason: input.decision, metadata: { confirmationId: confirmation.id, reason } } });
    return { confirmationId: confirmation.id, decision: input.decision, shipmentStatusUnchanged: confirmation.order.status };
  });
}
