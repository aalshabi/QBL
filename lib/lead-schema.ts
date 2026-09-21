import { z } from "zod";

/**
 * مخطط طلب عرض السعر — مصدر واحد.
 *
 * كان مكرراً حرفياً في lib/actions.ts وapp/api/quote/route.ts، وهذا يعني أن
 * تخفيف حقل في أحدهما يترك الآخر يرفض الطلب نفسه. النموذج والمسار يقرآن من هنا.
 *
 * «ما الذي تحتاجه شركتك؟» اختياري: كل حقل إلزامي إضافي عند آخر خطوة يخفض
 * إتمام الطلب، والمعلومة الناقصة تُستدرك في أول مكالمة. عمود message في
 * القاعدة غير قابل للإفراغ، فالغياب يُخزَّن نصاً فارغاً لا null.
 */
export const leadSchema = z.object({
  name: z.string().trim().min(2),
  company: z.string().trim().min(2),
  email: z.string().trim().email(),
  phone: z.string().trim().min(8),
  message: z.string().trim().max(2000).optional().default(""),
});

export type LeadInput = z.infer<typeof leadSchema>;
