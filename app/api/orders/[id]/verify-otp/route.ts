import { NextResponse } from "next/server";
import { z } from "zod";
import { deliveryOrders } from "@/lib/mock-data";
import { verifyOrderOtp } from "@/lib/otp-store";

const schema = z.object({
  otp: z.string().regex(/^\d{6}$/),
  courierId: z.string().optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = schema.safeParse(await request.json());

  if (!body.success) {
    return NextResponse.json({ error: "OTP must be a 6 digit code." }, { status: 422 });
  }

  const order = deliveryOrders.find((item) => item.id === id);
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  if (!["OUT_FOR_DELIVERY", "ARRIVED"].includes(order.status)) {
    return NextResponse.json({ error: "OTP can only be verified when the order is out for delivery or arrived." }, { status: 409 });
  }

  // التحقق عبر bcrypt ويُسجَّل خادميّاً — هو ما يقرأه مسار /status لاحقاً.
  const verified = await verifyOrderOtp(id, body.data.otp);
  if (!verified) {
    return NextResponse.json({ ok: false, remainingAttempts: 4, audit: "OTP_FAILED" }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    proofOfDelivery: {
      orderId: id,
      proofType: "OTP",
      otpVerified: true,
      capturedAt: new Date().toISOString(),
    },
    audit: "OTP_VERIFIED",
  });
}
