"use client";

import { useMemo, useState, useTransition } from "react";
import { CheckCircle2, Download, ExternalLink, Flag, MapPinned, RefreshCw, UserCheck } from "lucide-react";
import { AdminOrderStatusBadge, CodStatusBadge } from "@/components/admin/admin-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime, formatSar } from "@/lib/admin/format";
import type { AdminOrder, AdminOrderStatus } from "@/lib/admin/types";
import { orderStatusLabels, paymentMethodLabels } from "@/lib/admin/types";
import { buildVerifiedRouteCsv, RouteExportBlockedError } from "@/lib/google-maps/route-export";

type Props = {
  orders: AdminOrder[];
  clients: { id: string; name: string }[];
  couriers: { id: string; name: string }[];
  initialStatus?: AdminOrderStatus | "ALL";
};

type LogesTechsStatusResult = {
  ok: boolean;
  barcode: string;
  externalStatus?: string;
  suggestedStatus?: AdminOrderStatus | null;
  matchesCurrent?: boolean | null;
  error?: string;
};

type GoogleLocationResult = {
  ok: boolean;
  id: string;
  status?: "VERIFIED" | "NEEDS_REVIEW";
  latitude?: number;
  longitude?: number;
  formattedAddress?: string;
  googleMapsUrl?: string;
  reviewReason?: "OUTSIDE_RIYADH" | "PARTIAL_ADDRESS" | "RIYADH_NOT_CONFIRMED" | null;
  error?: string;
};

const reviewReasonLabels: Record<NonNullable<GoogleLocationResult["reviewReason"]>, string> = {
  OUTSIDE_RIYADH: "خارج نطاق الرياض",
  PARTIAL_ADDRESS: "العنوان غير دقيق",
  RIYADH_NOT_CONFIRMED: "الرياض غير مؤكدة",
};

