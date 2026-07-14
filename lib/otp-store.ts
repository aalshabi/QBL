// مخزن التحقق من رمز الاستلام (OTP) على جهة الخادم — مصدر الحقيقة الوحيد لحالة
// "تم التحقق". في الإنتاج يعيش هذا في قاعدة البيانات/Redis مفتاحه معرّف الطلب،
// ويُولَّد رمز مجزّأ لكل طلب عند خروجه للتسليم. هنا (تشغيل mock بلا حفظ) نستخدم
// خريطة في الذاكرة ورمزاً تجريبياً واحداً مجزّأً عبر bcrypt.
//
// الغرض الأمني: مسار /status لا يثق أبداً بـ otpVerified قادمة من العميل — بل
// يقرأ isOrderOtpVerified() التي لا تُضبط إلا بعد نجاح compareOtp هنا.

import { compareOtp, hashOtp } from "@/lib/security";

const verifiedAt = new Map<string, string>();
const expectedHashCache = new Map<string, string>();

/** رمز تجريبي لكل طلبات الـ mock (تطوير فقط). الإنتاج يخزّن رمزاً مجزّأً لكل طلب. */
const DEMO_ORDER_OTP = process.env.DEMO_ORDER_OTP ?? "123456";

async function expectedHashFor(orderId: string): Promise<string> {
  let hash = expectedHashCache.get(orderId);
  if (!hash) {
    hash = await hashOtp(DEMO_ORDER_OTP);
    expectedHashCache.set(orderId, hash);
  }
  return hash;
}

/** يقارن الرمز عبر bcrypt؛ عند النجاح يسجّل التحقق خادميّاً. لا يثق بأي إدخال عميل. */
export async function verifyOrderOtp(orderId: string, code: string): Promise<boolean> {
  const ok = await compareOtp(code, await expectedHashFor(orderId));
  if (ok) verifiedAt.set(orderId, new Date().toISOString());
  return ok;
}

/** هل تحقّق OTP لهذا الطلب فعلاً على الخادم؟ */
export function isOrderOtpVerified(orderId: string): boolean {
  return verifiedAt.has(orderId);
}

/** يُستخدم عند إعادة إرسال الرمز أو إلغاء التسليم. */
export function clearOrderOtp(orderId: string): void {
  verifiedAt.delete(orderId);
}
