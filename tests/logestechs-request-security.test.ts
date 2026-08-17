import assert from "node:assert/strict";
import { test } from "node:test";
import {
  acquireRatePermit,
  readBoundedRequestJson,
  validateStatusRequest,
} from "@/lib/logestechs/request-security";

function statusRequest(headers: Record<string, string> = {}, body = "{}") {
  return new Request("https://qbl.example.com/api/admin/integrations/logestechs/package-status", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-qbl-integration-request": "status-check-v1",
      ...headers,
    },
    body,
  });
}

test("accepts a marked same-origin JSON request", () => {
  const request = statusRequest({ origin: "https://qbl.example.com", "sec-fetch-site": "same-origin" });
  assert.deepEqual(validateStatusRequest(request), { ok: true });
});

test("rejects cross-origin and unmarked requests", () => {
  assert.equal(
    validateStatusRequest(statusRequest({ origin: "https://evil.example" })).ok,
    false,
  );

  const unmarked = statusRequest();
  unmarked.headers.delete("x-qbl-integration-request");
  assert.equal(validateStatusRequest(unmarked).ok, false);
});

test("reads a bounded JSON body", async () => {
  assert.deepEqual(await readBoundedRequestJson(statusRequest({}, '{"shipments":[]}')), {
    shipments: [],
  });
});

test("enforces per-key request and concurrency limits", () => {
  const key = `test-${Date.now()}-${Math.random()}`;
  const first = acquireRatePermit(key, 2, 1, 1_000);
  assert.equal(first.ok, true);
  assert.equal(acquireRatePermit(key, 2, 1, 1_000).ok, false);
  if (first.ok) first.release();

  const second = acquireRatePermit(key, 2, 1, 1_000);
  assert.equal(second.ok, true);
  if (second.ok) second.release();
  assert.equal(acquireRatePermit(key, 2, 1, 1_000).ok, false);
});
