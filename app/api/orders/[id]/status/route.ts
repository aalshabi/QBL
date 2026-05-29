import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession, assertRole } from "@/lib/auth";
import { deliveryOrders } from "@/lib/mock-data";

const schema = z.object({
  status: z.enum(["CREATED", "ASSIGNED", "OUT_FOR_DELIVERY", "ARRIVED", "DELIVERED", "FAILED"]),
  otpVerified: z.boolean().optional(),
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

  if (body.data.status === "DELIVERED" && !body.data.otpVerified) {
    if (!body.data.manualOverride) {
      return NextResponse.json({ error: "Delivered is blocked until OTP is verified." }, { status: 409 });
    }
    assertRole(session.role, ["ADMIN", "OPS_MANAGER"]);
    if (!body.data.reason || body.data.reason.length < 10) {
      return NextResponse.json({ error: "Manual override requires an audit reason." }, { status: 422 });
    }
  }

  return NextResponse.json({
    ok: true,
    orderId: id,
    status: body.data.status,
    audit:
      body.data.status === "DELIVERED" && body.data.manualOverride
        ? { action: "OTP_MANUAL_OVERRIDE", actor: session.userId, reason: body.data.reason }
        : { action: "STATUS_CHANGED", actor: session.userId },
  });
}
