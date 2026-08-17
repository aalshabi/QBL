import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { LogesTechsApiError, probeLogesTechs } from "@/lib/logestechs/client";

const originalFetch = globalThis.fetch;
const integrationVariables = [
  "LOGESTECHS_BASE_URL",
  "LOGESTECHS_COMPANY_ID",
  "LOGESTECHS_EMAIL",
  "LOGESTECHS_PASSWORD",
] as const;

function setValidConfiguration() {
  process.env.LOGESTECHS_BASE_URL = "https://api.example.com/";
  process.env.LOGESTECHS_COMPANY_ID = "727";
  process.env.LOGESTECHS_EMAIL = "integration@example.com";
  process.env.LOGESTECHS_PASSWORD = "test-password";
}

function stubFetch(response: Partial<Response>) {
  globalThis.fetch = (async () => response as Response) as typeof fetch;
}

function abortError() {
  const error = new Error("aborted");
  error.name = "AbortError";
  return error;
}

beforeEach(setValidConfiguration);

afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const variable of integrationVariables) delete process.env[variable];
});

test("summarizes a successful cities response without exposing its records", async () => {
  let requestedUrl = "";
  let requestedInit: RequestInit | undefined;
  globalThis.fetch = (async (input, init) => {
    requestedUrl = input.toString();
    requestedInit = init;
    return {
      ok: true,
      status: 200,
      json: async () => ({ data: [{ id: 1 }, { id: 2 }] }),
    } as Response;
  }) as typeof fetch;

  const result = await probeLogesTechs();

  assert.equal(requestedUrl, "https://api.example.com/addresses/cities?returnAll=true");
  assert.equal(new Headers(requestedInit?.headers).get("company-id"), "727");
  assert.deepEqual(result.response, { shape: "object", itemCount: 2 });
  assert.equal(result.upstreamStatus, 200);
});

test("classifies an abort while establishing the request as a timeout", async () => {
  globalThis.fetch = (async () => {
    throw abortError();
  }) as typeof fetch;

  await assert.rejects(
    probeLogesTechs(),
    (error: unknown) => error instanceof LogesTechsApiError && error.code === "TIMEOUT",
  );
});

test("preserves timeout classification when JSON body reading is aborted", async () => {
  stubFetch({
    ok: true,
    status: 200,
    json: async () => {
      throw abortError();
    },
  });

  await assert.rejects(
    probeLogesTechs(),
    (error: unknown) => error instanceof LogesTechsApiError && error.code === "TIMEOUT",
  );
});

test("classifies malformed JSON as an invalid upstream response", async () => {
  stubFetch({
    ok: true,
    status: 200,
    json: async () => {
      throw new SyntaxError("invalid JSON");
    },
  });

  await assert.rejects(
    probeLogesTechs(),
    (error: unknown) =>
      error instanceof LogesTechsApiError &&
      error.code === "INVALID_RESPONSE" &&
      error.upstreamStatus === 200,
  );
});

test("classifies non-abort request failures as network errors", async () => {
  globalThis.fetch = (async () => {
    throw new TypeError("connection refused");
  }) as typeof fetch;

  await assert.rejects(
    probeLogesTechs(),
    (error: unknown) => error instanceof LogesTechsApiError && error.code === "NETWORK",
  );
});

test("reports non-successful upstream status codes", async () => {
  stubFetch({ ok: false, status: 503 });

  await assert.rejects(
    probeLogesTechs(),
    (error: unknown) =>
      error instanceof LogesTechsApiError &&
      error.code === "UPSTREAM_STATUS" &&
      error.upstreamStatus === 503,
  );
});

test("rejects primitive JSON payloads", async () => {
  stubFetch({ ok: true, status: 200, json: async () => "unexpected" });

  await assert.rejects(
    probeLogesTechs(),
    (error: unknown) => error instanceof LogesTechsApiError && error.code === "INVALID_RESPONSE",
  );
});
