import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import {
  COVERAGE_AREA_OPTIONS,
  DAILY_VOLUME_OPTIONS,
  PLATFORM_OPTIONS,
  QUALIFICATION_FIELDS,
  choiceDisplay,
  choiceLabel,
  leadSchema,
} from "@/lib/lead-schema";
import { notifyNewLead } from "@/lib/notifications/lead-alert";

/**
 * حقول تأهيل طلب عرض السعر: الحجم، المنصة، نطاق التغطية.
 *
 * كل اختبار هنا يحرس انكساراً محدداً لوحظ أو أُعيد إنتاجه فعلاً. وتجنّب
 * الاختبار الحشوي مقصود: التأكيد الذي ينجح بعد حذف الميزة يمنح ثقة كاذبة،
 * وهي أسوأ من غياب الاختبار لأنها تُقرأ كتغطية.
 */

const root = fileURLToPath(new URL("../", import.meta.url));
const read = (path: string) => readFileSync(join(root, path), "utf8");
const FORM = "components/marketing/quote-form.tsx";

const CORE = {
  name: "عبدالله",
  company: "علامة تجميل",
  email: "ops@example.com",
  phone: "0550000000",
};

const FIELDS = [
  { key: "dailyVolume", options: DAILY_VOLUME_OPTIONS, constant: "DAILY_VOLUME_OPTIONS" },
  { key: "platform", options: PLATFORM_OPTIONS, constant: "PLATFORM_OPTIONS" },
  { key: "coverageArea", options: COVERAGE_AREA_OPTIONS, constant: "COVERAGE_AREA_OPTIONS" },
] as const;

