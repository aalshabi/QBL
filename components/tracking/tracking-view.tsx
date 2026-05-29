"use client";

import { useMemo, useState } from "react";
import { Clock, KeyRound, PhoneCall, RefreshCcw, ShieldCheck, Thermometer } from "lucide-react";
import { MockMap } from "@/components/maps/mock-map";
import { OrderStatusBadge, TemperatureBadge } from "@/components/status-badge";
import { StatusTimeline } from "@/components/timeline";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TrackingSnapshot } from "@/lib/domain";

export function TrackingView({ snapshot }: { snapshot: TrackingSnapshot }) {
  const [resent, setResent] = useState(false);
  const marker = useMemo(
    () => [
      {
        id: snapshot.courier.employeeCode,
        label: snapshot.courier.employeeCode,
        latitude: snapshot.courier.latitude,
        longitude: snapshot.courier.longitude,
        status: snapshot.order.status,
      },
    ],
    [snapshot],
  );

  return (
    <main className="min-h-screen bg-muted/40">
      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <div className="space-y-6">
          <Card className="rounded-lg">
            <CardHeader className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">رقم الشحنة</p>
                  <h1 className="text-2xl font-bold text-primary ltr text-right">{snapshot.order.publicCode}</h1>
                </div>
                <OrderStatusBadge status={snapshot.order.status} />
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border p-4">
                <Clock className="h-5 w-5 text-accent" />
                <p className="mt-3 text-sm text-muted-foreground">الوصول المتوقع</p>
                <p className="text-xl font-bold">{snapshot.order.etaMinutes} دقيقة</p>
              </div>
              <div className="rounded-lg border p-4">
                <Thermometer className="h-5 w-5 text-accent" />
                <p className="mt-3 text-sm text-muted-foreground">الحرارة</p>
                <TemperatureBadge status={snapshot.order.temperatureStatus} value={snapshot.order.currentTemperature} />
              </div>
              <div className="rounded-lg border p-4">
                <ShieldCheck className="h-5 w-5 text-accent" />
                <p className="mt-3 text-sm text-muted-foreground">النطاق المطلوب</p>
                <p className="font-bold">{snapshot.order.temperatureTarget}</p>
              </div>
            </CardContent>
          </Card>

          <MockMap markers={marker} compact />

          <Card className="rounded-lg">
            <CardHeader><CardTitle>خط حالة الطلب</CardTitle></CardHeader>
            <CardContent><StatusTimeline events={snapshot.order.timeline} /></CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card className="rounded-lg">
            <CardHeader><CardTitle>المندوب</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <p className="font-bold">{snapshot.courier.displayName}</p>
                <p className="mt-1 text-sm text-muted-foreground ltr text-right">{snapshot.courier.employeeCode}</p>
              </div>
              <Button variant="outline" className="w-full">
                <PhoneCall className="h-4 w-4" />
                تواصل عبر رقم مقنّع {snapshot.courier.phoneMasked}
              </Button>
              <p className="text-xs text-muted-foreground">
                آخر تحديث موقع: {new Intl.DateTimeFormat("ar-SA", { hour: "2-digit", minute: "2-digit" }).format(new Date(snapshot.courier.lastPingAt))}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-lg">
            <CardHeader><CardTitle>كود الاستلام OTP</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid place-items-center rounded-lg border bg-background p-6">
                <KeyRound className="h-7 w-7 text-accent" />
                <p className="mt-3 text-3xl font-bold tracking-[0.35em] ltr">{snapshot.otp.masked}</p>
                <p className="mt-2 text-center text-sm text-muted-foreground">
                  يظهر الكود للعميل عبر الرسالة، ولا يستطيع المندوب إغلاق الطلب إلا بعد التحقق منه.
                </p>
              </div>
              <Button variant="outline" className="w-full" onClick={() => setResent(true)}>
                <RefreshCcw className="h-4 w-4" />
                إعادة إرسال الكود
              </Button>
              {resent ? (
                <Alert>
                  <AlertTitle>تم تسجيل طلب إعادة الإرسال</AlertTitle>
                  <AlertDescription>في التكامل الحقيقي يتم الإرسال عبر SMS/WhatsApp adapter مع سجل NotificationLog.</AlertDescription>
                </Alert>
              ) : null}
            </CardContent>
          </Card>
        </aside>
      </section>
    </main>
  );
}
