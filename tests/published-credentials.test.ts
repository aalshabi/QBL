import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, test } from "node:test";
import { fileURLToPath } from "node:url";
import { verifyCredentials } from "@/lib/auth-users";
import { PUBLISHED_SEED_PASSWORD_SHA256, isPublishedSeedPassword } from "@/lib/published-credentials";

const root = fileURLToPath(new URL("../", import.meta.url));
const env = process.env as Record<string, string | undefined>;
const originalNodeEnv = env.NODE_ENV;
const originalDatabaseUrl = env.DATABASE_URL;

afterEach(() => {
  env.NODE_ENV = originalNodeEnv;
  if (originalDatabaseUrl === undefined) delete env.DATABASE_URL;
  else env.DATABASE_URL = originalDatabaseUrl;
});

/** كلمات المرور الحرفية في seed.ts — تُقرأ من الملف ولا تُكتب في الاختبار. */
function seedPasswords(): string[] {
  const source = readFileSync(join(root, "prisma/seed.ts"), "utf8");
  return [...new Set([...source.matchAll(/hash(?:Otp|Password)\(\s*"([^"]+)"\s*\)/g)].map((match) => match[1]))];
}

test("every literal password in prisma/seed.ts has its fingerprint on the deny list", () => {
  const passwords = seedPasswords();
  assert.ok(passwords.length > 0, "seed.ts no longer has literal passwords — revisit this guard");
  for (const password of passwords) {
    const digest = createHash("sha256").update(password, "utf8").digest("hex");
    assert.ok(PUBLISHED_SEED_PASSWORD_SHA256.includes(digest), "a seed.ts password is missing from the deny list");
    assert.equal(isPublishedSeedPassword(password), true);
  }
});

test("ordinary passwords are not on the deny list", () => {
  assert.equal(isPublishedSeedPassword("a-real-strong-password-2026"), false);
  assert.equal(isPublishedSeedPassword(""), false);
});

test("in production a published seed password is rejected before any database lookup", async () => {
  env.NODE_ENV = "production";
  // قاعدة غير قابلة للوصول: لو وصل الطلب إليها لتعلّق أو رمى خطأ بدل أن يعيد null فورًا.
  env.DATABASE_URL = "postgresql://nobody@127.0.0.1:1/none";
  for (const password of seedPasswords()) {
    assert.equal(await verifyCredentials("ops.manager@qbl.sa", password), null);
  }
});
