import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";

/**
 * حراسة انحدار على سطحين عامين سبق أن كانا مكشوفين:
 * 1) /api/quote صار يُطلق بريداً صادراً، فبقاؤه بلا حدّ معدل يحوّله إلى مضخة إرسال.
 * 2) لوحة العمليات ومسار بثها كانا يفتحان لزائر مجهول.
 * الاختبار يقرأ المصدر لأن تنفيذ المسار يتطلب بيئة Next كاملة؛ الغرض أن يسقط
 * البناء إن حُذف الحارس مستقبلاً، لا أن يحاكي الطلب.
 */

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("مسار طلب عرض السعر محدود المعدل على مستوى IP", () => {
  const source = read("app/api/quote/route.ts");
  assert.match(source, /acquireRatePermit\(`quote:ip:/);
  assert.match(source, /status: 429/);
  assert.match(source, /permit\.release\(\)/);
  assert.match(source, /readBoundedRequestJson/);
});

test("لوحة العمليات محمية في الـ layout وفي الصفحة معاً", () => {
  assert.match(read("app/(ops)/layout.tsx"), /requireOpsPage\(\)/);
  assert.match(read("app/(ops)/ops/page.tsx"), /requireOpsPage\(\)/);
});

test("بث العمليات يفحص الصلاحية قبل فتح القناة", () => {
  const source = read("app/api/ops/stream/route.ts");
  assert.match(source, /requireOpsApi\(\)/);
  const guardIndex = source.indexOf("requireOpsApi()");
  const streamIndex = source.indexOf("new ReadableStream");
  assert.ok(guardIndex > 0 && guardIndex < streamIndex, "الفحص يجب أن يسبق فتح البث");
});

test("حارس العمليات يرفض غياب الجلسة قبل فحص الدور", () => {
  const source = read("lib/ops/guard.ts");
  const sessionCheck = source.indexOf("if (!session)");
  const roleCheck = source.indexOf("OPS_ROLES.includes");
  assert.ok(sessionCheck > 0 && sessionCheck < roleCheck);
  assert.doesNotMatch(source, /"COURIER"|"CLIENT"/);
});
