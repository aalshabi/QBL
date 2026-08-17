import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { getIntegrationServices } from "@/lib/integrations/overview";

const variables = [
  "DATABASE_URL",
  "GOOGLE_MAPS_API_KEY",
  "LOGESTECHS_BASE_URL",
  "LOGESTECHS_COMPANY_ID",
  "LOGESTECHS_EMAIL",
  "LOGESTECHS_PASSWORD",
] as const;

const originalValues = Object.fromEntries(
  variables.map((variable) => [variable, process.env[variable]]),
);

beforeEach(() => {
  process.env.DATABASE_URL = "postgresql://example.invalid/qbl";
  process.env.GOOGLE_MAPS_API_KEY = "maps-test-key";
  process.env.LOGESTECHS_BASE_URL = "https://apisv2.logestechs.com/api";
  process.env.LOGESTECHS_COMPANY_ID = "727";
  process.env.LOGESTECHS_EMAIL = "integration@example.com";
  process.env.LOGESTECHS_PASSWORD = "test-password";
});

afterEach(() => {
  for (const variable of variables) {
    const original = originalValues[variable];
    if (original === undefined) delete process.env[variable];
    else process.env[variable] = original;
  }
});

test("reports configured integrations without exposing secret values", () => {
  const services = getIntegrationServices();
  assert.deepEqual(
    services.map(({ id, state }) => ({ id, state })),
    [
      { id: "logestechs", state: "configured" },
      { id: "google-maps", state: "configured" },
      { id: "neon", state: "configured" },
    ],
  );
  assert.equal(JSON.stringify(services).includes("maps-test-key"), false);
  assert.equal(JSON.stringify(services).includes("test-password"), false);
});

test("shows missing and invalid service configuration honestly", () => {
  delete process.env.GOOGLE_MAPS_API_KEY;
  delete process.env.DATABASE_URL;
  process.env.LOGESTECHS_BASE_URL = "https://example.invalid/api";

  const services = getIntegrationServices();
  assert.equal(services.find((service) => service.id === "logestechs")?.state, "needs_attention");
  assert.equal(services.find((service) => service.id === "google-maps")?.state, "not_configured");
  assert.equal(services.find((service) => service.id === "neon")?.state, "needs_attention");
});
