import "server-only";
import { randomUUID } from "node:crypto";
import { getPrisma } from "@/lib/prisma";
import { assertSendingConfigured, getWhatsAppConfig } from "@/lib/whatsapp/config";
import { normalizeSaudiPhone } from "@/lib/whatsapp/phone";
import { confirmationTemplate } from "@/lib/whatsapp/templates";

const UTILITY_RATE_USD = 0.0107;

export function retryDisposition(attemptCountAfterLease: number, now = new Date()) {
  const dead = attemptCountAfterLease >= 8;
  return { dead, status: dead ? "DEAD_LETTER" as const : "RETRY" as const, nextAttemptAt: new Date(now.getTime() + Math.min(60, 2 ** attemptCountAfterLease) * 60_000) };
}

export async function recoverExpiredWhatsAppLeases(now = new Date()) {
  return getPrisma().whatsAppOutbox.updateMany({ where: { status: "LEASED", leaseExpiresAt: { lt: now } }, data: { status: "RETRY", leaseOwner: null, leaseExpiresAt: null, nextAttemptAt: now, lastError: "LEASE_EXPIRED" } });
}

export async function enqueueDeliveryConfirmation(orderId: string, version = 1) {
  const prisma = getPrisma();
  return prisma.$transaction(async (tx) => {
    const order = await tx.deliveryOrder.findUniqueOrThrow({ where: { id: orderId }, include: { customer: true, clientAccount: true } });
    if (order.status !== "ASSIGNED") throw new Error("SHIPMENT_NOT_READY");
    const phoneE164 = normalizeSaudiPhone(order.customer.phone);
    if (!phoneE164) throw new Error("INVALID_CUSTOMER_PHONE");
    const consent = await tx.whatsAppConsent.findFirst({ where: { customerId: order.customerId, phoneE164, revokedAt: null, purpose: "DELIVERY_UPDATES" }, orderBy: { grantedAt: "desc" } });
    if (!consent) throw new Error("DELIVERY_MESSAGE_OPT_IN_REQUIRED");
    const template = confirmationTemplate({ customerName: order.customer.name, merchantName: order.clientAccount.companyName, shipmentCode: order.publicCode, codAmount: order.codAmount?.toFixed(2) });
    const confirmation = await tx.whatsAppConfirmation.upsert({ where: { orderId_version: { orderId, version } }, create: { orderId, version, phoneE164, courierIdSnapshot: order.courierId }, update: {} });
    const outbox = await tx.whatsAppOutbox.upsert({ where: { idempotencyKey: `delivery-confirmation:${orderId}:v${version}` }, create: { idempotencyKey: `delivery-confirmation:${orderId}:v${version}`, orderId, confirmationId: confirmation.id, phoneE164, templateName: template.name, parameters: template.parameters }, update: {} });
    return { confirmation, outbox };
  });
}

async function sendTemplate(row: { phoneE164: string; templateName: string; templateLanguage: string; parameters: unknown }) {
  const config = assertSendingConfigured();
  const parameters = Array.isArray(row.parameters) ? row.parameters.map((text) => ({ type: "text", text: String(text) })) : [];
  const message = row.templateName === "__text__"
    ? { messaging_product: "whatsapp", to: row.phoneE164.slice(1), type: "text", text: { preview_url: false, body: parameters[0]?.text ?? "" } }
    : { messaging_product: "whatsapp", to: row.phoneE164.slice(1), type: "template", template: { name: row.templateName, language: { code: row.templateLanguage }, components: [{ type: "body", parameters }] } };
  const url = config.provider === "360dialog"
    ? "https://waba-v2.360dialog.io/messages"
    : `https://graph.facebook.com/${config.graphVersion}/${config.phoneNumberId}/messages`;
  const authorization: Record<string, string> = config.provider === "360dialog"
    ? { "D360-API-KEY": config.dialogApiKey }
    : { Authorization: `Bearer ${config.accessToken}` };
  const response = await fetch(url, { method: "POST", headers: { ...authorization, "Content-Type": "application/json" }, body: JSON.stringify(message), signal: AbortSignal.timeout(15_000) });
  const body = await response.json() as { messages?: Array<{ id?: string }>; error?: { code?: number; message?: string } };
  if (!response.ok || !body.messages?.[0]?.id) throw new Error(`META_SEND_${body.error?.code ?? response.status}`);
  return body.messages[0].id;
}

