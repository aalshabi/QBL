import { AdminOrderStatusBadge } from "@/components/admin/admin-status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAdminDataSource } from "@/lib/admin/data";
import { formatDateTime, formatNumber, formatSar } from "@/lib/admin/format";

const sectorLabels: Record<string, string> = {
  FOOD_SUPPLIER: "موردو أغذية",
  PHARMACY_CLINIC: "صيدليات وعيادات",
  RESTAURANT_CAFE: "مطاعم وكافيهات",
  RETAIL: "تجزئة",
  HOTEL_HOSPITAL: "فنادق ومستشفيات",
  ECOMMERCE: "تجارة إلكترونية",
};

export default async function AdminReportsPage() {
  const { drivers, clients, statusDistribution, cityDistribution } = await getAdminDataSource().getReports();
  const maxStatus = Math.max(...statusDistribution.map((s) => s.count), 1);
  const maxCity = Math.max(...cityDistribution.map((c) => c.count), 1);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-[#0D1B3A]">التقارير والتحليلات</h1>
        <p className="text-sm text-slate-500">أداء المناديب، نشاط العملاء، وتوزيعات الطلبات</p>
      </div>

      <Tabs defaultValue="drivers">
        <TabsList>
          <TabsTrigger value="drivers">تقرير المناديب</TabsTrigger>
          <TabsTrigger value="clients">العملاء النشطون</TabsTrigger>
          <TabsTrigger value="distribution">التوزيعات</TabsTrigger>
        </TabsList>

        <TabsContent value="drivers">
          <Card>
            <CardContent className="overflow-x-auto p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="text-start">المندوب</TableHead>
                    <TableHead className="text-start">إجمالي الطلبات</TableHead>
                    <TableHead className="text-start">مسلَّم</TableHead>
                    <TableHead className="text-start">مرتجع</TableHead>
                    <TableHead className="text-start">مؤجل</TableHead>
                    <TableHead className="text-start">قيد التنفيذ</TableHead>
                    <TableHead className="text-start">نسبة النجاح</TableHead>
                    <TableHead className="text-start">COD محصَّل</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drivers.map((row) => (
                    <TableRow key={row.courierId}>
                      <TableCell className="font-medium">{row.courierName}</TableCell>
                      <TableCell>{formatNumber(row.totalOrders)}</TableCell>
                      <TableCell className="text-emerald-700">{formatNumber(row.delivered)}</TableCell>
                      <TableCell className="text-rose-700">{formatNumber(row.returned)}</TableCell>
                      <TableCell className="text-amber-700">{formatNumber(row.postponed)}</TableCell>
                      <TableCell>{formatNumber(row.inProgress)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200">
                            <div
                              className="h-full rounded-full bg-[#00A7B6]"
                              style={{ width: `${row.successRate}%` }}
                            />
                          </div>
                          <span className="text-xs">{row.successRate}٪</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">{formatSar(row.codCollected)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients">
          <Card>
            <CardContent className="overflow-x-auto p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="text-start">العميل</TableHead>
                    <TableHead className="text-start">القطاع</TableHead>
                    <TableHead className="text-start">إجمالي الطلبات</TableHead>
                    <TableHead className="text-start">مسلَّم</TableHead>
                    <TableHead className="text-start">مرتجع</TableHead>
                    <TableHead className="text-start">إجمالي COD</TableHead>
                    <TableHead className="text-start">إجمالي الأجور</TableHead>
                    <TableHead className="text-start">آخر طلب</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((row) => (
                    <TableRow key={row.clientAccountId}>
                      <TableCell className="max-w-52 truncate font-medium">{row.clientName}</TableCell>
                      <TableCell className="text-sm">{sectorLabels[row.sector] ?? row.sector}</TableCell>
                      <TableCell>{formatNumber(row.totalOrders)}</TableCell>
                      <TableCell className="text-emerald-700">{formatNumber(row.delivered)}</TableCell>
                      <TableCell className="text-rose-700">{formatNumber(row.returned)}</TableCell>
                      <TableCell className="font-semibold">{formatSar(row.codTotal)}</TableCell>
                      <TableCell>{formatSar(row.feesTotal)}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-slate-500">
                        {formatDateTime(row.lastOrderAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">الطلبات حسب الحالة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {statusDistribution.map((row) => (
                  <div key={row.status} className="flex items-center gap-3">
                    <div className="w-32 shrink-0">
                      <AdminOrderStatusBadge status={row.status} />
                    </div>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-[#0D1B3A]"
                        style={{ width: `${(row.count / maxStatus) * 100}%` }}
                      />
                    </div>
                    <span className="w-8 text-end text-sm font-semibold">{formatNumber(row.count)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">أعلى الأحياء (وجهات التوصيل)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {cityDistribution.map((row) => (
                  <div key={row.area} className="flex items-center gap-3">
                    <span className="w-40 shrink-0 truncate text-sm">{row.area}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-[#00A7B6]"
                        style={{ width: `${(row.count / maxCity) * 100}%` }}
                      />
                    </div>
                    <span className="w-14 text-end text-xs text-slate-500">
                      {formatNumber(row.delivered)}/{formatNumber(row.count)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
