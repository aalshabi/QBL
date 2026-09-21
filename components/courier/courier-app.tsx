"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  Clock,
  MapPin,
  Navigation,
  Phone,
  Play,
  ShieldCheck,
  Thermometer,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { nextStepFor, navigationUrl, telHref, type CourierOrderView } from "@/lib/orders/courier-view";
import type { OrderStatus } from "@/lib/domain";

/**
 * شاشة المندوب. مبدأ التصميم: خطوة واحدة ظاهرة في كل حالة.
 *
 * النسخة السابقة كانت تعرض كل الأزرار دائماً — «وصلت» و«تم التسليم» و«تعذر
 * التسليم» معاً — وأربعة منها بلا onClick أصلاً، والتحقق من الرمز كان مقارنة
 * نصية في المتصفح. هنا: الحالة تحدد الزر الأساسي، وكل إجراء يمر بالخادم،
 * ولا تتقدم الشاشة قبل أن يؤكد الخادم.
 */

const ERROR_TEXT: Record<string, string> = {
  OTP_NOT_VERIFIED: "أكمل التحقق من رمز الاستلام أولاً.",
  ILLEGAL_TRANSITION: "حالة الطلب تغيّرت. حدّث الشاشة.",
  ORDER_CHANGED_CONCURRENTLY: "حالة الطلب تغيّرت. حدّث الشاشة.",
  ORDER_NOT_ASSIGNED_TO_COURIER: "هذا الطلب لم يعد مسنداً لك.",
  ORDER_NOT_AT_DELIVERY_STAGE: "لا يمكن قراءة الرمز قبل الوصول.",
  FAILURE_REASON_REQUIRED: "اكتب سبب تعذر التسليم.",
  RATE_LIMITED: "محاولات كثيرة. انتظر قليلاً ثم أعد المحاولة.",
  NO_ACTIVE_CODE: "لا يوجد رمز نشط لهذا الطلب. تواصل مع العمليات.",
  EXPIRED: "انتهت صلاحية الرمز. اطلب رمزاً جديداً من العمليات.",
  TOO_MANY_ATTEMPTS: "استُهلكت محاولات الرمز. تواصل مع العمليات.",
  UNAUTHORIZED: "انتهت الجلسة. سجّل الدخول من جديد.",
};

const NETWORK_ERROR = "تعذّر الاتصال. لم يُحفظ التغيير — أعد المحاولة.";

const TEMPERATURE_TEXT: Record<string, { label: string; tone: string }> = {
  NORMAL: { label: "ضمن النطاق", tone: "text-emerald-700" },
  WARNING: { label: "خارج النطاق", tone: "text-amber-700" },
  CRITICAL: { label: "خارج النطاق بفارق كبير", tone: "text-destructive" },
  NOT_AVAILABLE: { label: "لا توجد قراءة", tone: "text-muted-foreground" },
};

const STATUS_TEXT: Record<OrderStatus, string> = {
  CREATED: "قيد الإنشاء",
  ASSIGNED: "مسند لك",
  OUT_FOR_DELIVERY: "في الطريق",
  ARRIVED: "عند الباب",
  DELIVERED: "تم التسليم",
  FAILED: "تعذر التسليم",
};

function minutesSince(iso: string): number {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
}

