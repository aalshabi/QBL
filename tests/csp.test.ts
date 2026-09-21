import assert from "node:assert/strict";
import { test } from "node:test";
import { GET, POST } from "../app/api/csp-report/route";
import nextConfig from "../next.config";

/**
 * سياسة المحتوى ومستقبِل بلاغاتها.
 * الإنفاذ عام، ويُستثنى /track وحده لأنه يحمّل Google Maps JS SDK ولم يُفحص بمفتاح
 * الإنتاج. الخطر في التوجيه ليس الحجب بل التسرب: تعبير الاستثناء إن أخطأ يترك
 * مسارات بلا سياسة إطلاقاً. هذه الاختبارات تثبّت الاثنين.
 */

function report(body: string, ip = "203.0.113.1", type = "application/csp-report") {
  return new Request("https://qbl.sa/api/csp-report", {
    method: "POST",
    headers: { "Content-Type": type, "X-Forwarded-For": ip },
    body,
  });
}

const VALID = JSON.stringify({
  "csp-report": {
    "document-uri": "https://qbl.sa/quote",
    "effective-directive": "script-src",
    "blocked-uri": "https://evil.example/x.js",
  },
});

test("بلاغ صالح يُقبل بلا محتوى", async () => {
  const response = await POST(report(VALID));
  assert.equal(response.status, 204);
});

test("بلاغ Reporting API كمصفوفة يُقبل", async () => {
  const body = JSON.stringify([{ type: "csp-violation", body: { "effective-directive": "img-src" } }]);
  assert.equal((await POST(report(body, "203.0.113.2", "application/reports+json"))).status, 204);
});

test("جسم غير صالح يُرفض بلا استثناء", async () => {
  assert.equal((await POST(report("not-json", "203.0.113.3"))).status, 400);
});

test("بلاغ أكبر من السقف يُرفض قبل التحليل", async () => {
  const huge = JSON.stringify({ "csp-report": { "blocked-uri": "a".repeat(20_000) } });
  assert.equal((await POST(report(huge, "203.0.113.4"))).status, 413);
});

test("GET غير مسموح — البلاغ يصل بـ POST وحده", async () => {
  const response = await GET();
  assert.equal(response.status, 405);
  assert.equal(response.headers.get("Allow"), "POST");
});

test("المسار العام محدود المعدل لكل IP", async () => {
  const ip = "203.0.113.9";
  const codes: number[] = [];
  for (let i = 0; i < 22; i += 1) codes.push((await POST(report(VALID, ip))).status);
  assert.equal(codes.filter((code) => code === 204).length, 20, "يجب قبول 20 بلاغاً في النافذة");
  assert.ok(codes.includes(429), "يجب رفض ما بعد الحد");
});

async function productionHeaders() {
  const previous = process.env.NODE_ENV;
  Object.defineProperty(process.env, "NODE_ENV", { value: "production", configurable: true, writable: true, enumerable: true });
  try {
    return await nextConfig.headers!();
  } finally {
    Object.defineProperty(process.env, "NODE_ENV", { value: previous, configurable: true, writable: true, enumerable: true });
  }
}

test("لا مسار بلا سياسة محتوى، و/track وحده تقريري", async () => {
  const rules = await productionHeaders();
  const names = (source: string) =>
    rules
      .filter((rule) => rule.source === source)
      .flatMap((rule) => rule.headers.map((header) => header.key));

  const general = names("/((?!track$|track/).*)");
  assert.ok(general.includes("Content-Security-Policy"), "السياسة العامة يجب أن تكون ملزمة");
  assert.ok(!general.includes("Content-Security-Policy-Report-Only"), "لا ازدواج في وضع السياسة العامة");

  const track = names("/track/:path*");
  assert.ok(track.includes("Content-Security-Policy-Report-Only"), "/track يبقى تقريرياً");

  for (const source of ["/((?!track$|track/).*)", "/track/:path*"]) {
    assert.ok(names(source).includes("Reporting-Endpoints"), `${source} بلا وجهة بلاغات`);
  }
});

test("كل سياسة تحمل وجهة بلاغ — وإلا فالوضع التقريري بلا قيمة", async () => {
  const rules = await productionHeaders();
  const policies = rules
    .flatMap((rule) => rule.headers)
    .filter((header) => header.key.startsWith("Content-Security-Policy") && header.value.includes("default-src"));

  assert.ok(policies.length > 0, "لم يُعثر على سياسة محتوى");
  for (const policy of policies) {
    assert.match(policy.value, /report-uri \/api\/csp-report/, "سياسة بلا report-uri");
    assert.match(policy.value, /report-to csp-endpoint/, "سياسة بلا report-to");
  }
});

test("/track يحتفظ بترقية الطلبات غير الآمنة رغم الوضع التقريري", async () => {
  const rules = await productionHeaders();
  const track = rules.filter((rule) => rule.source === "/track/:path*").flatMap((rule) => rule.headers);
  const enforced = track.find((header) => header.key === "Content-Security-Policy");

  assert.ok(enforced, "/track بلا سياسة ملزمة لترقية الاتصال");
  assert.equal(enforced.value, "upgrade-insecure-requests");
  assert.ok(!enforced.value.includes("src"), "السياسة الملزمة على /track يجب ألا تحمل أي توجيه جلب");
});