export async function processWhatsAppOutbox(limit = 10) {
  const config = getWhatsAppConfig();
  assertSendingConfigured(config);
  const prisma = getPrisma();
  const start = new Date(); start.setUTCHours(0, 0, 0, 0);
  const sentToday = await prisma.whatsAppOutbox.count({ where: { sentAt: { gte: start } } });
  if (sentToday >= config.dailyInitialLimit || (sentToday + 1) * UTILITY_RATE_USD > config.dailyCostLimitUsd) throw new Error("WHATSAPP_DAILY_GUARD_REACHED");
  const now = new Date();
  await recoverExpiredWhatsAppLeases(now);
  const leaseOwner = randomUUID();
  await prisma.whatsAppOutbox.updateMany({ where: { status: { in: ["QUEUED", "RETRY", "LEASED"] }, expiresAt: { lte: now } }, data: { status: "CANCELLED", leaseOwner: null, leaseExpiresAt: null, lastError: "CUSTOMER_SERVICE_WINDOW_CLOSED" } });
  const candidates = await prisma.whatsAppOutbox.findMany({ where: { status: { in: ["QUEUED", "RETRY"] }, nextAttemptAt: { lte: now }, AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }, { OR: [{ leaseExpiresAt: null }, { leaseExpiresAt: { lt: now } }] }] }, orderBy: { createdAt: "asc" }, take: Math.min(limit, config.dailyInitialLimit - sentToday) });
  const results = [];
  for (const candidate of candidates) {
    const leased = await prisma.whatsAppOutbox.updateMany({ where: { id: candidate.id, status: { in: ["QUEUED", "RETRY"] }, OR: [{ leaseExpiresAt: null }, { leaseExpiresAt: { lt: now } }] }, data: { status: "LEASED", leaseOwner, leaseExpiresAt: new Date(Date.now() + 60_000), attemptCount: { increment: 1 } } });
    if (!leased.count) continue;
    try {
      const providerMessageId = await sendTemplate(candidate);
      await prisma.$transaction([
        prisma.whatsAppOutbox.update({ where: { id: candidate.id }, data: { status: "SENT", providerMessageId, sentAt: new Date(), leaseOwner: null, leaseExpiresAt: null } }),
        prisma.whatsAppConfirmation.update({ where: { id: candidate.confirmationId }, data: { requestedAt: new Date(), sentAt: new Date(), communicationStatus: "SENT" } }),
        prisma.whatsAppMessage.create({ data: { providerMessageId, orderId: candidate.orderId, confirmationId: candidate.confirmationId, direction: "OUTBOUND", status: "SENT", phoneE164: candidate.phoneE164, messageType: candidate.templateName === "__text__" ? "text" : "template", payloadHash: candidate.idempotencyKey } }),
      ]);
      results.push({ id: candidate.id, status: "SENT" });
    } catch (error) {
      const attempt = candidate.attemptCount + 1;
      const disposition = retryDisposition(attempt);
      await prisma.$transaction([
        prisma.whatsAppOutbox.update({ where: { id: candidate.id }, data: { status: disposition.status, nextAttemptAt: disposition.nextAttemptAt, leaseOwner: null, leaseExpiresAt: null, lastError: error instanceof Error ? error.message.slice(0, 120) : "SEND_FAILED" } }),
        ...(disposition.dead ? [prisma.whatsAppConfirmation.update({ where: { id: candidate.confirmationId }, data: { communicationStatus: "FAILED", manualReviewAt: new Date() } })] : []),
      ]);
      results.push({ id: candidate.id, status: disposition.status });
    }
  }
  return results;
}
