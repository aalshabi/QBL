import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "warning" | "danger" | "success";
}

const TONE: Record<NonNullable<MetricCardProps["tone"]>, string> = {
  default: "border-muted bg-white",
  warning: "border-amber-200 bg-amber-50/60",
  danger: "border-rose-200 bg-rose-50/60",
  success: "border-emerald-200 bg-emerald-50/60",
};

export default function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "default",
}: MetricCardProps) {
  return (
    <article className={cn("rounded-lg border p-4", TONE[tone])}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slatebrand">{label}</span>
        <Icon className="h-4 w-4 text-accent" />
      </div>
      <p className="mt-3 font-latin text-2xl font-extrabold text-primary ltr">{value}</p>
      {hint && <p className="mt-1 text-xs text-slatebrand">{hint}</p>}
    </article>
  );
}
