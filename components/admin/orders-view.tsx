"use client";

import { useMemo, useState, useTransition } from "react";
import { CheckCircle2, Flag, RefreshCw, UserCheck } from "lucide-react";
import { AdminOrderStatusBadge, CodStatusBadge } from "@/components/admin/admin-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime, formatSar } from "@/lib/admin/format";
import type { AdminOrder, AdminOrderStatus } from "@/lib/admin/types";
import { orderStatusLabels, paymentMethodLabels } from "@/lib/admin/types";

type Props = {
  orders: AdminOrder[];
  clients: { id: string; name: string }[];
  couriers: { id: string; name: string }[];
  initialStatus?: AdminOrderStatus | "ALL";
};

export function OrdersView({ orders, clients, couriers, initialStatus = "ALL" }: Props) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<AdminOrderStatus | "ALL">(initialStatus);
  const [client, setClient] = useState("ALL");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkCourier, setBulkCourier] = useState("");
  const [bulkStatus, setBulkStatus] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const rows = useMemo(
    () =>
      orders.filter((order) => {
        if (status !== "ALL" && order.status !== status) return false;
        if (client !== "ALL" && order.clientAccountId !== client) return false;
        if (query) {
          const text = `${order.publicCode} ${order.reference} ${order.barcode} ${order.clientName} ${order.customerName} ${order.courierName ?? ""}`.toLowerCase();
          if (!text.includes(query.toLowerCase())) return false;
        }
        return true;
      }),
    [orders, status, client, query],
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) => (prev.size === rows.length ? new Set() : new Set(rows.map((r) => r.id))));
  };

  const runBulk = (action: "ASSIGN_COURIER" | "CHANGE_STATUS" | "APPROVE") => {
    if (!selected.size) {
      setMessage("حدد طلبًا واحدًا على الأقل");
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          orderIds: [...selected],
          courierId: bulkCourier || undefined,
          status: bulkStatus || undefined,
        }),
      });
      const data = await res.json();
      setMessage(
        res.ok
          ? `تم تنفيذ الإجراء على ${data.affected} طلب (تجريبي — بانتظار ربط قاعدة البيانات)`
          : data.message ?? "تعذر تنفيذ الإجراء",
      );
      if (res.ok) setSelected(new Set());
    });
  };

  return (
    <div className="space-y-4">
      {/* فلاتر */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="بحث برقم الطلب / المرجع / الباركود / العميل…"
            className="w-72"
          />
          <Select value={status} onValueChange={(v) => setStatus((v ?? "ALL") as AdminOrderStatus | "ALL")}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">كل الحالات</SelectItem>
              {Object.entries(orderStatusLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={client} onValueChange={(v) => setClient(v ?? "ALL")}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="العميل" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">كل العملاء</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="ms-auto text-sm text-slate-500">{rows.length} طلب</span>
        </CardContent>
      </Card>

      {/* شريط الإجراءات الجماعية */}
      <Card className="border-[#00A7B6]/40">
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <span className="text-sm font-semibold text-[#0D1B3A]">
            إجراءات جماعية ({selected.size} محدد):
          </span>
          <Select value={bulkCourier} onValueChange={(v) => setBulkCourier(v ?? "")}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="اختر مندوبًا" />
            </SelectTrigger>
            <SelectContent>
              {couriers.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" disabled={pending || !bulkCourier} onClick={() => runBulk("ASSIGN_COURIER")}>
            <UserCheck className="me-1 h-4 w-4" />
            تعيين للمندوب
          </Button>
          <Select value={bulkStatus} onValueChange={(v) => setBulkStatus(v ?? "")}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="حالة جديدة" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(orderStatusLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" variant="secondary" disabled={pending || !bulkStatus} onClick={() => runBulk("CHANGE_STATUS")}>
            <RefreshCw className="me-1 h-4 w-4" />
            تغيير الحالة
          </Button>
          <Button size="sm" variant="outline" disabled={pending} onClick={() => runBulk("APPROVE")}>
            <CheckCircle2 className="me-1 h-4 w-4" />
            موافقة على الطلبات
          </Button>
          {message && <span className="text-sm text-[#00A7B6]">{message}</span>}
        </CardContent>
      </Card>

      {/* الجدول */}
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="w-10 text-start">
                  <input
                    type="checkbox"
                    aria-label="تحديد الكل"
                    checked={rows.length > 0 && selected.size === rows.length}
                    onChange={toggleAll}
                  />
                </TableHead>
                <TableHead className="text-start">رقم الطلب</TableHead>
                <TableHead className="text-start">العميل (المتجر)</TableHead>
                <TableHead className="text-start">المستلم</TableHead>
                <TableHead className="text-start">المندوب</TableHead>
                <TableHead className="text-start">الحالة</TableHead>
                <TableHead className="text-start">COD</TableHead>
                <TableHead className="text-start">أجرة التوصيل</TableHead>
                <TableHead className="text-start">طريقة الدفع</TableHead>
                <TableHead className="text-start">حالة التحصيل</TableHead>
                <TableHead className="text-start">موعد الجدولة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((order) => (
                <TableRow key={order.id} className={order.isFollowUp ? "bg-rose-50/50" : undefined}>
                  <TableCell>
                    <input
                      type="checkbox"
                      aria-label={`تحديد ${order.publicCode}`}
                      checked={selected.has(order.id)}
                      onChange={() => toggle(order.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 font-mono text-xs">
                      {order.isFollowUp && <Flag className="h-3.5 w-3.5 text-rose-500" />}
                      {order.publicCode}
                    </div>
                    <p className="text-xs text-slate-400">{order.barcode}</p>
                  </TableCell>
                  <TableCell className="max-w-40 truncate">{order.clientName}</TableCell>
                  <TableCell>
                    <p className="text-sm">{order.customerName}</p>
                    <p className="max-w-44 truncate text-xs text-slate-400">{order.customerArea}</p>
                  </TableCell>
                  <TableCell>{order.courierName ?? <span className="text-slate-400">غير معيّن</span>}</TableCell>
                  <TableCell>
                    <AdminOrderStatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="font-semibold">{formatSar(order.codAmount)}</TableCell>
                  <TableCell>{formatSar(order.deliveryFee)}</TableCell>
                  <TableCell className="text-sm">{paymentMethodLabels[order.paymentMethod]}</TableCell>
                  <TableCell>
                    <CodStatusBadge status={order.codStatus} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-slate-500">
                    {formatDateTime(order.scheduledAt)}
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} className="py-10 text-center text-slate-400">
                    لا توجد طلبات مطابقة للفلاتر الحالية
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
