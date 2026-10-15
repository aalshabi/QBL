import { z } from "zod";
import {
  COVERAGE_AREA_OPTIONS,
  DAILY_VOLUME_OPTIONS,
  PLATFORM_OPTIONS,
  type ChoiceOption,
} from "@/lib/lead-options";

// القوائم والعرض في lib/lead-options.ts — وحدة بلا zod، حتى لا يجرّ النموذج
// (مكوّن عميل) مشغّل zod إلى حزمة /quote. يُعاد تصديرها هنا للقارئ الخادمي.
export {
  COVERAGE_AREA_OPTIONS,
  DAILY_VOLUME_OPTIONS,
  PLATFORM_OPTIONS,
  QUALIFICATION_FIELDS,
  choiceDisplay,
  choiceLabel,
  type ChoiceOption,
  type QualificationField,
} from "@/lib/lead-options";

/**
 * حقل تأهيل اختياري مقيَّد بقائمته، ويتدهور بلطف.
 *
 * التقييد ليس تجميلاً: المسار /api/quote عام بلا مصادقة، فحقل نصّي حر إضافي
 * يعني عموداً يقبل أي شيء من أي مُرسِل.
 *
 * و catch("") ليست تساهلاً: بدونها كانت قيمة واحدة غير معروفة في حقل
 * **اختياري** تُسقط الطلب كله — أربعة حقول إلزامية صحيحة ورسالة العميل تُرمى،
 * ويُعاد 422 بلا بيان أي حقل. ويكفي لذلك أن نسحب خياراً من القائمة بينما
 * صفحة زائر مفتوحة بحزمة قديمة. فقدان إجابة اختيارية مقبول؛ فقدان عميل لا.
 * المخزَّن يبقى مقيَّداً: لا شيء يصل العمود إلا "" أو قيمة من القائمة.
 */
function optionalChoice(options: readonly ChoiceOption[]) {
  const values = ["", ...options.map((option) => option.value)] as [string, ...string[]];
  return z.enum(values).optional().default("").catch("");
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
  // حدّ أعلى لحقلي السطر الواحد: كلاهما يدخل بريداً صادراً — والمنشأة تدخل
  // سطر الموضوع — وبلا حدّ يحمل طلب واحد عشرات الكيلوبايتات إلى صندوق المبيعات.
  name: z.string().trim().min(2).max(120),
  company: z.string().trim().min(2).max(160),
  email: z.string().trim().email(),
  phone: z.string().trim().min(8),
  message: z.string().trim().max(2000).optional().default(""),
  dailyVolume: optionalChoice(DAILY_VOLUME_OPTIONS),
  platform: optionalChoice(PLATFORM_OPTIONS),
  coverageArea: optionalChoice(COVERAGE_AREA_OPTIONS),
});

export type LeadInput = z.infer<typeof leadSchema>;
