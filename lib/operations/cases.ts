import "server-only";
import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { canOperate } from "./access";
import type { Session, Role } from "@/lib/auth";
export const CASE_STATUSES = [
  "NEW",
  "IN_PROGRESS",
  "WAITING_EXTERNAL",
  "WAITING_CUSTOMER_CONFIRMATION",
  "CLOSED",
] as const;
export const CASE_TYPES = [
  "SHIPMENT_STALLED",
  "SLA_RISK",
  "NO_UPDATE",
  "FAILED_DELIVERY",
  "STATUS_CONFLICT",
  "MISSING_SHIPMENT",
  "ADDRESS_PROBLEM",
  "COMMITMENT_AT_RISK",
  "POD_MISSING",
  "RETURN_DELAYED",
  "DRIVER_OVERLOADED",
  "WAREHOUSE_DELAY",
  "INTEGRATION_FAILURE",
  "DELIVERY_DISPUTE",
  "COMMERCIAL_ESCALATION",
] as const;
export const createCaseSchema = z
  .object({
    orderId: z.string().max(100).optional(),
    clientAccountId: z.string().min(1).max(100),
    caseType: z.enum(CASE_TYPES),
    priority: z.enum(["P0", "P1", "P2"]),
    ownerId: z.string().min(1).max(100),
    backupOwnerId: z.string().min(1).max(100),
    ackDueAt: z.iso.datetime(),
    resolutionDueAt: z.iso.datetime(),
  })
  .strict();
export const updateCaseSchema = z
  .object({
    id: z.string().min(1).max(100),
    version: z.number().int().min(0),
    status: z.enum(CASE_STATUSES),
    resolution: z.string().trim().max(4000).optional(),
    evidence: z.array(z.string().trim().min(3).max(500)).max(10).default([]),
    customerConfirmed: z.boolean().default(false),
  })
  .strict();

export async function assertOperator(
  session: Session | null,
): Promise<Session> {
  if (!session || !canOperate(session.role)) throw new Error("FORBIDDEN");
  const user = await getPrisma().user.findUnique({
    where: { id: session.userId },
    select: {
      status: true,
      roles: { select: { role: { select: { name: true } } } },
    },
  });
  if (
    !user ||
    user.status !== "ACTIVE" ||
    !user.roles.some(
      (x) => x.role.name === session.role && canOperate(x.role.name as Role),
    )
  )
    throw new Error("FORBIDDEN");
  return session;
}

export async function createOperationalCase(
  input: unknown,
  session: Session | null,
) {
  const actor = await assertOperator(session),
    data = createCaseSchema.parse(input),
    now = new Date();
  if (
    data.ownerId === data.backupOwnerId ||
    new Date(data.ackDueAt) < now ||
    new Date(data.resolutionDueAt) < new Date(data.ackDueAt)
  )
    throw new Error("INVALID_CASE");
  const prisma = getPrisma();
  return prisma.$transaction(async (tx) => {
    const owners = await tx.user.findMany({
      where: {
        id: { in: [data.ownerId, data.backupOwnerId] },
        status: "ACTIVE",
        roles: {
          some: {
            role: { name: { in: ["ADMIN", "OPS_MANAGER", "DISPATCHER"] } },
          },
        },
      },
      select: { id: true },
    });
    if (owners.length !== 2) throw new Error("INVALID_OWNERS");
    if (
      data.orderId &&
      !(await tx.deliveryOrder.findFirst({
        where: { id: data.orderId, clientAccountId: data.clientAccountId },
        select: { id: true },
      }))
    )
      throw new Error("CASE_TENANT_MISMATCH");
    const created = await tx.operationalCase.create({
      data: {
        ...data,
        createdAt: now,
        ackDueAt: new Date(data.ackDueAt),
        resolutionDueAt: new Date(data.resolutionDueAt),
        requiresCustomerConfirmation: data.caseType === "DELIVERY_DISPUTE",
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: actor.userId,
        orderId: data.orderId,
        action: "STATUS_CHANGED",
        reason: "Operational case created",
        metadata: {
          caseId: created.id,
          ownerId: data.ownerId,
          backupOwnerId: data.backupOwnerId,
        },
      },
    });
    return created;
  });
}

