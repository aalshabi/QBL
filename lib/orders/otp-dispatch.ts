import "server-only";
import type { PrismaClient } from "@/lib/generated/prisma/client";
import { issueOrderOtp } from "@/lib/orders/otp";

/**
 * إصدار رمز الاستلام عند خروج الطلب للتوصيل، وتسجيل محاولة إيصاله.
 *
 * لا مزود رسائل متعاقد اليوم: lib/notifications/adapter.ts يعيد "SENT" دائماً
 * وهو mock. تسجيل SENT هنا يعني أن لوحة العمليات ستُظهر أن العميل استلم رمزاً
 * لم يُرسل أبداً — وهذا أسوأ من غياب التسجيل. لذلك تُكتب المحاولة QUEUED مع
 * سبب صريح، ويبقى الرمز متاحاً عبر صفحة التتبع الخاصة بالعميل.
 *
 * الرمز لا يُعاد إلى المستدعي بأي حال: مسار المندوب يمر بهذه الدالة، ومن يوصل
 * الطلب يجب ألا يملك الرمز الذي يُفترض أن يقرأه من العميل.
 */

export type OtpDispatchOutcome = {
  issued: boolean;
  delivery: "QUEUED" | "FAILED";
  reason: "NO_MESSAGING_PROVIDER" | "QUEUED_FOR_PROVIDER";
};

function hasMessagingProvider(): boolean {
  return Boolean(process.env.SMS_PROVIDER?.trim() || process.env.WHATSAPP_PROVIDER?.trim());
}

export async function issueAndQueueOrderOtp(
  prisma: PrismaClient,
  orderId: string,
): Promise<OtpDispatchOutcome> {
  const order = await prisma.deliveryOrder.findUnique({
    where: { id: orderId },
    select: { customer: { select: { phone: true } } },
  });

  const { expiresAt } = await issueOrderOtp(prisma, orderId);
  const configured = hasMessagingProvider();

  await prisma.notificationLog.create({
    data: {
      orderId,
      channel: "SMS",
      recipient: order?.customer.phone ?? "unknown",
      templateKey: "otp_code",
      // لا يُخزَّن الرمز هنا: سجل الإشعارات يُقرأ من لوحات التشغيل.
      payload: { expiresAt: expiresAt.toISOString(), providerConfigured: configured },
      status: "QUEUED",
      error: configured ? null : "NO_MESSAGING_PROVIDER_CONFIGURED",
    },
  });

  return {
    issued: true,
    delivery: "QUEUED",
    reason: configured ? "QUEUED_FOR_PROVIDER" : "NO_MESSAGING_PROVIDER",
  };
}
