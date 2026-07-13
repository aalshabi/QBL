import { NextRequest, NextResponse } from "next/server";
import { getAdminDataSource } from "@/lib/admin/data";
import { requireAdmin } from "@/lib/admin/guard";
import { advanceSettlement, receiveCustody, sortSettlement } from "@/lib/admin/mutations";

export async function GET() {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;

  const cod = await getAdminDataSource().getCod();
  return NextResponse.json(cod);
}

/** دورة حياة التحصيل: استلام عهدة مندوب → فرز كشف عميل → تصدير → تسليم. */
export async function PATCH(request: NextRequest) {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;

  const body = (await request.json()) as {
    action: "RECEIVE_CUSTODY" | "SORT_SETTLEMENT" | "EXPORT_SETTLEMENT" | "DELIVER_SETTLEMENT";
    courierId?: string;
    clientAccountId?: string;
    settlementId?: string;
  };

  if (body.action === "RECEIVE_CUSTODY") {
    if (!body.courierId) {
      return NextResponse.json({ error: "VALIDATION", message: "حدد المندوب" }, { status: 400 });
    }
    const result = await receiveCustody(body.courierId);
    return NextResponse.json({ ok: true, action: body.action, ...result });
  }

  if (body.action === "SORT_SETTLEMENT") {
    if (!body.clientAccountId) {
      return NextResponse.json({ error: "VALIDATION", message: "حدد العميل" }, { status: 400 });
    }
    const result = await sortSettlement(body.clientAccountId);
    return NextResponse.json({ ok: true, action: body.action, ...result });
  }

  if (!body.settlementId) {
    return NextResponse.json({ error: "VALIDATION", message: "حدد الكشف" }, { status: 400 });
  }

  const result = await advanceSettlement(
    body.settlementId,
    body.action === "EXPORT_SETTLEMENT" ? "EXPORT" : "DELIVER",
  );
  if (!result.ok) {
    return NextResponse.json({ error: "CONFLICT", message: result.message }, { status: 409 });
  }

  return NextResponse.json({ ok: true, action: body.action, affected: result.affected });
}
