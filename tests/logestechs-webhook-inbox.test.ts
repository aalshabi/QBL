import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { normalizeLogesTechsWebhookPayload, webhookEventId } from "@/lib/logestechs/webhook";

/**
 * صندوق الوارد لأحداث LogesTechs.
 *
 * اختبارات الوحدة تعمل دائمًا. اختبارات التكامل تكتب في قاعدة Postgres حقيقية، فلا تعمل
 * إلا إذا ضُبط LOGESTECHS_INBOX_TEST_DATABASE_URL على قاعدة اختبار فارغة مُرحَّلة
 * (`prisma migrate deploy`). لا تشير به إلى قاعدة الإنتاج أبدًا.
 */

test("normalization keeps the failure note and COD, still drops driver PII", () => {
  const event = normalizeLogesTechsWebhookPayload({
    packageId: 368200054,
    newStatus: "FAILED",
    barcode: "100368200545",
    cod: "125.5",
    notes: "العميل لا يرد",
    driverName: "Private Driver",
    driverPhone: "+966500000000",
    attachmentUrls: ["https://example.invalid/pod.png"],
  });

  assert.equal(event.notes, "العميل لا يرد");
  assert.equal(event.codAmount, 125.5);
  const serialized = JSON.stringify(event);
  assert.equal(serialized.includes("Private Driver"), false);
  assert.equal(serialized.includes("966500000000"), false);
  assert.equal(serialized.includes("pod.png"), false);
});

test("documented capitalised Notes/Cod are accepted; junk COD becomes null", () => {
  const event = normalizeLogesTechsWebhookPayload({
    newStatus: "POSTPONED_DELIVERY",
    barcode: "QBL-1",
    Notes: "postponed reason",
    Cod: "not-a-number",
  });
  assert.equal(event.notes, "postponed reason");
  assert.equal(event.codAmount, null);
});

test("notes and COD do not change the event id, so earlier audit ids still dedupe", () => {
  const base = { newStatus: "OUT_FOR_DELIVERY", barcode: "QBL-2", time: 1_762_347_300_095 };
  assert.equal(
    webhookEventId(normalizeLogesTechsWebhookPayload(base)),
    webhookEventId(normalizeLogesTechsWebhookPayload({ ...base, notes: "x", cod: 10 })),
  );
});

// ---------------------------------------------------------------------------
// تكامل: المسار الحقيقي + Postgres حقيقية
// ---------------------------------------------------------------------------

const databaseUrl = process.env.LOGESTECHS_INBOX_TEST_DATABASE_URL;
// هذه الاختبارات تمسح جداول؛ ترفض أي قاعدة غير محلية حتى لو ضُبط المتغير خطأً.
const isLocal = Boolean(databaseUrl && /@(localhost|127\.0\.0\.1)[:/]/.test(databaseUrl));
const skip = !databaseUrl
  ? "LOGESTECHS_INBOX_TEST_DATABASE_URL not set"
  : !isLocal
    ? "LOGESTECHS_INBOX_TEST_DATABASE_URL must point at localhost"
    : false;
const secret = "inbox-integration-test-secret-0123456789abcd";

type Prisma = Awaited<ReturnType<typeof import("@/lib/prisma")["getPrisma"]>>;
let prisma: Prisma;
let POST: (request: Request) => Promise<Response>;

function webhook(body: unknown, apiKey: string | null = secret) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (apiKey) headers["x-api-key"] = apiKey;
  return new Request("https://qbl-logistics.vercel.app/api/webhooks/logestechs/status", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

before(async () => {
  if (skip) return;
  process.env.DATABASE_URL = databaseUrl;
  process.env.LOGESTECHS_WEBHOOK_API_KEY = secret;
  prisma = (await import("@/lib/prisma")).getPrisma();
  // المسار يقرأ الترويسات والجسم فقط، فـ Request العادي يكفيه.
  POST = (await import("@/app/api/webhooks/logestechs/status/route")).POST as unknown as typeof POST;
  await prisma.logesTechsWebhookEvent.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.deliveryOrder.deleteMany({ where: { reference: { startsWith: "INBOX-TEST-" } } });
});

after(async () => {
  if (skip) return;
  await prisma.$disconnect();
});

test("unknown barcode: 200, stored with note and COD, processed as ORDER_NOT_FOUND", { skip }, async () => {
  const response = await POST(
    webhook({ packageId: 1, newStatus: "FAILED", barcode: "LT-UNKNOWN-1", cod: 40, notes: "رفض الاستلام", time: 1_762_347_300_095 }),
  );
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.outcome, "IGNORED_ORDER_NOT_FOUND");

  const rows = await prisma.logesTechsWebhookEvent.findMany({ where: { barcode: "LT-UNKNOWN-1" } });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].externalStatus, "FAILED");
  assert.equal(rows[0].notes, "رفض الاستلام");
  assert.equal(Number(rows[0].codAmount), 40);
  assert.equal(rows[0].outcome, "IGNORED_ORDER_NOT_FOUND");
  assert.ok(rows[0].processedAt, "processedAt must be set");
  assert.equal(rows[0].externalTime?.toISOString(), "2025-11-05T12:55:00.095Z");
});

