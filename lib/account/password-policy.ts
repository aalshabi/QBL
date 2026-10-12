import { isPublishedSeedPassword } from "@/lib/published-credentials";

export const MIN_PASSWORD_LENGTH = 12;
export const MAX_PASSWORD_LENGTH = 128;

export type PasswordPolicyError =
  | "TOO_SHORT"
  | "TOO_LONG"
  | "SAME_AS_CURRENT"
  | "CONTAINS_ACCOUNT_NAME"
  | "PUBLISHED_PASSWORD"
  | "SINGLE_CHARACTER";

export type PasswordPolicyResult = { ok: true } | { ok: false; error: PasswordPolicyError; message: string };

const MESSAGES: Record<PasswordPolicyError, string> = {
  TOO_SHORT: `كلمة المرور الجديدة يجب ألا تقل عن ${MIN_PASSWORD_LENGTH} حرفًا`,
  TOO_LONG: `كلمة المرور الجديدة يجب ألا تزيد على ${MAX_PASSWORD_LENGTH} حرفًا`,
  SAME_AS_CURRENT: "كلمة المرور الجديدة مطابقة للحالية",
  CONTAINS_ACCOUNT_NAME: "كلمة المرور الجديدة تحتوي اسم الحساب",
  PUBLISHED_PASSWORD: "هذه كلمة مرور منشورة ولا يجوز استعمالها",
  SINGLE_CHARACTER: "كلمة المرور الجديدة مكررة من حرف واحد",
};

function fail(error: PasswordPolicyError): PasswordPolicyResult {
  return { ok: false, error, message: MESSAGES[error] };
}

/** قواعد كلمة المرور الجديدة. لا تقرأ القاعدة ولا تكتب شيئًا؛ تقرر فقط. */
export function checkNewPassword(input: {
  email: string;
  currentPassword: string;
  newPassword: string;
}): PasswordPolicyResult {
  const { email, currentPassword, newPassword } = input;
  if (newPassword.length < MIN_PASSWORD_LENGTH) return fail("TOO_SHORT");
  if (newPassword.length > MAX_PASSWORD_LENGTH) return fail("TOO_LONG");
  if (newPassword === currentPassword) return fail("SAME_AS_CURRENT");
  if (/^(.)\1+$/u.test(newPassword)) return fail("SINGLE_CHARACTER");

  const accountName = email.split("@")[0]?.toLowerCase() ?? "";
  if (accountName.length >= 4 && newPassword.toLowerCase().includes(accountName)) {
    return fail("CONTAINS_ACCOUNT_NAME");
  }

  if (isPublishedSeedPassword(newPassword)) return fail("PUBLISHED_PASSWORD");
  return { ok: true };
}