export function OrdersView({ orders, clients, couriers, initialStatus = "ALL" }: Props) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<AdminOrderStatus | "ALL">(initialStatus);
  const [client, setClient] = useState("ALL");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkCourier, setBulkCourier] = useState("");
  const [bulkStatus, setBulkStatus] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [logesTechsStatuses, setLogesTechsStatuses] = useState<Record<string, LogesTechsStatusResult>>({});
  const [googleLocations, setGoogleLocations] = useState<Record<string, GoogleLocationResult>>({});
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

  const checkLogesTechsStatuses = () => {
    const shipments = rows
      .filter((order) => selected.has(order.id) && order.barcode)
      .map((order) => ({ barcode: order.barcode, currentStatus: order.status }));

    if (!shipments.length) {
      setMessage("حدد طلبًا واحدًا على الأقل يحتوي على باركود");
      return;
    }
    if (shipments.length > 20) {
      setMessage("يمكن فحص 20 شحنة كحد أقصى في المرة الواحدة");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/integrations/logestechs/package-status", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-QBL-Integration-Request": "status-check-v1",
          },
          body: JSON.stringify({ shipments }),
        });
        const data = await response.json();
        if (!response.ok) {
          setMessage(data.message ?? "تعذر فحص حالات LogesTechs");
          return;
        }

        const nextStatuses = Object.fromEntries(
          (data.results as LogesTechsStatusResult[]).map((result) => [result.barcode, result]),
        );
        setLogesTechsStatuses((current) => ({ ...current, ...nextStatuses }));
        setMessage(
          `تم الفحص فقط دون تعديل: ${data.summary.succeeded} ناجحة، ${data.summary.mismatched} مختلفة، ${data.summary.failed} متعذرة`,
        );
      } catch {
        setMessage("تعذر الاتصال بمسار فحص LogesTechs. حاول مرة أخرى.");
      }
    });
  };

  const checkGoogleLocations = () => {
    const locations = rows
      .filter((order) => selected.has(order.id) && order.customerArea.trim())
      .map((order) => ({ id: order.id, address: order.customerArea }));

    if (!locations.length) {
      setMessage("حدد طلبًا واحدًا على الأقل يحتوي على عنوان");
      return;
    }
    if (locations.length > 20) {
      setMessage("يمكن فحص 20 موقعًا كحد أقصى في المرة الواحدة");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/integrations/google-maps/resolve", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-QBL-Integration-Request": "location-check-v1",
          },
          // لا تُرسل أسماء العملاء أو الهواتف أو أرقام الشحن إلى Google.
          body: JSON.stringify({ locations }),
        });
        const data = await response.json();
        if (!response.ok && !Array.isArray(data.results)) {
          setMessage(data.message ?? "تعذر فحص المواقع عبر Google Maps");
          return;
        }

        const results = (data.results ?? []) as GoogleLocationResult[];
        setGoogleLocations((current) => ({
          ...current,
          ...Object.fromEntries(results.map((result) => [result.id, result])),
        }));
        setMessage(
          `فحص المواقع: ${data.summary?.verified ?? 0} مؤكدة، ${data.summary?.needsReview ?? 0} للمراجعة، ${data.summary?.failed ?? 0} متعذرة`,
        );
      } catch {
        setMessage("تعذر الاتصال بمسار فحص Google Maps. حاول مرة أخرى.");
      }
    });
  };

  const downloadVerifiedRouteFile = () => {
    const selectedOrders = rows.filter((order) => selected.has(order.id));
    if (!selectedOrders.length) {
      setMessage("حدد طلبًا واحدًا على الأقل");
      return;
    }

    let csv: string;
    try {
      csv = buildVerifiedRouteCsv(
        selectedOrders.map((order) => ({
          tracking: order.barcode || order.publicCode,
          address: order.customerArea,
          location: googleLocations[order.id]?.ok
            ? {
                ok: true,
                status: googleLocations[order.id].status ?? "NEEDS_REVIEW",
                latitude: googleLocations[order.id].latitude,
                longitude: googleLocations[order.id].longitude,
                formattedAddress: googleLocations[order.id].formattedAddress,
              }
            : googleLocations[order.id]
              ? { ok: false }
              : undefined,
        })),
      );
    } catch (error) {
      const blockedCount = error instanceof RouteExportBlockedError ? error.blockedCount : selectedOrders.length;
      setMessage(`لا يمكن إنشاء ملف المسارات: ${blockedCount} موقع لم يُؤكد بعد`);
      return;
    }
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `qbl-verified-routes-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setMessage("تم تنزيل ملف المواقع المؤكدة، وهو جاهز للرفع في محسن المسارات");
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
          <Button
            size="sm"
            variant="outline"
            disabled={pending || !selected.size}
            onClick={checkLogesTechsStatuses}
          >
            <RefreshCw className={`me-1 h-4 w-4 ${pending ? "animate-spin" : ""}`} />
            فحص LogesTechs
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={pending || !selected.size}
            onClick={checkGoogleLocations}
          >
            <MapPinned className={`me-1 h-4 w-4 ${pending ? "animate-pulse" : ""}`} />
            تأكيد المواقع
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={pending || !selected.size}
            onClick={downloadVerifiedRouteFile}
          >
            <Download className="me-1 h-4 w-4" />
            تنزيل ملف المسارات
          </Button>
          <Button asChild size="sm" variant="secondary">
            <a href="https://www.qbl.sa/route-optimizer/login">
              <ExternalLink className="me-1 h-4 w-4" />
              فتح محسن المسارات
            </a>
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
                <TableHead className="text-start">LogesTechs</TableHead>
                <TableHead className="text-start">Google Maps</TableHead>
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
                  <TableCell className="max-w-52 text-xs">
                    {(() => {
                      const external = logesTechsStatuses[order.barcode];
                      if (!external) return <span className="text-slate-400">لم يُفحص</span>;
                      if (!external.ok) return <span className="text-rose-600">تعذر الفحص</span>;
                      return (
                        <div>
                          <p className="break-all font-mono text-[11px] text-slate-600">
                            {external.externalStatus}
                          </p>
                          {external.suggestedStatus ? (
                            <p className={external.matchesCurrent ? "text-emerald-600" : "text-amber-600"}>
                              {external.matchesCurrent ? "مطابقة" : "مختلفة"} —{" "}
                              {orderStatusLabels[external.suggestedStatus]}
                            </p>
                          ) : (
                            <p className="text-slate-400">حالة غير مربوطة بعد</p>
                          )}
                        </div>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="max-w-52 text-xs">
                    {(() => {
                      const location = googleLocations[order.id];
                      if (!location) return <span className="text-slate-400">لم يُفحص</span>;
                      if (!location.ok) return <span className="text-rose-600">تعذر الفحص</span>;
                      const verified = location.status === "VERIFIED";
                      return (
                        <div className="space-y-1">
                          <p className={verified ? "text-emerald-600" : "text-amber-600"}>
                            {verified
                              ? "موقع مؤكد"
                              : location.reviewReason
                                ? reviewReasonLabels[location.reviewReason]
                                : "يحتاج مراجعة"}
                          </p>
                          {location.googleMapsUrl ? (
                            <a
                              href={location.googleMapsUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[#00A7B6] hover:underline"
                            >
                              عرض النقطة <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : null}
                        </div>
                      );
                    })()}
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
                  <TableCell colSpan={13} className="py-10 text-center text-slate-400">
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
