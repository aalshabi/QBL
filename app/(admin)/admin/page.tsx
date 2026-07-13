import Link from "next/link";
import { ArrowLeft, Banknote, Flag, Truck, Wallet } from "lucide-react";
import { AdminOrderStatusBadge } from "@/components/admin/admin-status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAdminDataSource } from "@/lib/admin/data";
import { formatDateTime, formatNumber, formatSar } from "@/lib/admin/format";
import { requireAdminPage } from "@/lib/admin/guard";
import { orderStatusLabels } from "@/lib/admin/types";

export default async function AdminDashboardPage() {
  await requireAdminPage();
  const source = getAdminDataSource();
  const [dashboard, orders] = await Promise.all([
    source.getDashboard(),
    source.getOrders({ followUpOnly: true }),
  ]);

  const kpis = [
    {
      label: "COD محصَّل اليوم",
      value: formatSar(dashboard.todayDeliveredCod),
      icon: Banknote,
      tone: "text-emerald-600",
    },
    {
      label: "أجور توصيل اليوم",
      value: formatSar(dashboard.todayFees),
      icon: Wallet,
      tone: "text-[#00A7B6]",
    },
    {
      label: "مناديب متصلون",
      value: `${formatNumber(dashboard.activeCouriers)} / ${formatNumber(dashboard.totalCouriers)}`,
      icon: Truck,
      tone: "text-indigo-600",
    },
    {
      label: "متابعات مفتوحة",
      value: formatNumber(dashboard.followUpCount),
      icon: Flag,
      tone: "text-rose-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0D1B3A]">الملخص</h1>
          <p className="text-sm text-slate-500">نظرة تشغيلية لحظية على الطلبات والمناديب والتحصيل</p>
        </div>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 rounded-md bg-[#0D1B3A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0D1B3A]/90"
        >
          إدارة الطلبات
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </div>

      {/* KPI */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-slate-500">{kpi.label}</p>
                <p className="mt-1 text-2xl font-bold text-[#0D1B3A]">{kpi.value}</p>
              </div>
              <kpi.icon className={`h-8 w-8 ${kpi.tone}`} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* بطاقات الحالات — كما في لوحة المصدر */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">الطلبات حسب الحالة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {dashboard.cards.map((card) => (
              <Link
                key={card.status}
                href={`/admin/orders?status=${card.status}`}
                className="rounded-lg border bg-white p-3 transition-colors hover:border-[#00A7B6]"
              >
                <p className="text-xs text-slate-500">{orderStatusLabels[card.status]}</p>
                <p className="mt-1 text-2xl font-bold text-[#0D1B3A]">{formatNumber(card.count)}</p>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* متابعات */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">طلبات تتطلب متابعة ({formatNumber(orders.length)})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-start">رقم الطلب</TableHead>
                <TableHead className="text-start">العميل</TableHead>
                <TableHead className="text-start">المستلم</TableHead>
                <TableHead className="text-start">الحالة</TableHead>
                <TableHead className="text-start">موعد الجدولة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.slice(0, 6).map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs">{order.publicCode}</TableCell>
                  <TableCell>{order.clientName}</TableCell>
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell>
                    <AdminOrderStatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">{formatDateTime(order.scheduledAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
