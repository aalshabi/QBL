import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession, type Role } from "@/lib/auth";
import { canTransition } from "@/lib/domain";
import { deliveryOrders } from "@/lib/mock-data";
import { isOrderOtpVerified } from "@/lib/otp-store";

const OVERRIDE_ROLES: Role[] = ["ADMIN", "OPS_MANAGER"];

// otpVerified لم يعد يُقبل من العميل — حالة التحقق تُقرأ من الخادم حصراً.
const schema = z.object({
  status: z.enum(["CREATED", "ASSIGNED", "OUT_FOR_DELIVERY", "ARRIVED", "DELIVERED", "FAILED"]),
  manualOverride: z.boolean().optional(),
  reason: z.string().optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const body = schema.safeParse(await request.json());

  if (!body.success) {
    return NextResponse.json({ error: "Invalid status payload." }, { status: 422 });
  }

  const order = deliveryOrders.find((item) => item.id === id);
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  // آلة الحالات: لا قفزات غير مشروعة (مثل CREATED → DELIVERED).
  if (!canTransition(order.status, body.data.status)) {
    return NextResponse.json(
      { error: `Illegal transition ${order.status} → ${body.data.status}.` },
      { status: 409 },
    );
  }

  // التسليم يتطلب تحققاً خادميّاً لـ OTP، أو تجاوزاً يدويّاً موثّقاً بدور إداري.
  let overridden = false;
  if (body.data.status === "DELIVERED" && !isOrderOtpVerified(id)) {
    if (!body.data.manualOverride) {
      return NextResponse.json({ error: "Delivered is blocked until OTP is verified." }, { status: 409 });
    }
    if (!session || !OVERRIDE_ROLES.includes(session.role)) {
      return NextResponse.json(
        { error: "Manual override requires an admin role." },
        { status: session ? 403 : 401 },
      );
    }
    if (!body.data.reason || body.data.reason.length < 10) {
      return NextResponse.json({ error: "Manual override requires an audit reason." }, { status: 422 });
    }
    overridden = true;
  }

  return NextResponse.json({
    ok: true,
    orderId: id,
    status: body.data.status,
    audit: overridden
      ? { action: "OTP_MANUAL_OVERRIDE", actor: session?.userId ?? "anonymous", reason: body.data.reason }
      : { action: "STATUS_CHANGED", actor: session?.userId ?? "anonymous" },
  });
}
