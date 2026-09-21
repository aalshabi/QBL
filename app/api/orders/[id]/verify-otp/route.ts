import { NextResponse } from "next/server";
import { z } from "zod";
import { assertRole, getSession } from "@/lib/auth";
import { acquireRatePermit, secureJsonHeaders } from "@/lib/logestechs/request-security";
import { getPrisma } from "@/lib/prisma";
import { verifyOrderOtp } from "@/lib/orders/otp";
import { toDomainStatus } from "@/lib/orders/transitions";

const schema = z.object({ otp: z.string().regex(/^\d{6}$/) });

/**
 * التحقق من رمز الاستلام. المسار السابق كان مفتوحاً بلا مصادقة ويقارن برمز ثابت؛
 * الآن: جلسة مندوب، وملكية الطلب، وحدّ معدل صارم (تخمين ستة أرقام يحتاج آلاف
 * المحاولات، فالحدّ هنا خط الدفاع الأول قبل عدّاد المحاولات في الجدول).
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  try {
    assertRole(session?.role, ["COURIER"]);
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401, headers: secureJsonHeaders });
  }

  const permit = acquireRatePermit(`order-otp:${session!.userId}`, 10, 1);
  if (!permit.ok) {
    return NextResponse.json(
      { error: "RATE_LIMITED" },
      { status: 429, headers: { ...secureJsonHeaders, "Retry-After": String(permit.retryAfterSeconds) } },
    );
  }

  try {
    const { id } = await params;
    const body = schema.safeParse(await request.json().catch(() => null));
    if (!body.success) {
      return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 422, headers: secureJsonHeaders });
    }

    const prisma = getPrisma();
    const courier = await prisma.courier.findUnique({
      where: { userId: session!.userId },
      select: { id: true },
    });
    if (!courier) {
      return NextResponse.json({ error: "COURIER_PROFILE_NOT_FOUND" }, { status: 404, headers: secureJsonHeaders });
    }

    const order = await prisma.deliveryOrder.findUnique({
      where: { id },
      select: { id: true, status: true, courierId: true },
    });
    if (!order) {
      return NextResponse.json({ error: "ORDER_NOT_FOUND" }, { status: 404, headers: secureJsonHeaders });
    }
    if (order.courierId !== courier.id) {
      return NextResponse.json({ error: "ORDER_NOT_ASSIGNED_TO_COURIER" }, { status: 403, headers: secureJsonHeaders });
    }

    // الرمز يُقرأ عند الباب، لا قبل الخروج للتوصيل.
    if (!["OUT_FOR_DELIVERY", "ARRIVED"].includes(toDomainStatus(order.status))) {
      return NextResponse.json({ error: "ORDER_NOT_AT_DELIVERY_STAGE" }, { status: 409, headers: secureJsonHeaders });
    }

    const result = await verifyOrderOtp(prisma, id, body.data.otp);

    await prisma.auditLog.create({
      data: {
        orderId: id,
        actorId: session!.userId,
        action: result.ok ? "OTP_VERIFIED" : "OTP_FAILED",
        metadata: result.ok ? { result: "ok" } : { result: result.reason },
      },
    });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.reason, remainingAttempts: result.remainingAttempts },
        { status: result.reason === "MISMATCH" ? 400 : 409, headers: secureJsonHeaders },
      );
    }

    return NextResponse.json({ ok: true }, { headers: secureJsonHeaders });
  } catch {
    return NextResponse.json({ error: "OTP_VERIFICATION_FAILED" }, { status: 500, headers: secureJsonHeaders });
  } finally {
    permit.release();
  }
}
