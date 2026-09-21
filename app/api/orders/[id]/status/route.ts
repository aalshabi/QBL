import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { acquireRatePermit, secureJsonHeaders } from "@/lib/logestechs/request-security";
import { getPrisma } from "@/lib/prisma";
import { applyOrderTransition, ConcurrentTransitionError } from "@/lib/orders/transitions";

/**
 * تحديث حالة الطلب. otpVerified لا يُقبل من العميل — تُقرأ من القاعدة داخل
 * applyOrderTransition، وكذلك الهوية والملكية.
 */
const schema = z.object({
  status: z.enum(["OUT_FOR_DELIVERY", "ARRIVED", "DELIVERED", "FAILED"]),
  manualOverride: z.boolean().optional(),
  reason: z.string().max(500).optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401, headers: secureJsonHeaders });
  }

  // الزر يُضغط مرتين على شبكة ضعيفة؛ الحد يمنع تحويل ذلك إلى عاصفة كتابة.
  const permit = acquireRatePermit(`order-status:${session.userId}`, 30, 3);
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

    const result = await applyOrderTransition({
      prisma: getPrisma(),
      orderId: id,
      to: body.data.status,
      actor: { userId: session.userId, role: session.role },
      reason: body.data.reason,
      manualOverride: body.data.manualOverride,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, detail: result.detail },
        { status: result.status, headers: secureJsonHeaders },
      );
    }

    return NextResponse.json(
      { ok: true, orderId: id, status: result.status, idempotent: result.idempotent, overridden: result.overridden },
      { headers: secureJsonHeaders },
    );
  } catch (error) {
    if (error instanceof ConcurrentTransitionError) {
      return NextResponse.json({ error: "ORDER_CHANGED_CONCURRENTLY" }, { status: 409, headers: secureJsonHeaders });
    }
    return NextResponse.json({ error: "STATUS_UPDATE_FAILED" }, { status: 500, headers: secureJsonHeaders });
  } finally {
    permit.release();
  }
}
