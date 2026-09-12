import { z } from "zod";
export const operationsPolicySchema = z
  .object({
    clientAccountId: z.string().min(1).max(100),
    ownerId: z.string().min(1).max(100),
    backupOwnerId: z.string().min(1).max(100),
    firstEscalationOwnerId: z.string().min(1).max(100),
    secondEscalationOwnerId: z.string().min(1).max(100),
    ackMinutes: z.number().int().min(1).max(10080),
    resolutionMinutes: z.number().int().min(1).max(43200),
    stalledMinutes: z.number().int().min(1).max(43200),
    noUpdateMinutes: z.number().int().min(1).max(43200),
    riskMinutes: z.number().int().min(1).max(1440),
    driverCapacity: z.number().int().min(1).max(500).nullable(),
  })
  .strict()
  .refine(
    (x) =>
      x.ownerId !== x.backupOwnerId &&
      x.firstEscalationOwnerId !== x.secondEscalationOwnerId &&
      x.resolutionMinutes >= x.ackMinutes,
  );
export type DetectionOrder = {
  id: string;
  status: string;
  scheduledAt: Date;
  createdAt: Date;
  logestechsOccurredAt: Date | null;
  outForDeliveryAt: Date | null;
  dropoffAddress: string;
  dropoffLatitude: number;
  dropoffLongitude: number;
  hasPod: boolean;
  courierId: string | null;
};
export function detectOrderRisks(
  order: DetectionOrder,
  policy: {
    stalledMinutes: number;
    noUpdateMinutes: number;
    riskMinutes: number;
  },
  now: Date,
) {
  const risks: string[] = [],
    active = !["DELIVERED", "RETURNED", "CANCELLED"].includes(order.status),
    age = (date: Date) => now.getTime() - date.getTime();
  if (
    order.status === "OUT_FOR_DELIVERY" &&
    order.outForDeliveryAt &&
    age(order.outForDeliveryAt) >= policy.stalledMinutes * 60000
  )
    risks.push("SHIPMENT_STALLED");
  if (
    active &&
    age(order.logestechsOccurredAt ?? order.createdAt) >=
      policy.noUpdateMinutes * 60000
  )
    risks.push("NO_UPDATE");
  // scheduledAt is the recorded delivery target. No invented SLA or ETA is added.
  if (
    active &&
    order.scheduledAt.getTime() <= now.getTime() + policy.riskMinutes * 60000
  )
    risks.push("SLA_RISK");
  if (order.status === "FAILED") risks.push("FAILED_DELIVERY");
  if (order.status === "DELIVERED" && !order.hasPod) risks.push("POD_MISSING");
  if (
    active &&
    (!order.dropoffAddress.trim() ||
      !Number.isFinite(order.dropoffLatitude) ||
      !Number.isFinite(order.dropoffLongitude) ||
      order.dropoffLatitude < 24.2 ||
      order.dropoffLatitude > 25.2 ||
      order.dropoffLongitude < 46.2 ||
      order.dropoffLongitude > 47.2)
  )
    risks.push("ADDRESS_PROBLEM");
  return risks;
}
export function escalationLevel(
  item: {
    status: string;
    priority: string;
    ackDueAt: Date;
    resolutionDueAt: Date;
  },
  now: Date,
) {
  if (item.status === "CLOSED") return 0;
  if (now > item.resolutionDueAt) return 2;
  if (item.priority === "P0" || (item.status === "NEW" && now > item.ackDueAt))
    return 1;
  return 0;
}
