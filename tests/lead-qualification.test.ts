import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import {
  COVERAGE_AREA_OPTIONS,
  DAILY_VOLUME_OPTIONS,
  PLATFORM_OPTIONS,
  choiceLabel,
  leadSchema,
} from "@/lib/lead-schema";

/**
 * حقول تأهيل طلب عرض السعر: الحجم، المنصة، نطاق التغطية.
 *
 * الثوابت التي تحرسها هذه الاختبارات ثلاثة، وكل واحد منها انكسر فعلاً في أنظمة
 * مشابهة: (١) الحقول اختيارية فلا تخفض إتمام الطلب، (٢) القيم مقيَّدة لأن
 * `/api/quote` عام بلا مصادقة، (٣) اسم الحقل في النموذج يطابق مفتاح المخطط —
 * وإلا سقطت الإجابة صامتةً عبر `Object.fromEntries`.
 */

const root = fileURLToPath(new URL("../", import.meta.url));
const read = (path: string) => readFileSync(join(root, path), "utf8");

const CORE = {
  name: "عبدالله",
  company: "علامة تجميل",
  email: "ops@example.com",
  phone: "0550000000",
};

const FIELDS = [
  { key: "dailyVolume", options: DAILY_VOLUME_OPTIONS },
  { key: "platform", options: PLATFORM_OPTIONS },
  { key: "coverageArea", options: COVERAGE_AREA_OPTIONS },
] as const;

test("حقول التأهيل اختيارية — الطلب بلا أي منها يُقبل", () => {
  const parsed = leadSchema.safeParse(CORE);
  assert.equal(parsed.success, true, "غياب حقول التأهيل يجب ألا يرفض الطلب");
  if (!parsed.success) return;
  for (const { key } of FIELDS) {
    assert.equal(parsed.data[key], "", `${key} يجب أن يكون "" لا undefined — العمود غير قابل للإفراغ`);
  }
});

test("القائمة الفارغة من <select> تمرّ — الزائر لم يختر شيئاً", () => {
  const parsed = leadSchema.safeParse({ ...CORE, dailyVolume: "", platform: "", coverageArea: "" });
  assert.equal(parsed.success, true, '"" من select بلا اختيار يجب أن يُقبل');
});

test("كل قيمة معروفة في كل قائمة تُقبل", () => {
  for (const { key, options } of FIELDS) {
    for (const option of options) {
      const parsed = leadSchema.safeParse({ ...CORE, [key]: option.value });
      assert.equal(parsed.success, true, `${key}=${option.value} يجب أن يُقبل`);
    }
  }
});

test("قيمة خارج القائمة تُرفض — المسار عام ولا يقبل نصاً حراً", () => {
  for (const { key } of FIELDS) {
    for (const bogus of ["ANYTHING", "<script>", "x".repeat(500)]) {
      const parsed = leadSchema.safeParse({ ...CORE, [key]: bogus });
      assert.equal(parsed.success, false, `${key}="${bogus.slice(0, 12)}" كان يجب أن يُرفض`);
    }
  }
});

test("حقول التأهيل لم تُجعل إلزامية — الحقول الإلزامية ما زالت أربعة", () => {
  for (const { key } of FIELDS) {
    const payload: Record<string, string> = { ...CORE };
    delete payload[key];
    assert.equal(leadSchema.safeParse(payload).success, true, `${key} أصبح إلزامياً — هذا يخفض إتمام الطلب`);
  }
});

test("اسم كل حقل في النموذج يطابق مفتاح المخطط حرفياً", () => {
  const source = read("components/marketing/quote-form.tsx");
  for (const { key } of FIELDS) {
    assert.ok(
      new RegExp(`id="${key}"`).test(source),
      `النموذج لا يحمل حقلاً باسم ${key} — الإجابة ستسقط صامتة عبر Object.fromEntries`,
    );
  }
});

test("النموذج لا يستخدم مفتاحاً مكرراً — Object.fromEntries تُبقي الأخير فقط", () => {
  const source = read("components/marketing/quote-form.tsx");
  assert.ok(
    !/type="checkbox"/.test(source) && !/\bmultiple\b/.test(source),
    "اختيار متعدد في النموذج يفقد كل القيم عدا الأخيرة في lib/actions.ts",
  );
});

test("القيم المخزّنة لاتينية ثابتة — تعديل الصياغة لا يُبطل الصفوف المحفوظة", () => {
  for (const { key, options } of FIELDS) {
    for (const option of options) {
      assert.match(option.value, /^[A-Z0-9_]+$/, `${key}: القيمة ${option.value} ليست ثابتاً لاتينياً`);
      assert.ok(option.label.trim().length > 0, `${key}: القيمة ${option.value} بلا تسمية معروضة`);
    }
    const values = options.map((option) => option.value);
    assert.equal(new Set(values).size, values.length, `${key}: قيمة مكررة في القائمة`);
  }
});

test("choiceLabel ترجع التسمية للقيمة المعروفة و\"\" لغيرها", () => {
  assert.equal(choiceLabel(PLATFORM_OPTIONS, "SALLA"), "سلّة");
  assert.equal(choiceLabel(PLATFORM_OPTIONS, ""), "");
  assert.equal(choiceLabel(PLATFORM_OPTIONS, "UNKNOWN"), "");
});

test("عمود لكل حقل تأهيل في مخطط القاعدة وفي هجرة مرافقة", () => {
  const schema = read("prisma/schema.prisma");
  const migration = read("prisma/migrations/20261015090000_lead_qualification/migration.sql");

  for (const { key } of FIELDS) {
    assert.match(schema, new RegExp(`${key}\\s+String\\s+@default\\(""\\)`), `مخطط Prisma بلا عمود ${key}`);
    assert.match(migration, new RegExp(`"${key}" TEXT NOT NULL DEFAULT ''`), `الهجرة لا تضيف ${key}`);
  }
});

test("النوع مشتق من المخطط لا مكرر عنه في طبقة الحفظ والتنبيه", () => {
  for (const file of ["lib/leads.ts", "lib/notifications/lead-alert.ts"]) {
    const source = read(file);
    assert.match(source, /from "@\/lib\/lead-schema"/, `${file} لا يقرأ النوع من المخطط`);
    assert.ok(
      !/name:\s*string;\s*\n\s*company:\s*string;/.test(source),
      `${file} ما زال يحمل نسخة يدوية من حقول العميل المحتمل`,
    );
  }
});

test("listLeads تعيد حقول التأهيل — وإلا ظهرت فارغة في لوحة الإدارة", () => {
  const source = read("lib/leads.ts");
  for (const { key } of FIELDS) {
    assert.match(source, new RegExp(`${key}:\\s*row\\.${key}`), `listLeads لا تمرر ${key}`);
  }
});
