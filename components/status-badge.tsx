import { Badge } from "@/components/ui/badge";
import { courierStatusLabels, statusLabels } from "@/lib/company";
import type { CourierStatus, OrderStatus, TemperatureStatus } from "@/lib/domain";

const orderTone: Record<OrderStatus, string> = {
  CREATED: "bg-slate-100 text-slate-800",
  ASSIGNED: "bg-blue-100 text-blue-800",
  OUT_FOR_DELIVERY: "bg-amber-100 text-amber-900",
  ARRIVED: "bg-orange-100 text-orange-900",
  DELIVERED: "bg-emerald-100 text-emerald-800",
  FAILED: "bg-red-100 text-red-800",
};

const courierTone: Record<CourierStatus, string> = {
  AVAILABLE: "bg-emerald-100 text-emerald-800",
  ON_TASK: "bg-blue-100 text-blue-800",
  LATE: "bg-amber-100 text-amber-900",
  OFFLINE: "bg-zinc-200 text-zinc-700",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge className={orderTone[status]}>{statusLabels[status]}</Badge>;
}

export function CourierStatusBadge({ status }: { status: CourierStatus }) {
  return <Badge className={courierTone[status]}>{courierStatusLabels[status]}</Badge>;
}

export function TemperatureBadge({ status, value }: { status: TemperatureStatus; value?: number }) {
  const tone =
    status === "CRITICAL"
      ? "bg-red-100 text-red-800"
      : status === "WARNING"
        ? "bg-amber-100 text-amber-900"
        : "bg-cyan-100 text-cyan-900";
  return <Badge className={tone}>{value === undefined ? "لا توجد قراءة" : `${value}°C`}</Badge>;
}
