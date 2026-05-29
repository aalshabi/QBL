"use client";

import { useState } from "react";
import { Camera, CheckCircle2, MapPinned, Navigation, ShieldCheck, XCircle } from "lucide-react";
import { OrderStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { DeliveryOrder } from "@/lib/domain";

export function CourierApp({ orders }: { orders: DeliveryOrder[] }) {
  const [otp, setOtp] = useState("");
  const [verified, setVerified] = useState(false);
  const current = orders.find((order) => ["OUT_FOR_DELIVERY", "ARRIVED", "ASSIGNED"].includes(order.status)) ?? orders[0];

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
              <Button><Navigation className="h-4 w-4" /> بدء الرحلة</Button>
              <Button variant="outline"><MapPinned className="h-4 w-4" /> وصلت</Button>
            </div>
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
          إرسال الموقع مصمم ليعمل كل 10-15 ثانية أو عند تغير الموقع عبر endpoint مخصص، مع احترام قيود المتصفح في الخلفية.
        </div>
      </div>
    </main>
  );
}
