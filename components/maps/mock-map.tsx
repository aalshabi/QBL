"use client";

import { MapPin, Navigation, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MapMarker } from "@/lib/maps/adapter";

function position(marker: MapMarker) {
  const x = ((marker.longitude - 46.55) / 0.32) * 100;
  const y = 100 - ((marker.latitude - 24.55) / 0.32) * 100;
  return { left: `${Math.min(92, Math.max(6, x))}%`, top: `${Math.min(88, Math.max(8, y))}%` };
}

export function MockMap({
  markers,
  orderMarkers = [],
  compact = false,
}: {
  markers: MapMarker[];
  orderMarkers?: MapMarker[];
  compact?: boolean;
}) {
  return (
    <div className={cn("relative overflow-hidden rounded-lg border bg-sky-50 map-grid", compact ? "h-72" : "h-[520px]")}>
      <div className="absolute inset-x-6 top-6 flex items-center justify-between rounded-md border bg-white/90 px-3 py-2 text-xs text-muted-foreground shadow-sm">
        <span>خريطة تشغيل تجريبية · الرياض</span>
        <span className="ltr">Mock Map Adapter</span>
      </div>
      <div className="absolute bottom-10 left-10 h-24 w-40 rounded-[50%] border-8 border-primary/10" />
      <div className="absolute bottom-20 right-14 h-40 w-56 rotate-12 rounded-[50%] border-8 border-accent/20" />
      {orderMarkers.map((marker) => (
        <span
          key={marker.id}
          className="absolute grid h-7 w-7 place-items-center rounded-full bg-white text-primary shadow ring-2 ring-white"
          style={position(marker)}
          title={marker.label}
        >
          <MapPin className="h-4 w-4" />
        </span>
      ))}
      {markers.map((marker) => (
        <span
          key={marker.id}
          className={cn(
            "absolute grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full shadow-lg ring-4 ring-white",
            marker.status === "OFFLINE" ? "bg-zinc-400 text-white" : marker.status === "LATE" ? "bg-amber-500 text-white" : "bg-primary text-white",
          )}
          style={position(marker)}
          title={marker.label}
        >
          <Truck className="h-5 w-5" />
        </span>
      ))}
      <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-md bg-white/90 px-3 py-2 text-xs shadow">
        <Navigation className="h-4 w-4 text-accent" />
        تحديث كل 10-15 ثانية عند التكامل الحقيقي
      </div>
    </div>
  );
}
