import {
  Building2,
  ClipboardCheck,
  Factory,
  FileCheck,
  MapPinned,
  PackageCheck,
  Pill,
  Route,
  ShieldCheck,
  ShoppingBag,
  Snowflake,
  Sparkles,
  Store,
  Thermometer,
  Truck,
  Utensils,
  Warehouse,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

export const SITE = {
  brand: "QBL",
  brandAr: "قدام بابك",
  brandFull: "QBL — Qaddam Babak Logistics",
  brandLong: "شركة قدام بابك للخدمات اللوجستية",
  brandLongEn: "Qaddam Babak Logistics",
  domain: "qbl.sa",
  domainDisplay: "QBL.SA",
  taglineAr: "مبرد. مضبوط. قدام بابك.",
  taglineEn: "Precision at every degree. Care at every step.",
  lockupTaglineEn: "Refrigerated. Reliable. Right to your doorstep.",
  city: "الرياض",
  cr: "1010985560",
  unifiedNo: "7038401902",
  address: "الرياض، طريق أبو عبيدة عامر بن الجراح، 4480",
  postalCode: "14256",
  phone: "+966 55 632 0555",
  emails: {
    info: "info@qbl.sa",
    sales: "sales@qbl.sa",
    ops: "ops@qbl.sa",
    support: "support@qbl.sa",
    billing: "billing@qbl.sa",
    owner: "abdullah@qbl.sa",
  },
};

export const NAV_ITEMS = [
  { href: "/", label: "الرئيسية" },
  { href: "/about", label: "من نحن" },
  { href: "/services", label: "الخدمات" },
  { href: "/services/beauty-shield", label: "Beauty Shield" },
  { href: "/sectors", label: "القطاعات" },
  { href: "/fleet-tech", label: "التقنية والتشغيل" },
  { href: "/cold-chain-system", label: "النظام التشغيلي" },
];

export const WHY_QBL = [
  {
    icon: Thermometer,
    title: "سلسلة تبريد منضبطة",
    desc: "تشغيل مبني على حساسية المنتج، نطاق الحرارة المطلوب، ومدة الرحلة داخل المدينة.",
  },
  {
    icon: FileCheck,
    title: "وضوح في التسليم",
    desc: "إجراءات تسليم واضحة، توثيق عند الحاجة، وتواصل منظم يقلل الالتباس بين الأطراف.",
  },
  {
    icon: ShieldCheck,
    title: "مناسب للمنتجات الحساسة",
    desc: "تعامل تشغيلي حذر مع الأغذية الطازجة، المجمدات، المستحضرات، وطلبات الأعمال.",
  },
  {
    icon: Route,
    title: "جاهزية للتوسع",
    desc: "تصميم تشغيل قابل للتكرار حسب المناطق، النوافذ الزمنية، وحجم الطلبات.",
  },
];

export type ServiceItem = {
  icon: LucideIcon;
  title: string;
  desc: string;
  href?: string;
  cta?: string;
};

export const SERVICES: ServiceItem[] = [
  {
    icon: Sparkles,
    title: "توصيل منتجات التجميل والعناية بدرجة حرارة محمية",
    desc: "خدمة مخصصة لحماية منتجات العناية والتجميل من حرارة الجو أثناء النقل، باستخدام حقائب وصناديق عازلة، سيارة مكيفة، وتوثيق واضح من الاستلام حتى التسليم.",
    href: "/services/beauty-shield",
    cta: "اطلب تجربة Beauty Shield",
  },
  {
    icon: Truck,
    title: "التوصيل المبرّد B2B2C",
    desc: "تسليم مبرد من المورد أو المستودع إلى عميلك النهائي ضمن نموذج تشغيلي واضح.",
  },
  {
    icon: Snowflake,
    title: "توصيل الأغذية الطازجة",
    desc: "مناسب للألبان، المنتجات الطازجة، المخبوزات الحساسة، والمنتجات التي تتطلب عناية حرارية.",
  },
  {
    icon: Thermometer,
    title: "توصيل المجمدات",
    desc: "رحلات مخصصة للمنتجات المجمدة حسب المتطلبات التشغيلية ونطاق الحرارة المتفق عليه.",
  },
  {
    icon: Pill,
    title: "الصيدليات والمنتجات الحساسة",
    desc: "تسليم منظم للمنتجات الحساسة للحرارة دون ادعاء شهادات غير موثقة.",
  },
  {
    icon: Warehouse,
    title: "توزيع داخل المدينة",
    desc: "مسارات داخل الرياض بين المستودعات، الفروع، نقاط البيع، والعملاء النهائيين.",
  },
  {
    icon: ClipboardCheck,
    title: "رحلات مخصصة حسب الحاجة",
    desc: "رحلات تشغيلية مصممة حول حجم الطلب، نقاط التسليم، ومستوى التوثيق المطلوب.",
  },
];

export const PROCESS = [
  {
    step: "01",
    icon: PackageCheck,
    title: "استلام",
    desc: "تحديد المنتج، نقطة الاستلام، نافذة الوقت، ومتطلبات المناولة قبل التحميل.",
  },
  {
    step: "02",
    icon: Truck,
    title: "تشغيل",
    desc: "تجهيز المركبة والمسار وتعليمات التسليم حسب طبيعة الشحنة.",
  },
  {
    step: "03",
    icon: MapPinned,
    title: "تنسيق",
    desc: "متابعة حالة الرحلة والتواصل مع الأطراف المعنية عند الحاجة.",
  },
  {
    step: "04",
    icon: FileCheck,
    title: "تسليم موثق",
    desc: "إغلاق التسليم بإثبات مناسب مثل توقيع، صورة، أو رمز استلام عند تفعيل ذلك.",
  },
];

export const SECTORS = [
  { icon: Factory, title: "الموردون الغذائيون", desc: "توريد منظم للمنتجات المبردة من المورد إلى الفروع أو العملاء." },
  { icon: Utensils, title: "المطاعم والمطابخ المركزية", desc: "ربط المطابخ، الفروع، ونقاط التوزيع ضمن نوافذ تشغيل واضحة." },
  { icon: Store, title: "متاجر التجزئة", desc: "تجديد المخزون المبرد والمجمد داخل المدينة بجدولة يمكن الاعتماد عليها." },
  { icon: Pill, title: "الصيدليات", desc: "تسليم المنتجات الحساسة للحرارة بإجراءات مناولة وتوثيق منظمة." },
  { icon: ShoppingBag, title: "التجارة الإلكترونية", desc: "تجربة تسليم مبردة مناسبة للعلامات التي تبيع مباشرة للمستهلك." },
  { icon: Building2, title: "الضيافة", desc: "دعم الفنادق والمرافق التي تحتاج توريداً مبرداً منضبطاً ومتكرراً." },
];

export const OPERATIONS = [
  {
    title: "جاهزية الأسطول المبرّد",
    desc: "مركبات مهيأة للرحلات المبردة وفق طبيعة المنتج، مع فحص تشغيلي قبل الانطلاق.",
  },
  {
    title: "منطق الإرسال والتنسيق",
    desc: "تخصيص الرحلات حسب المنطقة، نافذة التسليم، ونوع المنتج بدلاً من التعامل العشوائي مع الطلبات.",
  },
  {
    title: "تأكيد التسليم",
    desc: "توثيق التسليم يحدد حسب عقد التشغيل: توقيع، صورة، رمز استلام، أو تقرير نهاية رحلة.",
  },
  {
    title: "رؤية تشغيلية عند التفعيل",
    desc: "تتبّع الحالة ومشاركة التحديثات متاحان ضمن إعدادات العميل المتعاقد، وليس كخريطة عامة وهمية.",
  },
];

export const QUALITY_POINTS = [
  "فصل واضح بين تعليمات الاستلام، التحميل، النقل، والتسليم.",
  "مناولة تراعي المنتجات الحساسة للحرارة دون فتحات غير ضرورية أو تأخير غير مبرر.",
  "تحديد نطاق الحرارة والتوثيق المطلوب قبل التشغيل، حسب نوع المنتج والاتفاق.",
  "تصعيد تشغيلي عند وجود تأخير، رفض استلام، أو تغيير في نقطة التسليم.",
  "تقارير وإثباتات تسليم متاحة للعملاء المتعاقدين حسب نطاق الخدمة.",
];
