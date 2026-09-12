import assert from "node:assert/strict";
import { test } from "node:test";
import { eventDecision } from "../lib/logestechs/event-policy";
import { validCronAuthorization } from "../lib/cron-auth";
const earlier = new Date("2026-09-12T08:00:00Z"),
  later = new Date("2026-09-12T09:00:00Z");
test("older events never roll a shipment forward or backward", () => {
  assert.equal(
    eventDecision({
      current: "OUT_FOR_DELIVERY",
      incoming: "FAILED",
      occurredAt: earlier,
      receivedAt: later,
      lastOccurredAt: later,
    }),
    "STALE",
  );
});
test("later return after delivery is retained as the authoritative source status", () => {
  assert.equal(
    eventDecision({
      current: "DELIVERED",
      incoming: "RETURNED",
      occurredAt: later,
      receivedAt: later,
      lastOccurredAt: earlier,
    }),
    "UPDATE",
  );
});
test("missing time, conflicting equal time, future time and corrections require review", () => {
  for (const occurredAt of [null, earlier, new Date("2026-09-13T09:00:00Z")])
    assert.equal(
      eventDecision({
        current: "DELIVERED",
        incoming: "OUT_FOR_DELIVERY",
        occurredAt,
        receivedAt: later,
        lastOccurredAt: earlier,
      }),
      "REVIEW_REQUIRED",
    );
});
test("cron authorization requires the exact bearer credential", () => {
  const secret = "test-only-secret-for-cron-123456789";
  for (const h of [
    null,
    secret,
    "bearer " + secret,
    "Bearer " + secret + " ",
    "Bearer wrong",
  ])
    assert.equal(validCronAuthorization(h, secret), false);
  assert.equal(validCronAuthorization("Bearer " + secret, secret), true);
  assert.equal(validCronAuthorization("Bearer short", "short"), false);
});
