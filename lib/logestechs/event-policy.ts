import { decideWebhookTransition } from "./webhook";
import type { AdminOrderStatus } from "../admin/types";

export function eventDecision(input: {
  current: AdminOrderStatus;
  incoming: AdminOrderStatus;
  occurredAt: Date | null;
  receivedAt: Date;
  lastOccurredAt: Date | null;
}): "UPDATE" | "NO_CHANGE" | "STALE" | "REVIEW_REQUIRED" {
  const { current, incoming, occurredAt, receivedAt, lastOccurredAt } = input;
  // Missing source time cannot establish order; keep the event for review.
  if (!occurredAt || occurredAt.getTime() > receivedAt.getTime() + 300_000)
    return "REVIEW_REQUIRED";
  if (lastOccurredAt && occurredAt < lastOccurredAt) return "STALE";
  if (
    lastOccurredAt &&
    occurredAt.getTime() === lastOccurredAt.getTime() &&
    current !== incoming
  )
    return "REVIEW_REQUIRED";
  if (current === incoming) return "NO_CHANGE";
  // A later physical return is valid after delivery, unlike an old delivery rollback.
  if (
    current === "DELIVERED" &&
    incoming === "RETURNED" &&
    lastOccurredAt &&
    occurredAt > lastOccurredAt
  )
    return "UPDATE";
  return decideWebhookTransition(current, incoming) === "UPDATE"
    ? "UPDATE"
    : "REVIEW_REQUIRED";
}
