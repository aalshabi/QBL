import assert from "node:assert/strict";
import { test } from "node:test";
import { compareShipments } from "../lib/operations/reconciliation";
import { canOperate } from "../lib/operations/access";
test("detects a source shipment missing from QBL despite equal total counts", () => {
  const r = compareShipments(["S1", "S2"], ["S1", "OTHER"], 2);
  assert.equal(r.complete, false);
  assert.deepEqual(r.missingIds, ["S2"]);
  assert.deepEqual(r.unexpectedIds, ["OTHER"]);
});
test("duplicates and incomplete exports cannot pass reconciliation", () => {
  assert.equal(compareShipments(["S1", "S1"], ["S1"], 2).complete, false);
  assert.equal(compareShipments(["S1"], ["S1"], 2).complete, false);
  assert.equal(compareShipments(["S1"], ["S1"], 1).complete, true);
});
test("client and courier roles cannot read another account through operational endpoints", () => {
  assert.equal(canOperate("CLIENT"), false);
  assert.equal(canOperate("COURIER"), false);
  assert.equal(canOperate(null), false);
  assert.equal(canOperate("DISPATCHER"), true);
});
