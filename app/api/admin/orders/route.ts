import { NextRequest, NextResponse } from "next/server";
import { getAdminDataSource, type OrdersFilter } from "@/lib/admin/data";
import { requireAdmin } from "@/lib/admin/guard";
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

/**
 * إجراءات جماعية على الطلبات: تعيين مندوب / تغيير حالة / موافقة.
 * mock حاليًا — يُستبدل بكتابة Prisma + AuditLog عند توفر قاعدة البيانات.
 */
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

  // TODO(prisma): تنفيذ فعلي — تحديث DeliveryOrder + تسجيل AuditLog لكل طلب.
  return NextResponse.json({ ok: true, affected: body.orderIds.length, action: body.action });
}
