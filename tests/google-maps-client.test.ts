import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import {
  GoogleMapsApiError,
  probeGoogleMaps,
  sanitizeOperationalAddress,
  verifyOperationalAddress,
} from "@/lib/google-maps/client";
import { GoogleMapsConfigurationError } from "@/lib/google-maps/config";

const originalFetch = globalThis.fetch;
const originalKey = process.env.GOOGLE_MAPS_API_KEY;

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function stubSuccessfulPlaces(
  latitude = 24.8697238,
  longitude = 46.6427238,
  formattedAddress = "RAJB2706، 2706 شارع القصر، النرجس، الرياض 13336",
) {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  globalThis.fetch = (async (input, init) => {
    const url = input.toString();
    calls.push({ url, init });
    return calls.length === 1
      ? jsonResponse({ places: [{ id: "safe-place-id" }] })
      : jsonResponse({
          id: "safe-place-id",
          location: { latitude, longitude },
          formattedAddress,
        });
  }) as typeof fetch;
  return calls;
}

beforeEach(() => {
  process.env.GOOGLE_MAPS_API_KEY = "test-server-key";
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.GOOGLE_MAPS_API_KEY;
  else process.env.GOOGLE_MAPS_API_KEY = originalKey;
});

test("uses the server key only in Google headers with the economical field masks", async () => {
  const calls = stubSuccessfulPlaces();
  const result = await verifyOperationalAddress("RAJB2706");

  assert.equal(result.status, "VERIFIED");
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url, "https://places.googleapis.com/v1/places:searchText");
  assert.equal(calls[1].url, "https://places.googleapis.com/v1/places/safe-place-id?languageCode=ar");
  assert.equal(calls.every(({ url }) => !url.includes("test-server-key")), true);

  const searchHeaders = new Headers(calls[0].init?.headers);
  const detailsHeaders = new Headers(calls[1].init?.headers);
  assert.equal(searchHeaders.get("X-Goog-Api-Key"), "test-server-key");
  assert.equal(searchHeaders.get("X-Goog-FieldMask"), "places.id");
  assert.equal(detailsHeaders.get("X-Goog-FieldMask"), "id,location,formattedAddress");
  assert.deepEqual(Object.keys(JSON.parse(String(calls[0].init?.body))).sort(), [
    "languageCode",
    "locationBias",
    "textQuery",
  ]);
});

test("removes customer identifiers before the address is sent to Google", async () => {
  const calls = stubSuccessfulPlaces();
  await verifyOperationalAddress(
    "العميل: محمد، الهاتف: +966501234567، tracking: QBL123456789، RAJB2706",
  );

  const body = JSON.parse(String(calls[0].init?.body)) as { textQuery: string };
  assert.equal(body.textQuery.includes("محمد"), false);
  assert.equal(body.textQuery.includes("966501234567"), false);
  assert.equal(body.textQuery.includes("QBL123456789"), false);
  assert.match(body.textQuery, /RAJB2706/);
  assert.match(body.textQuery, /الرياض/);
});

test("rejects an outside-Riyadh result into manual review", async () => {
  stubSuccessfulPlaces(21.4858, 39.1925, "جدة، المملكة العربية السعودية");
  const result = await verifyOperationalAddress("RAJB2706");

  assert.equal(result.status, "NEEDS_REVIEW");
  assert.equal(result.reviewReason, "OUTSIDE_RIYADH");
});

test("marks a generic district-only address as partial even inside Riyadh", async () => {
  stubSuccessfulPlaces(24.8037, 46.6289, "حي النرجس، الرياض، المملكة العربية السعودية");
  const result = await verifyOperationalAddress("حي النرجس، الرياض");

  assert.equal(result.status, "NEEDS_REVIEW");
  assert.equal(result.reviewReason, "PARTIAL_ADDRESS");
});

test("fails closed before any network request when the server key is missing", async () => {
  delete process.env.GOOGLE_MAPS_API_KEY;
  let called = false;
  globalThis.fetch = (async () => {
    called = true;
    return jsonResponse({});
  }) as typeof fetch;

  await assert.rejects(verifyOperationalAddress("RAJB2706"), GoogleMapsConfigurationError);
  assert.equal(called, false);
});

test("health probe exercises both Places endpoints without returning probe address details", async () => {
  stubSuccessfulPlaces();
  const result = await probeGoogleMaps();

  assert.equal(result.ok, true);
  assert.deepEqual(result.upstreamStatus, { search: 200, details: 200 });
  assert.equal(JSON.stringify(result).includes("RAJB2706"), false);
  assert.equal(result.verification.withinRiyadh, true);
});

test("classifies an upstream non-success response without exposing its body", async () => {
  globalThis.fetch = (async () => jsonResponse({ error: { message: "secret upstream detail" } }, 403)) as typeof fetch;

  await assert.rejects(
    verifyOperationalAddress("RAJB2706"),
    (error: unknown) =>
      error instanceof GoogleMapsApiError &&
      error.code === "UPSTREAM_STATUS" &&
      error.upstreamStatus === 403 &&
      !error.message.includes("secret upstream detail"),
  );
});

test("sanitizer rejects empty and oversized operational addresses", () => {
  assert.equal(sanitizeOperationalAddress("محمد +966501234567"), "محمد، الرياض، المملكة العربية السعودية");
  assert.equal(sanitizeOperationalAddress("x"), "");
  assert.equal(sanitizeOperationalAddress("a".repeat(501)), "");
});
