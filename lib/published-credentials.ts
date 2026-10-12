import { createHash } from "node:crypto";

/**
 * بصمات SHA-256 لكلمات المرور المكتوبة نصًا في `prisma/seed.ts`.
 *
 * المستودع عام، فهذه الكلمات معروفة لكل من قرأه. أي حساب على الإنتاج ما زال يحملها
 * (حساب مدير العمليات الافتراضي أو حسابات المناديب إن شُغّل seed هناك) هو باب مفتوح،
 * لذلك يُرفض الدخول بها في الإنتاج أيًا كانت حالة القاعدة.
 *
 * تُحفظ البصمات لا الكلمات، و`tests/published-credentials.test.ts` يقرأ seed.ts ويفشل
 * إن أُضيفت كلمة مرور فيه دون بصمتها هنا.
 */
export const PUBLISHED_SEED_PASSWORD_SHA256: readonly string[] = [
  "1cd73874884db6a0f9f21d853d7e9eacdc773c39ee389060f5e96ae0bcb4773a",
  "6ab89b7389595bb813be094c72f4a3b52da80bb0b136637c7ce626f367eb388e",
];

export function isPublishedSeedPassword(password: string): boolean {
  const digest = createHash("sha256").update(password, "utf8").digest("hex");
  return PUBLISHED_SEED_PASSWORD_SHA256.includes(digest);
}

/** في الإنتاج (ومنه معاينات Vercel) تُرفض الكلمات المنشورة؛ التطوير المحلي يبقى يعمل مع seed. */
export function rejectsPublishedSeedPasswords(): boolean {
  return process.env.NODE_ENV === "production";
}
