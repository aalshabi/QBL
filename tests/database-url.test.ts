import assert from "node:assert/strict";
import test from "node:test";
import { parse } from "pg-connection-string";
import { withExplicitVerifyFull } from "../lib/database-url";

// رابط وهمي بالشكل الذي يصدره Neon، مع كلمة مرور مُرمّزة للتأكد من سلامتها.
const NEON_SHAPE =
  "postgresql://app_user:p%40ss%2Fw0rd@ep-example-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const nextTick = () => new Promise((resolve) => setImmediate(resolve));

// يجب أن يسبق أي parse لرابط require: pg يطلق التحذير مرة واحدة فقط في العملية.
test("الرابط المثبّت لا يطلق تحذير pg، والأصلي يطلقه (الاختبار يرى التحذير فعلًا)", async () => {
  const warnings: string[] = [];
  const onWarning = (warning: Error) => warnings.push(warning.message);
  process.on("warning", onWarning);
  try {
    parse(withExplicitVerifyFull(NEON_SHAPE));
    await nextTick();
    assert.equal(warnings.filter((m) => m.includes("sslmode") || m.includes("SSL modes")).length, 0);

    parse(NEON_SHAPE);
    await nextTick();
    assert.equal(warnings.filter((m) => m.includes("SSL modes")).length, 1);
  } finally {
    process.off("warning", onWarning);
  }
});

test("sslmode=require يصبح verify-full ولا يتغير شيء آخر في الاتصال", () => {
  const normalized = withExplicitVerifyFull(NEON_SHAPE);
  assert.match(normalized, /sslmode=verify-full/);
  assert.doesNotMatch(normalized, /sslmode=require/);

  const { sslmode: before, ...restBefore } = parse(NEON_SHAPE);
  const { sslmode: after, ...restAfter } = parse(normalized);
  assert.equal(before, "require");
  assert.equal(after, "verify-full");
  // المستخدم وكلمة المرور والخادم والقاعدة وchannel_binding وإعداد TLS الفعلي كلها كما هي.
  assert.deepEqual(restAfter, restBefore);
});

test("prefer وverify-ca تُثبَّت كذلك؛ ما عداها لا يُلمس", () => {
  assert.match(withExplicitVerifyFull("postgresql://u:p@h/db?sslmode=prefer"), /sslmode=verify-full/);
  assert.match(withExplicitVerifyFull("postgresql://u:p@h/db?sslmode=verify-ca"), /sslmode=verify-full/);

  for (const untouched of [
    "postgresql://u:p@h/db?sslmode=verify-full",
    "postgresql://u:p@h/db?sslmode=disable",
    "postgresql://u:p@h/db?sslmode=no-verify",
    "postgresql://postgres:postgres@localhost:5432/qdl?schema=public",
    "postgresql://u:p@h/db?uselibpqcompat=true&sslmode=require",
    "not a url",
  ]) {
    assert.equal(withExplicitVerifyFull(untouched), untouched);
  }
});

test("Prisma يمرّر DATABASE_URL عبر التثبيت", async () => {
  const { readFileSync } = await import("node:fs");
  const source = readFileSync(new URL("../lib/prisma.ts", import.meta.url), "utf8");
  assert.match(source, /connectionString: withExplicitVerifyFull\(/);
});
