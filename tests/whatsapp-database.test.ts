import assert from "node:assert/strict";
import test from "node:test";
import { getPrisma } from "@/lib/prisma";
import { enqueueDeliveryConfirmation, recoverExpiredWhatsAppLeases } from "@/lib/whatsapp/outbox";
import { ingestWhatsAppWebhook } from "@/lib/whatsapp/webhook";
import { evaluateWhatsAppDeadlines } from "@/lib/whatsapp/deadlines";
import { reviewWhatsAppConfirmation } from "@/lib/whatsapp/ops-review";

const databaseUrl = process.env.WHATSAPP_TEST_DATABASE_URL;
const skip = !databaseUrl ? "WHATSAPP_TEST_DATABASE_URL not set" : false;
if (databaseUrl) process.env.DATABASE_URL = databaseUrl;
process.env.WHATSAPP_PROVIDER = "360dialog";
process.env.WHATSAPP_EARLY_WARNING_MINUTES = "15";
process.env.WHATSAPP_NO_RESPONSE_MINUTES = "30";
process.env.WHATSAPP_DELIVERY_UNKNOWN_MINUTES = "15";

test("database workflow preserves atomicity, correlation, timers, alerts, lease recovery and audit history", { skip }, async () => {
  const prisma = getPrisma();
  const suffix = Date.now().toString();
  const user = await prisma.user.create({ data: { name: "WA Test Admin", email: `wa-${suffix}@example.invalid`, phone: "+966500000000", passwordHash: "test-only", roles: { create: { role: { connectOrCreate: { where: { name: "ADMIN" }, create: { name: "ADMIN" } } } } } } });
  const customer = await prisma.customer.create({ data: { name: "Test Customer", phone: "+966501234567", address: "Riyadh", latitude: 24.7, longitude: 46.7, sector: "ECOMMERCE" } });
  const client = await prisma.clientAccount.create({ data: { companyName: "Test Merchant", contactName: "Test", contactEmail: `merchant-${suffix}@example.invalid`, contactPhone: "+966500000001", sector: "ECOMMERCE" } });
  const courier1 = await prisma.courier.create({ data: { employeeCode: `WA-${suffix}-1`, displayName: "Courier One", phone: "+966500000002" } });
  const courier2 = await prisma.courier.create({ data: { employeeCode: `WA-${suffix}-2`, displayName: "Courier Two", phone: "+966500000003" } });
  const makeOrder = (n: number, courierId: string) => prisma.deliveryOrder.create({ data: { publicCode: `WA-${suffix}-${n}`, reference: `WA-REF-${suffix}-${n}`, clientAccountId: client.id, customerId: customer.id, courierId, status: "ASSIGNED", pickupAddress: "Hub", dropoffAddress: "Riyadh", dropoffLatitude: 24.7, dropoffLongitude: 46.7, serviceType: "STANDARD", temperatureTarget: "2-8C", etaMinutes: 30, scheduledAt: new Date("2026-10-16T09:00:00Z") } });
  const order1 = await makeOrder(1, courier1.id);
  const order2 = await makeOrder(2, courier1.id);
  await prisma.whatsAppConsent.create({ data: { customerId: customer.id, phoneE164: "+966501234567", purpose: "DELIVERY_UPDATES", source: "TEST", grantedAt: new Date() } });

  const first = await enqueueDeliveryConfirmation(order1.id);
  const duplicate = await enqueueDeliveryConfirmation(order1.id);
  assert.equal(first.outbox.id, duplicate.outbox.id, "one durable outbox row per shipment/version");
  const second = await enqueueDeliveryConfirmation(order2.id);
  await prisma.whatsAppConfirmation.update({ where: { id: first.confirmation.id }, data: { communicationStatus: "SENT", sentAt: new Date("2026-10-16T10:00:00Z"), requestedAt: new Date("2026-10-16T10:00:00Z") } });
  await prisma.whatsAppConfirmation.update({ where: { id: second.confirmation.id }, data: { communicationStatus: "SENT", sentAt: new Date("2026-10-16T10:00:00Z"), requestedAt: new Date("2026-10-16T10:00:00Z") } });
  await prisma.whatsAppMessage.createMany({ data: [
    { providerMessageId: `wamid-${suffix}-1`, orderId: order1.id, confirmationId: first.confirmation.id, direction: "OUTBOUND", status: "SENT", phoneE164: "+966501234567", messageType: "template", payloadHash: "one" },
    { providerMessageId: `wamid-${suffix}-2`, orderId: order2.id, confirmationId: second.confirmation.id, direction: "OUTBOUND", status: "SENT", phoneE164: "+966501234567", messageType: "template", payloadHash: "two" },
  ] });

  const deliveredPayload = { entry: [{ changes: [{ value: { statuses: [{ id: `wamid-${suffix}-1`, status: "delivered", timestamp: "1792144800" }] } }] }] };
  const rawDelivered = Buffer.from(JSON.stringify(deliveredPayload));
  await ingestWhatsAppWebhook(deliveredPayload, rawDelivered);
  assert.equal((await prisma.whatsAppConfirmation.findUniqueOrThrow({ where: { id: first.confirmation.id } })).communicationStatus, "DELIVERED");
  assert.equal((await ingestWhatsAppWebhook(deliveredPayload, rawDelivered)).duplicate, true, "duplicate webhook is idempotent");

  const ambiguous = { entry: [{ changes: [{ value: { messages: [{ id: `in-${suffix}-ambiguous`, from: "966501234567", type: "text", text: { body: "نعم" }, timestamp: "1792144860" }] } }] }] };
  await ingestWhatsAppWebhook(ambiguous, Buffer.from(JSON.stringify(ambiguous)));
  const ambiguousStates = await prisma.whatsAppConfirmation.findMany({ where: { id: { in: [first.confirmation.id, second.confirmation.id] } }, select: { status: true } });
  assert.ok(ambiguousStates.every((item) => item.status === "MANUAL_REVIEW"), "two shipments on one phone never auto-confirm");

  const quoted = { entry: [{ changes: [{ value: { messages: [{ id: `in-${suffix}-quoted`, from: "966501234567", type: "text", context: { id: `wamid-${suffix}-1` }, text: { body: "نعم" }, timestamp: "1792144920" }] } }] }] };
  await ingestWhatsAppWebhook(quoted, Buffer.from(JSON.stringify(quoted)));
  assert.equal((await prisma.whatsAppConfirmation.findUniqueOrThrow({ where: { id: first.confirmation.id } })).status, "CONFIRMED", "quoted reply selects the correct shipment");

  await prisma.whatsAppConfirmation.update({ where: { id: second.confirmation.id }, data: { status: "PENDING", communicationStatus: "DELIVERED", deliveredAt: new Date("2026-10-16T10:00:00Z"), earlyWarningAt: new Date("2026-10-16T10:15:00Z"), responseDeadlineAt: new Date("2026-10-16T10:30:00Z") } });
  await prisma.deliveryOrder.update({ where: { id: order2.id }, data: { courierId: courier2.id } });
  await evaluateWhatsAppDeadlines(new Date("2026-10-16T10:31:00Z"));
  const overdue = await prisma.whatsAppConfirmation.findUniqueOrThrow({ where: { id: second.confirmation.id } });
  assert.equal(overdue.status, "NO_REPLY");
  assert.equal((await prisma.deliveryOrder.findUniqueOrThrow({ where: { id: order2.id } })).status, "ASSIGNED", "timeout never cancels or completes the shipment");
  const noResponseAlert = await prisma.whatsAppOpsAlert.findUniqueOrThrow({ where: { confirmationId_kind: { confirmationId: second.confirmation.id, kind: "NO_RESPONSE" } } });
  assert.equal(noResponseAlert.courierIdSnapshot, courier2.id, "alert uses current reassignment safely");
  await evaluateWhatsAppDeadlines(new Date("2026-10-16T10:35:00Z"));
  assert.equal(await prisma.whatsAppOpsAlert.count({ where: { confirmationId: second.confirmation.id, kind: "NO_RESPONSE" } }), 1, "restart-safe timer evaluation does not duplicate alerts");

  const late = { entry: [{ changes: [{ value: { messages: [{ id: `in-${suffix}-late`, from: "966501234567", type: "text", context: { id: `wamid-${suffix}-2` }, text: { body: "نعم" }, timestamp: "1792146960" }] } }] }] };
  await ingestWhatsAppWebhook(late, Buffer.from(JSON.stringify(late)));
  assert.equal((await prisma.whatsAppConfirmation.findUniqueOrThrow({ where: { id: second.confirmation.id } })).status, "CONFIRMED", "late confirmation supersedes no-response without changing shipment status");
  assert.equal(await prisma.whatsAppOpsAlert.count({ where: { confirmationId: second.confirmation.id, status: "OPEN" } }), 0, "late reply cancels open alerts");

  const reviewed = await reviewWhatsAppConfirmation({ confirmationId: second.confirmation.id, actorId: user.id, decision: "HOLD_REORDER", reason: "Await customer confirmation before departure" });
  assert.equal(reviewed.shipmentStatusUnchanged, "ASSIGNED");
  assert.equal(await prisma.auditLog.count({ where: { orderId: order2.id, action: "WHATSAPP_OPS_REVIEWED" } }), 1);

  const leased = await prisma.whatsAppOutbox.create({ data: { idempotencyKey: `lease-${suffix}`, orderId: order2.id, confirmationId: second.confirmation.id, phoneE164: "+966501234567", templateName: "test", parameters: [], status: "LEASED", leaseOwner: "dead-worker", leaseExpiresAt: new Date("2026-10-16T09:00:00Z") } });
  await recoverExpiredWhatsAppLeases(new Date("2026-10-16T11:00:00Z"));
  assert.equal((await prisma.whatsAppOutbox.findUniqueOrThrow({ where: { id: leased.id } })).status, "RETRY");

  const stop = { entry: [{ changes: [{ value: { messages: [{ id: `in-${suffix}-stop`, from: "966501234567", type: "text", context: { id: `wamid-${suffix}-2` }, text: { body: "STOP" }, timestamp: "1792147200" }] } }] }] };
  await prisma.whatsAppConfirmation.update({ where: { id: second.confirmation.id }, data: { status: "MANUAL_REVIEW" } });
  await ingestWhatsAppWebhook(stop, Buffer.from(JSON.stringify(stop)));
  assert.equal((await prisma.whatsAppConfirmation.findUniqueOrThrow({ where: { id: second.confirmation.id } })).status, "OPTED_OUT");
  assert.ok((await prisma.whatsAppConsent.findFirstOrThrow({ where: { customerId: customer.id } })).revokedAt);
});
