import "server-only";
import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { assertOperator } from "./cases";
import type { Session } from "@/lib/auth";
import { isWithinRiyadh } from "@/lib/google-maps/coverage";
export const commitmentSchema = z
  .object({
    orderId: z.string().min(1).max(100),
    clientAccountId: z.string().min(1).max(100),
    ownerId: z.string().min(1).max(100),
    windowStart: z.iso.datetime(),
    windowEnd: z.iso.datetime(),
    planReference: z.string().trim().min(5).max(500),
    planConfirmed: z.boolean(),
  })
  .strict();
export async function createCommitment(
  input: unknown,
  session: Session | null,
) {
  const actor = await assertOperator(session),
    data = commitmentSchema.parse(input),
    prisma = getPrisma(),
    start = new Date(data.windowStart),
    end = new Date(data.windowEnd);
  if (start >= end || end <= new Date())
    throw new Error("INVALID_COMMITMENT_WINDOW");
  return prisma.$transaction(
    async (tx) => {
      const order = await tx.deliveryOrder.findFirst({
        where: { id: data.orderId, clientAccountId: data.clientAccountId },
      });
      if (!order) throw new Error("CASE_TENANT_MISMATCH");
      const owner = await tx.user.findFirst({
        where: {
          id: data.ownerId,
          status: "ACTIVE",
          roles: {
            some: {
              role: { name: { in: ["ADMIN", "OPS_MANAGER", "DISPATCHER"] } },
            },
          },
        },
        select: { id: true },
      });
      if (!owner) throw new Error("INVALID_OWNERS");
      if (["DELIVERED", "RETURNED", "CANCELLED"].includes(order.status))
        throw new Error("COMMITMENT_NOT_FEASIBLE");
      const feasible = Boolean(
        order.courierId &&
          order.logestechsOccurredAt &&
          isWithinRiyadh(
            Number(order.dropoffLatitude),
            Number(order.dropoffLongitude),
          ) &&
          order.scheduledAt >= start &&
          order.scheduledAt <= end,
      );
      if (data.planConfirmed && !feasible)
        throw new Error("COMMITMENT_NOT_FEASIBLE");
      const result = await tx.deliveryCommitment.create({
        data: {
          orderId: data.orderId,
          clientAccountId: data.clientAccountId,
          ownerId: data.ownerId,
          windowStart: start,
          windowEnd: end,
          planReference: data.planReference,
          feasibility: data.planConfirmed
            ? "MANUALLY_CONFIRMED"
            : "NEEDS_REVIEW",
          createdBy: actor.userId,
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: actor.userId,
          orderId: data.orderId,
          action: "STATUS_CHANGED",
          reason: "Delivery commitment recorded",
          metadata: {
            commitmentId: result.id,
            feasibility: result.feasibility,
          },
        },
      });
      return { id: result.id };
    },
    { isolationLevel: "Serializable" },
  );
}
