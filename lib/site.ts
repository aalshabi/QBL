export const SITE = {
  brand: "QBL",
  brandAr: "قدام بابك",
  brandFull: "QBL — Qaddam Babak Logistics",
  brandLong: "شركة قدام بابك للخدمات اللوجستية",
  brandLongEn: "Qaddam Babak Logistics",
  domain: "qbl.sa",
  domainDisplay: "QBL.SA",
  city: "الرياض",
  cr: "1010985560",
  // العنوان الوطني الرسمي (إثبات عنوان — العنوان الوطني السعودي).
  address: "حي السعادة، طريق أبي عبيدة عامر بن الجراح، مبنى 4480، الرياض 14256",
  district: "حي السعادة",
  buildingNo: "4480",
  secondaryNo: "6809",
  postalCode: "14256",
  shortAddress: "RQAB4480",
  phone: "+966 55 632 0555",
  emails: {
    // بريد معتمد واحد عبر الموقع (ملحق التنفيذ).
    info: "info@qbl.sa",
  },
};

// روابط أنظمة التشغيل الخارجية (LogesTechs) — دخول الشركاء/المتاجر وتطبيقات الجوال.
export const PARTNER_LOGIN = {
  admin: "https://admin-pro.logestechs.com/qbl-logistics/login",
  merchant: "https://qbl-logistics.logestechs.com/login",
};

export const APPS = {
  driver: {
    ios: "https://apps.apple.com/il/app/logestechs-driver/id1547993047",
    android: "https://play.google.com/store/apps/details?id=com.logestechs.driver",
    huawei: "https://appgallery.huawei.com/app/C111164171",
  },
  customer: {
    ios: "https://apps.apple.com/il/app/logestechs-customer/id1547994390",
    android: "https://play.google.com/store/apps/details?id=com.logestechs.customer_multiCustomer",
    huawei: "https://appgallery.huawei.com/app/C111182423",
  },
};

export const NAV_ITEMS = [
  { href: "/beauty-shield", label: "Beauty Shield" },
  { href: "/why-protection", label: "لماذا الحماية الحرارية" },
  { href: "/protection-levels", label: "مستويات الحماية" },
  { href: "/sectors", label: "القطاعات" },
  { href: "/how-it-works", label: "طريقة العمل" },
  { href: "/faq", label: "الأسئلة الشائعة" },
  { href: "/about", label: "من نحن" },
];

// روابط الفوتر — تشمل صفحات المحتوى + مدخل النظام التشغيلي والتتبع (يبقى النظام كما هو).
export const FOOTER_LINKS = [
  { href: "/company-profile", label: "بروفايل الشركة" },
  { href: "/beauty-shield", label: "Beauty Shield" },
  { href: "/protection-levels", label: "مستويات الحماية" },
  { href: "/how-it-works", label: "طريقة العمل" },
  { href: "/quality", label: "الجودة والاستعداد التنظيمي" },
  { href: "/sectors", label: "القطاعات" },
  { href: "/faq", label: "الأسئلة الشائعة" },
  { href: "/cold-chain-system", label: "النظام التشغيلي" },
  { href: "/track", label: "تتبع شحنة" },
];
