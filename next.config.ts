import type { NextConfig } from "next";

/**
 * سياسة المحتوى. الإنفاذ هو الوضع الافتراضي الآن: فُحص بناء إنتاجي محلياً على
 * 16 مساراً عاماً بمتصفح فعلي، فلم تُسجَّل أي مخالفة. يُستثنى /track وحده ويبقى
 * Report-Only لأنه المسار الوحيد الذي يحمّل Google Maps JS SDK، ومفتاح المتصفح
 * مقيّد بالمرجع على نطاق QBL فتعذّر التحقق من موارد الخريطة الفرعية خارج الإنتاج.
 * ترويسة تكسر خريطة التتبع أسوأ من غياب الترويسة على مسار واحد.
 *
 * كل مخالفة — في الوضعين — تُرسَل إلى /api/csp-report وتظهر في سجلات التشغيل،
 * فيصبح رفع /track إلى الإنفاذ قراراً على بيانات لا على تقدير.
 * للتراجع الكامل: CSP_MODE=report-only في متغيرات البيئة وأعد النشر.
 *
 * unsafe-inline للسكربتات مطلوب اليوم: Next.js يبث شجرة RSC عبر سكربتات inline
 * (self.__next_f.push) ولا يوجد middleware يولّد nonce — بدونه لا تعمل الترطيب
 * ولا النماذج ولا لوحات التشغيل. وللأنماط مطلوب دائماً لأن React يكتب style={{}}
 * كخاصية inline ولا يغطيها الـ nonce.
 */
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' https://maps.googleapis.com https://maps.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https://maps.googleapis.com https://maps.gstatic.com https://*.googleapis.com https://*.gstatic.com https://*.ggpht.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://maps.googleapis.com https://maps.gstatic.com",
  "worker-src 'self' blob:",
  "child-src 'self' blob:",
  "frame-src 'self' https://www.google.com",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
  "report-uri /api/csp-report",
  "report-to csp-endpoint",
].join("; ");

// Strict-Transport-Security تضبطها منصة الاستضافة على الإنتاج، فلا تُكرَّر هنا.
const BASE_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  // strict-origin-when-cross-origin وليس no-referrer: مفتاح الخرائط المتصفحي
  // مقيّد بالمرجع، وحجب المرجع كلياً يجعل قوقل ترفض الطلب وتتعطل الخريطة.
  // وفي الوقت نفسه لا يتسرب المسار الكامل — وهو يحمل توكن التتبع في /track/[token].
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // geolocation=(self) إلزامي: تطبيق المندوب يرسل نبضات الموقع عبر watchPosition.
  {
    key: "Permissions-Policy",
    value: "geolocation=(self), camera=(), microphone=(), payment=(), usb=(), magnetometer=(), gyroscope=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
];

const REPORT_ONLY_EVERYWHERE = process.env.CSP_MODE === "report-only";

const ENFORCED = { key: "Content-Security-Policy", value: CSP };
const REPORT_ONLY = { key: "Content-Security-Policy-Report-Only", value: CSP };

/**
 * ترقية الطلبات غير الآمنة تُهمَل في الوضع التقريري، فيخسرها /track وحده. تُعاد
 * إليه كسياسة ملزمة منفصلة لا تحمل أي توجيه جلب: لا شيء فيها يمكن أن يحجب مورداً،
 * فالخريطة في مأمن، والمسار لا يفقد الترقية بانتظار فحص الإنتاج.
 */
const UPGRADE_ONLY = { key: "Content-Security-Policy", value: "upgrade-insecure-requests" };

// Reporting API الحديثة تقرأ الوجهة من هذه الترويسة؛ report-uri يبقى للمتصفحات الأقدم.
const REPORTING_ENDPOINTS = {
  key: "Reporting-Endpoints",
  value: 'csp-endpoint="/api/csp-report"',
};

const nextConfig: NextConfig = {
  async headers() {
    // في التطوير تُعطَّل: HMR يحتاج unsafe-eval وسوكت ws، و upgrade-insecure-requests
    // يكسر http://localhost.
    if (process.env.NODE_ENV !== "production") return [];

    return [
      // كل المسارات عدا /track: السياسة ملزمة.
      {
        source: "/((?!track$|track/).*)",
        headers: [...BASE_HEADERS, REPORTING_ENDPOINTS, REPORT_ONLY_EVERYWHERE ? REPORT_ONLY : ENFORCED],
      },
      // /track و /track/[token]: بلاغ بلا إنفاذ حتى يُفحص رابط تتبع حقيقي بمفتاح الإنتاج.
      { source: "/track/:path*", headers: [...BASE_HEADERS, REPORTING_ENDPOINTS, REPORT_ONLY, UPGRADE_ONLY] },
      {
        // مسارات تحمل بيانات عميل أو واجهات داخلية — تُمنع من الفهرسة على مستوى
        // الترويسة أيضاً، لا في robots.txt وحده: رابط تتبع مسرَّب يصبح دائماً في الفهرس.
        source: "/:path(api|admin|ops|courier|login|offline)/:rest*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/track/:token*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
