import assert from "node:assert/strict";
import test from "node:test";
import { checkCronAuth, cronAuthFailure } from "../lib/cron/auth";

const bearer = (value: string) => new Headers({ authorization: value });

test("مفتاح غير مضبوط يُصنَّف خللَ إعداد لا رفضَ طلب", () => {
  const result = checkCronAuth(bearer("Bearer anything"), {});
  assert.deepEqual(result, { ok: false, reason: "NOT_CONFIGURED" });
});

test("مسافات حول المفتاح لا تكسر المطابقة", () => {
  const result = checkCronAuth(bearer("Bearer s3cret"), { CRON_SECRET: "  s3cret  " });
  assert.deepEqual(result, { ok: true });
});

test("المفتاح الصحيح يمر", () => {
  assert.deepEqual(checkCronAuth(bearer("Bearer s3cret"), { CRON_SECRET: "s3cret" }), { ok: true });
});

test("المفتاح الخاطئ يُرفض", () => {
  assert.deepEqual(checkCronAuth(bearer("Bearer wrong"), { CRON_SECRET: "s3cret" }), {
    ok: false,
    reason: "UNAUTHORIZED",
  });
});

test("غياب الترويسة يُرفض ولا يُعامَل كخلل إعداد", () => {
  assert.deepEqual(checkCronAuth(new Headers(), { CRON_SECRET: "s3cret" }), {
    ok: false,
    reason: "UNAUTHORIZED",
  });
});

test("المفتاح بلا بادئة Bearer يُرفض", () => {
  assert.deepEqual(checkCronAuth(bearer("s3cret"), { CRON_SECRET: "s3cret" }), {
    ok: false,
    reason: "UNAUTHORIZED",
  });
});

test("الإعداد الناقص يعيد 503 لا 401 — هذا ما يجعل العطل مرئياً في السجل", () => {
  const errors: string[] = [];
  const original = console.error;
  console.error = (message: string) => errors.push(message);
  try {
    const failure = cronAuthFailure("cold-chain-watch", { ok: false, reason: "NOT_CONFIGURED" });
    assert.equal(failure.status, 503);
    assert.equal(failure.body.error, "CRON_SECRET_NOT_CONFIGURED");
  } finally {
    console.error = original;
  }
  assert.equal(errors.length, 1);
  assert.match(errors[0], /CRON_SECRET_NOT_CONFIGURED/);
  assert.match(errors[0], /cold-chain-watch/);
});

test("الرفض يبقى 401 ويُسجَّل تحذيراً لا خطأً", () => {
  const warnings: string[] = [];
  const original = console.warn;
  console.warn = (message: string) => warnings.push(message);
  try {
    const failure = cronAuthFailure("cold-chain-poll", { ok: false, reason: "UNAUTHORIZED" });
    assert.equal(failure.status, 401);
    assert.equal(failure.body.error, "UNAUTHORIZED");
  } finally {
    console.warn = original;
  }
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /cold-chain-poll/);
});

test("كل المهام المجدولة في vercel.json تمر بالبوابة المشتركة", async () => {
  const { readFile } = await import("node:fs/promises");
  const config = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));
  const crons: Array<{ path: string }> = config.crons;
  assert.ok(crons.length > 0, "vercel.json بلا مهام مجدولة");

  for (const cron of crons) {
    const source = await readFile(new URL(`../app${cron.path}/route.ts`, import.meta.url), "utf8");
    assert.match(source, /checkCronAuth\(request\.headers\)/, `${cron.path} لا يستدعي البوابة المشتركة`);
    assert.doesNotMatch(source, /process\.env\.CRON_SECRET/, `${cron.path} ما زال يقرأ المفتاح بنفسه`);
  }
});
