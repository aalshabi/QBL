"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ClipboardList, Filter, RadioTower, Search, Thermometer } from "lucide-react";
import { MockMap } from "@/components/maps/mock-map";
import { CourierStatusBadge, OrderStatusBadge, TemperatureBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Courier, DeliveryOrder } from "@/lib/domain";
import { toCourierMarkers, toOrderMarkers } from "@/lib/maps/adapter";
import { auditEvents, clientAccounts } from "@/lib/mock-data";

export function OpsDashboard({ couriers, orders }: { couriers: Courier[]; orders: DeliveryOrder[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  const activeOrders = useMemo(
    () =>
      orders.filter((order) => {
        const text = `${order.publicCode} ${order.reference} ${order.serviceType}`.toLowerCase();
        return (status === "all" || order.status === status) && text.includes(query.toLowerCase());
      }),
    [orders, query, status],
  );
  const delayed = orders.filter((order) => order.isDelayed);
  const tempAlerts = orders.filter((order) => order.temperatureStatus !== "NORMAL");
  const intervention = orders.filter((order) => order.requiresIntervention);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <p className="text-sm font-medium text-orange-300">QBL Operations Center</p>
            <h1 className="mt-1 text-3xl font-bold">لوحة العمليات الحية</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary">إسناد طلب</Button>
            <Button className="bg-orange-400 text-zinc-950 hover:bg-orange-300">إعادة تخطيط المسارات</Button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "طلبات نشطة", value: orders.filter((o) => !["DELIVERED", "FAILED"].includes(o.status)).length, icon: ClipboardList },
            { label: "مناديب متصلون", value: couriers.filter((c) => c.status !== "OFFLINE").length, icon: RadioTower },
            { label: "طلبات متأخرة", value: delayed.length, icon: AlertTriangle },
            { label: "تنبيهات حرارة", value: tempAlerts.length, icon: Thermometer },
          ].map((stat) => (
            <Card key={stat.label} className="rounded-lg border-white/10 bg-white/5 text-white">
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-sm text-zinc-400">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold">{stat.value}</p>
                </div>
                <stat.icon className="h-7 w-7 text-orange-300" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="rounded-lg border-white/10 bg-white/5 text-white">
            <CardHeader><CardTitle>خريطة المناديب والطلبات</CardTitle></CardHeader>
            <CardContent>
              <MockMap markers={toCourierMarkers(couriers)} orderMarkers={toOrderMarkers(activeOrders.slice(0, 18))} />
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="rounded-lg border-white/10 bg-white/5 text-white">
              <CardHeader><CardTitle>حالة المناديب</CardTitle></CardHeader>
              <CardContent className="grid gap-3">
                {couriers.map((courier) => (
                  <div key={courier.id} className="flex items-center justify-between rounded-lg bg-zinc-900 p-3">
                    <div>
                      <p className="font-semibold">{courier.displayName} <span className="text-xs text-zinc-400 ltr">{courier.employeeCode}</span></p>
                      <p className="text-xs text-zinc-500">آخر تحديث {new Intl.DateTimeFormat("ar-SA", { hour: "2-digit", minute: "2-digit" }).format(new Date(courier.lastPingAt))}</p>
                    </div>
                    <CourierStatusBadge status={courier.status} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="orders" className="mt-6">
          <TabsList className="bg-white/10">
            <TabsTrigger value="orders">الطلبات</TabsTrigger>
            <TabsTrigger value="alerts">التنبيهات</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
          </TabsList>
          <TabsContent value="orders" className="mt-4">
            <Card className="rounded-lg border-white/10 bg-white/5 text-white">
              <CardHeader>
                <div className="grid gap-3 md:grid-cols-[1fr_220px_120px]">
                  <div className="relative">
                    <Search className="absolute right-3 top-3 h-4 w-4 text-zinc-500" />
                    <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="بحث برقم الطلب أو المرجع" className="bg-zinc-950 pr-9 text-white" />
                  </div>
                  <Select value={status} onValueChange={(value) => setStatus(value ?? "all")}>
                    <SelectTrigger className="bg-zinc-950 text-white"><SelectValue placeholder="الحالة" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل الحالات</SelectItem>
                      {["CREATED", "ASSIGNED", "OUT_FOR_DELIVERY", "ARRIVED", "DELIVERED", "FAILED"].map((item) => (
                        <SelectItem key={item} value={item}>{item}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="secondary"><Filter className="h-4 w-4" /> تصفية</Button>
                </div>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-white/5">
                      <TableHead>الطلب</TableHead><TableHead>العميل</TableHead><TableHead>الخدمة</TableHead><TableHead>الحالة</TableHead><TableHead>ETA</TableHead><TableHead>الحرارة</TableHead><TableHead>إجراء</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeOrders.slice(0, 18).map((order) => (
                      <TableRow key={order.id} className="border-white/10 hover:bg-white/5">
                        <TableCell className="font-mono">{order.publicCode}</TableCell>
                        <TableCell>{clientAccounts.find((client) => client.id === order.clientAccountId)?.companyName}</TableCell>
                        <TableCell>{order.serviceType}</TableCell>
                        <TableCell><OrderStatusBadge status={order.status} /></TableCell>
                        <TableCell>{order.etaMinutes} د</TableCell>
                        <TableCell><TemperatureBadge status={order.temperatureStatus} value={order.currentTemperature} /></TableCell>
                        <TableCell><Button size="sm" variant="secondary">إعادة إسناد</Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="alerts" className="mt-4 grid gap-4 md:grid-cols-2">
            {[...tempAlerts, ...intervention].slice(0, 10).map((order) => (
              <Card key={order.id} className="rounded-lg border-orange-300/30 bg-orange-300/10 text-white">
                <CardContent className="p-5">
                  <Badge className="bg-orange-300 text-zinc-950">يتطلب تدخل</Badge>
                  <h3 className="mt-3 font-bold">{order.publicCode}</h3>
                  <p className="mt-2 text-sm text-zinc-300">{order.serviceType} · {order.dropoffAddress}</p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
          <TabsContent value="audit" className="mt-4">
            <Card className="rounded-lg border-white/10 bg-white/5 text-white">
              <CardContent className="grid gap-3 p-5">
                {auditEvents.map((event) => (
                  <div key={event.id} className="flex flex-col gap-2 rounded-lg bg-zinc-900 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold ltr text-right">{event.action}</p>
                      <p className="text-sm text-zinc-400">{event.orderCode} · {event.actor}</p>
                      {event.reason ? <p className="mt-1 text-xs text-orange-300">{event.reason}</p> : null}
                    </div>
                    <p className="text-xs text-zinc-500">{new Intl.DateTimeFormat("ar-SA", { hour: "2-digit", minute: "2-digit" }).format(new Date(event.at))}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
