import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { shouldRunMigrations } from "../scripts/vercel-build.mjs";

test("Vercel runs database migrations only for production builds", () => {
  assert.equal(shouldRunMigrations("production"), true);
  assert.equal(shouldRunMigrations("preview"), false);
  assert.equal(shouldRunMigrations("development"), false);
  assert.equal(shouldRunMigrations(undefined), false);
});

test("Vercel delegates the build to the guarded build script", async () => {
  const config = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));
  assert.equal(config.buildCommand, "node scripts/vercel-build.mjs");
});
