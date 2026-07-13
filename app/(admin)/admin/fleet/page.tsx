import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAdminDataSource } from "@/lib/admin/data";
import { formatDate, formatNumber, formatSar } from "@/lib/admin/format";
import { cn } from "@/lib/utils";

const courierStatusLabels: Record<string, { label: string; className: string }> = {
  AVAILABLE: { label: "متاح", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  ON_TASK: { label: "في مهمة", className: "bg-sky-100 text-sky-800 border-sky-200" },
  LATE: { label: "متأخر", className: "bg-amber-100 text-amber-800 border-amber-200" },
  OFFLINE: { label: "خارج الخدمة", className: "bg-zinc-200 text-zinc-600 border-zinc-300" },
};

const vehicleStatusLabels: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: "نشطة", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  MAINTENANCE: { label: "صيانة", className: "bg-amber-100 text-amber-800 border-amber-200" },
  OFFLINE: { label: "متوقفة", className: "bg-zinc-200 text-zinc-600 border-zinc-300" },
};

export default async function AdminFleetPage() {
  const { couriers, vehicles } = await getAdminDataSource().getFleet();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-[#0D1B3A]">المناديب والأسطول</h1>
        <p className="text-sm text-slate-500">حالة المناديب وعُهدهم، ومركبات التبريد وتواريخ الوثائق</p>
      </div>

      <Tabs defaultValue="couriers">
        <TabsList>
          <TabsTrigger value="couriers">المناديب ({formatNumber(couriers.length)})</TabsTrigger>
          <TabsTrigger value="vehicles">المركبات ({formatNumber(vehicles.length)})</TabsTrigger>
        </TabsList>

        <TabsContent value="couriers">
          <Card>
            <CardContent className="overflow-x-auto p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="text-start">الرمز</TableHead>
                    <TableHead className="text-start">المندوب</TableHead>
                    <TableHead className="text-start">الحالة</TableHead>
                    <TableHead className="text-start">الفرع</TableHead>
                    <TableHead className="text-start">المركبة</TableHead>
                    <TableHead className="text-start">مهام حالية</TableHead>
                    <TableHead className="text-start">مسلَّم اليوم</TableHead>
                    <TableHead className="text-start">نسبة النجاح</TableHead>
                    <TableHead className="text-start">عهدة COD</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {couriers.map((courier) => {
                    const status = courierStatusLabels[courier.status];
                    return (
                      <TableRow key={courier.id}>
                        <TableCell className="font-mono text-xs">{courier.employeeCode}</TableCell>
                        <TableCell>
                          <p className="font-medium">{courier.displayName}</p>
                          <p className="text-xs text-slate-400" dir="ltr">
                            {courier.phoneMasked}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("font-medium", status.className)}>
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{courier.hubName}</TableCell>
                        <TableCell className="text-sm">{courier.vehicleLabel}</TableCell>
                        <TableCell>{formatNumber(courier.assignedOrders)}</TableCell>
                        <TableCell>{formatNumber(courier.deliveredToday)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200">
                              <div
                                className="h-full rounded-full bg-[#00A7B6]"
                                style={{ width: `${courier.successRate}%` }}
                              />
                            </div>
                            <span className="text-xs">{courier.successRate}٪</span>
                          </div>
                        </TableCell>
                        <TableCell
                          className={cn("font-semibold", courier.codCustody > 0 ? "text-amber-700" : "text-slate-400")}
                        >
                          {formatSar(courier.codCustody)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vehicles">
          <Card>
            <CardContent className="overflow-x-auto p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="text-start">اللوحة</TableHead>
                    <TableHead className="text-start">المركبة</TableHead>
                    <TableHead className="text-start">الحالة</TableHead>
                    <TableHead className="text-start">نطاق التبريد</TableHead>
                    <TableHead className="text-start">السائق</TableHead>
                    <TableHead className="text-start">طرود محمّلة</TableHead>
                    <TableHead className="text-start">انتهاء التأمين</TableHead>
                    <TableHead className="text-start">انتهاء الرخصة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicles.map((vehicle) => {
                    const status = vehicleStatusLabels[vehicle.status];
                    return (
                      <TableRow key={vehicle.id}>
                        <TableCell className="font-mono text-xs">{vehicle.plateNumber}</TableCell>
                        <TableCell>
                          <p className="font-medium">{vehicle.label}</p>
                          <p className="text-xs text-slate-400">
                            {vehicle.make} — {vehicle.model}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("font-medium", status.className)}>
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {vehicle.coldRange}°
                          {vehicle.supportsFrozen && (
                            <Badge variant="outline" className="ms-2 border-cyan-200 bg-cyan-50 text-cyan-700">
                              مجمدات
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{vehicle.courierName ?? <span className="text-slate-400">—</span>}</TableCell>
                        <TableCell>{formatNumber(vehicle.loadedOrders)}</TableCell>
                        <TableCell className="text-sm">{formatDate(vehicle.insuranceExpiry)}</TableCell>
                        <TableCell className="text-sm">{formatDate(vehicle.licenseExpiry)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
