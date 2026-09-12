import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import {
  caseWorklist,
  createOperationalCase,
  updateOperationalCase,
} from "../lib/operations/cases";
import {
  runCaseAutomation,
  saveOperationsPolicy,
} from "../lib/operations/automation";
import { prismaAdminDataSource } from "../lib/admin/prisma-source";
import { managementSnapshot } from "../lib/operations/management";
import { createCommitment } from "../lib/operations/commitments";
import { getPrisma } from "../lib/prisma";
import {
  processLogesTechsWebhook,
  reconcileLogesTechsEvent,
  retryPendingLogesTechsEvents,
} from "../lib/logestechs/webhook-store";
import { normalizeLogesTechsWebhookPayload } from "../lib/logestechs/webhook";

test(
  "durable inbox survives missing orders, duplicates, old events and failed processing",
  { timeout: 120000 },
  async () => {
    const db = await PGlite.create();
    for (const folder of readdirSync("prisma/migrations", {
      withFileTypes: true,
    })
      .filter((x) => x.isDirectory())
      .sort((a, b) => a.name.localeCompare(b.name)))
      await db.exec(
        readFileSync(
          "prisma/migrations/" + folder.name + "/migration.sql",
          "utf8",
        ),
      );
    const server = new PGLiteSocketServer({ db, host: "127.0.0.1", port: 0 });
    await server.start();
    const connection = server.getServerConn();
    process.env.DATABASE_URL = connection.startsWith("postgres")
      ? connection
      : "postgresql://postgres:postgres@" + connection + "/postgres";
    const prisma = getPrisma();
    try {
      const event = normalizeLogesTechsWebhookPayload({
        barcode: "ISOLATED-001",
        newStatus: "OUT_FOR_DELIVERY",
        time: "2026-09-12T08:00:00Z",
      });
      const first = await processLogesTechsWebhook(event);
      assert.equal(first.outcome, "PENDING_ORDER");
      assert.equal(await prisma.logesTechsEvent.count(), 1);
      assert.equal(
        (
          await prisma.logesTechsEvent.findUniqueOrThrow({
            where: { id: first.eventId },
          })
        ).barcode,
        "ISOLATED-001",
      );
      const duplicate = await processLogesTechsWebhook(event);
      assert.equal(duplicate.duplicate, true);
      assert.equal(await prisma.logesTechsEvent.count(), 1);
      const client = await prisma.clientAccount.create({
        data: {
          companyName: "ISOLATED TEST",
          contactName: "Synthetic",
          contactEmail: "test@example.invalid",
          contactPhone: "000",
          sector: "ECOMMERCE",
        },
      });
      const customer = await prisma.customer.create({
        data: {
          name: "Synthetic",
          phone: "000",
          address: "Synthetic Riyadh address",
          latitude: 24.7,
          longitude: 46.7,
          sector: "ECOMMERCE",
        },
      });
      const order = await prisma.deliveryOrder.create({
        data: {
          publicCode: "ISOLATED-001",
          reference: "TEST-REF-001",
          barcode: "ISOLATED-001",
          clientAccountId: client.id,
          customerId: customer.id,
          pickupAddress: "Synthetic",
          dropoffAddress: "Synthetic",
          dropoffLatitude: 24.7,
          dropoffLongitude: 46.7,
          serviceType: "TEST",
          temperatureTarget: "UNSPECIFIED",
          etaMinutes: 0,
          scheduledAt: new Date(),
          status: "ASSIGNED",
        },
      });
      assert.equal(await reconcileLogesTechsEvent(first.eventId), "UPDATE");
      assert.equal(
        (
          await prisma.deliveryOrder.findUniqueOrThrow({
            where: { id: order.id },
          })
        ).outForDeliveryAt?.toISOString(),
        "2026-09-12T08:00:00.000Z",
      );
      assert.equal((await processLogesTechsWebhook(event)).duplicate, true);
      const old = await processLogesTechsWebhook({
        ...event,
        externalStatus: "FAILED",
        externalTime: new Date("2026-09-12T07:00:00Z"),
      });
      assert.equal(old.outcome, "STALE");
      assert.equal(
        (
          await prisma.deliveryOrder.findUniqueOrThrow({
            where: { id: order.id },
          })
        ).status,
        "OUT_FOR_DELIVERY",
      );
      const untimed = await processLogesTechsWebhook({
        ...event,
        externalStatus: "FAILED",
        externalTime: null,
      });
      assert.equal(untimed.outcome, "REVIEW_REQUIRED");
      // Simulate an outage of the processing dependency after the inbox table is durable.
      await prisma.$executeRawUnsafe(
        'ALTER TABLE "DeliveryOrder" RENAME TO "IsolatedUnavailableOrders"',
      );
      const outage = await processLogesTechsWebhook({
        ...event,
        externalStatus: "ASSIGNED",
        externalTime: new Date("2026-09-12T09:00:00Z"),
      });
      assert.equal(outage.accepted, true);
      assert.equal(outage.outcome, "PENDING_RETRY");
      assert.equal(
        (
          await prisma.logesTechsEvent.findUniqueOrThrow({
            where: { id: outage.eventId },
          })
        ).state,
        "PENDING",
      );
      await prisma.$executeRawUnsafe(
        'ALTER TABLE "IsolatedUnavailableOrders" RENAME TO "DeliveryOrder"',
      );
      await prisma.logesTechsEvent.update({
        where: { id: outage.eventId },
        data: { nextAttemptAt: new Date(0) },
      });
      const recovery = await retryPendingLogesTechsEvents();
      assert.equal(recovery.failed, 0);
      assert.ok(
        (
          await prisma.integrationJobRun.findUniqueOrThrow({
            where: { name: "logestechs-reconciliation" },
          })
        ).lastSucceededAt,
      );
      // Case owner, tenant and closure rules use the same isolated database.
      const role = await prisma.role.create({ data: { name: "OPS_MANAGER" } });
      const owner = await prisma.user.create({
        data: {
          name: "Synthetic operator",
          email: "operator@example.invalid",
          passwordHash: "not-a-real-password",
          status: "ACTIVE",
          roles: { create: { roleId: role.id } },
        },
      });
      const backup = await prisma.user.create({
        data: {
          name: "Synthetic backup",
          email: "backup@example.invalid",
          passwordHash: "not-a-real-password",
          status: "ACTIVE",
          roles: { create: { roleId: role.id } },
        },
      });
      const actor = { userId: owner.id, role: "OPS_MANAGER" as const };
      const input = {
        orderId: order.id,
        clientAccountId: client.id,
        caseType: "DELIVERY_DISPUTE",
        priority: "P1",
        ownerId: owner.id,
        backupOwnerId: backup.id,
        ackDueAt: new Date(Date.now() + 60_000).toISOString(),
        resolutionDueAt: new Date(Date.now() + 120_000).toISOString(),
      };
      const incident = await createOperationalCase(input, actor);
      await assert.rejects(
        updateOperationalCase(
          {
            id: incident.id,
            version: 0,
            status: "CLOSED",
            resolution: "An employee replied",
            evidence: [],
          },
          actor,
        ),
        /CLOSURE_EVIDENCE_REQUIRED/,
      );
      await assert.rejects(
        updateOperationalCase(
          {
            id: incident.id,
            version: 0,
            status: "CLOSED",
            resolution: "Shipment received and confirmed",
            evidence: ["ISOLATED-EVIDENCE"],
          },
          actor,
        ),
        /CLOSURE_EVIDENCE_REQUIRED/,
      );
      await assert.rejects(
        updateOperationalCase(
          { id: incident.id, version: 0, status: "IN_PROGRESS" },
          { userId: owner.id, role: "CLIENT" },
        ),
        /FORBIDDEN/,
      );
      await assert.rejects(
        createOperationalCase(
          { ...input, clientAccountId: "OTHER-TENANT" },
          actor,
        ),
        /CASE_TENANT_MISMATCH/,
      );
      await updateOperationalCase(
        {
          id: incident.id,
          version: 0,
          status: "CLOSED",
          resolution: "Shipment received and confirmed",
          evidence: ["ISOLATED-EVIDENCE"],
          customerConfirmed: true,
        },
        actor,
      );
      const closed = await prisma.operationalCase.findUniqueOrThrow({
        where: { id: incident.id },
      });
      assert.ok(closed.closedAt);
      assert.ok(closed.customerConfirmedAt);
      assert.equal(
        await prisma.auditLog.count({ where: { actorId: owner.id } }),
        2,
      );
      await assert.rejects(
        runCaseAutomation(),
        /OPERATIONS_POLICY_NOT_CONFIGURED/,
      );
      await saveOperationsPolicy(
        {
          clientAccountId: client.id,
          ownerId: owner.id,
          backupOwnerId: backup.id,
          firstEscalationOwnerId: owner.id,
          secondEscalationOwnerId: backup.id,
          ackMinutes: 1,
          resolutionMinutes: 2,
          stalledMinutes: 1,
          noUpdateMinutes: 1,
          riskMinutes: 30,
          driverCapacity: null,
        },
        actor,
      );
      const automation = await runCaseAutomation();
      assert.ok(automation.created >= 1);
      assert.equal((await runCaseAutomation()).created, 0);
      const detected = await prisma.operationalCase.findFirstOrThrow({
        where: { status: "NEW", detectionKey: { not: null } },
      });
      await assert.rejects(
        updateOperationalCase(
          {
            id: detected.id,
            version: detected.version,
            status: "CLOSED",
            resolution: "An employee reviewed the record",
            evidence: ["SOURCE:not-a-proof"],
          },
          actor,
        ),
        /CLOSURE_EVIDENCE_REQUIRED/,
      );
      await prisma.operationalCase.update({
        where: { id: detected.id },
        data: {
          createdAt: new Date(Date.now() - 180000),
          ackDueAt: new Date(Date.now() - 120000),
          resolutionDueAt: new Date(Date.now() - 60000),
        },
      });
      assert.ok((await runCaseAutomation()).escalated >= 1);
      assert.equal(
        (
          await prisma.operationalCase.findUniqueOrThrow({
            where: { id: detected.id },
          })
        ).escalatedToUserId,
        backup.id,
      );
      const commitmentInput = {
        orderId: order.id,
        clientAccountId: client.id,
        ownerId: owner.id,
        windowStart: new Date(Date.now() + 60000).toISOString(),
        windowEnd: new Date(Date.now() + 120000).toISOString(),
        planReference: "SYNTHETIC-PLAN-ONLY",
        planConfirmed: false,
      };
      await assert.rejects(
        createCommitment({ ...commitmentInput, planConfirmed: true }, actor),
        /COMMITMENT_NOT_FEASIBLE/,
      );
      await assert.rejects(
        createCommitment(
          { ...commitmentInput, clientAccountId: "OTHER-TENANT" },
          actor,
        ),
        /CASE_TENANT_MISMATCH/,
      );
      const commitment = await createCommitment(commitmentInput, actor);
      assert.equal(
        (
          await prisma.deliveryCommitment.findUniqueOrThrow({
            where: { id: commitment.id },
          })
        ).feasibility,
        "NEEDS_REVIEW",
      );
      await runCaseAutomation();
      assert.equal(
        (
          await prisma.deliveryCommitment.findUniqueOrThrow({
            where: { id: commitment.id },
          })
        ).status,
        "AT_RISK",
      );
      assert.equal((await caseWorklist(actor)).clients.length, 1);
      const financial = await prismaAdminDataSource.getCod();
      assert.equal(financial.summary.netProfit, null);
      assert.equal(financial.summary.returnedFeesSum, null);
      assert.equal(
        (await prismaAdminDataSource.getReports()).clients.length,
        1,
      );
      const overview = await managementSnapshot(undefined, actor);
      assert.equal(overview.kpis.length, 15);
      assert.equal(overview.clients[0].recordedFees, null);
      assert.equal(
        overview.kpis.find((x) => x.label === "هامش الربح")?.value,
        null,
      );
      const unrelated = await processLogesTechsWebhook({
        ...event,
        barcode: "UNRELATED-PROVIDER-ID",
        invoiceNumber: order.reference,
      });
      assert.equal(unrelated.outcome, "PENDING_ORDER");
      // Bypassing the application still cannot remove mandatory closure evidence.
      await assert.rejects(
        db.query(
          'UPDATE "OperationalCase" SET resolution = NULL WHERE id = $1',
          [incident.id],
        ),
      );
      await assert.rejects(
        db.query(
          'UPDATE "OperationalCase" SET "clientAccountId" = $1 WHERE id = $2',
          ["OTHER-TENANT", incident.id],
        ),
      );
      // The database rejects invalid inbox state even if application validation is bypassed.
      await assert.rejects(
        prisma.$executeRawUnsafe(
          `UPDATE "LogesTechsEvent" SET "state" = 'LOST'`,
        ),
      );
    } finally {
      await prisma.$disconnect();
      await server.stop();
      await db.close();
    }
  },
);
