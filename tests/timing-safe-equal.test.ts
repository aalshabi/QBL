import assert from "node:assert/strict";
import { test } from "node:test";
import { timingSafeEqualStrings } from "@/lib/security";

test("timingSafeEqualStrings matches identical strings", () => {
  assert.equal(timingSafeEqualStrings("1234", "1234"), true);
});

test("timingSafeEqualStrings rejects a mismatch of the same length", () => {
  assert.equal(timingSafeEqualStrings("1234", "5678"), false);
});

test("timingSafeEqualStrings rejects mismatched lengths without throwing", () => {
  assert.equal(timingSafeEqualStrings("123", "1234"), false);
  assert.equal(timingSafeEqualStrings("", "1234"), false);
});
