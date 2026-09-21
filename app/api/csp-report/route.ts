import { acquireRatePermit } from "@/lib/logestechs/request-security";

/**
 * مستقبِل بلاغات انتهاك سياسة المحتوى.
 *
 * بدونه كان وضع Report-Only بلا قيمة: المتصفح يطبع المخالفة في كونسول الزائر
 * وحده، فلا تصل إلينا أبداً، ولا يوجد ما يُبنى عليه قرار الإنفاذ. الآن يرسل
 * المتصفح كل مخالفة إلى هنا، وتظهر في سجلات التشغيل على المنصة.
 *
 * المسار عام بالضرورة — المتصفح يرسل البلاغ بلا جلسة — فيُعامَل كأي مدخل غير
 * موثوق: حدّ معدل لكل IP، سقف حجم، ولا تخزين ولا صدى للمحتوى في الاستجابة.
 */

const MAX_REPORT_BYTES = 16 * 1024;

// حقول تقرير CSP القياسية فقط. أي حقل آخر يصل من المتصفح يُهمل بدل تسجيله كما هو.
const REPORTED_FIELDS = [
  "document-uri",
  "violated-directive",
  "effective-directive",
  "blocked-uri",
  "disposition",
  "status-code",
  "line-number",
  "source-file",
] as const;

function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function summarize(body: unknown): Record<string, unknown> | null {
  if (!body || typeof body !== "object") return null;
  const report = (body as Record<string, unknown>)["csp-report"] ?? body;
  if (!report || typeof report !== "object") return null;

  const source = report as Record<string, unknown>;
  const summary: Record<string, unknown> = {};
  for (const field of REPORTED_FIELDS) {
    const value = source[field];
    if (typeof value === "string") summary[field] = value.slice(0, 300);
    else if (typeof value === "number") summary[field] = value;
  }
  return Object.keys(summary).length > 0 ? summary : null;
}

export async function POST(request: Request) {
  const permit = acquireRatePermit(`csp-report:ip:${clientIp(request)}`, 20, 4);
  if (!permit.ok) return new Response(null, { status: 429, headers: { "Retry-After": String(permit.retryAfterSeconds) } });

  try {
    const raw = await request.text();
    if (raw.length > MAX_REPORT_BYTES) return new Response(null, { status: 413 });

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return new Response(null, { status: 400 });
    }

    // تقرير Reporting API يصل كمصفوفة؛ تقرير report-uri القديم كائن واحد.
    const entries = Array.isArray(parsed) ? parsed : [parsed];
    for (const entry of entries.slice(0, 10)) {
      const summary = summarize(
        entry && typeof entry === "object" && "body" in (entry as Record<string, unknown>)
          ? (entry as Record<string, unknown>).body
          : entry,
      );
      if (summary) console.warn("[csp-violation]", JSON.stringify(summary));
    }

    return new Response(null, { status: 204 });
  } finally {
    permit.release();
  }
}

// أي فعل آخر على المسار لا معنى له: البلاغ يصل بـ POST وحده.
export async function GET() {
  return new Response(null, { status: 405, headers: { Allow: "POST" } });
}