test("redelivery of a processed event is a DUPLICATE and stores no second row", { skip }, async () => {
  const payload = { packageId: 2, newStatus: "OUT_FOR_DELIVERY", barcode: "LT-DUP-1", time: 1_762_347_300_100 };
  assert.equal((await POST(webhook(payload))).status, 200);
  const second = await POST(webhook(payload));
  assert.equal(second.status, 200);
  assert.equal((await second.json()).outcome, "DUPLICATE");
  assert.equal(await prisma.logesTechsWebhookEvent.count({ where: { barcode: "LT-DUP-1" } }), 1);
});

test("a stored-but-unprocessed event is processed on redelivery", { skip }, async () => {
  const payload = { newStatus: "OUT_FOR_DELIVERY", barcode: "LT-RETRY-1", time: 1_762_347_300_200 };
  const id = webhookEventId(normalizeLogesTechsWebhookPayload(payload));
  await prisma.logesTechsWebhookEvent.create({
    data: { id, kind: "LAST_MILE", barcode: "LT-RETRY-1", externalStatus: "OUT_FOR_DELIVERY", outcome: "PROCESSING_FAILED" },
  });

  const response = await POST(webhook(payload));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).outcome, "IGNORED_ORDER_NOT_FOUND");
  const row = await prisma.logesTechsWebhookEvent.findUniqueOrThrow({ where: { id } });
  assert.ok(row.processedAt);
  assert.equal(row.outcome, "IGNORED_ORDER_NOT_FOUND");
});

test("known order: status updated and the inbox row links to the order", { skip }, async () => {
  const client = await prisma.clientAccount.create({
    data: { companyName: "Inbox Test Co", contactName: "Test", contactEmail: "t@example.invalid", contactPhone: "0500000000", sector: "RETAIL" },
  });
  const customer = await prisma.customer.create({
    data: { name: "Test", phone: "0500000001", address: "Riyadh", latitude: 24.7, longitude: 46.7, sector: "RETAIL" },
  });
  const order = await prisma.deliveryOrder.create({
    data: {
      publicCode: "INBOX-TEST-PC-1",
      reference: "INBOX-TEST-REF-1",
      barcode: "LT-KNOWN-1",
      clientAccountId: client.id,
      customerId: customer.id,
      status: "ASSIGNED",
      pickupAddress: "Hub",
      dropoffAddress: "Riyadh",
      dropoffLatitude: 24.7,
      dropoffLongitude: 46.7,
      serviceType: "COLD",
      temperatureTarget: "2-8",
      etaMinutes: 60,
      scheduledAt: new Date(),
    },
  });

  const response = await POST(webhook({ newStatus: "OUT_FOR_DELIVERY", barcode: "LT-KNOWN-1", time: 1_762_347_300_300 }));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).outcome, "UPDATED");
  assert.equal((await prisma.deliveryOrder.findUniqueOrThrow({ where: { id: order.id } })).status, "OUT_FOR_DELIVERY");
  const row = await prisma.logesTechsWebhookEvent.findFirstOrThrow({ where: { barcode: "LT-KNOWN-1" } });
  assert.equal(row.orderId, order.id);
  assert.equal(row.outcome, "UPDATED");
});

test("missing API key is rejected before anything is stored", { skip }, async () => {
  const response = await POST(webhook({ newStatus: "FAILED", barcode: "LT-NOKEY-1" }, null));
  assert.equal(response.status, 401);
  assert.equal(await prisma.logesTechsWebhookEvent.count({ where: { barcode: "LT-NOKEY-1" } }), 0);
});

test("a burst is never answered with 429 (vendor does not retry)", { skip }, async () => {
  const responses = await Promise.all(
    Array.from({ length: 40 }, (_, index) =>
      POST(webhook({ newStatus: "OUT_FOR_DELIVERY", barcode: `LT-BURST-${index}`, time: 1_762_347_400_000 + index })),
    ),
  );
  assert.deepEqual([...new Set(responses.map((response) => response.status))], [200]);
  assert.equal(await prisma.logesTechsWebhookEvent.count({ where: { barcode: { startsWith: "LT-BURST-" } } }), 40);
});