export function CourierApp({ orders, courierName }: { orders: CourierOrderView[]; courierName: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [failureOpen, setFailureOpen] = useState(false);
  const [failureReason, setFailureReason] = useState("");
  const [temperature, setTemperature] = useState("");
  const [tempState, setTempState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [sharingLocation, setSharingLocation] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  const current = orders[0];
  const rest = orders.slice(1);
  const step = current ? nextStepFor(current.status) : null;

  const stopSharing = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setSharingLocation(false);
  }, []);

  const startSharing = useCallback(
    (orderId: string) => {
      if (!("geolocation" in navigator) || watchIdRef.current !== null) return;
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          void fetch("/api/courier/location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              speedKph: position.coords.speed != null ? position.coords.speed * 3.6 : undefined,
              heading: position.coords.heading ?? undefined,
            }),
          }).catch(() => undefined);
        },
        () => setSharingLocation(false),
        { enableHighAccuracy: true, maximumAge: 15_000 },
      );
      setSharingLocation(true);
    },
    [],
  );

  useEffect(() => stopSharing, [stopSharing]);

  // مشاركة الموقع تتبع حالة الطلب، لا زراً منفصلاً ينساه المندوب مفتوحاً.
  useEffect(() => {
    if (current?.status !== "OUT_FOR_DELIVERY" && watchIdRef.current !== null) stopSharing();
  }, [current?.status, stopSharing]);

  async function post(url: string, payload: unknown): Promise<{ ok: boolean; body: Record<string, unknown> }> {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    return { ok: response.ok, body };
  }

  async function transition(target: OrderStatus, reason?: string) {
    if (!current || busy) return;
    setBusy(true);
    setError(null);
    try {
      const { ok, body } = await post(`/api/orders/${current.id}/status`, { status: target, reason });
      if (!ok) {
        setError(ERROR_TEXT[String(body.error)] ?? "تعذّر تنفيذ الإجراء.");
        return;
      }
      // لا تتقدم الشاشة إلا بعد تأكيد الخادم.
      if (target === "OUT_FOR_DELIVERY") startSharing(current.id);
      if (target === "DELIVERED" || target === "FAILED") stopSharing();
      setOtp("");
      setOtpVerified(false);
      setFailureOpen(false);
      setFailureReason("");
      router.refresh();
    } catch {
      setError(NETWORK_ERROR);
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp() {
    if (!current || busy || otp.length !== 6) return;
    setBusy(true);
    setError(null);
    try {
      const { ok, body } = await post(`/api/orders/${current.id}/verify-otp`, { otp });
      if (!ok) {
        const key = String(body.error);
        const remaining = typeof body.remainingAttempts === "number" ? body.remainingAttempts : null;
        setError(
          key === "MISMATCH"
            ? `الرمز غير صحيح.${remaining !== null ? ` المحاولات المتبقية: ${remaining}` : ""}`
            : (ERROR_TEXT[key] ?? "تعذّر التحقق من الرمز."),
        );
        return;
      }
      setOtpVerified(true);
    } catch {
      setError(NETWORK_ERROR);
    } finally {
      setBusy(false);
    }
  }

  async function submitTemperature() {
    const celsius = Number(temperature);
    if (!current || !Number.isFinite(celsius)) return;
    setTempState("sending");
    try {
      const { ok } = await post("/api/courier/temperature", { orderId: current.id, celsius });
      setTempState(ok ? "sent" : "error");
      if (ok) {
        setTemperature("");
        router.refresh();
      }
    } catch {
      setTempState("error");
    }
  }

  if (!current || !step) {
    return (
      <main className="grid min-h-screen place-items-center bg-muted/40 px-4 text-center">
        <div>
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-700" aria-hidden="true" />
          <p className="mt-3 text-lg font-bold text-primary">لا توجد طلبات نشطة</p>
          <p className="mt-1 text-sm text-muted-foreground">{courierName}</p>
        </div>
      </main>
    );
  }

  const temp = current.temperature;
  const tempInfo = TEMPERATURE_TEXT[temp?.status ?? "NOT_AVAILABLE"];

  return (
    <main className="min-h-screen bg-muted/40 pb-10">
      <div className="mx-auto max-w-md px-4 py-4">
        <div className="flex items-baseline justify-between">
          <h1 className="text-xl font-bold text-primary">{courierName}</h1>
          <p className="text-sm text-muted-foreground">{orders.length} طلب متبقٍ</p>
        </div>

        <Card className="mt-4 rounded-lg">
          <CardContent className="space-y-4 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="ltr text-lg font-bold text-primary">{current.publicCode}</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                {STATUS_TEXT[current.status]}
              </span>
            </div>

            {current.isDelayed && (
              <p className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 p-2 text-sm font-semibold text-amber-800">
                <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                الطلب متأخر عن موعده.
              </p>
            )}

            <div className="rounded-lg bg-muted p-3">
              <p className="flex items-start gap-2 font-semibold">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                {current.dropoffAddress}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{current.customerName}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {current.serviceType} · {current.temperatureTarget}
              </p>
              <p className={`mt-2 flex items-center gap-1.5 text-sm font-semibold ${tempInfo.tone}`}>
                <Thermometer className="h-4 w-4" aria-hidden="true" />
                {temp ? `${temp.celsius}°م — ${tempInfo.label}` : tempInfo.label}
                {temp && <span className="font-normal text-muted-foreground">· قبل {minutesSince(temp.recordedAt)} د</span>}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button asChild variant="outline" className="h-12">
                <a href={navigationUrl(current.dropoffLatitude, current.dropoffLongitude)} target="_blank" rel="noopener noreferrer">
                  <Navigation className="h-5 w-5" aria-hidden="true" /> افتح الملاحة
                </a>
              </Button>
              <Button asChild variant="outline" className="h-12">
                <a href={telHref(current.customerPhone)}>
                  <Phone className="h-5 w-5" aria-hidden="true" /> اتصل بالعميل
                </a>
              </Button>
            </div>

            {step.kind === "START" && (
              <Button className="h-14 w-full text-base" disabled={busy} onClick={() => transition("OUT_FOR_DELIVERY")}>
                <Play className="h-5 w-5" aria-hidden="true" /> {step.label}
              </Button>
            )}

            {step.kind === "ARRIVE" && (
              <Button className="h-14 w-full text-base" disabled={busy} onClick={() => transition("ARRIVED")}>
                <MapPin className="h-5 w-5" aria-hidden="true" /> {step.label}
              </Button>
            )}

            {step.kind === "DELIVER" && (
              <div className="space-y-3 rounded-lg border p-3">
                <Label htmlFor="otp" className="text-sm font-semibold">
                  رمز الاستلام من العميل
                </Label>
                <Input
                  id="otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  dir="ltr"
                  value={otp}
                  disabled={otpVerified}
                  onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
                  className="ltr h-14 text-center text-2xl tracking-[0.35em]"
                />
                {otpVerified ? (
                  <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> تم التحقق من الرمز.
                  </p>
                ) : (
                  <Button className="h-12 w-full" variant="outline" disabled={busy || otp.length !== 6} onClick={verifyOtp}>
                    <ShieldCheck className="h-5 w-5" aria-hidden="true" /> تحقق من الرمز
                  </Button>
                )}
                <Button
                  className="h-14 w-full bg-accent text-base text-accent-foreground hover:bg-accent/90"
                  disabled={busy || !otpVerified}
                  onClick={() => transition("DELIVERED")}
                >
                  <CheckCircle2 className="h-5 w-5" aria-hidden="true" /> {step.label}
                </Button>
              </div>
            )}

            {error && (
              <p role="alert" className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-2 text-sm font-semibold text-destructive">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {error}
              </p>
            )}

            {sharingLocation && (
              <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                <Navigation className="h-3.5 w-3.5" aria-hidden="true" /> مشاركة الموقع فعّالة أثناء الرحلة.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="mt-3 rounded-lg">
          <CardContent className="space-y-2 p-4">
            <Label htmlFor="temp" className="text-sm font-semibold">
              تسجيل قراءة حرارة المركبة
            </Label>
            <div className="flex gap-2">
              <Input
                id="temp"
                type="number"
                step="0.1"
                dir="ltr"
                className="ltr h-12"
                value={temperature}
                onChange={(event) => setTemperature(event.target.value)}
                placeholder="4.5"
              />
              <Button className="h-12 px-4" disabled={!temperature || tempState === "sending"} onClick={submitTemperature}>
                <Thermometer className="h-5 w-5" aria-hidden="true" /> تسجيل
              </Button>
            </div>
            {tempState === "sent" && <p className="text-xs font-semibold text-emerald-700">تم تسجيل القراءة.</p>}
            {tempState === "error" && <p className="text-xs font-semibold text-destructive">تعذّر تسجيل القراءة.</p>}
          </CardContent>
        </Card>

        <Card className="mt-3 rounded-lg">
          <CardContent className="space-y-3 p-4">
            {failureOpen ? (
              <>
                <Label htmlFor="failure" className="text-sm font-semibold">
                  سبب تعذر التسليم
                </Label>
                <Textarea
                  id="failure"
                  value={failureReason}
                  onChange={(event) => setFailureReason(event.target.value)}
                  placeholder="مثال: العميل لا يرد، العنوان مغلق"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="h-12" onClick={() => setFailureOpen(false)}>
                    إلغاء
                  </Button>
                  <Button
                    variant="destructive"
                    className="h-12"
                    disabled={busy || failureReason.trim().length < 3}
                    onClick={() => transition("FAILED", failureReason)}
                  >
                    <XCircle className="h-5 w-5" aria-hidden="true" /> تأكيد التعذر
                  </Button>
                </div>
              </>
            ) : (
              <Button variant="outline" className="h-12 w-full" onClick={() => setFailureOpen(true)}>
                <XCircle className="h-5 w-5" aria-hidden="true" /> تعذر التسليم
              </Button>
            )}
          </CardContent>
        </Card>

        {rest.length > 0 && (
          <div className="mt-5">
            <h2 className="text-sm font-bold text-muted-foreground">الطلبات التالية</h2>
            <ul className="mt-2 space-y-2">
              {rest.map((order) => (
                <li key={order.id} className="flex items-center justify-between gap-2 rounded-lg border bg-background p-3">
                  <div className="min-w-0">
                    <p className="ltr text-sm font-bold text-primary">{order.publicCode}</p>
                    <p className="truncate text-xs text-muted-foreground">{order.dropoffAddress}</p>
                  </div>
                  <ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}
