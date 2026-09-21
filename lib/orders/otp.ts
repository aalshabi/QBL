import "server-only";
import { compareOtp, generateOtpCode, hashOtp } from "@/lib/security";
import type { PrismaClient } from "@/lib/generated/prisma/client";

/**
 * رمز استلام الطلب — مصدر الحقيقة هو جدول OtpCode، لا ذاكرة العملية.
 *
 * النسخة السابقة كانت `Map` داخل الوحدة ورمزاً ثابتاً "123456": على Vercel تموت
 * الخريطة مع كل نسخة دالة، فيتحقق المندوب على نسخة ثم يُغلق الطلب على نسخة أخرى
 * لا تعرف شيئاً عن التحقق. والرمز الثابت يعني أن أي شخص يعرف الرقم يُغلق أي طلب.
 *
 * هنا: رمز لكل طلب، مجزّأ بـ bcrypt مع pepper، بصلاحية زمنية وعدّاد محاولات
 * يُزاد قبل المقارنة — فالمحاولة الفاشلة تُحتسب حتى لو انقطع الاتصال بعدها.
 */

const OTP_TTL_MINUTES = 120;
const MAX_ATTEMPTS = 5;

export type OtpIssueResult = {
  code: string;
  expiresAt: Date;
};

export type OtpVerifyResult =
  | { ok: true }
  | { ok: false; reason: "NO_ACTIVE_CODE" | "EXPIRED" | "TOO_MANY_ATTEMPTS" | "MISMATCH"; remainingAttempts: number };

/**
 * يُصدر رمزاً جديداً ويُبطل أي رمز سابق لنفس الطلب: وجود رمزين صالحين معاً يعني
 * أن رمزاً قديماً مسرّباً يظل يفتح الطلب بعد إعادة الإرسال.
 */
export async function issueOrderOtp(prisma: PrismaClient, orderId: string): Promise<OtpIssueResult> {
  const code = generateOtpCode();
  const codeHash = await hashOtp(code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60_000);

  await prisma.$transaction([
    prisma.otpCode.updateMany({
      where: { orderId, verifiedAt: null, expiresAt: { gt: new Date() } },
      data: { expiresAt: new Date() },
    }),
    prisma.otpCode.create({
      data: { orderId, codeHash, expiresAt, maxAttempts: MAX_ATTEMPTS, lastSentAt: new Date() },
    }),
  ]);

  return { code, expiresAt };
}

export async function verifyOrderOtp(
  prisma: PrismaClient,
  orderId: string,
  code: string,
): Promise<OtpVerifyResult> {
  const record = await prisma.otpCode.findFirst({
    where: { orderId, verifiedAt: null },
    orderBy: { createdAt: "desc" },
    select: { id: true, codeHash: true, attempts: true, maxAttempts: true, expiresAt: true },
  });

  if (!record) return { ok: false, reason: "NO_ACTIVE_CODE", remainingAttempts: 0 };
  if (record.expiresAt.getTime() <= Date.now()) {
    return { ok: false, reason: "EXPIRED", remainingAttempts: 0 };
  }
  if (record.attempts >= record.maxAttempts) {
    return { ok: false, reason: "TOO_MANY_ATTEMPTS", remainingAttempts: 0 };
  }

  // العدّاد يُزاد قبل المقارنة: محاولة تُقطع بعد الإرسال يجب أن تُحتسب أيضاً.
  const attempted = await prisma.otpCode.update({
    where: { id: record.id },
    data: { attempts: { increment: 1 } },
    select: { attempts: true, maxAttempts: true },
  });

  const matches = await compareOtp(code, record.codeHash);
  if (!matches) {
    return {
      ok: false,
      reason: "MISMATCH",
      remainingAttempts: Math.max(0, attempted.maxAttempts - attempted.attempts),
    };
  }

  await prisma.otpCode.update({ where: { id: record.id }, data: { verifiedAt: new Date() } });
  return { ok: true };
}

/** هل تحقّق رمز هذا الطلب فعلاً؟ تُقرأ من القاعدة، ولا تُقبل من العميل أبداً. */
export async function isOrderOtpVerified(prisma: PrismaClient, orderId: string): Promise<boolean> {
  const verified = await prisma.otpCode.findFirst({
    where: { orderId, verifiedAt: { not: null } },
    select: { id: true },
  });
  return Boolean(verified);
}
