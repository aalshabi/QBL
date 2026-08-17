import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import {
  getLogesTechsConfig,
  LogesTechsConfigurationError,
} from "@/lib/logestechs/config";

const integrationVariables = [
  "LOGESTECHS_BASE_URL",
  "LOGESTECHS_COMPANY_ID",
  "LOGESTECHS_EMAIL",
  "LOGESTECHS_PASSWORD",
  "LOGESTECHS_ALLOWED_HOSTS",
] as const;

function setValidConfiguration() {
  process.env.LOGESTECHS_BASE_URL = "https://api.example.com/api/";
  process.env.LOGESTECHS_COMPANY_ID = "727";
  process.env.LOGESTECHS_EMAIL = "integration@example.com";
  process.env.LOGESTECHS_PASSWORD = " test-password ";
  process.env.LOGESTECHS_ALLOWED_HOSTS = "api.example.com";
}

beforeEach(setValidConfiguration);

afterEach(() => {
  for (const variable of integrationVariables) delete process.env[variable];
});

test("normalizes server configuration while preserving password whitespace", () => {
  assert.deepEqual(getLogesTechsConfig(), {
    baseUrl: "https://api.example.com/api",
    companyId: "727",
    email: "integration@example.com",
    password: " test-password ",
  });
});

test("rejects missing required variables", () => {
  delete process.env.LOGESTECHS_PASSWORD;

  assert.throws(
    getLogesTechsConfig,
    (error: unknown) =>
      error instanceof LogesTechsConfigurationError && error.variable === "LOGESTECHS_PASSWORD",
  );
});

test("requires an HTTPS base URL", () => {
  process.env.LOGESTECHS_BASE_URL = "http://api.example.com/api";

  assert.throws(
    getLogesTechsConfig,
    (error: unknown) =>
      error instanceof LogesTechsConfigurationError && error.variable === "LOGESTECHS_BASE_URL",
  );
});

test("rejects an HTTPS host outside the explicit allowlist", () => {
  process.env.LOGESTECHS_BASE_URL = "https://attacker.example.net/api";

  assert.throws(
    getLogesTechsConfig,
    (error: unknown) =>
      error instanceof LogesTechsConfigurationError && error.variable === "LOGESTECHS_BASE_URL",
  );
});

test("rejects embedded credentials, query strings, fragments, and nonstandard ports", () => {
  for (const baseUrl of [
    "https://user:pass@api.example.com/api",
    "https://api.example.com/api?redirect=https://example.net",
    "https://api.example.com/api#fragment",
    "https://api.example.com:8443/api",
  ]) {
    process.env.LOGESTECHS_BASE_URL = baseUrl;
    assert.throws(getLogesTechsConfig, LogesTechsConfigurationError);
  }
});

test("pins the integration to the documented API base path", () => {
  process.env.LOGESTECHS_BASE_URL = "https://api.example.com/internal";
  assert.throws(getLogesTechsConfig, LogesTechsConfigurationError);
});

test("requires a numeric company id", () => {
  process.env.LOGESTECHS_COMPANY_ID = "QBL";

  assert.throws(
    getLogesTechsConfig,
    (error: unknown) =>
      error instanceof LogesTechsConfigurationError && error.variable === "LOGESTECHS_COMPANY_ID",
  );
});

test("requires an email-shaped integration username", () => {
  process.env.LOGESTECHS_EMAIL = "integration-user";

  assert.throws(
    getLogesTechsConfig,
    (error: unknown) =>
      error instanceof LogesTechsConfigurationError && error.variable === "LOGESTECHS_EMAIL",
  );
});
