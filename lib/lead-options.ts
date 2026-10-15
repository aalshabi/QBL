/**
 * قوائم تأهيل العميل المحتمل وعرضها — **بلا zod عمداً**.
 *
 * نموذج عرض السعر مكوّن عميل ("use client")، وكان يستورد القوائم من
 * lib/lead-schema.ts. ذلك الملف يبني المخطط في أعلى الوحدة، فجرّ مشغّل zod
 * كاملاً إلى حزمة /quote — ١٦ كيلوبايت مضغوطة على أهم صفحة تحويل في الموقع،
 * لا ينفّذها المتصفح أصلاً لأن التحقق كله خادمي. فصل القوائم هنا يقطع ذلك.
 *
 * القاعدة: ما يحتاجه العميل يسكن هنا. ما يحتاجه الخادم وحده يسكن في
 * lib/lead-schema.ts.
 */
export type ChoiceOption = { value: string; label: string };

/**
 * القيمة ثابتة لاتينية تُخزَّن في القاعدة؛ التسمية عربية تُعرض فقط. فصلهما يعني
 * أن تعديل الصياغة لاحقاً لا يُبطل الصفوف المحفوظة ولا يكسر أي تقرير.
 */
export const DAILY_VOLUME_OPTIONS = [
  { value: "LT_20", label: "أقل من ٢٠ طلباً يومياً" },
  { value: "V20_50", label: "٢٠–٥٠ طلباً يومياً" },
  { value: "V51_100", label: "٥١–١٠٠ طلب يومياً" },
  { value: "V101_300", label: "١٠١–٣٠٠ طلب يومياً" },
  { value: "GT_300", label: "أكثر من ٣٠٠ طلب يومياً" },
] as const satisfies readonly ChoiceOption[];

export const PLATFORM_OPTIONS = [
  { value: "SALLA", label: "سلّة" },
  { value: "ZID", label: "زد" },
  { value: "SHOPIFY", label: "Shopify" },
  { value: "WOOCOMMERCE", label: "ووكومرس / ووردبريس" },
  { value: "CUSTOM", label: "نظام خاص أو ERP" },
  { value: "NONE", label: "بدون متجر إلكتروني" },
] as const satisfies readonly ChoiceOption[];

export const COVERAGE_AREA_OPTIONS = [
  { value: "RIYADH_ALL", label: "كل الرياض" },
  { value: "RIYADH_NORTH", label: "شمال الرياض" },
  { value: "RIYADH_EAST", label: "شرق الرياض" },
  { value: "RIYADH_WEST", label: "غرب الرياض" },
  { value: "RIYADH_SOUTH", label: "جنوب الرياض" },
  { value: "RIYADH_CENTER", label: "وسط الرياض" },
] as const satisfies readonly ChoiceOption[];

/** أسماء حقول التأهيل — مصدر واحد يربط المخطط بالنموذج بالقاعدة. */
export const QUALIFICATION_FIELDS = ["dailyVolume", "platform", "coverageArea"] as const;
export type QualificationField = (typeof QUALIFICATION_FIELDS)[number];

/** التسمية العربية لقيمة مخزّنة، أو "" إذا لم تُختَر أو لم تُعرَف — للعرض فقط. */
export function choiceLabel(options: readonly ChoiceOption[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? "";
}

/**
 * عرض لوحة الإدارة. العمود نصّ حر في القاعدة لا enum، فالمخطط يحرس مسارَي
 * الكتابة وحدهما؛ أي بذرة أو استيراد أو تعديل يدوي لاحق — أو خيار سُحب من
 * القائمة بعد أن أجاب به عملاء — قد يترك قيمة لا تعرفها القائمة الحالية.
 * طيّ المجهول في «—» نفسها كان سيجعله مطابقاً لـ«الزائر لم يُجب»، فيُقرأ
 * العميل المؤهَّل على أنه غير مؤهَّل، وينكسر الانحراف بصمت أمام الشخص
 * الوحيد القادر على ملاحظته.
 */
export function choiceDisplay(options: readonly ChoiceOption[], value: string): string {
  if (!value) return "—";
  return choiceLabel(options, value) || `قيمة غير معروفة: ${value}`;
}
