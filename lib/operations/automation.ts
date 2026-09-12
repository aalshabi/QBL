import "server-only";
import { createHash } from "node:crypto";
import { getPrisma } from "@/lib/prisma";
import {
  detectOrderRisks,
  escalationLevel,
  operationsPolicySchema,
} from "./automation-policy";
import { assertOperator } from "./cases";
import type { Session } from "@/lib/auth";
export async function saveOperationsPolicy(
  input: unknown,
  session: Session | null,
) {
  const actor = await assertOperator(session);
  if (actor.role === "DISPATCHER") throw new Error("FORBIDDEN");
  const data = operationsPolicySchema.parse(input),
    prisma = getPrisma();
  const ids = [
    ...new Set([
      data.ownerId,
      data.backupOwnerId,
      data.firstEscalationOwnerId,
      data.secondEscalationOwnerId,
    ]),
  ];
  const users = await prisma.user.count({
    where: {
      id: { in: ids },
      status: "ACTIVE",
      roles: {
        some: {
          role: { name: { in: ["ADMIN", "OPS_MANAGER", "DISPATCHER"] } },
        },
      },
    },
  });
  if (users !== ids.length) throw new Error("INVALID_OWNERS");
  return prisma.$transaction(async (tx) => {
    const result = await tx.operationsPolicy.upsert({
      where: { clientAccountId: data.clientAccountId },
      create: { ...data, updatedBy: actor.userId },
      update: { ...data, updatedBy: actor.userId },
    });
    await tx.auditLog.create({
      data: {
        actorId: actor.userId,
        action: "STATUS_CHANGED",
        reason: "Operations escalation policy updated",
        metadata: { policyId: result.id },
      },
    });
    return { ok: true };
  });
}
export async function runCaseAutomation() {
  const prisma = getPrisma(),
    now = new Date(),
    name = "operations-case-automation";
  await prisma.integrationJobRun.upsert({
    where: { name },
    create: { name, lastStartedAt: now },
    update: { lastStartedAt: now },
  });
  let created = 0,
    escalated = 0;
  try {
    const policies = await prisma.operationsPolicy.findMany();
    if (!policies.length) throw new Error("OPERATIONS_POLICY_NOT_CONFIGURED");
    const sync = await prisma.integrationJobRun.findUnique({
      where: { name: "logestechs-reconciliation" },
    });
    for (const policy of policies) {
      const ownerIds = [
        ...new Set([
          policy.ownerId,
          policy.backupOwnerId,
          policy.firstEscalationOwnerId,
          policy.secondEscalationOwnerId,
        ]),
      ];
      if (
        (await prisma.user.count({
          where: {
            id: { in: ownerIds },
            status: "ACTIVE",
            roles: {
              some: {
                role: { name: { in: ["ADMIN", "OPS_MANAGER", "DISPATCHER"] } },
              },
            },
          },
        })) !== ownerIds.length
      )
        throw new Error("OPERATIONS_POLICY_OWNER_UNAVAILABLE");
      async function open(type: string, source: string, orderId?: string) {
        const detectionKey = createHash("sha256")
          .update(policy.clientAccountId + ":" + type + ":" + source)
          .digest("hex");
        const exists = await prisma.operationalCase.findFirst({
          where: {
            OR: [
              { detectionKey },
              {
                clientAccountId: policy.clientAccountId,
                orderId: orderId ?? null,
                caseType: type,
                status: { not: "CLOSED" },
              },
            ],
          },
          select: { id: true },
        });
        if (exists) return;
        const previous = await prisma.operationalCase.findFirst({
          where: {
            clientAccountId: policy.clientAccountId,
            orderId: orderId ?? null,
            caseType: type,
            status: "CLOSED",
          },
          orderBy: { closedAt: "desc" },
          select: { id: true },
        });
        const result = await prisma.$transaction(async (tx) => {
          const id = "auto_" + detectionKey;
          const result = await tx.operationalCase.createMany({
            data: [
              {
                id,
                detectionKey,
                clientAccountId: policy.clientAccountId,
                orderId,
                caseType: type,
                priority:
                  type === "MISSING_SHIPMENT"
                    ? "P0"
                    : type === "DRIVER_OVERLOADED"
                      ? "P2"
                      : "P1",
                ownerId: policy.ownerId,
                backupOwnerId: policy.backupOwnerId,
                createdAt: now,
                ackDueAt: new Date(now.getTime() + policy.ackMinutes * 60000),
                resolutionDueAt: new Date(
                  now.getTime() + policy.resolutionMinutes * 60000,
                ),
                reopenedFromCaseId: previous?.id,
                evidence: ["SOURCE:" + source],
              },
            ],
            skipDuplicates: true,
          });
          if (result.count)
            await tx.auditLog.create({
              data: {
                action: "STATUS_CHANGED",
                orderId,
                reason: "Operational case detected",
                metadata: { caseId: id, caseType: type },
              },
            });
          return result;
        });
        created += result.count;
      }
      const orders = await prisma.deliveryOrder.findMany({
        where: {
          clientAccountId: policy.clientAccountId,
          OR: [
            { status: { notIn: ["DELIVERED", "RETURNED", "CANCELLED"] } },
            { deliveredAt: { gte: new Date(now.getTime() - 7 * 86400000) } },
          ],
        },
        include: { proofOfDelivery: true },
        take: 5001,
      });
      if (orders.length > 5000)
        throw new Error("AUTOMATION_SCOPE_EXCEEDS_LIMIT");
      for (const order of orders) {
        const pod = order.proofOfDelivery,
          hasPod = Boolean(
            pod &&
              (pod.otpVerified ||
                pod.photoUrl ||
                pod.signatureUrl ||
                (pod.proofType === "MANUAL_OVERRIDE" && pod.notes)),
          );
        for (const type of detectOrderRisks(
          {
            ...order,
            dropoffLatitude: Number(order.dropoffLatitude),
            dropoffLongitude: Number(order.dropoffLongitude),
            hasPod,
          },
          policy,
          now,
        ))
          await open(
            type,
            order.id +
              ":" +
              (order.logestechsOccurredAt ?? order.createdAt).toISOString(),
            order.id,
          );
        if (
          policy.driverCapacity &&
          order.courierId &&
          orders.filter(
            (x) =>
              x.courierId === order.courierId &&
              !["DELIVERED", "RETURNED", "CANCELLED"].includes(x.status),
          ).length > policy.driverCapacity
        )
          await open(
            "DRIVER_OVERLOADED",
            order.id +
              ":" +
              (order.logestechsOccurredAt ?? order.createdAt).toISOString(),
            order.id,
          );
      }
      const conflicts = await prisma.logesTechsEvent.findMany({
        where: {
          state: "REVIEW_REQUIRED",
          orderId: { in: orders.map((x) => x.id) },
        },
        select: { id: true, orderId: true },
        take: 501,
      });
      if (conflicts.length > 500)
        throw new Error("AUTOMATION_SCOPE_EXCEEDS_LIMIT");
      for (const event of conflicts)
        await open("STATUS_CONFLICT", event.id, event.orderId ?? undefined);
      const latest = await prisma.shipmentReconciliation.findFirst({
        where: { clientAccountId: policy.clientAccountId },
        orderBy: { createdAt: "desc" },
      });
      if (latest && !latest.complete) await open("MISSING_SHIPMENT", latest.id);
      if (
        !sync?.lastSucceededAt ||
        sync.lastError ||
        now.getTime() - sync.lastSucceededAt.getTime() > 900000
      )
        await open(
          "INTEGRATION_FAILURE",
          sync?.lastSucceededAt?.toISOString() ?? "NO_VERIFIED_SYNC",
        );
      const commitments = await prisma.deliveryCommitment.findMany({
        where: {
          clientAccountId: policy.clientAccountId,
          status: { in: ["PLANNED", "AT_RISK"] },
        },
      });
      for (const item of commitments) {
        const order = await prisma.deliveryOrder.findUnique({
          where: { id: item.orderId },
          select: { status: true, deliveredAt: true },
        });
        if (order?.status === "DELIVERED" && order.deliveredAt) {
          await prisma.deliveryCommitment.update({
            where: { id: item.id },
            data: {
              status:
                order.deliveredAt <= item.windowEnd &&
                order.deliveredAt >= item.windowStart
                  ? "KEPT"
                  : "MISSED",
              result:
                "Recorded delivery event time compared with the committed window",
            },
          });
        } else if (
          now.getTime() + policy.riskMinutes * 60000 >=
          item.windowEnd.getTime()
        ) {
          await prisma.deliveryCommitment.update({
            where: { id: item.id },
            data: { status: now > item.windowEnd ? "MISSED" : "AT_RISK" },
          });
          await open("COMMITMENT_AT_RISK", item.id, item.orderId);
        }
      }
      const cases = await prisma.operationalCase.findMany({
        where: {
          clientAccountId: policy.clientAccountId,
          status: { not: "CLOSED" },
        },
      });
      for (const item of cases) {
        const level = escalationLevel(item, now);
        if (level <= item.escalationLevel) continue;
        await prisma.$transaction(async (tx) => {
          const changed = await tx.operationalCase.updateMany({
            where: {
              id: item.id,
              version: item.version,
              status: { not: "CLOSED" },
            },
            data: {
              escalationLevel: level,
              escalatedToUserId:
                level === 1
                  ? policy.firstEscalationOwnerId
                  : policy.secondEscalationOwnerId,
              version: { increment: 1 },
            },
          });
          if (changed.count) {
            escalated++;
            await tx.auditLog.create({
              data: {
                orderId: item.orderId,
                action: "STATUS_CHANGED",
                reason: "Operational case escalated",
                metadata: { caseId: item.id, level },
              },
            });
          }
        });
      }
    }
    await prisma.integrationJobRun.update({
      where: { name },
      data: {
        lastSucceededAt: new Date(),
        lastError: null,
        processedCount: created + escalated,
      },
    });
    return { created, escalated };
  } catch (error) {
    await prisma.integrationJobRun
      .update({
        where: { name },
        data: {
          lastError:
            error instanceof Error &&
            /^OPERATIONS_POLICY_|^AUTOMATION_SCOPE_/.test(error.message)
              ? error.message
              : "AUTOMATION_FAILED",
        },
      })
      .catch(() => {});
    throw error;
  }
}
