import assert from "node:assert/strict";
import { test } from "node:test";
import { mapLogesTechsStatus } from "@/lib/logestechs/status-map";

test("maps documented LogesTechs statuses to QBL order statuses", () => {
  assert.equal(mapLogesTechsStatus("DELIVERED_TO_RECIPIENT"), "DELIVERED");
  assert.equal(mapLogesTechsStatus("OUT_FOR_DELIVERY"), "OUT_FOR_DELIVERY");
  assert.equal(mapLogesTechsStatus("POSTPONED_DELIVERY"), "POSTPONED");
  assert.equal(mapLogesTechsStatus("RETURNED_BY_RECIPIENT"), "RETURNED");
  assert.equal(mapLogesTechsStatus("FAILED"), "FAILED");
});

test("keeps undocumented or semantically ambiguous statuses unmapped instead of guessing", () => {
  assert.equal(mapLogesTechsStatus("SOME_FUTURE_STATUS"), null);
  assert.equal(mapLogesTechsStatus("COMPLETED"), null);
  assert.equal(mapLogesTechsStatus("DAMAGED"), null);
  assert.equal(mapLogesTechsStatus("OPENED_ISSUE_AND_WAITING_FOR_MANAGEMENT"), null);
});
