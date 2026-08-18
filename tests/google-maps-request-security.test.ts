import assert from "node:assert/strict";
import { test } from "node:test";
import { validateLocationRequest } from "@/lib/google-maps/request-security";

function locationRequest(headers: Record<string, string> = {}) {
  return new Request("https://qbl.example.com/api/admin/integrations/google-maps/resolve", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-qbl-integration-request": "location-check-v1",
      ...headers,
    },
    body: JSON.stringify({ locations: [{ id: "order-1", address: "RAJB2706" }] }),
  });
}

test("accepts a marked same-origin location verification request", () => {
  const request = locationRequest({ origin: "https://qbl.example.com", "sec-fetch-site": "same-origin" });
  assert.deepEqual(validateLocationRequest(request), { ok: true });
});

test("rejects cross-site, unmarked, and non-JSON location requests", () => {
  assert.equal(validateLocationRequest(locationRequest({ origin: "https://evil.example" })).ok, false);

  const unmarked = locationRequest();
  unmarked.headers.delete("x-qbl-integration-request");
  assert.equal(validateLocationRequest(unmarked).ok, false);

  const nonJson = locationRequest();
  nonJson.headers.set("content-type", "text/plain");
  assert.equal(validateLocationRequest(nonJson).ok, false);
});
