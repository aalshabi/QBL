import { Banknote, HandCoins, Landmark, Receipt } from "lucide-react";
import { SettlementStatusBadge } from "@/components/admin/admin-status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAdminDataSource } from "@/lib/admin/data";
import { formatDateTime, formatNumber, formatSar, formatSarExact } from "@/lib/admin/format";
import { expenseTypeLabels } from "@/lib/admin/types";

export default async function AdminCodPage() {
  const { custody, settlements, expenses, summary } = await getAdminDataSource().getCod();

  const kpis = [
    { label: "COD في عهدة المناديب", value: formatSar(summary.codWithCouriers), icon: HandCoins, tone: "text-amber-600" },
    { label: "مستحق للعملاء", value: formatSar(summary.dueToClients), icon: Banknote, tone: "text-sky-600" },
    { label: "أجور التوصيل (مسلَّم)", value: formatSar(summary.deliveryFeesSum), icon: Receipt, tone: "text-[#00A7B6]" },
    { label: "صافي الربح", value: formatSarExact(summary.netProfit), icon: Landmark, tone: "text-emerald-600" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-[#0D1B3A]">الفوترة وتحصيل COD</h1>
        <p className="text-sm text-slate-500">
          دورة التحصيل: عهدة المندوب ← استلام ← فرز لكل عميل ← تصدير ← تسليم
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-slate-500">{kpi.label}</p>
                <p className="mt-1 text-xl font-bold text-[#0D1B3A]">{kpi.value}</p>
              </div>
              <kpi.icon className={`h-8 w-8 ${kpi.tone}`} />
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="custody">
        <TabsList>
          <TabsTrigger value="custody">عُهدات المناديب ({formatNumber(custody.length)})</TabsTrigger>
          <TabsTrigger value="settlements">كشوفات العملاء ({formatNumber(settlements.length)})</TabsTrigger>
          <TabsTrigger value="expenses">المصروفات ({formatNumber(expenses.length)})</TabsTrigger>
          <TabsTrigger value="summary">ملخص مالي</TabsTrigger>
        </TabsList>

        {/* عهدات */}
        <TabsContent value="custody">
          <Card>
            <CardContent className="overflow-x-auto p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="text-start">المندوب</TableHead>
                    <TableHead className="text-start">عدد الطلبات</TableHead>
                    <TableHead className="text-start">إجمالي COD</TableHead>
                    <TableHead className="text-start">أجور التوصيل</TableHead>
                    <TableHead className="text-start">صافي العهدة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {custody.map((row) => (
                    <TableRow key={row.courierId}>
                      <TableCell className="font-medium">{row.courierName}</TableCell>
                      <TableCell>{formatNumber(row.ordersCount)}</TableCell>
                      <TableCell className="font-semibold text-amber-700">{formatSar(row.totalCod)}</TableCell>
                      <TableCell>{formatSar(row.totalFees)}</TableCell>
                      <TableCell className="font-semibold">{formatSar(row.totalCod - row.totalFees)}</TableCell>
                    </TableRow>
                  ))}
                  {custody.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-slate-400">
                        لا توجد عُهدات حالية
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* كشوفات */}
        <TabsContent value="settlements">
          <Card>
            <CardContent className="overflow-x-auto p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="text-start">الكشف</TableHead>
                    <TableHead className="text-start">العميل</TableHead>
                    <TableHead className="text-start">الحالة</TableHead>
                    <TableHead className="text-start">الطلبات</TableHead>
                    <TableHead className="text-start">إجمالي COD</TableHead>
                    <TableHead className="text-start">الأجور</TableHead>
                    <TableHead className="text-start">الضريبة</TableHead>
                    <TableHead className="text-start">صافي للعميل</TableHead>
                    <TableHead className="text-start">آخر تحديث</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settlements.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-mono text-xs">{row.id}</TableCell>
                      <TableCell className="max-w-44 truncate font-medium">{row.clientName}</TableCell>
                      <TableCell>
                        <SettlementStatusBadge status={row.status} />
                      </TableCell>
                      <TableCell>{formatNumber(row.ordersCount)}</TableCell>
                      <TableCell className="font-semibold">{formatSar(row.totalCod)}</TableCell>
                      <TableCell>{formatSar(row.totalFees)}</TableCell>
                      <TableCell>{formatSarExact(row.vatAmount)}</TableCell>
                      <TableCell className="font-semibold text-emerald-700">{formatSarExact(row.netToClient)}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-slate-500">
                        {formatDateTime(row.deliveredAt ?? row.exportedAt ?? row.sortedAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* مصروفات */}
        <TabsContent value="expenses">
          <Card>
            <CardContent className="overflow-x-auto p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="text-start">النوع</TableHead>
                    <TableHead className="text-start">البيان</TableHead>
                    <TableHead className="text-start">المبلغ</TableHead>
                    <TableHead className="text-start">التاريخ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{expenseTypeLabels[row.type]}</TableCell>
                      <TableCell>{row.note}</TableCell>
                      <TableCell className="font-semibold text-rose-700">{formatSar(row.amount)}</TableCell>
                      <TableCell className="text-sm text-slate-500">{formatDateTime(row.spentAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ملخص مالي */}
        <TabsContent value="summary">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">الإيرادات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Row label="مجموع COD المسلَّم" value={formatSar(summary.deliveredCodSum)} />
                <Row label="أجور التوصيل (مسلَّم)" value={formatSar(summary.deliveryFeesSum)} />
                <Row label="أجور الرواجع" value={formatSarExact(summary.returnedFeesSum)} />
                <Row label="الضريبة المضافة (15٪)" value={formatSarExact(summary.vatSum)} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">المصروفات والصافي</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Row label="مصروفات المناديب" value={formatSar(summary.expensesByType.DRIVER)} />
                <Row label="مصروفات الفروع" value={formatSar(summary.expensesByType.HUB)} />
                <Row label="مصروفات الشركاء" value={formatSar(summary.expensesByType.PARTNER)} />
                <Row label="مصروفات أخرى" value={formatSar(summary.expensesByType.OTHER)} />
                <div className="border-t pt-2">
                  <Row label="إجمالي المصروفات" value={formatSar(summary.expensesSum)} strong />
                  <Row label="صافي الربح" value={formatSarExact(summary.netProfit)} strong accent />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
  accent,
}: {
  label: string;
  value: string;
  strong?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className={strong ? "font-semibold" : "text-slate-600"}>{label}</span>
      <span className={`${strong ? "font-bold" : "font-medium"} ${accent ? "text-emerald-700" : "text-[#0D1B3A]"}`}>
        {value}
      </span>
    </div>
  );
}
