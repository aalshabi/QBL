// عناوين التواصل الرسمية — وحدة نقية بلا أي استيراد واجهة، حتى تُقرأ من الخادم
// ومن الاختبارات دون جرّ مكونات React أو أيقونات. lib/site.ts يعيد تصديرها.

export const CONTACT_EMAILS = {
  info: "info@qbl.sa",
  sales: "sales@qbl.sa",
  ops: "ops@qbl.sa",
  support: "support@qbl.sa",
  billing: "billing@qbl.sa",
  owner: "abdullah@qbl.sa",
} as const;

export const CONTACT_DOMAIN = "qbl.sa";
