"use client";

import { Navigation } from "lucide-react";
import type { MapMarker } from "@/lib/maps/adapter";

/**
 * Renders the courier's live position using the Google Maps Embed API.
 * Requires NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY — a separate, browser-exposed
 * key restricted by HTTP referrer in Google Cloud Console, distinct from the
 * server-only GOOGLE_MAPS_API_KEY used elsewhere (route optimizer).
 */
export function LiveGoogleMap({ marker, compact = false }: { marker: MapMarker; compact?: boolean }) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;
  const hasPosition = marker.latitude !== 0 || marker.longitude !== 0;

  if (!apiKey) {
    return (
      <div className={compact ? "grid h-72 place-items-center rounded-lg border bg-muted/40" : "grid h-[520px] place-items-center rounded-lg border bg-muted/40"}>
        <p className="max-w-xs text-center text-sm text-muted-foreground">
          خريطة قوقل غير مفعّلة بعد. أضف NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY لعرض الموقع المباشر.
        </p>
      </div>
    );
  }

  if (!hasPosition) {
    return (
      <div className={compact ? "grid h-72 place-items-center rounded-lg border bg-muted/40" : "grid h-[520px] place-items-center rounded-lg border bg-muted/40"}>
        <p className="max-w-xs text-center text-sm text-muted-foreground">لا توجد بيانات موقع مسجّلة لهذه الشحنة بعد.</p>
      </div>
    );
  }

  const src = `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(apiKey)}&q=${marker.latitude},${marker.longitude}&zoom=14`;

  return (
    <div className={`relative overflow-hidden rounded-lg border ${compact ? "h-72" : "h-[520px]"}`}>
      <iframe
        title="موقع الشحنة المباشر"
        src={src}
        className="h-full w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-md bg-white/90 px-3 py-2 text-xs shadow">
        <Navigation className="h-4 w-4 text-accent" />
        موقع مباشر عبر خرائط قوقل
      </div>
    </div>
  );
}
