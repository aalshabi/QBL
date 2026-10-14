import { CONTACT_DOMAIN, CONTACT_EMAILS } from "@/lib/contact";

export const company = {
  officialName: "شركة قدام بابك للخدمات اللوجستية",
  tradeName: "QADDAM BABAK Logistics",
  abbreviation: "QBL",
  sector: "التوصيل المبرّد آخر ميل Last-Mile Cold Chain",
  headquarters: "الرياض، السعودية",
  foundedYear: 2024,
  promise: "نحافظ على جودة منتجاتك حتى آخر متر: تسليم مبرّد، تتبع واضح، وإثبات استلام يقلل المخاطر على شركتك وعميلك.",
  vision: "أن نوسّع تغطية التوصيل المبرّد آخر ميل من الرياض إلى مدن أخرى في المملكة، بتشغيل موثّق وقابل للقياس.",
  mission: "تمكين الشركات من تشغيل توصيل مبرّد موثوق، قابل للقياس، ومرن مع تتبع لحظي ووضوح كامل لحالة الطلب.",
  values: ["الموثوقية", "الشفافية", "السرعة", "سلامة المنتج", "خدمة العميل"],
  website: CONTACT_DOMAIN,
  // العناوين من lib/contact.ts — مصدر واحد يمنع تكرار انحراف النطاق.
  emails: {
    general: CONTACT_EMAILS.info,
    sales: CONTACT_EMAILS.sales,
    ops: CONTACT_EMAILS.ops,
    billing: CONTACT_EMAILS.billing,
    manager: CONTACT_EMAILS.owner,
  },
  generalManager: "عبدالله إسماعيل الشعبي",
  address: "الرياض، طريق أبو عبيدة عامر بن الجراح، 4480 — 14256",
  crNumber: "1010985560",
  unifiedNumber: "7038401902",
};

export const services = [
  {
    title: "التوصيل المبرّد B2B2C",
    description: "حل آخر ميل للشركات التي تريد تسليم منتجاتها للعميل النهائي دون فقدان السيطرة على الحالة، الوقت، ودرجة الحرارة.",
  },
  {
    title: "الخطوط الثابتة Fixed Routes",
    description: "مسارات متكررة للفروع والموردين، مصممة لتقليل التكاليف وتحسين الالتزام بمواعيد الاستلام والتسليم.",
  },
  {
    title: "التوصيل عند الطلب On-Demand",
    description: "استجابة تشغيلية للذروة والطلبات العاجلة داخل الرياض، مع إمكانية الإسناد وإعادة الإسناد من لوحة العمليات.",
  },
  {
    title: "الاشتراكات المؤسسية",
    description: "سعة تشغيلية شهرية للشركات التي تحتاج شريكًا ثابتًا، تقارير أوضح، وتجربة موحدة لعملائها.",
  },
  {
    title: "اللوجستيات العكسية",
    description: "إدارة المرتجعات أو العبوات أو الاستبدال بطريقة موثقة تقلل الفوضى التشغيلية بعد التسليم.",
  },
];

export const sectors = [
  "مستودعات وشركات الفلفلمنت (3PL)",
  "علامات ومصنّعو التجميل والعناية بالبشرة والشعر",
  "علامات ومتاجر العطور",
  "متاجر Beauty الإلكترونية (سلّة، زد، Shopify)",
];

export const differentiators = [
  "تتبع حالة الطلب ومشاركة التحديثات ضمن إعدادات العميل المتعاقد",
  "رصد درجة الحرارة أثناء النقل حسب نوع المنتج والاتفاق التشغيلي",
  "تخطيط مسارات قابل للتوسع حسب حجم الطلبات والمناطق",
  "تكاملات تقنية مع الخرائط ومزودي الرسائل",
  "فريق تشغيل سعودي متخصص في التوصيل المبرّد آخر ميل",
];

export const operatingMetrics = [
  { label: "زمن التوصيل", value: "24–72 ساعة", note: "داخل الرياض عدا الجمعة والعطل الرسمية" },
  { label: "محاولات التوصيل", value: "حتى 3", note: "مع إعادة تنسيق الموعد مع العميل" },
  { label: "تحديث موقع المندوب", value: "10-15 ث", note: "عند تفعيل تتبع المندوب" },
];

export const slaHighlights = [
  {
    title: "وضوح تشغيلي من أول طلب",
    description: "كل شحنة مرتبطة بحساب العميل، مندوب، مركبة، حالة، ووقت وصول متوقع؛ حتى تعرف شركتك أين تقف كل عملية.",
  },
  {
    title: "تجربة عميل تقلل الاتصالات",
    description: "رابط تتبع مباشر يمنح العميل النهائي حالة الطلب و ETA وموقع المندوب دون الرجوع المتكرر لفريق خدمة العملاء.",
  },
  {
    title: "إثبات تسليم يقلل النزاعات",
    description: "OTP/PIN قبل إغلاق الطلب، مع سجل تدقيق للتجاوزات اليدوية وإثبات تسليم قابل للمراجعة.",
  },
  {
    title: "تنبيهات قبل أن تتحول المشكلة إلى خسارة",
    description: "مؤشرات تأخير وحرارة تساعد فريق العمليات على التدخل مبكرًا لحماية المنتج وسمعة العلامة.",
  },
];

