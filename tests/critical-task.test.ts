import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import {
  LOGESTECHS_TASK,
  TASK_DECISIONS,
  TASK_GAPS,
  TASK_PHASES,
  TASK_TESTS,
  activePhase,
  isOverdue,
  riyadhToday,
  summarize,
  windowProgress,
} from "@/lib/tasks/logestechs-integration";

const root = fileURLToPath(new URL("../", import.meta.url));
const dataSource = readFileSync(join(root, "lib/tasks/logestechs-integration.ts"), "utf8");
const pageSource = readFileSync(join(root, "app/(admin)/admin/tasks/page.tsx"), "utf8");

/**
 * صفحة المهام الحرجة في مساحة عمل الفريق. الثوابت المحمية: كل بند قابل للتنفيذ
 * (مالك، إجراء، معيار قبول)، لا أسرار ولا بيانات شخصية في المحتوى، والصفحة خلف
 * حارس الإدارة.
 */

test("كل بند له معرّف فريد ومالك وإجراء ومعيار قبول", () => {
  const ids = TASK_GAPS.map((gap) => gap.id);
  assert.equal(new Set(ids).size, ids.length, "معرّف بند مكرر");
  for (const gap of TASK_GAPS) {
    assert.ok(gap.problem.trim() && gap.action.trim() && gap.acceptance.trim(), `${gap.id} ناقص`);
    assert.ok(gap.owners.length > 0, `${gap.id} بلا مالك`);
    if (gap.due === null) assert.ok(gap.dueNote, `${gap.id} بلا موعد ولا ملاحظة موعد`);
    else assert.match(gap.due, /^\d{4}-\d{2}-\d{2}$/, `${gap.id} موعد بصيغة خاطئة`);
  }
});

test("مواعيد P0 و P1 داخل نافذة التنفيذ", () => {
  for (const gap of TASK_GAPS.filter((item) => item.priority !== "P2")) {
    assert.ok(gap.due, `${gap.id} بلا موعد`);
    assert.ok(gap.due >= LOGESTECHS_TASK.windowStart && gap.due <= LOGESTECHS_TASK.windowEnd, `${gap.id} خارج النافذة`);
  }
});

test("المراحل متصلة وتغطي النافذة كاملة بلا فجوة ولا تداخل", () => {
  assert.equal(TASK_PHASES[0].start, LOGESTECHS_TASK.windowStart);
  assert.equal(TASK_PHASES.at(-1)?.end, LOGESTECHS_TASK.windowEnd);
  for (let index = 1; index < TASK_PHASES.length; index += 1) {
    const previousEnd = Date.parse(`${TASK_PHASES[index - 1].end}T00:00:00Z`);
    const start = Date.parse(`${TASK_PHASES[index].start}T00:00:00Z`);
    assert.equal(start - previousEnd, 86_400_000, `فجوة أو تداخل قبل ${TASK_PHASES[index].id}`);
  }
});

test("القرارات والاختبارات بمعرّفات فريدة", () => {
  for (const list of [TASK_DECISIONS.map((item) => item.id), TASK_TESTS.map((item) => item.id)]) {
    assert.equal(new Set(list).size, list.length);
  }
});

test("حساب اليوم من النافذة والتأخر", () => {
  assert.deepEqual(windowProgress("2026-10-11"), { day: 0, total: 30, state: "BEFORE" });
  assert.deepEqual(windowProgress("2026-10-12"), { day: 1, total: 30, state: "RUNNING" });
  assert.deepEqual(windowProgress("2026-11-10"), { day: 30, total: 30, state: "RUNNING" });
  assert.deepEqual(windowProgress("2026-11-11"), { day: 30, total: 30, state: "ENDED" });

  const first = TASK_GAPS[0];
  assert.equal(isOverdue(first, first.due as string), false, "يوم الموعد نفسه ليس تأخراً");
  assert.equal(isOverdue(first, "2026-10-14"), true);
  assert.equal(isOverdue({ ...first, status: "DONE" }, "2026-10-14"), false);
  assert.equal(isOverdue({ ...first, due: null }, "2026-12-01"), false);

  assert.equal(activePhase("2026-10-12")?.id, "PH1");
  assert.equal(activePhase("2026-10-20")?.id, "PH3");
  assert.equal(activePhase("2026-12-01"), null);
});

test("تاريخ اليوم يُحسب بتوقيت الرياض لا بتوقيت الخادم", () => {
  // 21:30 UTC = 00:30 اليوم التالي في الرياض.
  assert.equal(riyadhToday(new Date("2026-10-12T21:30:00Z")), "2026-10-13");
  assert.equal(riyadhToday(new Date("2026-10-12T20:30:00Z")), "2026-10-12");
});

test("الملخص يعكس البيانات", () => {
  const summary = summarize("2026-10-12");
  assert.equal(summary.p0Total, TASK_GAPS.filter((gap) => gap.priority === "P0").length);
  assert.equal(summary.overdue, 0);
  assert.equal(summary.testsTotal, TASK_TESTS.length);
  assert.ok(summarize("2026-11-11").overdue >= summary.p0Open);
});

test("المحتوى بلا أسرار ولا بيانات شخصية", () => {
  const forbidden: { pattern: RegExp; label: string }[] = [
    { pattern: /pass(word)?\s*[:=]/i, label: "كلمة مرور" },
    { pattern: /كلمة\s+(ال)?مرور\s*[:=]/, label: "كلمة مرور" },
    { pattern: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[a-z]{2,}/i, label: "بريد إلكتروني" },
    { pattern: /(\+?966|\b05)\d{8,}/, label: "رقم جوال" },
    { pattern: /company-?id/i, label: "معرّف حساب المورد" },
    { pattern: /\b(sk|pk|key)_[A-Za-z0-9]{8,}/, label: "مفتاح" },
  ];
  for (const { pattern, label } of forbidden) {
    assert.doesNotMatch(dataSource, pattern, `ملف بيانات المهمة يحتوي ${label}`);
    assert.doesNotMatch(pageSource, pattern, `صفحة المهمة تحتوي ${label}`);
  }
});

test("الصفحة خلف حارس الإدارة وغير مفهرسة", () => {
  assert.match(pageSource, /await requireAdminPage\(\)/, "الصفحة لا تستدعي حارس الإدارة");
  assert.match(pageSource, /index:\s*false/, "الصفحة قابلة للفهرسة");
});

test("بيانات اللوحة نفسها هي المصدر التشغيلي الحالي", () => {
  assert.equal(LOGESTECHS_TASK.reference, "lib/tasks/logestechs-integration.ts");
});


test("G19 closes after all three scheduled jobs have production evidence", () => {
  const cronSecretGap = TASK_GAPS.find((gap) => gap.id === "G19");
  assert.ok(cronSecretGap);
  assert.equal(cronSecretGap.status, "DONE");
  assert.match(cronSecretGap.action, /\/api\/cron\/daily-temperature-report/);
  assert.match(cronSecretGap.action, /HTTP 200/);
});
