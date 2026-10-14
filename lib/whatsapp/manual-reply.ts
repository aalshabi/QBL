import "server-only";
import { randomUUID } from "node:crypto";
import { getPrisma } from "@/lib/prisma";
import { safeText, sha256 } from "@/lib/whatsapp/security";

export const CUSTOMER_SERVICE_WINDOW_MS = 24 * 60 * 60 * 1000;

export function customerServiceWindowEnds(lastInboundAt: Date, now = new Date()) {
  const endsAt = new Date(lastInboundAt.getTime() + CUSTOMER_SERVICE_WINDOW_MS);
  return { endsAt, open: endsAt.getTime() > now.getTime() };
}

export async function queueManualReply(input: { confirmationId: string; actorId: string; body: string; now?: Date }) {
  const now = input.now ?? new Date();
  const body = safeText(input.body, 800);
  if (body.length < 1) throw new Error("EMPTY_REPLY");
  const prisma = getPrisma();
  return prisma.$transaction(async (tx) => {
    const confirmation = await tx.whatsAppConfirmation.findUnique({ where: { id: input.confirmationId }, select: { id: true, orderId: true, phoneE164: true, lastInboundAt: true, optedOutAt: true } });
    if (!confirmation) throw new Error("CONFIRMATION_NOT_FOUND");
    if (confirmation.optedOutAt) throw new Error("CUSTOMER_OPTED_OUT");
    if (!confirmation.lastInboundAt) throw new Error("NO_CUSTOMER_SERVICE_WINDOW");
    const window = customerServiceWindowEnds(confirmation.lastInboundAt, now);
    if (!window.open) throw new Error("CUSTOMER_SERVICE_WINDOW_CLOSED");
    const idempotencyKey = `manual-reply:${confirmation.id}:${sha256(body)}:${randomUUID()}`;
    const outbox = await tx.whatsAppOutbox.create({ data: { idempotencyKey, orderId: confirmation.orderId, confirmationId: confirmation.id, phoneE164: confirmation.phoneE164, templateName: "__text__", parameters: [body], expiresAt: window.endsAt } });
    await tx.auditLog.create({ data: { orderId: confirmation.orderId, actorId: input.actorId, action: "WHATSAPP_MANUAL_REPLY_QUEUED", reason: "Manual WhatsApp reply queued inside customer-service window", metadata: { outboxId: outbox.id, confirmationId: confirmation.id, bodyHash: sha256(body), expiresAt: window.endsAt.toISOString() } } });
    return { outboxId: outbox.id, expiresAt: window.endsAt };
  });
}
