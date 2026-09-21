import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { OG_IMAGE, PUBLIC_ROUTES, pageMetadata } from "@/lib/seo";

/**
 * صورة المشاركة وروابط الاكتشاف.
 * لم تكن أي صفحة تحمل og:image: كل رابط يُرسَل على واتساب أو لينكدإن يظهر
 * بلا صورة، وهي أول ما يراه المستلم. وأربع صفحات كانت في sitemap بلا رابط
 * داخلي واحد — مُعلنة للزاحف ومعزولة عن الزائر.
 */

const root = fileURLToPath(new URL("../", import.meta.url));
const read = (path: string) => readFileSync(join(root, path), "utf8");

test("كل صفحة مبنية بـ pageMetadata تحمل صورة مشاركة مطلقة", () => {
  const meta = pageMetadata({ title: "عنوان", description: "وصف", path: "/quote" });
  const og = meta.openGraph as { images?: { url: string }[] };

  assert.ok(og.images?.length, "openGraph بلا صورة");
  assert.equal(og.images[0].url, "https://qbl.sa/opengraph-image");
  assert.ok(og.images[0].url.startsWith("https://"), "الزواحف لا تقبل مساراً نسبياً");

  const twitter = meta.twitter as { images?: string[] };
  assert.ok(twitter.images?.length, "بطاقة تويتر بلا صورة");
});

test("أبعاد الصورة هي المقاس الذي تقرأه الشبكات", () => {
  assert.equal(OG_IMAGE.width, 1200);
  assert.equal(OG_IMAGE.height, 630);
  assert.ok(OG_IMAGE.alt.length > 0, "نص بديل مطلوب");
});

test("الصفحات التي تكتب metadata بيدها لا تُنسى بلا صورة", () => {
  for (const file of [
    "app/(marketing)/services/beauty-shield/page.tsx",
    "app/(marketing)/cold-chain-system/page.tsx",
  ]) {
    const source = read(file);
    assert.match(source, /openGraph: \{\s*\n\s*images: \[OG_IMAGE\]/, `${file} بلا صورة مشاركة`);
  }
});

test("مولّد الصورة موجود ويقرأ خطه من المستودع لا من الشبكة", () => {
  const source = read("app/opengraph-image.tsx");
  assert.match(source, /assets\/fonts\/Tajawal-Bold\.ttf/);
  assert.ok(!/fonts\.gstatic\.com|fetch\(/.test(source), "جلب خط وقت التوليد يجعل الصورة رهينة الشبكة");
  assert.ok(statSync(join(root, "assets/fonts/Tajawal-Bold.ttf")).size > 10_000, "ملف الخط مفقود أو فارغ");
});

/** كل مسار في sitemap يجب أن يصله رابط داخلي واحد على الأقل. */
function collectTsx(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(join(root, dir))) {
    const rel = join(dir, entry);
    if (entry === "generated" || entry === "node_modules") continue;
    if (statSync(join(root, rel)).isDirectory()) collectTsx(rel, acc);
    else if (/\.tsx$/.test(entry)) acc.push(rel);
  }
  return acc;
}

test("لا صفحة في sitemap بلا رابط داخلي يصل إليها", () => {
  // قوائم التنقل تعيش في ملفات بيانات .ts لا في المكوّنات، فلا يكفي مسح .tsx.
  const sources = [...collectTsx("app"), ...collectTsx("components"), "lib/site.ts", "lib/company.ts"]
    .map((file) => read(file))
    .join("\n");

  const orphans = PUBLIC_ROUTES.map((route) => route.path)
    .filter((path) => path !== "/")
    .filter((path) => !sources.includes(`"${path}"`) && !sources.includes(`href="${path}"`));

  assert.deepEqual(orphans, [], `صفحات معلنة بلا رابط داخلي:\n${orphans.join("\n")}`);
});

test("عنوان الصفحة ووصفها ضمن ما يعرضه محرك البحث", () => {
  for (const file of [
    "app/(marketing)/services/beauty-shield/page.tsx",
    "app/(marketing)/cold-chain-system/page.tsx",
  ]) {
    const source = read(file);
    const title = source.match(/^\s*title: "([^"]+)"/m)?.[1] ?? "";
    assert.ok(title.length > 0 && title.length <= 65, `${file}: طول العنوان ${title.length}`);
  }
});

/**
 * الميتا تصف ما على الصفحة. حين أُعيد توجيه القطاعات بقيت أوصاف الصفحات تسرد
 * القطاعات القديمة — ومنها الصيدليات والمستوصفات، وهو بالضبط ادعاء القدرة
 * الذي حُذف من المحتوى. وصف يَعِد بما لا تقدمه الصفحة يضلّل الزائر ومحرك
 * البحث معاً، ويعيد ادعاءً حُذف من الباب الخلفي.
 */
test("أوصاف الصفحات لا تعِد بقطاعات لم تعد تُخدَم", () => {
  const retired = ["الصيدليات", "المستوصفات", "المستشفيات", "موردو الأغذية", "الموردين الغذائيين"];
  const surfaces = [
    "app/page.tsx",
    "app/layout.tsx",
    "app/(marketing)/sectors/page.tsx",
    "app/(marketing)/case-studies/page.tsx",
  ];

  const hits: string[] = [];
  for (const file of surfaces) {
    const source = read(file);
    for (const term of retired) {
      if (source.includes(term)) hits.push(`${file}: ${term}`);
    }
  }

  assert.deepEqual(hits, [], `قطاع محذوف عاد في وصف صفحة:\n${hits.join("\n")}`);
});

test("وصف صفحة القطاعات يذكر القطاعات المخدومة فعلاً", () => {
  const source = read("app/(marketing)/sectors/page.tsx");
  for (const sector of ["الفلفلمنت", "التجميل", "العطور"]) {
    assert.ok(source.includes(sector), `وصف الصفحة لا يذكر ${sector}`);
  }
});
