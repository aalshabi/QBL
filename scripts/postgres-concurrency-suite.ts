import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import pg from "pg";
import { requirePostgresTestTarget } from "./postgres-test-guard.mjs";
import { getPrisma } from "../lib/prisma";
import { createOperationalCase, updateOperationalCase } from "../lib/operations/cases";
import { createCommitment } from "../lib/operations/commitments";
import { runCaseAutomation, saveOperationsPolicy } from "../lib/operations/automation";
import { reconcileLogesTechsEvent } from "../lib/logestechs/webhook-store";
import type { Session } from "../lib/auth";

const target = requirePostgresTestTarget();
const prisma = getPrisma();
const coordinator = new pg.Client({ connectionString: target.connectionString, statement_timeout: 15_000 });
const observer = new pg.Client({ connectionString: target.connectionString, statement_timeout: 15_000 });
type Job = { kind: string; input?: unknown; actor?: Session };
type Result = { ok: boolean; result?: Record<string, unknown>; code?: string; message?: string };
const allPids = new Set<number>();
let checks = 0;

async function check(name: string, test: () => Promise<void>) {
  await test();
  checks++;
  console.log(`PASS ${name}`);
}

/** Every worker has its own Node process, Prisma pool and PostgreSQL backend. */
async function contend(jobs: Job[], lockSql: string, params: unknown[] = []) {
  const workers = jobs.map(() => spawn(process.execPath, ["--conditions=react-server", "--import", "tsx", "scripts/postgres-concurrency-worker.ts"], {
    env: process.env,
    windowsHide: true, stdio: ["ignore", "ignore", "ignore", "ipc"],
  }));
  const pids: number[] = [];
  const timeouts: ReturnType<typeof setTimeout>[] = [];
  const ready = workers.map((worker) => new Promise<void>((resolve, reject) => {
    timeouts.push(setTimeout(() => reject(new Error("WORKER_READY_TIMEOUT")), 25_000));
    worker.once("error", reject);
    worker.once("exit", (code) => { if (code !== 0) reject(new Error("WORKER_START_FAILED")); });
    worker.on("message", (message) => {
      const data = message as { ready?: boolean; pid?: number };
      if (data.ready && data.pid) { pids.push(data.pid); allPids.add(data.pid); resolve(); }
    });
  }));
  // Install result/exit listeners before dispatch. Keep all worker failures observed.
  const results = workers.map((worker) => new Promise<Result>((resolve, reject) => {
    timeouts.push(setTimeout(() => reject(new Error("WORKER_RESULT_TIMEOUT")), 45_000));
    worker.once("error", reject);
    let received = false;
    worker.on("message", (message) => {
      const data = message as Result;
      if (typeof data.ok === "boolean") { received = true; resolve(data); }
    });
    worker.once("exit", () => { if (!received) reject(new Error("WORKER_EXITED_WITHOUT_RESULT")); });
  }));
  const joinedResults = Promise.all(results);
  void joinedResults.catch(() => {});
  const exited = workers.map((worker) => once(worker, "exit"));
  let locked = false;
  try {
    await Promise.all(ready);
    assert.equal(new Set(pids).size, jobs.length, "Workers did not have independent connections");
    await coordinator.query("BEGIN"); locked = true;
    await coordinator.query(lockSql, params);
    workers.forEach((worker, i) => worker.send(jobs[i]));
    // Require observed DB lock contention, not timing assumptions or Promise.all alone.
    const deadline = Date.now() + 3000;
    let waiting = 0;
    while (Date.now() < deadline) {
      waiting = Number((await observer.query("SELECT count(*)::int AS n FROM pg_stat_activity WHERE pid = ANY($1::int[]) AND wait_event_type='Lock'", [pids])).rows[0].n);
      if (waiting === jobs.length) break;
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    assert.equal(waiting, jobs.length, "Expected simultaneous lock waiters were not observed");
    await coordinator.query("COMMIT"); locked = false;
    console.log(`  Observed ${waiting} concurrent PostgreSQL lock waiters on distinct backends`);
    const outcome = await joinedResults;
    await Promise.all(exited);
    return outcome;
  } finally {
    if (locked) await coordinator.query("ROLLBACK");
    timeouts.forEach(clearTimeout);
    for (const worker of workers) if (worker.exitCode === null) worker.kill();
    await Promise.allSettled(exited);
  }
}

function assertSuccessful(results: Result[]) {
  assert.ok(results.every((x) => x.ok), `Unexpected worker rejection: ${JSON.stringify(results.filter((x) => !x.ok))}`);
}

async function main() {
  await coordinator.connect(); await observer.connect();
  const identity = (await coordinator.query("SELECT current_database() AS database, current_user AS username")).rows[0];
  assert.equal(identity.database, target.database); assert.equal(identity.username, "qbl_test");
  assert.equal(await prisma.deliveryOrder.count(), 0, "Test database is not fresh");
  const role = await prisma.role.create({ data: { name: "OPS_MANAGER" } });
  const owner = await prisma.user.create({ data: { name: "Synthetic operator", email: "pg-operator@example.invalid", passwordHash: "not-a-login-credential", roles: { create: { roleId: role.id } } } });
  const backup = await prisma.user.create({ data: { name: "Synthetic backup", email: "pg-backup@example.invalid", passwordHash: "not-a-login-credential", roles: { create: { roleId: role.id } } } });
  const actor: Session = { userId: owner.id, role: "OPS_MANAGER" };
  const client = await prisma.clientAccount.create({ data: { companyName: "SYNTHETIC PG A", contactName: "Synthetic", contactEmail: "pg-a@example.invalid", contactPhone: "000", sector: "ECOMMERCE" } });
  const otherClient = await prisma.clientAccount.create({ data: { companyName: "SYNTHETIC PG B", contactName: "Synthetic", contactEmail: "pg-b@example.invalid", contactPhone: "000", sector: "ECOMMERCE" } });
  const customer = await prisma.customer.create({ data: { name: "Synthetic", phone: "000", address: "Synthetic Riyadh", latitude: 24.7, longitude: 46.7, sector: "ECOMMERCE" } });
  async function order(code: string) {
    return prisma.deliveryOrder.create({ data: {
      publicCode: code, barcode: code, reference: `REF-${code}`, clientAccountId: client.id, customerId: customer.id,
      pickupAddress: "Synthetic", dropoffAddress: "Synthetic Riyadh", dropoffLatitude: 24.7, dropoffLongitude: 46.7,
      serviceType: "SYNTHETIC", temperatureTarget: "UNSPECIFIED", etaMinutes: 0,
      scheduledAt: new Date(Date.now() + 86400000), status: "ASSIGNED",
    } });
  }
  const occurred = new Date(Date.now() - 3600000).toISOString();
  const duplicatePayload = { barcode: "PG-DUPLICATE", newStatus: "OUT_FOR_DELIVERY", time: occurred };
  let pendingEventId = "";
  await check("simultaneous duplicate webhooks persist exactly one pending event before the order exists", async () => {
    const results = await contend(Array.from({ length: 4 }, () => ({ kind: "webhook", input: duplicatePayload })), 'LOCK TABLE "LogesTechsEvent" IN SHARE MODE');
    assertSuccessful(results);
    assert.ok(results.every((x) => x.result?.accepted === true));
    assert.equal(results.filter((x) => x.result?.duplicate === false).length, 1);
    const rows = await prisma.logesTechsEvent.findMany({ where: { barcode: "PG-DUPLICATE" } });
    assert.equal(rows.length, 1); assert.equal(rows[0].state, "PENDING");
    pendingEventId = rows[0].id;
  });
  await check("replay after order creation and concurrent terminal duplicates preserve one event and audit", async () => {
    const shipment = await order("PG-DUPLICATE");
    assert.equal(await reconcileLogesTechsEvent(pendingEventId), "UPDATE");
    const results = await contend(Array.from({ length: 4 }, () => ({ kind: "webhook", input: duplicatePayload })), 'LOCK TABLE "LogesTechsEvent" IN SHARE MODE');
    assertSuccessful(results);
    assert.ok(results.every((x) => x.result?.accepted === true && x.result?.duplicate === true));
    assert.equal(await prisma.logesTechsEvent.count({ where: { barcode: "PG-DUPLICATE" } }), 1);
    const count = await prisma.auditLog.count({ where: { id: pendingEventId } });
    assert.equal(count, 1);
    assert.equal((await prisma.deliveryOrder.findUniqueOrThrow({ where: { id: shipment.id } })).status, "OUT_FOR_DELIVERY");
    assert.equal((await prisma.logesTechsEvent.findUniqueOrThrow({ where: { id: pendingEventId } })).state, "PROCESSED");
  });
  await check("competing status events preserve newest source chronology and durable inbox rows", async () => {
    const shipment = await order("PG-STATUS-RACE");
    const early = new Date(Date.now() - 1800000).toISOString();
    const later = new Date(Date.now() - 1200000).toISOString();
    const results = await contend([
      { kind: "webhook", input: { barcode: shipment.barcode, newStatus: "ASSIGNED", time: early } },
      { kind: "webhook", input: { barcode: shipment.barcode, newStatus: "OUT_FOR_DELIVERY", time: later } },
    ], 'SELECT id FROM "DeliveryOrder" WHERE id=$1 FOR UPDATE', [shipment.id]);
    assertSuccessful(results);
    const events = await prisma.logesTechsEvent.findMany({ where: { barcode: shipment.barcode! } });
    assert.equal(events.length, 2);
    for (const event of events) if (event.state === "PENDING") await reconcileLogesTechsEvent(event.id);
    const final = await prisma.deliveryOrder.findUniqueOrThrow({ where: { id: shipment.id } });
    assert.equal(final.status, "OUT_FOR_DELIVERY"); assert.equal(final.logestechsOccurredAt?.toISOString(), later);
    assert.equal(await prisma.auditLog.count({ where: { id: { in: events.map((x) => x.id) } } }), 2);
    assert.equal(await prisma.logesTechsEvent.count({ where: { barcode: shipment.barcode!, state: "PENDING" } }), 0);
  });
  let incidentId = "";
  const caseOrder = await order("PG-CASE");
  const caseInput = { orderId: caseOrder.id, clientAccountId: client.id, caseType: "DELIVERY_DISPUTE", priority: "P1", ownerId: owner.id, backupOwnerId: backup.id, ackDueAt: new Date(Date.now() + 600000).toISOString(), resolutionDueAt: new Date(Date.now() + 1200000).toISOString() };
  await check("simultaneous case edits reject lost updates and stale versions", async () => {
    const incident = await createOperationalCase(caseInput, actor); incidentId = incident.id;
    const results = await contend([
      { kind: "case", input: { id: incident.id, version: 0, status: "IN_PROGRESS" }, actor },
      { kind: "case", input: { id: incident.id, version: 0, status: "WAITING_EXTERNAL" }, actor },
    ], 'SELECT id FROM "OperationalCase" WHERE id=$1 FOR UPDATE', [incident.id]);
    assert.equal(results.filter((x) => x.ok).length, 1);
    assert.ok(results.filter((x) => !x.ok).every((x) => x.code === "P2034" || x.message === "CASE_CHANGED_RELOAD"));
    assert.equal((await prisma.operationalCase.findUniqueOrThrow({ where: { id: incident.id } })).version, 1);
    assert.equal(await prisma.auditLog.count({ where: { reason: "Operational case updated", metadata: { path: ["caseId"], equals: incident.id } } }), 1);
    await assert.rejects(updateOperationalCase({ id: incident.id, version: 0, status: "IN_PROGRESS" }, actor), /CASE_CHANGED_RELOAD/);
  });
  let commitmentId = "";
  const commitmentOrder = await order("PG-COMMITMENT");
  const commitmentInput = { orderId: commitmentOrder.id, clientAccountId: client.id, ownerId: owner.id, windowStart: new Date(Date.now() + 600000).toISOString(), windowEnd: new Date(Date.now() + 1200000).toISOString(), planReference: "SYNTHETIC-PLAN-ONLY", planConfirmed: false };
  await check("competing delivery commitments preserve one active commitment and one audit", async () => {
    const results = await contend(Array.from({ length: 2 }, () => ({ kind: "commitment", input: commitmentInput, actor })), 'LOCK TABLE "DeliveryCommitment" IN SHARE MODE');
    assert.equal(results.filter((x) => x.ok).length, 1);
    assert.ok(results.filter((x) => !x.ok).every((x) => ["P2002", "P2034"].includes(x.code ?? "")));
    const rows = await prisma.deliveryCommitment.findMany({ where: { orderId: commitmentOrder.id } });
    assert.equal(rows.length, 1); commitmentId = rows[0].id;
    assert.equal(await prisma.auditLog.count({ where: { reason: "Delivery commitment recorded", orderId: commitmentOrder.id } }), 1);
    const indexes = await coordinator.query("SELECT indexdef FROM pg_indexes WHERE indexname='DeliveryCommitment_active_order_key'");
    assert.match(indexes.rows[0].indexdef, /UNIQUE.*WHERE/);
  });
  await check("tenant and closure constraints hold through application and independent SQL connections", async () => {
    await assert.rejects(createOperationalCase({ ...caseInput, clientAccountId: otherClient.id }, actor), /CASE_TENANT_MISMATCH/);
    await assert.rejects(createCommitment({ ...commitmentInput, clientAccountId: otherClient.id }, actor), /CASE_TENANT_MISMATCH/);
    await assert.rejects(createOperationalCase(caseInput, { ...actor, role: "CLIENT" }), /FORBIDDEN/);
    await assert.rejects(observer.query('UPDATE "OperationalCase" SET "clientAccountId"=$1 WHERE id=$2', [otherClient.id, incidentId]), { code: "23514" });
    await assert.rejects(observer.query('UPDATE "DeliveryCommitment" SET "clientAccountId"=$1 WHERE id=$2', [otherClient.id, commitmentId]), { code: "23514" });
    await assert.rejects(updateOperationalCase({ id: incidentId, version: 1, status: "CLOSED", resolution: "Synthetic verification closure", evidence: [] }, actor), /CLOSURE_EVIDENCE_REQUIRED/);
    await assert.rejects(updateOperationalCase({ id: incidentId, version: 1, status: "CLOSED", resolution: "Synthetic verification closure", evidence: ["SYNTHETIC-PROOF"] }, actor), /CLOSURE_EVIDENCE_REQUIRED/);
    await assert.rejects(observer.query('UPDATE "OperationalCase" SET status=\'CLOSED\', resolution=\'Synthetic closure\', "closedAt"=NOW() WHERE id=$1', [incidentId]), { code: "23514" });
    await updateOperationalCase({ id: incidentId, version: 1, status: "CLOSED", resolution: "Synthetic confirmed receipt", evidence: ["SYNTHETIC-PROOF"], customerConfirmed: true }, actor);
    await assert.rejects(observer.query('UPDATE "OperationalCase" SET resolution=NULL WHERE id=$1', [incidentId]), { code: "23514" });
    await assert.rejects(observer.query('UPDATE "OperationalCase" SET "customerConfirmedAt"=NULL WHERE id=$1', [incidentId]), { code: "23514" });
    await assert.rejects(updateOperationalCase({ id: incidentId, version: 2, status: "IN_PROGRESS" }, actor), /CASE_ALREADY_CLOSED/);
    assert.equal((await prisma.operationalCase.findUniqueOrThrow({ where: { id: incidentId } })).clientAccountId, client.id);
  });
  await check("simultaneous automation deduplicates cases and audit entries under real contention", async () => {
    await saveOperationsPolicy({ clientAccountId: client.id, ownerId: owner.id, backupOwnerId: backup.id, firstEscalationOwnerId: owner.id, secondEscalationOwnerId: backup.id, ackMinutes: 10, resolutionMinutes: 20, stalledMinutes: 1, noUpdateMinutes: 1, riskMinutes: 30, driverCapacity: null }, actor);
    const results = await contend(Array.from({ length: 3 }, () => ({ kind: "automation" })), 'LOCK TABLE "OperationalCase" IN SHARE MODE');
    assertSuccessful(results);
    const cases = await prisma.operationalCase.findMany({ where: { detectionKey: { not: null } } });
    assert.ok(cases.length > 0);
    assert.equal(results.reduce((n, x) => n + Number(x.result?.created), 0), cases.length);
    assert.equal(await prisma.auditLog.count({ where: { reason: "Operational case detected" } }), cases.length);
    const duplicates = await observer.query('SELECT "clientAccountId", "orderId", "caseType", count(*) FROM "OperationalCase" WHERE status <> \'CLOSED\' AND "detectionKey" IS NOT NULL GROUP BY "clientAccountId", "orderId", "caseType" HAVING count(*) > 1');
    assert.equal(duplicates.rowCount, 0);
    // A distinct detection key must not bypass the active case partial unique index.
    await assert.rejects(observer.query(`INSERT INTO "OperationalCase" (id, "clientAccountId", "orderId", "caseType", priority, "ownerId", "backupOwnerId", "createdAt", "ackDueAt", "resolutionDueAt", "detectionKey") SELECT 'duplicate-' || id, "clientAccountId", "orderId", "caseType", priority, "ownerId", "backupOwnerId", "createdAt", "ackDueAt", "resolutionDueAt", 'distinct-' || "detectionKey" FROM "OperationalCase" WHERE id=$1`, [cases[0].id]), { code: "23505", constraint: "OperationalCase_active_detection_key" });
    assert.equal((await runCaseAutomation()).created, 0);
    // Force one overdue case, then race escalation. Audit/version can advance only once.
    const selected = cases[0];
    await prisma.operationalCase.update({ where: { id: selected.id }, data: { createdAt: new Date(Date.now() - 180000), ackDueAt: new Date(Date.now() - 120000), resolutionDueAt: new Date(Date.now() - 60000) } });
    const escalations = await contend(Array.from({ length: 2 }, () => ({ kind: "automation" })), 'SELECT id FROM "OperationalCase" WHERE id=$1 FOR UPDATE', [selected.id]);
    assertSuccessful(escalations);
    assert.equal(escalations.reduce((n, x) => n + Number(x.result?.escalated), 0), 1);
    assert.equal(await prisma.auditLog.count({ where: { reason: "Operational case escalated", metadata: { path: ["caseId"], equals: selected.id } } }), 1);
  });
  await check("fresh PostgreSQL connection sees committed inbox, case, and commitment state", async () => {
    const fresh = new pg.Client({ connectionString: target.connectionString });
    try {
      await fresh.connect();
      assert.equal((await fresh.query('SELECT state FROM "LogesTechsEvent" WHERE id=$1', [pendingEventId])).rows[0].state, "PROCESSED");
      assert.equal((await fresh.query('SELECT status FROM "OperationalCase" WHERE id=$1', [incidentId])).rows[0].status, "CLOSED");
      assert.equal((await fresh.query('SELECT count(*)::int AS n FROM "DeliveryCommitment" WHERE id=$1', [commitmentId])).rows[0].n, 1);
    } finally { await fresh.end(); }
  });
  await prisma.integrationJobRun.create({ data: { name: `postgres-verification-${target.runId}`, lastStartedAt: new Date(), lastSucceededAt: new Date(), processedCount: checks } });
  console.log(`CONCURRENCY_CHECKS_PASSED=${checks}; distinct worker backend PIDs=${allPids.size}`);
}

void main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => {
  await prisma.$disconnect(); await coordinator.end(); await observer.end();
});
