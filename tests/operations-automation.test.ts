import assert from "node:assert/strict";
import { test } from "node:test";
import {
  detectOrderRisks,
  escalationLevel,
  operationsPolicySchema,
} from "../lib/operations/automation-policy";
const now = new Date("2026-09-13T10:00:00Z"),
  policy = { stalledMinutes: 60, noUpdateMinutes: 60, riskMinutes: 30 };
const order = {
  id: "synthetic",
  status: "OUT_FOR_DELIVERY",
  scheduledAt: new Date("2026-09-13T10:10:00Z"),
  createdAt: new Date("2026-09-13T07:00:00Z"),
  logestechsOccurredAt: new Date("2026-09-13T08:00:00Z"),
  outForDeliveryAt: new Date("2026-09-13T08:00:00Z"),
  dropoffAddress: "Synthetic",
  dropoffLatitude: 24.7,
  dropoffLongitude: 46.7,
  hasPod: false,
  courierId: null,
};
test("detects stalled, stale and due shipments without inventing custody or temperature observations", () => {
  assert.deepEqual(detectOrderRisks(order, policy, now), [
    "SHIPMENT_STALLED",
    "NO_UPDATE",
    "SLA_RISK",
  ]);
  assert.deepEqual(
    detectOrderRisks({ ...order, status: "DELIVERED" }, policy, now),
    ["POD_MISSING"],
  );
  assert.deepEqual(
    detectOrderRisks(
      { ...order, status: "DELIVERED", hasPod: true },
      policy,
      now,
    ),
    [],
  );
  assert.ok(
    detectOrderRisks({ ...order, dropoffLatitude: NaN }, policy, now).includes(
      "ADDRESS_PROBLEM",
    ),
  );
});
test("escalation follows severity and deadlines and never reopens a closed case", () => {
  const item = {
    status: "NEW",
    priority: "P1",
    ackDueAt: new Date("2026-09-13T09:00:00Z"),
    resolutionDueAt: new Date("2026-09-13T11:00:00Z"),
  };
  assert.equal(escalationLevel(item, now), 1);
  assert.equal(
    escalationLevel(
      { ...item, resolutionDueAt: new Date("2026-09-13T09:30:00Z") },
      now,
    ),
    2,
  );
  assert.equal(escalationLevel({ ...item, status: "CLOSED" }, now), 0);
  assert.equal(escalationLevel({ ...item, status: "IN_PROGRESS" }, now), 0);
  assert.equal(
    escalationLevel({ ...item, status: "IN_PROGRESS", priority: "P0" }, now),
    1,
  );
});
test("automation has no guessed default owners, deadlines or driver capacity", () => {
  assert.equal(
    operationsPolicySchema.safeParse({ clientAccountId: "synthetic" }).success,
    false,
  );
});
