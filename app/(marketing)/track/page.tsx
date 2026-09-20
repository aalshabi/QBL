"use client";

import { useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import { TrackingView } from "@/components/tracking/tracking-view";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TrackingSnapshot } from "@/lib/domain";

/**
 * تتبع عام بإدخال رقم الشحنة، بدل رابط SMS/WhatsApp الموقّع وحده — كما ينص
 * الهدف. التحقق الثانوي (آخر 4 أرقام من الجوال) عبر /api/tracking/lookup
 * يمنع تخمين رقم شحنة عشوائي من كشف بيانات عميل آخر.
 */
export default function TrackEntryPage() {
  const [publicCode, setPublicCode] = useState("");
  const [phoneLast4, setPhoneLast4] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [snapshot, setSnapshot] = useState<TrackingSnapshot | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("loading");
    setSnapshot(null);
    try {
      const response = await fetch("/api/tracking/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicCode, phoneLast4 }),
      });
      if (!response.ok) {
        setStatus("error");
        return;
      }
      const data = await response.json();
      setSnapshot(data.snapshot);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  if (snapshot) {
    const mapProvider = process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY ? "google" : "mock";
    return <TrackingView snapshot={snapshot} mapProvider={mapProvider} />;
  }

  return (
    <main className="mx-auto grid min-h-[70vh] max-w-4xl place-items-center px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md rounded-lg">
        <CardHeader>
          <p className="font-bold text-accent">تتبع الشحنة</p>
          <CardTitle className="text-2xl font-bold text-primary">أين شحنتي؟</CardTitle>
          <p className="text-sm text-muted-foreground">أدخل رقم الشحنة وآخر 4 أرقام من رقم الجوال المسجل على الطلب.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="publicCode">رقم الشحنة</Label>
              <Input
                id="publicCode"
                dir="ltr"
                className="ltr"
                required
                value={publicCode}
                onChange={(event) => setPublicCode(event.target.value)}
                placeholder="QBL-20260430-0001"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phoneLast4">آخر 4 أرقام من الجوال</Label>
              <Input
                id="phoneLast4"
                inputMode="numeric"
                maxLength={4}
                dir="ltr"
                className="ltr text-center tracking-[0.35em]"
                required
                value={phoneLast4}
                onChange={(event) => setPhoneLast4(event.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="1234"
              />
            </div>
            <Button type="submit" className="w-full" disabled={status === "loading" || phoneLast4.length !== 4 || !publicCode}>
              <Search className="h-4 w-4" />
              {status === "loading" ? "جاري البحث..." : "تتبع الشحنة"}
            </Button>
            {status === "error" ? (
              <p className="text-center text-sm font-semibold text-destructive">
                رقم الشحنة أو آخر 4 أرقام من الجوال غير صحيحة، أو الطلب لم يعد قابلًا للتتبع.
              </p>
            ) : null}
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
