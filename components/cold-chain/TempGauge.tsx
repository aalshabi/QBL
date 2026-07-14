import { cn } from "@/lib/utils";
import { isWithinRange, type TemperatureRange } from "@/data/coldChain";
import { Thermometer } from "lucide-react";

interface TempGaugeProps {
  current: number;
  range: TemperatureRange;
  label?: string;
  size?: "sm" | "md";
}

export default function TempGauge({ current, range, label, size = "md" }: TempGaugeProps) {
  const within = isWithinRange(current, range);
  const span = Math.max(range.maxC - range.minC + 10, 4);
  const min = range.minC - 5;
  const pct = Math.max(0, Math.min(100, ((current - min) / span) * 100));
  const okMin = ((range.minC - min) / span) * 100;
  const okMax = ((range.maxC - min) / span) * 100;

  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        within ? "border-emerald-200 bg-emerald-50/40" : "border-rose-200 bg-rose-50/40",
        size === "sm" && "p-3",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slatebrand">
          <Thermometer className={cn("text-accent", size === "sm" ? "h-4 w-4" : "h-5 w-5")} />
          {label ?? "حرارة المركبة"}
        </div>
        <div className="font-latin text-xs font-semibold text-slatebrand ltr">
          {range.minC}° / {range.maxC}°
        </div>
      </div>
      <div className={cn("mt-3 flex items-baseline gap-1", size === "sm" ? "" : "")}>
        <span
          className={cn(
            "font-latin font-extrabold ltr",
            within ? "text-emerald-700" : "text-rose-700",
            size === "sm" ? "text-2xl" : "text-3xl",
          )}
        >
          {current.toFixed(1)}
        </span>
        <span className="font-latin text-sm font-semibold text-slatebrand ltr">°C</span>
        <span className={cn("ms-auto text-xs font-bold", within ? "text-emerald-700" : "text-rose-700")}>
          {within ? "ضمن النطاق" : "خارج النطاق"}
        </span>
      </div>
      <div className="relative mt-3 h-2 rounded-full bg-slate-100">
        <div
          className="absolute top-0 h-2 rounded-full bg-emerald-200/70"
          style={{ left: `${okMin}%`, width: `${Math.max(0, okMax - okMin)}%` }}
        />
        <div
          className={cn(
            "absolute top-1/2 h-3 w-1 -translate-y-1/2 rounded-sm",
            within ? "bg-emerald-600" : "bg-rose-600",
          )}
          style={{ left: `calc(${pct}% - 2px)` }}
        />
      </div>
    </div>
  );
}
