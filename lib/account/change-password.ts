import "server-only";

import { checkNewPassword, type PasswordPolicyError } from "@/lib/account/password-policy";
import { getPrisma } from "@/lib/prisma";
import { compareOtp, hashOtp } from "@/lib/security";

export type ChangePasswordResult =
  | { ok: true }
  | { ok: false; error: "INVALID_CURRENT_PASSWORD"; message: string }
  | { ok: false; error: PasswordPolicyError; message: string };

/**
 * يغيّر صاحب الحساب كلمة مروره. يعمل داخل بيئة التشغيل حيث OTP_PEPPER متاح، فلا
 * تمر الكلمة الجديدة بأي إنسان ولا تُسجَّل في أي مكان.
 *
 * الحساب غير الموجود أو غير الفعّال يُعامل مثل كلمة حالية خاطئة: الرد لا يفرّق بينهما.
 */
export async function changeOwnPassword(input: {
  userId: string;
  currentPassword: string;
  newPassword: string;
}): Promise<ChangePasswordResult> {
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { id: true, email: true, status: true, passwordHash: true },
  });

  const currentMatches =
    Boolean(user) && user!.status === "ACTIVE" && (await compareOtp(input.currentPassword, user!.passwordHash));
  if (!user || !currentMatches) {
    return { ok: false, error: "INVALID_CURRENT_PASSWORD", message: "كلمة المرور الحالية غير صحيحة" };
  }

  const policy = checkNewPassword({
    email: user.email,
    currentPassword: input.currentPassword,
    newPassword: input.newPassword,
  });
  if (!policy.ok) return { ok: false, error: policy.error, message: policy.message };

  const passwordHash = await hashOtp(input.newPassword);
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
    prisma.auditLog.create({
      data: { action: "PASSWORD_CHANGED", actorId: user.id, reason: "Password changed by the account owner" },
    }),
  ]);

  return { ok: true };
}