export async function updateOperationalCase(
  input: unknown,
  session: Session | null,
) {
  const actor = await assertOperator(session),
    data = updateCaseSchema.parse(input),
    prisma = getPrisma();
  return prisma.$transaction(
    async (tx) => {
      const existing = await tx.operationalCase.findUniqueOrThrow({
        where: { id: data.id },
      });
      if (
        actor.role === "DISPATCHER" &&
        existing.ownerId !== actor.userId &&
        existing.backupOwnerId !== actor.userId &&
        existing.escalatedToUserId !== actor.userId
      )
        throw new Error("FORBIDDEN");
      if (existing.status === "CLOSED") throw new Error("CASE_ALREADY_CLOSED");
      if (
        data.status === "CLOSED" &&
        ((data.resolution?.length ?? 0) < 10 ||
          !data.evidence.some((x) => !x.startsWith("SOURCE:")) ||
          (existing.requiresCustomerConfirmation && !data.customerConfirmed))
      )
        throw new Error("CLOSURE_EVIDENCE_REQUIRED");
      const now = new Date();
      const result = await tx.operationalCase.updateMany({
        where: {
          id: data.id,
          version: data.version,
          status: { not: "CLOSED" },
        },
        data: {
          status: data.status,
          resolution: data.resolution,
          evidence: data.evidence,
          lastActionAt: now,
          closedAt: data.status === "CLOSED" ? now : null,
          customerConfirmedAt: data.customerConfirmed
            ? now
            : existing.customerConfirmedAt,
          version: { increment: 1 },
        },
      });
      if (result.count !== 1) throw new Error("CASE_CHANGED_RELOAD");
      await tx.auditLog.create({
        data: {
          actorId: actor.userId,
          orderId: existing.orderId,
          action: "STATUS_CHANGED",
          reason: "Operational case updated",
          metadata: {
            caseId: data.id,
            from: existing.status,
            to: data.status,
            customerConfirmationRecorded: data.customerConfirmed,
          },
        },
      });
      return { ok: true };
    },
    { isolationLevel: "Serializable" },
  );
}

export async function caseWorklist(session: Session | null) {
  const actor = await assertOperator(session),
    prisma = getPrisma();
  const scope =
    actor.role === "DISPATCHER"
      ? {
          OR: [
            { ownerId: actor.userId },
            { backupOwnerId: actor.userId },
            { escalatedToUserId: actor.userId },
          ],
        }
      : {};
  const [
    cases,
    users,
    clients,
    pending,
    review,
    job,
    orders,
    policies,
    commitments,
    automationJob,
  ] = await prisma.$transaction(
    [
      prisma.operationalCase.findMany({
        where: { ...scope, status: { not: "CLOSED" } },
        orderBy: [{ priority: "asc" }, { resolutionDueAt: "asc" }],
        take: 100,
      }),
      prisma.user.findMany({
        where: {
          status: "ACTIVE",
          roles: {
            some: {
              role: { name: { in: ["ADMIN", "OPS_MANAGER", "DISPATCHER"] } },
            },
          },
        },
        select: { id: true, name: true },
      }),
      prisma.clientAccount.findMany({
        select: { id: true, companyName: true },
        take: 500,
      }),
      prisma.logesTechsEvent.count({ where: { state: "PENDING" } }),
      prisma.logesTechsEvent.count({ where: { state: "REVIEW_REQUIRED" } }),
      prisma.integrationJobRun.findUnique({
        where: { name: "logestechs-reconciliation" },
      }),
      prisma.deliveryOrder.findMany({
        orderBy: { scheduledAt: "desc" },
        take: 500,
        select: { id: true, publicCode: true, clientAccountId: true },
      }),
      prisma.operationsPolicy.findMany(),
      prisma.deliveryCommitment.findMany({
        where: { status: { in: ["PLANNED", "AT_RISK", "MISSED"] } },
        orderBy: { windowEnd: "asc" },
        take: 100,
      }),
      prisma.integrationJobRun.findUnique({
        where: { name: "operations-case-automation" },
      }),
    ],
    { isolationLevel: "RepeatableRead" },
  );
  const jobHealthy = Boolean(
    job?.lastSucceededAt &&
      Date.now() - job.lastSucceededAt.getTime() < 15 * 60_000 &&
      !job.lastError,
  );
  return {
    cases,
    users,
    clients,
    pending,
    review,
    jobHealthy,
    orders,
    policies,
    commitments,
    canConfigure: actor.role !== "DISPATCHER",
    automationHealthy: Boolean(
      automationJob?.lastSucceededAt &&
        !automationJob.lastError &&
        Date.now() - automationJob.lastSucceededAt.getTime() < 15 * 60_000,
    ),
  };
}
