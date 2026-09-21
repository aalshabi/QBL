import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { leadSchema } from "@/lib/lead-schema";
import { marketingNav } from "@/lib/company";

/**
 * سطح التحويل: الطريق من الزائر إلى طلب عرض السعر.
 * كان زر الطلب داخل كتلة `hidden lg:flex`، فيغيب عن كل شاشة أصغر من 1024px —
 * أي عن أغلب الزوار — والهدف التجاري الأول للموقع لا يُخفى خلف قائمة.
 */

const root = fileURLToPath(new URL("../", import.meta.url));
const read = (path: string) => readFileSync(join(root, path), "utf8");

test("زر طلب عرض السعر ظاهر على الجوال لا خلف القائمة", () => {
  const source = read("components/site-header.tsx");
  const mobileBlock = source.slice(source.indexOf("lg:hidden"));

  assert.ok(mobileBlock.includes('href="/quote"'), "الكتلة الظاهرة على الجوال بلا رابط طلب السعر");
  assert.ok(
    mobileBlock.indexOf('href="/quote"') < mobileBlock.indexOf("SheetTrigger"),
    "الزر يجب أن يسبق زر القائمة لا أن يكون داخلها",
  );
});

test("لا يوجد رابط طلب سعر محبوس في كتلة سطح المكتب وحدها", () => {
  const source = read("components/site-header.tsx");
  const desktopOnly = source.match(/hidden[^"]*lg:flex[^"]*"[\s\S]*?<\/div>/);
  assert.ok(desktopOnly, "لم يُعثر على كتلة سطح المكتب");
  // مسموح أن تحمل نسخة سطح المكتب الزر، بشرط وجود نسخة الجوال أيضاً.
  assert.ok(source.includes("lg:hidden"), "لا توجد نسخة للجوال إطلاقاً");
});

/** تسمية واحدة للإجراء الأساسي: التنوع يُضعف التعرّف ويُفقد الزخم. */
function collectTsx(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(join(root, dir))) {
    const rel = join(dir, entry);
    if (entry === "generated" || entry === "node_modules") continue;
    if (statSync(join(root, rel)).isDirectory()) collectTsx(rel, acc);
    else if (/\.tsx$/.test(entry)) acc.push(rel);
  }
  return acc;
}

test("كل زر يقود إلى /quote يحمل التسمية نفسها", () => {
  const allowed = new Set(["اطلب عرض سعر", "عرض سعر", "أرسل طلب عرض السعر"]);
  const offenders: string[] = [];

  for (const file of [...collectTsx("app"), ...collectTsx("components")]) {
    const source = read(file);
    for (const match of source.matchAll(/href="\/quote[^"]*"[\s\S]{0,220}?<\/Link>/g)) {
      const label = match[0]
        .replace(/<[^>]*>/g, " ")
        .replace(/\{[^}]*\}/g, " ")
        .replace(/href="[^"]*"/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (!label) continue;
      if (![...allowed].some((text) => label.includes(text))) offenders.push(`${file}: "${label}"`);
    }
  }

  assert.deepEqual(offenders, [], `تسميات مختلفة لنفس الإجراء:\n${offenders.join("\n")}`);
});

test("الشرح الحر اختياري — الطلب يمر بأربعة حقول", () => {
  const withoutMessage = leadSchema.safeParse({
    name: "عبدالله",
    company: "علامة تجميل",
    email: "ops@example.com",
    phone: "0550000000",
  });

  assert.equal(withoutMessage.success, true, "الطلب بلا شرح يجب أن يُقبل");
  assert.equal(withoutMessage.success && withoutMessage.data.message, "", "الغياب يُخزَّن نصاً فارغاً لا null");
});

test("الحقول الأربعة الأساسية تبقى إلزامية", () => {
  for (const missing of ["name", "company", "email", "phone"]) {
    const payload: Record<string, string> = {
      name: "عبدالله",
      company: "علامة تجميل",
      email: "ops@example.com",
      phone: "0550000000",
    };
    delete payload[missing];
    assert.equal(leadSchema.safeParse(payload).success, false, `${missing} يجب أن يبقى إلزامياً`);
  }
});

test("مخطط الطلب مصدر واحد يقرأ منه النموذج والمسار", () => {
  for (const file of ["lib/actions.ts", "app/api/quote/route.ts"]) {
    const source = read(file);
    assert.match(source, /from "@\/lib\/lead-schema"/, `${file} يعرّف مخططه بنفسه`);
    assert.ok(!/z\.object\(/.test(source), `${file} ما زال يحمل مخططاً مكرراً`);
  }
});

test("شارة الصدر عربية — أول ما تقع عليه العين يخاطب جمهور الموقع", () => {
  const source = read("app/page.tsx");
  assert.ok(!source.includes("Last-Mile Cold Chain · Riyadh"), "الشارة ما زالت إنجليزية");
  assert.match(source, /توصيل مبرّد آخر ميل · الرياض/);
});

test("العناصر اللاتينية في القائمة موسومة لتأخذ خط الهوية اللاتيني", () => {
  const latin = marketingNav.filter((item) => /^[A-Za-z][A-Za-z\s]*$/.test(item.label));
  assert.ok(latin.length > 0, "لم يُعثر على عنصر لاتيني في القائمة");
  for (const item of latin) {
    assert.equal(item.latin, true, `${item.label} بلا وسم لاتيني`);
  }
  assert.match(read("components/site-header.tsx"), /item\.latin && "font-latin"/);
});

test("مصدر تنقل واحد — لا قائمة ثانية تناقض المعروضة", () => {
  assert.ok(!read("lib/site.ts").includes("NAV_ITEMS"), "عادت قائمة تنقل ثانية غير مستخدمة");
});
