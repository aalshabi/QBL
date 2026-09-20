"use client";

import { useEffect, useRef, useState } from "react";
import { Navigation } from "lucide-react";
import type { MapMarker } from "@/lib/maps/adapter";

const SCRIPT_ID = "google-maps-js-api";

declare global {
  interface Window {
    google?: typeof google;
  }
}

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  if (window.google?.maps) return Promise.resolve();

  const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("GOOGLE_MAPS_SCRIPT_LOAD_FAILED")), { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&loading=async`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("GOOGLE_MAPS_SCRIPT_LOAD_FAILED"));
    document.head.appendChild(script);
  });
}

function boxClass(compact: boolean) {
  return compact
    ? "grid h-72 place-items-center rounded-lg border bg-muted/40"
    : "grid h-[520px] place-items-center rounded-lg border bg-muted/40";
}

/**
 * Renders via the Google Maps JavaScript API — not the Embed API — because
 * the provisioned browser key only has "Maps JavaScript API" enabled in
 * Google Cloud Console. Loads the SDK once per page via a plain <script>
 * tag (no extra dependency) and keeps a single Map/Marker instance alive
 * across position updates instead of remounting an iframe each time.
 */
function GoogleMapCanvas({ marker, compact, apiKey }: { marker: MapMarker; compact: boolean; apiKey: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    loadGoogleMapsScript(apiKey)
      .then(() => {
        if (!cancelled) setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  useEffect(() => {
    if (status !== "ready" || !containerRef.current || !window.google?.maps) return;

    const position = { lat: marker.latitude, lng: marker.longitude };

    if (!mapRef.current) {
      mapRef.current = new window.google.maps.Map(containerRef.current, {
        center: position,
        zoom: 14,
        disableDefaultUI: true,
        zoomControl: true,
      });
    } else {
      mapRef.current.setCenter(position);
    }

    if (!markerRef.current) {
      markerRef.current = new window.google.maps.Marker({ position, map: mapRef.current, title: marker.label });
    } else {
      markerRef.current.setPosition(position);
    }
  }, [status, marker.latitude, marker.longitude, marker.label]);

  if (status === "error") {
    return (
      <div className={boxClass(compact)}>
        <p className="max-w-xs text-center text-sm text-muted-foreground">
          تعذّر تحميل خرائط قوقل. تحقق من صلاحية المفتاح وقيود المُحيل (HTTP referrer) في Google Cloud Console.
        </p>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-lg border ${compact ? "h-72" : "h-[520px]"}`}>
      <div ref={containerRef} className="h-full w-full" />
      {status === "loading" ? (
        <div className="absolute inset-0 grid place-items-center bg-muted/40">
          <p className="text-sm text-muted-foreground">جاري تحميل الخريطة...</p>
        </div>
      ) : null}
      <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-md bg-white/90 px-3 py-2 text-xs shadow">
        <Navigation className="h-4 w-4 text-accent" />
        موقع مباشر عبر خرائط قوقل
      </div>
    </div>
  );
}

export function LiveGoogleMap({ marker, compact = false }: { marker: MapMarker; compact?: boolean }) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY;
  const hasPosition = marker.latitude !== 0 || marker.longitude !== 0;

  if (!apiKey) {
    return (
      <div className={boxClass(compact)}>
        <p className="max-w-xs text-center text-sm text-muted-foreground">
          خريطة قوقل غير مفعّلة بعد. أضف NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY لعرض الموقع المباشر.
        </p>
      </div>
    );
  }

  if (!hasPosition) {
    return (
      <div className={boxClass(compact)}>
        <p className="max-w-xs text-center text-sm text-muted-foreground">لا توجد بيانات موقع مسجّلة لهذه الشحنة بعد.</p>
      </div>
    );
  }

  return <GoogleMapCanvas marker={marker} compact={compact} apiKey={apiKey} />;
}
