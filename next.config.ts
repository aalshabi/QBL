import type { NextConfig } from "next";

/**
 * سياسة المحتوى. تُشحن أول دورة في وضع Report-Only عمداً: مفتاح خرائط المتصفح
 * مقيّد بالمرجع على نطاق QBL، فلا يمكن التحقق من تحميل الخريطة تحت السياسة من
 * بيئة التطوير. ترويسة تكسر خريطة التتبع أسوأ من غياب الترويسة. بعد فتح /track
 * على الإنتاج بمفتاح فعلي وقراءة أي مخالفة في الكونسول، يُحوَّل الاسم إلى
 * Content-Security-Policy ويصبح ملزماً.
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

/**
 * اسم ترويسة السياسة. الافتراض Report-Only حتى تُفحص الخريطة الحية على الإنتاج.
 * للتحويل إلى الإلزام: اضبط CSP_MODE=enforce في متغيرات البيئة وأعد النشر —
 * بلا تعديل كود، وبتراجع فوري بإزالة المتغيّر.
 */
const CSP_HEADER_NAME =
  process.env.CSP_MODE === "enforce" ? "Content-Security-Policy" : "Content-Security-Policy-Report-Only";

const nextConfig: NextConfig = {
  async headers() {
    // في التطوير تُعطَّل: HMR يحتاج unsafe-eval وسوكت ws، و upgrade-insecure-requests
    // يكسر http://localhost.
    if (process.env.NODE_ENV !== "production") return [];

    return [
      { source: "/:path*", headers: [...BASE_HEADERS, { key: CSP_HEADER_NAME, value: CSP }] },
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
