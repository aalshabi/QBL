import "server-only";
import { getPrisma } from "@/lib/prisma";
import { classifyReply } from "@/lib/whatsapp/intent";
import { normalizeSaudiPhone } from "@/lib/whatsapp/phone";
import { safeText, sha256 } from "@/lib/whatsapp/security";
import { getWhatsAppConfig } from "@/lib/whatsapp/config";

type MetaMessage = { id?: string; from?: string; timestamp?: string; type?: string; text?: { body?: string }; context?: { id?: string } };
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
  const config = getWhatsAppConfig();
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
        const existing = await tx.whatsAppMessage.findUnique({ where: { providerMessageId: status.id }, select: { status: true, confirmationId: true, orderId: true } });
        if (existing && shouldApplyMessageStatus(existing.status, mapped)) {
          const occurredAt = providerDate(status.timestamp) ?? new Date();
          await tx.whatsAppMessage.update({ where: { providerMessageId: status.id }, data: { status: mapped, providerTimestamp: occurredAt, errorCode: status.errors?.[0]?.code?.toString(), errorSummary: safeText(status.errors?.[0]?.title ?? "", 120) || null } });
          if (existing.confirmationId && mapped === "DELIVERED") {
            await tx.whatsAppConfirmation.update({ where: { id: existing.confirmationId }, data: { communicationStatus: "DELIVERED", deliveredAt: occurredAt, earlyWarningAt: new Date(occurredAt.getTime() + config.earlyWarningMinutes * 60_000), responseDeadlineAt: new Date(occurredAt.getTime() + config.noResponseMinutes * 60_000) } });
          } else if (existing.confirmationId && mapped === "SENT") {
            await tx.whatsAppConfirmation.update({ where: { id: existing.confirmationId }, data: { communicationStatus: "SENT", sentAt: occurredAt } });
          } else if (existing.confirmationId && mapped === "FAILED") {
            await tx.whatsAppConfirmation.update({ where: { id: existing.confirmationId }, data: { communicationStatus: "FAILED", manualReviewAt: occurredAt } });
          }
        }
      }
      for (const message of messages) {
        if (!message.id) continue;
        const phoneE164 = normalizeSaudiPhone(message.from ?? "");
        if (!phoneE164) continue;
        const active = await tx.whatsAppConfirmation.findMany({ where: { phoneE164, status: { in: ["PENDING", "NO_REPLY", "MANUAL_REVIEW", "RESCHEDULE_REQUESTED"] }, optedOutAt: null }, orderBy: { requestedAt: "desc" }, take: 5 });
        const quoted = message.context?.id ? await tx.whatsAppMessage.findUnique({ where: { providerMessageId: message.context.id }, select: { confirmationId: true } }) : null;
        const selected = quoted?.confirmationId ? active.find((item) => item.id === quoted.confirmationId) ?? null : active.length === 1 ? active[0] : null;
        const body = message.type === "text" && message.text?.body ? message.text.body : `[${message.type ?? "unsupported"}]`;
        const intent = message.type === "text" && message.text?.body ? classifyReply(message.text.body) : "MANUAL_REVIEW";
        const resolved = selected ? intent : "MANUAL_REVIEW";
        const receivedAt = providerDate(message.timestamp) ?? new Date();
        await tx.whatsAppMessage.create({ data: { providerMessageId: message.id, orderId: selected?.orderId, confirmationId: selected?.id, direction: "INBOUND", status: "RECEIVED", phoneE164, messageType: message.type ?? "unsupported", bodyRedacted: safeText(body), payloadHash: sha256(body), providerTimestamp: receivedAt } });
        if (selected) {
          await tx.whatsAppConfirmation.update({ where: { id: selected.id }, data: { status: resolved, respondedAt: receivedAt, lastInboundAt: receivedAt, manualReviewAt: resolved === "MANUAL_REVIEW" ? receivedAt : undefined, optedOutAt: resolved === "OPTED_OUT" ? receivedAt : undefined, requestedTimeText: resolved === "RESCHEDULE_REQUESTED" ? safeText(body) : undefined } });
          await tx.whatsAppOpsAlert.updateMany({ where: { confirmationId: selected.id, status: { in: ["OPEN", "ACKNOWLEDGED"] } }, data: { status: "RESOLVED", resolvedAt: receivedAt } });
          if (resolved === "OPTED_OUT") await tx.whatsAppConsent.updateMany({ where: { phoneE164, revokedAt: null }, data: { revokedAt: receivedAt } });
        } else if (active.length) {
          for (const candidate of active) {
            await tx.whatsAppConfirmation.update({ where: { id: candidate.id }, data: { status: "MANUAL_REVIEW", manualReviewAt: receivedAt, lastInboundAt: receivedAt } });
            await tx.whatsAppOpsAlert.upsert({ where: { confirmationId_kind: { confirmationId: candidate.id, kind: "NEEDS_REVIEW" } }, create: { confirmationId: candidate.id, orderId: candidate.orderId, kind: "NEEDS_REVIEW", detailsHash: sha256(`${message.id}:${candidate.id}`) }, update: {} });
          }
        }
      }
      await tx.whatsAppWebhookEvent.update({ where: { id: eventId }, data: { processedAt: new Date(), outcome: "PROCESSED", attempts: { increment: 1 } } });
    });
    return { duplicate: false, eventId, messages: messages.length, statuses: statuses.length };
  } catch (error) {
    await prisma.whatsAppWebhookEvent.update({ where: { id: eventId }, data: { attempts: { increment: 1 }, outcome: "PROCESSING_FAILED", lastError: error instanceof Error ? error.name : "UnknownError" } }).catch(() => undefined);
    throw error;
  }
}