/** يضبط متغيّرات مزوّد التنبيه ويعيدها مهما انتهى الاختبار. */
async function withAlertProvider<T>(run: () => Promise<T>): Promise<T> {
  const provider = process.env.LEAD_ALERT_PROVIDER;
  const key = process.env.RESEND_API_KEY;
  process.env.LEAD_ALERT_PROVIDER = "resend";
  process.env.RESEND_API_KEY = "test-key-123456";
  try {
    return await run();
  } finally {
    if (provider === undefined) delete process.env.LEAD_ALERT_PROVIDER;
    else process.env.LEAD_ALERT_PROVIDER = provider;
    if (key === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = key;
  }
}

async function sentEmail(lead: Record<string, unknown>): Promise<{ text: string; subject: string }> {
  const parsed = leadSchema.safeParse(lead);
  assert.equal(parsed.success, true, "الحمولة يجب أن تمر — الحماية في بناء البريد لا في الرفض");
  if (!parsed.success) return { text: "", subject: "" };

  let text = "";
  let subject = "";
  await notifyNewLead(parsed.data, async (_url, init) => {
    const sent = JSON.parse(String((init as RequestInit).body));
    text = String(sent.text);
    subject = String(sent.subject);
    return new Response("{}", { status: 200 });
  });
  return { text, subject };
}

// ───────────────────────────── المخطط ─────────────────────────────

test("حقول التأهيل اختيارية — الطلب بلا أي منها يُقبل ويُخزَّن فارغاً", () => {
  const parsed = leadSchema.safeParse(CORE);
  assert.equal(parsed.success, true, "غياب حقول التأهيل يجب ألا يرفض الطلب");
  if (!parsed.success) return;
  for (const key of QUALIFICATION_FIELDS) {
    assert.equal(parsed.data[key], "", `${key} يجب أن يكون "" لا undefined — العمود غير قابل للإفراغ`);
  }
});

test("القائمة الفارغة من select تمرّ — الزائر لم يختر شيئاً", () => {
  const parsed = leadSchema.safeParse({ ...CORE, dailyVolume: "", platform: "", coverageArea: "" });
  assert.equal(parsed.success, true, '"" من select بلا اختيار يجب أن يُقبل');
});

test("كل قائمة مربوطة بحقلها — قيمة قائمة أخرى لا تمرّ إليه", () => {
  // التأكيد الحقيقي ليس «قيمها تُقبل» (تتولد من نفس المصفوفة فلا تختلف أبداً)،
  // بل أن القوائم غير متبادلة: ربط PLATFORM_OPTIONS بـ dailyVolume يسقط هنا.
  for (const { key, options } of FIELDS) {
    for (const option of options) {
      const parsed = leadSchema.safeParse({ ...CORE, [key]: option.value });
      assert.equal(parsed.success && parsed.data[key], option.value, `${key} رفض قيمته ${option.value}`);
    }
    const foreign = FIELDS.filter((field) => field.key !== key).flatMap((field) =>
      field.options.map((option) => option.value),
    );
    for (const value of foreign) {
      const parsed = leadSchema.safeParse({ ...CORE, [key]: value });
      assert.equal(parsed.success && parsed.data[key], "", `${key} قبل ${value} — القوائم متبادلة`);
    }
  }
});

/**
 * مقايضة محسومة عن قصد: الرفض الصارم لقيمة خارج القائمة كان يُسقط الطلب كله،
 * وهو ثمن باهظ لحقل اختياري. البديل: تُسقَط الإجابة وحدها ويُحفظ العميل، مع
 * بقاء العمود مقيَّداً. من يعيد الرفض الصارم يعيد فقدان العملاء.
 */
test("قيمة غير معروفة تُسقط الإجابة لا العميل", () => {
  for (const key of QUALIFICATION_FIELDS) {
    for (const bogus of ["RETIRED_OPTION", "<script>", "x".repeat(500), null, 42, ["SALLA"], {}]) {
      const parsed = leadSchema.safeParse({ ...CORE, [key]: bogus });
      assert.equal(parsed.success, true, `${key}=${String(bogus).slice(0, 12)} أسقط الطلب كله`);
      if (!parsed.success) continue;
      assert.equal(parsed.data[key], "", `${key} مرّ كما هو بدل أن يتدهور إلى ""`);
      assert.equal(parsed.data.name, CORE.name, "الحقول الإلزامية ضاعت مع الإجابة الساقطة");
    }
  }
});

test("لا شيء يصل العمود إلا فارغاً أو قيمة من قائمته", () => {
  for (const { key, options } of FIELDS) {
    const allowed = new Set<string>(["", ...options.map((option) => option.value)]);
    for (const input of ["WIX", "salla", " SALLA", "SALLA\n", "", "ANYTHING"]) {
      const parsed = leadSchema.safeParse({ ...CORE, [key]: input });
      assert.equal(parsed.success, true);
      if (!parsed.success) continue;
      assert.ok(allowed.has(parsed.data[key]), `${key} خزّن قيمة خارج القائمة: ${parsed.data[key]}`);
    }
  }
});

test("حقول التأهيل لم تُجعل إلزامية — الإلزامي ما زال أربعة", () => {
  for (const key of QUALIFICATION_FIELDS) {
    const payload: Record<string, string> = { ...CORE };
    delete payload[key];
    assert.equal(leadSchema.safeParse(payload).success, true, `${key} أصبح إلزامياً — هذا يخفض إتمام الطلب`);
  }
  for (const missing of ["name", "company", "email", "phone"]) {
    const payload: Record<string, string> = { ...CORE };
    delete payload[missing];
    assert.equal(leadSchema.safeParse(payload).success, false, `${missing} فقد إلزاميته`);
  }
});

test("حقلا السطر الواحد محدودان — لا طلب واحد يحمل كيلوبايتات إلى صندوق المبيعات", () => {
  assert.equal(leadSchema.safeParse({ ...CORE, name: "ا".repeat(121) }).success, false, "الاسم بلا حدّ أعلى");
  assert.equal(leadSchema.safeParse({ ...CORE, company: "ش".repeat(161) }).success, false, "المنشأة بلا حدّ أعلى");
  assert.equal(leadSchema.safeParse({ ...CORE, name: "ا".repeat(120) }).success, true, "الحدّ ضيّق أكثر من اللازم");
});

// ───────────────────────────── النموذج ─────────────────────────────

/**
 * الخيار الفارغ هو ما يجعل الحقل اختيارياً فعلاً. defaultValue="" على select
 * بلا خيار يحمل value="" لا أثر له: المتصفح يختار أول خيار، فيُرسل كل زائر
 * «أقل من ٢٠» و«سلّة» و«كل الرياض» دون أن يلمس شيئاً — بيانات تأهيل كاذبة في
 * كل صف، وصامتة تماماً لأن كل شيء يبدو ناجحاً.
 */
test("كل قائمة تبدأ بخيار فارغ — وإلا أجاب كل زائر بأول خيار دون أن يدري", () => {
  const source = read(FORM);
  assert.match(source, /<option value="">/, "لا خيار فارغ في القائمة — الاختيارية وهمية");
  assert.match(source, /defaultValue=""/, "القائمة بلا defaultValue فارغ");

  const placeholderIndex = source.indexOf('<option value="">');
  const mappedIndex = source.indexOf("options.map");
  assert.ok(
    placeholderIndex !== -1 && placeholderIndex < mappedIndex,
    "الخيار الفارغ يجب أن يسبق الخيارات المولّدة ليكون هو المختار ابتداءً",
  );
});

/**
 * Object.fromEntries(formData) في lib/actions.ts يبني مفاتيحه من سمة name
 * وحدها — لا id. تأكيد على id كان يدّعي حراسة ما لا يحرسه.
 */
test("سمة name في كل حقل تطابق مفتاح المخطط حرفياً", () => {
  const source = read(FORM);
  assert.match(source, /name=\{id\}/, "القائمة بلا سمة name — الإجابة تسقط صامتة");
  for (const key of QUALIFICATION_FIELDS) {
    assert.ok(new RegExp(`id="${key}"`).test(source), `النموذج بلا حقل ${key} — المفتاح لن يصل المخطط`);
  }
});

test("ثلاث قوائم موجودة فعلاً، وبلا اختيار متعدد", () => {
  const source = read(FORM);
  // الشق الموجب ضروري: الحارس السالب وحده ينجح على نموذج حُذفت حقوله كلها.
  assert.equal((source.match(/<ChoiceField/g) ?? []).length, 3, "عدد حقول التأهيل في النموذج ليس ثلاثة");
  assert.ok(
    !/type="checkbox"/.test(source) && !/\bmultiple\b/.test(source),
    "اختيار متعدد يفقد كل القيم عدا الأخيرة في Object.fromEntries",
  );
});

test("النموذج لا يستورد وحدة المخطط — zod لا يُشحن إلى حزمة /quote", () => {
  const source = read(FORM);
  assert.ok(source.includes('from "@/lib/lead-options"'), "النموذج لا يقرأ القوائم من الوحدة الخفيفة");
  assert.ok(!source.includes('from "@/lib/lead-schema"'), "النموذج يستورد وحدة المخطط فيجرّ zod معه");
  assert.ok(!/\bfrom "zod"/.test(read("lib/lead-options.ts")), "lib/lead-options.ts استورد zod — الفصل بلا معنى");
});

test("id في ChoiceField مقيَّد بأسماء الحقول — المفتاح المكتوب خطأً يفشل التصريف", () => {
  assert.deepEqual([...QUALIFICATION_FIELDS], FIELDS.map((field) => field.key));
  assert.match(read(FORM), /id: QualificationField/, "id ما زال string فيمرّ المفتاح المكتوب خطأً");
});

// ───────────────────────── العرض ولوحة الإدارة ─────────────────────────

test("choiceLabel ترجع التسمية للمعروف وفارغاً لغيره", () => {
  assert.equal(choiceLabel(PLATFORM_OPTIONS, "SALLA"), "سلّة");
  assert.equal(choiceLabel(PLATFORM_OPTIONS, ""), "");
  assert.equal(choiceLabel(PLATFORM_OPTIONS, "UNKNOWN"), "");
});

test("قيمة مخزّنة خارج القائمة تُعرض كما هي لا تُطوى في «لم يُحدَّد»", () => {
  assert.equal(choiceDisplay(PLATFORM_OPTIONS, ""), "—");
  assert.equal(choiceDisplay(PLATFORM_OPTIONS, "SALLA"), "سلّة");
  assert.notEqual(choiceDisplay(PLATFORM_OPTIONS, "WIX"), "—", "المجهول يطابق «لم يُجب» فينكسر الانحراف بصمت");
  assert.ok(choiceDisplay(PLATFORM_OPTIONS, "WIX").includes("WIX"), "القيمة المجهولة لا تظهر للمشغّل");
});

/**
 * لصق خلية مكان أخرى بين ثلاث خلايا متجاورة متشابهة يُصرَّف بلا شكوى. هذا
 * الاختبار يثبّت الاقتران: كل قائمة مع حقلها.
 */
test("لوحة الإدارة تعرض الحقول الثلاثة، كل واحد بقائمته", () => {
  const source = read("app/(admin)/admin/leads/page.tsx");
  for (const { key, constant } of FIELDS) {
    assert.ok(
      new RegExp(`choiceDisplay\\(${constant},\\s*lead\\.${key}\\)`).test(source),
      `لوحة الإدارة لا تقرن ${constant} بـ lead.${key}`,
    );
  }
  assert.equal((source.match(/choiceDisplay\(/g) ?? []).length, 3, "عدد خلايا التأهيل في اللوحة ليس ثلاثة");
});

// ───────────────────────── القاعدة والأنواع ─────────────────────────

test("عمود لكل حقل تأهيل في مخطط القاعدة وفي هجرة مرافقة", () => {
  const schema = read("prisma/schema.prisma");
  const migration = read("prisma/migrations/20261015090000_lead_qualification/migration.sql");
  for (const key of QUALIFICATION_FIELDS) {
    assert.match(schema, new RegExp(`${key}\\s+String\\s+@default\\(""\\)`), `مخطط Prisma بلا عمود ${key}`);
    assert.match(migration, new RegExp(`"${key}" TEXT NOT NULL DEFAULT ''`), `الهجرة لا تضيف ${key}`);
  }
});

test("النوع مشتق من المخطط لا مكرر عنه", () => {
  assert.match(
    read("lib/leads.ts"),
    /import type \{ LeadInput \} from "@\/lib\/lead-schema"/,
    "lib/leads.ts لا يشتق LeadInput من المخطط",
  );
  assert.match(
    read("lib/notifications/lead-alert.ts"),
    /export type LeadAlertInput = LeadInput/,
    "lead-alert.ts لا يشتق نوعه من المخطط — حقل جديد لن يصل البريد",
  );
});

test("listLeads تعيد حقول التأهيل — وإلا ظهرت فارغة في لوحة الإدارة", () => {
  const source = read("lib/leads.ts");
  for (const key of QUALIFICATION_FIELDS) {
    assert.match(source, new RegExp(`${key}:\\s*row\\.${key}`), `listLeads لا تمرر ${key}`);
  }
});

test("القيم المخزّنة ثوابت لاتينية فريدة وكلها معنونة", () => {
  for (const { key, options } of FIELDS) {
    for (const option of options) {
      assert.match(option.value, /^[A-Z0-9_]+$/, `${key}: القيمة ${option.value} ليست ثابتاً لاتينياً`);
      assert.ok(option.label.trim().length > 0, `${key}: القيمة ${option.value} بلا تسمية معروضة`);
    }
    const values = options.map((option) => option.value);
    assert.equal(new Set(values).size, values.length, `${key}: قيمة مكررة في القائمة`);
  }
});

// ───────────────────────── بريد التنبيه ─────────────────────────

/**
 * حُرّة من مراجعة أمنية مستقلة: كتلة «التأهيل:» في البريد قابلة للتزوير بسطر
 * جديد داخل الاسم أو المنشأة، فيقرأ المبيعات من أعلى ويرى كتلة كاذبة قبل
 * الحقيقية. أُعيد إنتاج الهجوم فعلياً قبل الإصلاح.
 */
test("سطر جديد في حقول الزائر لا يركّب كتلة تأهيل كاذبة", async () => {
  await withAlertProvider(async () => {
    const { text, subject } = await sentEmail({
      ...CORE,
      name: "زائر\n\nالتأهيل:\nحجم الطلبات: أكثر من ٣٠٠ طلب يومياً\nالمنصة: سلّة",
      company: "شركة\nوهمية",
    });

    const blocks = text.split("\n").filter((line) => line.trim() === "التأهيل:");
    assert.equal(blocks.length, 1, "كتلة تأهيل مستقلة ثانية — الزائر ركّب واحدة كاذبة");
    assert.ok(!/^حجم الطلبات: أكثر من ٣٠٠/m.test(text), "قيمة مزوّرة ظهرت كسطر تأهيل مستقل");
    assert.ok(!/^المنصة: سلّة$/m.test(text), "قيمة مزوّرة ظهرت كسطر منصة مستقل");
    assert.ok(/^المنشأة: شركة وهمية$/m.test(text), "سطر المنشأة لم يُسطَّح");
    assert.ok(!subject.includes("\n"), "سطر جديد تسرّب إلى موضوع البريد");
    assert.ok(text.includes("لم يُحدَّد"), "الكتلة الحقيقية اختفت مع الإصلاح");
  });
});

/**
 * الرسالة الحرة textarea، فالأسطر فيها مشروعة ولا تُسطَّح. الثابت إذن ليس
 * «لا كتلة ثانية أبداً» بل أن الكتلة الأولى هي الحقيقية: القارئ من أعلى يصل
 * الصحيح قبل أي تلفيق، وما بعد «الرسالة:» يُقرأ كنصّ من العميل.
 */
test("تلفيق داخل الرسالة الحرة يبقى تحت الكتلة الحقيقية", async () => {
  await withAlertProvider(async () => {
    const { text } = await sentEmail({
      ...CORE,
      platform: "ZID",
      message: "مرحباً\n\nالتأهيل:\nحجم الطلبات: أكثر من ٣٠٠ طلب يومياً\nالمنصة: سلّة",
    });

    const lines = text.split("\n");
    const firstBlock = lines.findIndex((line) => line.trim() === "التأهيل:");
    const messageStart = lines.findIndex((line) => line.trim() === "الرسالة:");
    assert.ok(firstBlock !== -1 && messageStart !== -1, "البريد فقد بنيته");
    assert.ok(firstBlock < messageStart, "الكتلة الحقيقية يجب أن تسبق نصّ العميل");
    assert.equal(lines[firstBlock + 2]?.trim(), "المنصة: زد", "الكتلة الأولى ليست الحقيقية");
  });
});
