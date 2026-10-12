import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";
import { checkNewPassword } from "@/lib/account/password-policy";

const root = fileURLToPath(new URL("../", import.meta.url));
const read = (path: string) => readFileSync(join(root, path), "utf8");

// ---------------------------------------------------------------------------
// سياسة كلمة المرور (وحدة — تعمل دائمًا)
// ---------------------------------------------------------------------------

const base = { email: "hello@qbl.sa", currentPassword: "old-password-123" };

test("policy accepts a strong new password", () => {
  assert.deepEqual(checkNewPassword({ ...base, newPassword: "Riyadh-cold-chain-2026" }), { ok: true });
});

test("policy rejects short, same, single-character and account-name passwords", () => {
  const error = (newPassword: string) => {
    const result = checkNewPassword({ ...base, newPassword });
    return result.ok ? "OK" : result.error;
  };
  assert.equal(error("short-1"), "TOO_SHORT");
  assert.equal(error("x".repeat(129)), "TOO_LONG");
  assert.equal(error("aaaaaaaaaaaaaa"), "SINGLE_CHARACTER");
  assert.equal(error("my-HELLO-password-99"), "CONTAINS_ACCOUNT_NAME");
  assert.equal(checkNewPassword({ email: "hello@qbl.sa", currentPassword: "same-password-1234", newPassword: "same-password-1234" }).ok, false);
});

test("policy rejects every password published in prisma/seed.ts", () => {
  const seed = read("prisma/seed.ts");
  const published = [...new Set([...seed.matchAll(/hashOtp\(\s*"([^"]+)"\s*\)/g)].map((match) => match[1]))];
  assert.ok(published.length > 0);
  for (const password of published) {
    const result = checkNewPassword({ email: "x@qbl.sa", currentPassword: "old-password-123", newPassword: password });
    // قد تُرفض لقِصرها قبل وصولها إلى قائمة المنشور؛ المهم أنها لا تُقبل.
    assert.equal(result.ok, false);
  }
});

test("route requires a session, the same-origin marker and a rate limit", () => {
  const route = read("app/api/account/password/route.ts");
  assert.match(route, /getSession\(\)/);
  assert.match(route, /ACCOUNT_REQUEST_MARKER/);
  assert.match(route, /acquireRatePermit\(`password-change:\$\{session\.userId\}`/);
  assert.match(route, /CROSS_SITE_REQUEST/);
  // لا يمرّر إلى السجلات أي متغير يحمل الكلمات أو جسم الطلب (أسماء الأحداث النصية مسموحة).
  assert.doesNotMatch(route, /console\.\w+\([^)]*\b(currentPassword|newPassword|body|raw|data)\b/);
});

test("the account page is admin-guarded, not indexed, and reachable from the workspace nav", () => {
  const page = read("app/(admin)/admin/account/page.tsx");
  assert.match(page, /await requireAdminPage\(\)/);
  assert.match(page, /index: false/);
  assert.match(read("lib/workspace-nav.ts"), /href: "\/admin\/account"/);
});

// ---------------------------------------------------------------------------
// تكامل: Postgres حقيقية (محلية فقط)
// ---------------------------------------------------------------------------

const databaseUrl = process.env.ACCOUNT_PASSWORD_TEST_DATABASE_URL;
const isLocal = Boolean(databaseUrl && /@(localhost|127\.0\.0\.1)[:/]/.test(databaseUrl));
const skip = !databaseUrl
  ? "ACCOUNT_PASSWORD_TEST_DATABASE_URL not set"
  : !isLocal
    ? "ACCOUNT_PASSWORD_TEST_DATABASE_URL must point at localhost"
    : false;

const EMAIL = "pw-test-owner@qbl.sa";
const OLD = "Old-integration-pass-2026";
const NEW = "New-integration-pass-2026";

type Prisma = ReturnType<typeof import("@/lib/prisma")["getPrisma"]>;
let prisma: Prisma;
let userId = "";
let changeOwnPassword: typeof import("@/lib/account/change-password")["changeOwnPassword"];
let verifyCredentials: typeof import("@/lib/auth-users")["verifyCredentials"];

before(async () => {
  if (skip) return;
  process.env.DATABASE_URL = databaseUrl;
  process.env.OTP_PEPPER = "account-password-test-pepper";
  prisma = (await import("@/lib/prisma")).getPrisma();
  ({ changeOwnPassword } = await import("@/lib/account/change-password"));
  ({ verifyCredentials } = await import("@/lib/auth-users"));
  const { hashOtp } = await import("@/lib/security");

  await prisma.auditLog.deleteMany({ where: { action: "PASSWORD_CHANGED" } });
  await prisma.userRole.deleteMany({ where: { user: { email: { startsWith: "pw-test-" } } } });
  await prisma.user.deleteMany({ where: { email: { startsWith: "pw-test-" } } });
  const role = await prisma.role.upsert({ where: { name: "OPS_MANAGER" }, update: {}, create: { name: "OPS_MANAGER" } });
  const user = await prisma.user.create({
    data: {
      name: "PW Test",
      email: EMAIL,
      phone: "0500000099",
      passwordHash: await hashOtp(OLD),
      roles: { create: [{ roleId: role.id }] },
    },
  });
  userId = user.id;
});

after(async () => {
  if (skip) return;
  await prisma.$disconnect();
});

test("wrong current password changes nothing", { skip }, async () => {
  const result = await changeOwnPassword({ userId, currentPassword: "not-the-password", newPassword: NEW });
  assert.equal(result.ok, false);
  assert.equal(!result.ok && result.error, "INVALID_CURRENT_PASSWORD");
  assert.ok(await verifyCredentials(EMAIL, OLD), "old password must still work");
});

test("a weak new password is refused and changes nothing", { skip }, async () => {
  const result = await changeOwnPassword({ userId, currentPassword: OLD, newPassword: "short" });
  assert.equal(!result.ok && result.error, "TOO_SHORT");
  assert.ok(await verifyCredentials(EMAIL, OLD));
});

test("success: new password signs in, old one no longer does, audit row written", { skip }, async () => {
  const result = await changeOwnPassword({ userId, currentPassword: OLD, newPassword: NEW });
  assert.deepEqual(result, { ok: true });
  assert.equal((await verifyCredentials(EMAIL, NEW))?.role, "OPS_MANAGER");
  assert.equal(await verifyCredentials(EMAIL, OLD), null);
  const audit = await prisma.auditLog.findMany({ where: { action: "PASSWORD_CHANGED", actorId: userId } });
  assert.equal(audit.length, 1);
  assert.equal(JSON.stringify(audit).includes(NEW), false, "audit must not contain the password");
});

test("a suspended account cannot change its password", { skip }, async () => {
  await prisma.user.update({ where: { id: userId }, data: { status: "SUSPENDED" } });
  const result = await changeOwnPassword({ userId, currentPassword: NEW, newPassword: "Another-strong-pass-2026" });
  assert.equal(!result.ok && result.error, "INVALID_CURRENT_PASSWORD");
});
