import { Badge } from "@/components/ui/badge";
import type { AdminCodStatus, AdminOrderStatus, CodSettlementStatus } from "@/lib/admin/types";
import { codStatusLabels, orderStatusLabels, settlementStatusLabels } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

const orderStatusStyles: Record<AdminOrderStatus, string> = {
  CREATED: "bg-slate-100 text-slate-700 border-slate-200",
  PENDING_APPROVAL: "bg-amber-100 text-amber-800 border-amber-200",
  ASSIGNED: "bg-sky-100 text-sky-800 border-sky-200",
  OUT_FOR_DELIVERY: "bg-indigo-100 text-indigo-800 border-indigo-200",
  ARRIVED: "bg-cyan-100 text-cyan-800 border-cyan-200",
  DELIVERED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  POSTPONED: "bg-orange-100 text-orange-800 border-orange-200",
  RETURNED: "bg-rose-100 text-rose-800 border-rose-200",
  FAILED: "bg-red-100 text-red-800 border-red-200",
  CANCELLED: "bg-zinc-200 text-zinc-600 border-zinc-300",
};

export function AdminOrderStatusBadge({ status }: { status: AdminOrderStatus }) {
  return (
    <Badge variant="outline" className={cn("font-medium", orderStatusStyles[status])}>
      {orderStatusLabels[status]}
    </Badge>
  );
}

const codStatusStyles: Record<AdminCodStatus, string> = {
  WITH_COURIER: "bg-amber-100 text-amber-800 border-amber-200",
  RECEIVED: "bg-sky-100 text-sky-800 border-sky-200",
  SORTED: "bg-indigo-100 text-indigo-800 border-indigo-200",
  EXPORTED: "bg-cyan-100 text-cyan-800 border-cyan-200",
  SETTLED: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

export function CodStatusBadge({ status }: { status: AdminCodStatus | null }) {
  if (!status) return <span className="text-slate-400">—</span>;
  return (
    <Badge variant="outline" className={cn("font-medium", codStatusStyles[status])}>
      {codStatusLabels[status]}
    </Badge>
  );
}

const settlementStyles: Record<CodSettlementStatus, string> = {
  SORTED: "bg-indigo-100 text-indigo-800 border-indigo-200",
  EXPORTED: "bg-cyan-100 text-cyan-800 border-cyan-200",
  DELIVERED: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

export function SettlementStatusBadge({ status }: { status: CodSettlementStatus }) {
  return (
    <Badge variant="outline" className={cn("font-medium", settlementStyles[status])}>
      {settlementStatusLabels[status]}
    </Badge>
  );
}
