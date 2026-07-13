import { OrdersView } from "@/components/admin/orders-view";
import { getAdminDataSource } from "@/lib/admin/data";
import type { AdminOrderStatus } from "@/lib/admin/types";
import { orderStatusLabels } from "@/lib/admin/types";
import { clientAccounts, couriers } from "@/lib/mock-data";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const initialStatus =
    params.status && params.status in orderStatusLabels ? (params.status as AdminOrderStatus) : "ALL";

  const orders = await getAdminDataSource().getOrders();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-[#0D1B3A]">إدارة الطلبات</h1>
        <p className="text-sm text-slate-500">
          الجدول التشغيلي المركزي — فلاتر، إجراءات جماعية، وحالة التحصيل لكل طلب
        </p>
      </div>
      <OrdersView
        orders={orders}
        initialStatus={initialStatus}
        clients={clientAccounts.map((c) => ({ id: c.id, name: c.companyName }))}
        couriers={couriers.map((c) => ({ id: c.id, name: c.displayName }))}
      />
    </div>
  );
}
