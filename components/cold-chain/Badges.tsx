import { cn } from "@/lib/utils";
import {
  ALERTS,
  RISK_LABEL,
  SEVERITY_LABEL,
  SLA_LABEL,
  STATUS_META,
  ZONE_LABEL,
  type AlertSeverity,
  type DeliveryStatus,
  type RiskLevel,
  type SlaPriority,
  type TemperatureZone,
} from "@/data/coldChain";

const baseChip =
  "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-bold whitespace-nowrap";

export function StatusBadge({ status }: { status: DeliveryStatus }) {
  const meta = STATUS_META[status];
  const tone =
    meta.group === "completion" && status === "delivered"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : meta.group === "exception" || status === "temp_warning"
      ? "bg-rose-50 text-rose-700 border-rose-200"
      : meta.group === "transit"
      ? "bg-sky-50 text-sky-700 border-sky-200"
      : meta.group === "warehouse"
      ? "bg-indigo-50 text-indigo-700 border-indigo-200"
      : "bg-slate-50 text-slate-700 border-slate-200";
  return <span className={cn(baseChip, tone)}>{meta.labelAr}</span>;
}

export function RiskBadge({ level }: { level: RiskLevel }) {
  const r = RISK_LABEL[level];
  return <span className={cn(baseChip, r.tone)}>{r.ar}</span>;
}

export function SlaBadge({ priority }: { priority: SlaPriority }) {
  const s = SLA_LABEL[priority];
  return <span className={cn(baseChip, s.tone)}>{s.ar}</span>;
}

export function ZoneBadge({ zone }: { zone: TemperatureZone }) {
  const z = ZONE_LABEL[zone];
  const tone =
    zone === "frozen"
      ? "bg-sky-50 text-sky-700 border-sky-200"
      : zone === "chilled"
      ? "bg-cyan-50 text-cyan-700 border-cyan-200"
      : "bg-amber-50 text-amber-700 border-amber-200";
  return (
    <span className={cn(baseChip, tone)}>
      {z.ar} · {z.range.minC}° / {z.range.maxC}°
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: AlertSeverity }) {
  const s = SEVERITY_LABEL[severity];
  return (
    <span className={cn(baseChip, s.tone)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {s.ar}
    </span>
  );
}

export function alertCountBySeverity() {
  return ALERTS.reduce(
    (acc, a) => ({ ...acc, [a.severity]: (acc[a.severity] || 0) + 1 }),
    {} as Record<AlertSeverity, number>,
  );
}
