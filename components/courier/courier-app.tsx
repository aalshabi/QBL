"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, MapPinned, Navigation, ShieldCheck, Thermometer, XCircle } from "lucide-react";
import { OrderStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { DeliveryOrder } from "@/lib/domain";

const LOCATION_PING_INTERVAL_MS = 15_000;

export function CourierApp({ orders }: { orders: DeliveryOrder[] }) {
  const [otp, setOtp] = useState("");
  const [verified, setVerified] = useState(false);
  const [tripActive, setTripActive] = useState(false);
  const [temperature, setTemperature] = useState("");
  const [tempStatus, setTempStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [locationStatus, setLocationStatus] = useState<"idle" | "active" | "error">("idle");
  const watchIdRef = useRef<number | null>(null);
  const current = orders.find((order) => ["OUT_FOR_DELIVERY", "ARRIVED", "ASSIGNED"].includes(order.status)) ?? orders[0];

  async function sendLocationPing(position: GeolocationPosition) {
    try {
      const response = await fetch("/api/courier/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: current.id,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          speedKph: position.coords.speed != null ? position.coords.speed * 3.6 : undefined,
          heading: position.coords.heading ?? undefined,
        }),
      });
      setLocationStatus(response.ok ? "active" : "error");
    } catch {
      setLocationStatus("error");
    }
  }

  function toggleTrip() {
    if (tripActive) {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setTripActive(false);
      setLocationStatus("idle");
      return;
    }

    if (!("geolocation" in navigator)) {
      setLocationStatus("error");
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(sendLocationPing, () => setLocationStatus("error"), {
      enableHighAccuracy: true,
      maximumAge: LOCATION_PING_INTERVAL_MS,
    });
    setTripActive(true);
    setLocationStatus("active");
  }

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  async function submitTemperature() {
    const celsius = Number(temperature);
    if (!Number.isFinite(celsius)) return;
    setTempStatus("sending");
    try {
      const response = await fetch("/api/courier/temperature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: current.id, celsius }),
      });
      setTempStatus(response.ok ? "sent" : "error");
      if (response.ok) setTemperature("");
    } catch {
      setTempStatus("error");
    }
  }

  return (
    <main className="min-h-screen bg-muted/50">
      <div className="mx-auto max-w-md px-4 py-5">
        <div>
          <p className="text-sm font-bold text-accent">QBL Courier PWA</p>
          <h1 className="text-2xl font-bold text-primary">مهام اليوم</h1>
        </div>

        <Card className="mt-5 rounded-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg ltr">{current.publicCode}</CardTitle>
              <OrderStatusBadge status={current.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <p className="font-semibold">{current.dropoffAddress}</p>
              <p className="mt-1 text-sm text-muted-foreground">{current.serviceType} · {current.temperatureTarget}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={toggleTrip} variant={tripActive ? "outline" : "default"}>
                <Navigation className="h-4 w-4" /> {tripActive ? "إيقاف مشاركة الموقع" : "بدء الرحلة"}
              </Button>
              <Button variant="outline"><MapPinned className="h-4 w-4" /> وصلت</Button>
            </div>
            {locationStatus === "active" && (
              <p className="text-xs font-semibold text-emerald-700">مشاركة الموقع فعّالة — يُرسل تلقائيًا أثناء الرحلة.</p>
            )}
            {locationStatus === "error" && (
              <p className="text-xs font-semibold text-destructive">تعذّر إرسال الموقع — تحقق من إذن الموقع في المتصفح.</p>
            )}
          </CardContent>
        </Card>

        <Card className="mt-4 rounded-lg">
          <CardHeader><CardTitle className="text-lg">قراءة حرارة المركبة</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2">
              <Label htmlFor="temp-reading">الحرارة الحالية (°م)</Label>
              <div className="flex gap-2">
                <Input
                  id="temp-reading"
                  type="number"
                  step="0.1"
                  dir="ltr"
                  className="ltr"
                  value={temperature}
                  onChange={(event) => setTemperature(event.target.value)}
                  placeholder="مثال: 4.5"
                />
                <Button onClick={submitTemperature} disabled={!temperature || tempStatus === "sending"}>
                  <Thermometer className="h-4 w-4" /> تسجيل
                </Button>
              </div>
            </div>
            {tempStatus === "sent" && <p className="text-xs font-semibold text-emerald-700">تم تسجيل القراءة.</p>}
            {tempStatus === "error" && <p className="text-xs font-semibold text-destructive">تعذّر تسجيل القراءة.</p>}
          </CardContent>
        </Card>

        <Card className="mt-4 rounded-lg">
          <CardHeader><CardTitle className="text-lg">تأكيد التسليم</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="otp">كود الاستلام</Label>
              <Input id="otp" inputMode="numeric" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))} className="text-center text-2xl tracking-[0.35em] ltr" />
            </div>
            <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={otp.length !== 6} onClick={() => setVerified(otp === "123456")}>
              <ShieldCheck className="h-4 w-4" />
              تحقق من الكود
            </Button>
            {verified ? <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700"><CheckCircle2 className="h-4 w-4" /> تم التحقق، يمكن إغلاق الطلب.</p> : null}
            <Button className="w-full" disabled={!verified}>
              <CheckCircle2 className="h-4 w-4" />
              تم التسليم
            </Button>
          </CardContent>
        </Card>

        <Card className="mt-4 rounded-lg">
          <CardHeader><CardTitle className="text-lg">إثبات أو تعذر التسليم</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full"><Camera className="h-4 w-4" /> رفع صورة إثبات</Button>
            <Textarea placeholder="سبب تعذر التسليم عند الحاجة" />
            <Button variant="destructive" className="w-full"><XCircle className="h-4 w-4" /> تعذر التسليم</Button>
          </CardContent>
        </Card>

        <div className="mt-4 rounded-lg border bg-background p-3 text-xs leading-6 text-muted-foreground">
          يُرسل الموقع تلقائيًا أثناء الرحلة عبر متصفح الجوال. أوقف تشغيل الشاشة يوقف الإرسال حسب قيود المتصفح في الخلفية.
        </div>
      </div>
    </main>
  );
}
