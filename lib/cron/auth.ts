import { timingSafeEqualStrings } from "@/lib/security";

/**
 * بوابة المهام المجدولة.
 *
 * كانت مكررة حرفياً في ثلاثة مسارات، وكلها تخلط بين حالتين مختلفتين تماماً:
 * مفتاح غير مضبوط (خلل إعداد عندنا)، ومفتاح خاطئ (طلب مرفوض من الخارج).
 * الاثنتان كانتا ترجعان 401 الصامت نفسه — فبقيت المهام الثلاث معطّلة في
 * الإنتاج أياماً دون أن يظهر شيء في السجل يقول إن الخلل عندنا لا عند المهاجم.
 *
 * هنا تُفصل الحالتان: 503 مع سطر خطأ صريح للإعداد الناقص، و401 للرفض.
 */
export type CronAuthResult =
  | { ok: true }
  | { ok: false; reason: "NOT_CONFIGURED" }
  | { ok: false; reason: "UNAUTHORIZED" };

/** Vercel Cron يرسل `Authorization: Bearer $CRON_SECRET` تلقائياً متى وُجد المتغير. */
export function checkCronAuth(
  headers: Headers,
  env: { readonly [key: string]: string | undefined } = process.env,
): CronAuthResult {
  const secret = env.CRON_SECRET?.trim();
  if (!secret) return { ok: false, reason: "NOT_CONFIGURED" };

  const header = headers.get("authorization") ?? "";
  return timingSafeEqualStrings(header, `Bearer ${secret}`)
    ? { ok: true }
    : { ok: false, reason: "UNAUTHORIZED" };
}

/** حمولة الرفض — تُسجّل السبب قبل أن تعيده، فالفشل الصامت هو أصل العطل. */
export function cronAuthFailure(
  route: string,
  result: Extract<CronAuthResult, { ok: false }>,
): { status: number; body: { ok: false; error: string } } {
  if (result.reason === "NOT_CONFIGURED") {
    console.error(
      `[cron] CRON_SECRET_NOT_CONFIGURED — لم تُنفَّذ المهمة ${route}. اضبط CRON_SECRET في بيئة الإنتاج ثم أعد النشر.`,
    );
    return { status: 503, body: { ok: false, error: "CRON_SECRET_NOT_CONFIGURED" } };
  }

  console.warn(`[cron] UNAUTHORIZED — طلب مرفوض على ${route}.`);
  return { status: 401, body: { ok: false, error: "UNAUTHORIZED" } };
}