export const caseStudies = [
  {
    title: "علامة تجميل وعناية",
    sector: "Beauty & Personal Care",
    challenge: "طلبات مباشرة للمستهلك تتأثر بحرارة النقل، مع حاجة لإثبات تسليم يقلل النزاعات.",
    solution: "توصيل محمي حرارياً بحقائب وصناديق عازلة، تتبع حالة الطلب، وكود استلام قبل الإغلاق.",
    outcome: "حماية أفضل لجودة المنتج عند التسليم ووضوح أعلى لفريق خدمة العملاء.",
  },
  {
    title: "متجر عطور إلكتروني",
    sector: "Perfume & Fragrance",
    challenge: "مجموعات عطرية وهدايا تتأثر بحرارة النقل وتحتاج مناولة حذرة وتغليفاً سليماً.",
    solution: "رحلات مخصصة حسب المنطقة ونافذة التسليم، مع التوثيق المطلوب في عقد التشغيل.",
    outcome: "تقليل احتمالات تلف العبوة وتجربة تسليم أوضح للعميل النهائي.",
  },
  {
    title: "مركز فلفلمنت 3PL",
    sector: "Fulfillment & 3PL",
    challenge: "تشغيل آخر ميل لمخزون علامات متعددة من التجميل والعناية والعطور داخل مركز واحد.",
    solution: "طبقة توصيل مبرّد تُدمج مع عمليات المركز، مع تتبع حالة لكل طلب وإثبات تسليم.",
    outcome: "رؤية تشغيلية أفضل لكل علامة ونقل مسؤولية آخر ميل بشكل موثق.",
  },
];

export const trustSignals = [
  "بيانات رسمية واضحة للشركة: سجل تجاري، رقم موحد، وعنوان",
  "قنوات بريد منفصلة للمبيعات والتشغيل والفواتير لتسهيل التعامل المؤسسي",
  "بروفايل شركة قابل للطباعة والمشاركة مع فرق المشتريات والإدارة",
  "نموذج بيانات يدعم تقارير SLA والحرارة وإثبات التسليم لاحقًا",
  "تصميم تقني جاهز للربط مع Google Maps أو Mapbox ومزود رسائل حقيقي",
];

/**
 * `latin` يعلّم العناصر المكتوبة بحروف لاتينية داخل قائمة عربية. الهوية تنصّ
 * على Montserrat للاتيني وTajawal للعربي، وبلا هذا الوسم كان اللاتيني يُرسم
 * بخط عربي — فرق يظهر في القائمة أكثر من أي مكان لأن الكلمات متجاورة.
 */
/**
 * Primary header navigation — intentionally compact (≤4 informational links
 * plus the quote CTA and the contact button, both rendered in SiteHeader).
 * Tracking is first because returning customers come for it. The longer detail
 * pages (sectors, fleet-tech, case-studies, sla, beauty-shield, company
 * profile…) stay reachable from the footer and in-page links — no page is
 * deleted, only lifted out of the top bar. The demo "النظام التشغيلي"
 * (/cold-chain-system) is deliberately kept out of the customer journey.
 */
export const marketingNav: { href: string; label: string; latin?: boolean }[] = [
  { href: "/track", label: "تتبع شحنتك" },
  { href: "/services", label: "خدماتنا" },
  { href: "/about", label: "عن QBL" },
];

/** Grouped footer links so the detail pages lifted out of the top bar stay reachable. */
export const footerServiceLinks: { href: string; label: string; latin?: boolean }[] = [
  { href: "/services", label: "خدماتنا" },
  { href: "/services/beauty-shield", label: "Beauty Shield", latin: true },
  { href: "/sectors", label: "القطاعات" },
  { href: "/fleet-tech", label: "التقنيات" },
  { href: "/track", label: "تتبع شحنة" },
];

export const statusLabels = {
  CREATED: "تم إنشاء الطلب",
  ASSIGNED: "تم إسناد المندوب",
  OUT_FOR_DELIVERY: "خرج للتسليم",
  ARRIVED: "وصل المندوب",
  DELIVERED: "تم التسليم",
  FAILED: "تعذر التسليم",
} as const;

export const courierStatusLabels = {
  AVAILABLE: "متاح",
  ON_TASK: "في مهمة",
  LATE: "متأخر",
  OFFLINE: "غير متصل",
} as const;
