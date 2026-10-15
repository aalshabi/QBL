import { z } from "zod";

/**
 * خيارات التأهيل — مصدر واحد يغذّي المخطط والنموذج وبريد التنبيه ولوحة الإدارة.
 * القيمة ثابتة لاتينية تُخزَّن في القاعدة؛ التسمية عربية تُعرض فقط. فصلهما يعني
 * أن تعديل الصياغة لاحقاً لا يُبطل الصفوف المحفوظة ولا يكسر أي تقرير.
 */
export type ChoiceOption = { value: string; label: string };

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

/**
 * حقل تأهيل اختياري مقيَّد بقائمته.
 *
 * التقييد ليس تجميلاً: المسار `/api/quote` عام بلا مصادقة، فحقل نصّي حر إضافي
 * يعني عموداً يقبل أي شيء من أي مُرسِل. والقيمة الفارغة مقبولة صراحة لأن
 * `<select>` بلا اختيار يرسل "" لا غياباً.
 */
function optionalChoice(options: readonly ChoiceOption[]) {
  const values = ["", ...options.map((option) => option.value)] as [string, ...string[]];
  return z.enum(values).optional().default("");
}

/** التسمية العربية لقيمة مخزّنة، أو "" إذا لم تُختَر — للعرض فقط. */
export function choiceLabel(options: readonly ChoiceOption[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? "";
}

/**
 * مخطط طلب عرض السعر — مصدر واحد.
 *
 * كان مكرراً حرفياً في lib/actions.ts وapp/api/quote/route.ts، وهذا يعني أن
 * تخفيف حقل في أحدهما يترك الآخر يرفض الطلب نفسه. النموذج والمسار يقرآن من هنا،
 * وكذلك lib/leads.ts وlib/notifications/lead-alert.ts يشتقّان أنواعهما منه.
 *
 * حقول التأهيل الثلاثة اختيارية عمداً، كـ«ما الذي تحتاجه شركتك؟»: كل حقل إلزامي
 * إضافي عند آخر خطوة يخفض إتمام الطلب، والمعلومة الناقصة تُستدرك في أول مكالمة.
 * الغياب يُخزَّن نصاً فارغاً لا null، لأن أعمدة القاعدة غير قابلة للإفراغ.
 */
export const leadSchema = z.object({
  name: z.string().trim().min(2),
  company: z.string().trim().min(2),
  email: z.string().trim().email(),
  phone: z.string().trim().min(8),
  message: z.string().trim().max(2000).optional().default(""),
  dailyVolume: optionalChoice(DAILY_VOLUME_OPTIONS),
  platform: optionalChoice(PLATFORM_OPTIONS),
  coverageArea: optionalChoice(COVERAGE_AREA_OPTIONS),
});

export type LeadInput = z.infer<typeof leadSchema>;
