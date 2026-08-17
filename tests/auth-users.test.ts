import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { verifyCredentials } from "@/lib/auth-users";

const originalDatabaseUrl = process.env.DATABASE_URL;

afterEach(() => {
  if (originalDatabaseUrl === undefined) {
    delete process.env.DATABASE_URL;
  } else {
    process.env.DATABASE_URL = originalDatabaseUrl;
  }
});

test("fails closed when the database is not configured", async () => {
  delete process.env.DATABASE_URL;

  const result = await verifyCredentials("ops@example.com", "any-password");

  assert.equal(result, null);
});
