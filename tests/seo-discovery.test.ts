import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { PRIVATE_PATH_PREFIXES, PUBLIC_ROUTES, absoluteUrl, pageMetadata } from "@/lib/seo";
import {
  beautyShieldSchema,
  companyProfileSchema,
  contactSchema,
  homeSchema,
  organizationSchema,
} from "@/lib/structured-data";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("خريطة الموقع لا تسرّب أي مسار خاص", () => {
  for (const route of PUBLIC_ROUTES) {
    for (const prefix of PRIVATE_PATH_PREFIXES) {
      assert.ok(
        !route.path.startsWith(prefix),
        `المسار العام ${route.path} يطابق البادئة الخاصة ${prefix}`,
      );
    }
  }
  const paths = PUBLIC_ROUTES.map((r) => r.path);
  assert.equal(new Set(paths).size, paths.length, "تكرار في مسارات الخريطة");
});

test("robots يمنع مسارات بيانات العملاء والواجهات الداخلية", () => {
  const source = read("app/robots.ts");
  for (const blocked of ["/api/", "/admin", "/ops", "/courier", "/track/", "/login"]) {
    assert.ok(source.includes(`"${blocked}"`), `robots لا يمنع ${blocked}`);
  }
  assert.match(source, /sitemap:/);
});

test("كل صفحة عامة تُصدّر metadata خاصة بها", () => {
  const files: Record<string, string> = {
    "/": "app/page.tsx",
    "/about": "app/(marketing)/about/page.tsx",
    "/services": "app/(marketing)/services/page.tsx",
    "/services/beauty-shield": "app/(marketing)/services/beauty-shield/page.tsx",
    "/cold-chain-system": "app/(marketing)/cold-chain-system/page.tsx",
    "/sectors": "app/(marketing)/sectors/page.tsx",
    "/quote": "app/(marketing)/quote/page.tsx",
    "/contact": "app/(marketing)/contact/page.tsx",
    "/about-company": "app/(marketing)/company-profile/page.tsx",
    "/why-us": "app/(marketing)/why-us/page.tsx",
    "/fleet-tech": "app/(marketing)/fleet-tech/page.tsx",
    "/compliance": "app/(marketing)/compliance/page.tsx",
    "/sla": "app/(marketing)/sla/page.tsx",
    "/case-studies": "app/(marketing)/case-studies/page.tsx",
    "/en": "app/(marketing)/en/page.tsx",
    // صفحة التتبع مكوّن عميل، فالـ layout يحمل الميتا عنها.
    "/track": "app/(marketing)/track/layout.tsx",
  };
  for (const [route, file] of Object.entries(files)) {
    assert.match(read(file), /export const metadata/, `${route} بلا metadata`);
  }
});

test("الجذر يضبط metadataBase و hreflang", () => {
  const source = read("app/layout.tsx");
  assert.match(source, /metadataBase: new URL\(SITE_URL\)/);
  assert.match(source, /"ar-SA"/);
  assert.match(source, /"x-default"/);
});

test("pageMetadata يبني canonical مطلقاً و Open Graph متطابقاً", () => {
  const meta = pageMetadata({ title: "عنوان", description: "وصف", path: "/quote" });
  assert.equal(meta.alternates?.canonical, "https://qbl.sa/quote");
  assert.equal(absoluteUrl("/quote"), "https://qbl.sa/quote");
  const og = meta.openGraph as { title?: string; url?: string };
  assert.equal(og.title, "عنوان");
  assert.equal(og.url, "https://qbl.sa/quote");
});

test("السكيما لا تحمل أي ادعاء ممنوع ولا رقماً خارج السجل", () => {
  const serialized = JSON.stringify([
    homeSchema,
    companyProfileSchema,
    contactSchema,
    beautyShieldSchema,
    organizationSchema,
  ]);
  for (const forbidden of [
    "aggregateRating",
    "ratingValue",
    "reviewCount",
    "priceRange",
    "offers",
    "numberOfEmployees",
    "award",
    "certification",
  ]) {
    assert.ok(!serialized.includes(forbidden), `السكيما تحتوي حقلاً ممنوعاً: ${forbidden}`);
  }
  assert.ok(serialized.includes("1010985560"), "السجل التجاري مفقود من السكيما");
  assert.ok(serialized.includes("الرياض"), "نطاق الخدمة مفقود");
});

test("ترويسات الأمان لا تكسر الخريطة ولا تتبع المندوب", () => {
  const source = read("next.config.ts");
  assert.match(source, /geolocation=\(self\)/, "حجب geolocation يعطّل تتبع المندوب");
  assert.match(source, /strict-origin-when-cross-origin/, "no-referrer يعطّل مفتاح الخرائط المقيّد بالمرجع");
  assert.ok(!source.includes("Cross-Origin-Embedder-Policy"), "COEP يكسر خرائط قوقل");
  assert.match(source, /maps\.googleapis\.com/);
  assert.match(source, /maps\.gstatic\.com/, "غياب gstatic يكسر تحميل الخريطة بصمت");
  assert.match(source, /X-Content-Type-Options/);
  assert.match(source, /X-Robots-Tag/);
  assert.match(source, /process\.env\.NODE_ENV !== "production"/, "الترويسات يجب أن تُعطَّل في التطوير");
});
