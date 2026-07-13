import { NextRequest, NextResponse } from "next/server";
import { getAdminDataSource, type OrdersFilter } from "@/lib/admin/data";
import { requireAdmin } from "@/lib/admin/guard";
import { approveOrders, assignCourier, changeStatus } from "@/lib/admin/mutations";
import type { AdminOrderStatus } from "@/lib/admin/types";

export async function GET(request: NextRequest) {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;

  const params = request.nextUrl.searchParams;
  const filter: OrdersFilter = {
    status: (params.get("status") as AdminOrderStatus | "ALL") ?? "ALL",
    clientAccountId: params.get("client") ?? "ALL",
    query: params.get("q") ?? undefined,
    followUpOnly: params.get("followUp") === "1",
  };

  const orders = await getAdminDataSource().getOrders(filter);
  return NextResponse.json({ orders, total: orders.length });
}

/** إجراءات جماعية على الطلبات: تعيين مندوب / تغيير حالة / موافقة — تُكتب في Prisma مع AuditLog. */
export async function PATCH(request: NextRequest) {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;

  const body = (await request.json()) as {
    action: "ASSIGN_COURIER" | "CHANGE_STATUS" | "APPROVE";
    orderIds: string[];
    courierId?: string;
    status?: AdminOrderStatus;
  };

  if (!body.orderIds?.length) {
    return NextResponse.json({ error: "VALIDATION", message: "حدد طلبًا واحدًا على الأقل" }, { status: 400 });
  }
  if (body.action === "ASSIGN_COURIER" && !body.courierId) {
    return NextResponse.json({ error: "VALIDATION", message: "حدد المندوب" }, { status: 400 });
  }
  if (body.action === "CHANGE_STATUS" && !body.status) {
    return NextResponse.json({ error: "VALIDATION", message: "حدد الحالة الجديدة" }, { status: 400 });
  }

  const affected =
    body.action === "ASSIGN_COURIER"
      ? await assignCourier(body.orderIds, body.courierId!)
      : body.action === "CHANGE_STATUS"
        ? await changeStatus(body.orderIds, body.status!)
        : await approveOrders(body.orderIds);

  return NextResponse.json({ ok: true, affected, action: body.action });
}
