import assert from "node:assert/strict";
import { test } from "node:test";
import { demoDataAllowed, requireDatabaseUrl } from "../lib/runtime-mode";

test("production and hosted previews cannot fall back to synthetic operations", () => {
  for (const env of [
    {},
    { NODE_ENV: "production" },
    { NODE_ENV: "development", VERCEL: "1" },
    { NODE_ENV: "test", VERCEL_ENV: "preview" },
  ]) {
    assert.equal(demoDataAllowed(env as NodeJS.ProcessEnv), false);
  }
  assert.equal(demoDataAllowed({ NODE_ENV: "development" }), true);
  assert.equal(demoDataAllowed({ NODE_ENV: "test" }), true);
});
test("missing or blank database configuration fails instead of selecting a local database", () => {
  assert.throws(() => requireDatabaseUrl({}), /DATABASE_NOT_CONFIGURED/);
  assert.throws(
    () => requireDatabaseUrl({ DATABASE_URL: "  " }),
    /DATABASE_NOT_CONFIGURED/,
  );
  assert.equal(
    requireDatabaseUrl({
      DATABASE_URL: " postgresql://isolated.example/test ",
    }),
    "postgresql://isolated.example/test",
  );
});
