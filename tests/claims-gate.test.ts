import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

/**
 * حارس بوابة الادعاءات على المحتوى المنشور.
 * عدد الأسطول ادعاء ممنوع: يتحول عند أول نزاع إلى التزام مكتوب بسعة تشغيلية،
 * ويتغير العدد أسرع مما يُحدَّث الموقع. حُذف من المحتوى، وهذا الاختبار يمنع عودته.
 */

const root = fileURLToPath(new URL("../", import.meta.url));

function collect(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(join(root, dir))) {
    const rel = join(dir, entry);
    if (entry === "generated" || entry === "node_modules") continue;
    if (statSync(join(root, rel)).isDirectory()) collect(rel, acc);
    else if (/\.(ts|tsx)$/.test(entry)) acc.push(rel);
  }
  return acc;
}

// أسطح يراها العميل فقط. لوحات التشغيل مستثناة عمداً: قراءة حرارة فعلية على
// شاشة عمليات بيانات تشغيلية، لا ادعاء تسويقي.
const CUSTOMER_FACING = [
  "app/page.tsx",
  ...collect("app/(marketing)"),
  "lib/company.ts",
  "lib/site.ts",
  "lib/contact.ts",
  "lib/structured-data.ts",
  ...collect("components/marketing"),
];

const FLEET_COUNT_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /أسطول\s+حديث/, label: "وصف حجم الأسطول" },
  { pattern: /سعة\s+أسطول/, label: "سعة الأسطول كرقم" },
  { pattern: /\d+\s*[-–]\s*\d+\s*فان/, label: "عدد المركبات" },
  { pattern: /\d+\s*(مركبة|مركبات|سائق|سائقين|مندوب)\s/, label: "عدد المركبات أو السائقين" },
];

const GUARANTEE_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /\b0\s*إلى\s*\+?\s*5\b/, label: "نطاق حرارة مضمون" },
  { pattern: /حتى\s*[-−–]\s*18/, label: "درجة تجميد مضمونة" },
  { pattern: /نضمن/, label: "صيغة ضمان نتيجة" },
];

const SUPERLATIVE_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /الخيار\s+الأول/, label: "صفة تفضيل" },
  { pattern: /الأفضل\s+في/, label: "صفة تفضيل" },
  { pattern: /الأرخص/, label: "ادعاء سعر مقارن" },
  { pattern: /الرائد|الرائدة/, label: "صفة تفضيل" },
  { pattern: /الأولى\s+في\s+المملكة/, label: "صفة تفضيل" },
];

function scan(groups: { pattern: RegExp; label: string }[]): string[] {
  const hits: string[] = [];
  for (const file of CUSTOMER_FACING) {
    let source: string;
    try {
      source = readFileSync(join(root, file), "utf8");
    } catch {
      continue;
    }
    for (const { pattern, label } of groups) {
      const match = source.match(pattern);
      if (match) hits.push(`${file}: ${label} → "${match[0].trim()}"`);
    }
  }
  return hits;
}

test("لا ضمان لدرجة حرارة في أي محتوى يراه العميل — الوعد إجراء لا نتيجة", () => {
  assert.deepEqual(scan(GUARANTEE_PATTERNS), [], "ادعاء ضمان حراري عاد إلى المحتوى");
});

test("لا صفة تفضيل غير قابلة للإثبات", () => {
  assert.deepEqual(scan(SUPERLATIVE_PATTERNS), [], "صفة تفضيل عادت إلى المحتوى");
});

test("لا ادعاء عن حجم الأسطول أو عدد السائقين في أي محتوى يراه العميل", () => {
  const hits: string[] = [];

  for (const file of CUSTOMER_FACING) {
    let source: string;
    try {
      source = readFileSync(join(root, file), "utf8");
    } catch {
      continue;
    }
    for (const { pattern, label } of FLEET_COUNT_PATTERNS) {
      const match = source.match(pattern);
      if (match) hits.push(`${file}: ${label} → "${match[0].trim()}"`);
    }
  }

  assert.deepEqual(hits, [], `ادعاءات ممنوعة عادت إلى المحتوى:\n${hits.join("\n")}`);
});

/**
 * نطاق التواصل. كان lib/company.ts يحمل qdl.sa — بقايا التسمية القديمة — بينما
 * lib/site.ts على qbl.sa، فظهر في تذييل الموقع بريد بنطاق قد لا يستقبل. الآن
 * الملفان يقرآن من lib/contact.ts، وهذا الاختبار يمنع عودة الانحراف.
 * ملاحظة: lib/prisma.ts يذكر qdl كاسم قاعدة بيانات محلية، لا كنطاق — ولذلك يُستثنى.
 */
test("لا نطاق بريد قديم في أي محتوى يراه العميل", () => {
  const hits = scan([{ pattern: /@qdl\.sa/, label: "نطاق بريد قديم" }, { pattern: /"qdl\.sa"/, label: "نطاق موقع قديم" }]);
  assert.deepEqual(hits, [], "عاد نطاق qdl.sa إلى المحتوى");
});

test("عناوين الشركة تقرأ من مصدر واحد", () => {
  const source = readFileSync(join(root, "lib/company.ts"), "utf8");
  assert.match(source, /CONTACT_EMAILS/, "company.ts يجب أن يقرأ العناوين من lib/contact.ts");
  assert.doesNotMatch(source, /@q[bd]l\.sa"/, "لا عناوين مكتوبة يدوياً في company.ts");
});
