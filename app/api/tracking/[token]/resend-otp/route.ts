import { NextResponse } from "next/server";
import { getNotificationAdapter } from "@/lib/notifications/adapter";
import { getPublicTrackingSnapshot } from "@/lib/tracking";

export async function POST(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const snapshot = await getPublicTrackingSnapshot(token);

  if (!snapshot || !snapshot.otp.required) {
    return NextResponse.json({ error: "OTP resend is unavailable for this order." }, { status: 400 });
  }

  const adapter = getNotificationAdapter();
  const result = await adapter.sendSms({
    to: snapshot.customer.phoneMasked,
    templateKey: "otp_code",
    variables: { order: snapshot.order.publicCode, code: "******" },
  });

  return NextResponse.json({ ok: true, notification: result });
}
