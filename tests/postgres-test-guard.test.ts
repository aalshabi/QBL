import assert from "node:assert/strict";
import { test } from "node:test";
import { requirePostgresTestTarget } from "../scripts/postgres-test-guard.mjs";

const run = "a".repeat(24);
const url = `postgresql://qbl_test:synthetic-only@127.0.0.1:15432/qbl_test_${run}`;
const safe = { QBL_POSTGRES_TEST_RUN_ID: run, DATABASE_URL: url, DIRECT_URL: url };
test("PostgreSQL harness accepts only its generated loopback test target", () => {
  assert.equal(requirePostgresTestTarget(safe).database, `qbl_test_${run}`);
});
test("PostgreSQL harness rejects remote, ambient, mismatched, and deployed targets", () => {
  for (const bad of [
    {}, { ...safe, QBL_POSTGRES_TEST_RUN_ID: "" }, { ...safe, VERCEL: "1" },
    { ...safe, VERCEL_ENV: "preview" }, { ...safe, DIRECT_URL: "postgresql://production.invalid/main" },
    ...[url.replace("127.0.0.1", "production.invalid"), url.replace("127.0.0.1", "localhost"), url.replace(`qbl_test_${run}`, "production"), `${url}?host=production.invalid`, url.replace(":15432", ":543"), url.replace("qbl_test:", "postgres:")].map((value) => ({ ...safe, DATABASE_URL: value, DIRECT_URL: value })),
  ]) assert.throws(() => requirePostgresTestTarget(bad));
});
