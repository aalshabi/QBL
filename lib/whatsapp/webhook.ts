import "server-only";
import { getPrisma } from "@/lib/prisma";
import { classifyReply } from "@/lib/whatsapp/intent";
import { normalizeSaudiPhone } from "@/lib/whatsapp/phone";
import { safeText, sha256 } from "@/lib/whatsapp/security";

type MetaMessage = { id?: string; from?: string; timestamp?: string; type?: string; text?: { body?: string } };
type MetaStatus = { id?: string; status?: string; timestamp?: string; errors?: Array<{ code?: number; title?: string }> };

const STATUS_RANK = { QUEUED: 0, SENT: 1, DELIVERED: 2, READ: 3, FAILED: 4, DEAD_LETTER: 5, RECEIVED: 0 } as const;
export function shouldApplyMessageStatus(current: keyof typeof STATUS_RANK, next: keyof typeof STATUS_RANK) {
  if (next === "FAILED") return current !== "READ";
  return STATUS_RANK[next] >= STATUS_RANK[current];
}

export function extractWebhookChanges(payload: unknown) {
  const entries = typeof payload === "object" && payload && "entry" in payload && Array.isArray((payload as { entry?: unknown }).entry)
    ? (payload as { entry: Array<{ changes?: Array<{ value?: { messages?: MetaMessage[]; statuses?: MetaStatus[] } }> }> }).entry
    : [];
  const messages: MetaMessage[] = [];
  const statuses: MetaStatus[] = [];
  for (const entry of entries) for (const change of entry.changes ?? []) {
    messages.push(...(change.value?.messages ?? []));
    statuses.push(...(change.value?.statuses ?? []));
  }
  return { messages, statuses };
}

const providerDate = (timestamp?: string) => timestamp && /^\d+$/.test(timestamp) ? new Date(Number(timestamp) * 1000) : null;

export async function ingestWhatsAppWebhook(payload: unknown, rawBody: Buffer) {
  const prisma = getPrisma();
  const payloadHash = sha256(rawBody);
  const { messages, statuses } = extractWebhookChanges(payload);
  const eventIds = [...messages.map((m) => m.id), ...statuses.map((s) => s.id)].filter((id): id is string => Boolean(id));
  const eventId = eventIds.length ? `wa_${sha256(eventIds.sort().join("|"))}` : `wa_${payloadHash}`;

  try {
    await prisma.whatsAppWebhookEvent.create({ data: { id: eventId, payloadHash, eventType: messages.length ? "messages" : statuses.length ? "statuses" : "unknown" } });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") return { duplicate: true, eventId };
    throw error;
  }

  try {
    await prisma.$transaction(async (tx) => {
      for (const status of statuses) {
        if (!status.id || !status.status) continue;
        const mapped = status.status === "sent" ? "SENT" : status.status === "delivered" ? "DELIVERED" : status.status === "read" ? "READ" : status.status === "failed" ? "FAILED" : null;
        if (!mapped) continue;
        const existing = await tx.whatsAppMessage.findUnique({ where: { providerMessageId: status.id }, select: { status: true } });
        if (existing && shouldApplyMessageStatus(existing.status, mapped)) await tx.whatsAppMessage.update({ where: { providerMessageId: status.id }, data: { status: mapped, providerTimestamp: providerDate(status.timestamp), errorCode: status.errors?.[0]?.code?.toString(), errorSummary: safeText(status.errors?.[0]?.title ?? "", 120) || null } });
      }
      for (const message of messages) {
        if (!message.id || message.type !== "text" || !message.text?.body) continue;
        const phoneE164 = normalizeSaudiPhone(message.from ?? "");
        if (!phoneE164) continue;
        const active = await tx.whatsAppConfirmation.findMany({ where: { phoneE164, status: "PENDING" }, orderBy: { requestedAt: "desc" }, take: 3 });
        const intent = classifyReply(message.text.body);
        const selected = active.length === 1 ? active[0] : null;
        const resolved = selected ? intent : "MANUAL_REVIEW";
        await tx.whatsAppMessage.create({ data: { providerMessageId: message.id, orderId: selected?.orderId, confirmationId: selected?.id, direction: "INBOUND", status: "RECEIVED", phoneE164, messageType: "text", bodyRedacted: safeText(message.text.body), payloadHash: sha256(message.text.body), providerTimestamp: providerDate(message.timestamp) } });
        if (selected) await tx.whatsAppConfirmation.update({ where: { id: selected.id }, data: { status: resolved, respondedAt: new Date(), lastInboundAt: new Date(), manualReviewAt: resolved === "MANUAL_REVIEW" ? new Date() : undefined, optedOutAt: resolved === "OPTED_OUT" ? new Date() : undefined, requestedTimeText: resolved === "RESCHEDULE_REQUESTED" ? safeText(message.text.body) : undefined } });
      }
      await tx.whatsAppWebhookEvent.update({ where: { id: eventId }, data: { processedAt: new Date(), outcome: "PROCESSED", attempts: { increment: 1 } } });
    });
    return { duplicate: false, eventId, messages: messages.length, statuses: statuses.length };
  } catch (error) {
    await prisma.whatsAppWebhookEvent.update({ where: { id: eventId }, data: { attempts: { increment: 1 }, outcome: "PROCESSING_FAILED", lastError: error instanceof Error ? error.name : "UnknownError" } }).catch(() => undefined);
    throw error;
  }
}
