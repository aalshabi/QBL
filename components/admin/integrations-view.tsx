"use client";

import { useState } from "react";
import {
  CheckCircle2,
  CircleAlert,
  Database,
  ExternalLink,
  MapPinned,
  RefreshCw,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { IntegrationService } from "@/lib/integrations/overview";
import { cn } from "@/lib/utils";

const serviceIcons = {
  logestechs: Truck,
  "google-maps": MapPinned,
  neon: Database,
} as const;

const stateStyles = {
  configured: "border-emerald-200 bg-emerald-50 text-emerald-700",
  not_configured: "border-slate-200 bg-slate-100 text-slate-600",
  needs_attention: "border-amber-200 bg-amber-50 text-amber-700",
} as const;

type HealthState =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "healthy"; latencyMs: number; checkedAt: string }
  | { state: "failed"; message: string };

type HealthService = "logestechs" | "google-maps";

const initialHealth: Record<HealthService, HealthState> = {
  logestechs: { state: "idle" },
  "google-maps": { state: "idle" },
};

export function IntegrationsView({ services }: { services: IntegrationService[] }) {
  const [healthByService, setHealthByService] = useState(initialHealth);

  async function checkIntegration(service: HealthService) {
    setHealthByService((current) => ({ ...current, [service]: { state: "checking" } }));
    try {
      const response = await fetch(`/api/admin/integrations/${service}/health`, {
        cache: "no-store",
      });
      const data = (await response.json()) as {
        latencyMs?: number;
        checkedAt?: string;
        message?: string;
      };
      if (!response.ok || typeof data.latencyMs !== "number" || !data.checkedAt) {
        setHealthByService((current) => ({
          ...current,
          [service]: { state: "failed", message: data.message ?? "تعذر فحص الاتصال" },
        }));
        return;
      }
      setHealthByService((current) => ({
        ...current,
        [service]: { state: "healthy", latencyMs: data.latencyMs!, checkedAt: data.checkedAt! },
      }));
    } catch {
      setHealthByService((current) => ({
        ...current,
        [service]: { state: "failed", message: "تعذر الوصول إلى مسار فحص الاتصال" },
      }));
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      {services.map((service) => {
        const Icon = serviceIcons[service.id];
        const isLogesTechs = service.id === "logestechs";
        const isGoogleMaps = service.id === "google-maps";
        const healthService: HealthService | null = isLogesTechs
          ? "logestechs"
          : isGoogleMaps
            ? "google-maps"
            : null;
        const health = healthService ? healthByService[healthService] : null;
        return (
          <Card key={service.id} className="border-0 bg-white shadow-sm ring-1 ring-slate-200">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0D1B3A] text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#00A7B6]">{service.category}</p>
                    <CardTitle className="mt-1 text-lg text-[#0D1B3A]">{service.name}</CardTitle>
                  </div>
                </div>
                <Badge variant="outline" className={cn("h-auto py-1", stateStyles[service.state])}>
                  {service.stateLabel}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="flex flex-1 flex-col gap-4">
              <p className="leading-6 text-slate-600">{service.description}</p>
              <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
                {service.mode}
              </div>
              <ul className="space-y-2">
                {service.capabilities.map((capability) => (
                  <li key={capability} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{capability}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50/70 p-3 text-xs leading-5 text-amber-900">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{service.boundary}</span>
              </div>

              {healthService && health ? (
                <div className="space-y-2 border-t border-slate-100 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={service.state !== "configured" || health.state === "checking"}
                    onClick={() => checkIntegration(healthService)}
                  >
                    <RefreshCw className={cn("h-4 w-4", health.state === "checking" && "animate-spin")} />
                    {health.state === "checking"
                      ? "جارٍ فحص الاتصال"
                      : isGoogleMaps
                        ? "فحص Google Maps الآن"
                        : "فحص الاتصال الآن"}
                  </Button>
                  {health.state === "healthy" ? (
                    <div className="space-y-1 text-xs text-emerald-700">
                      <p className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        متصل — زمن الاستجابة {health.latencyMs} مللي ثانية
                      </p>
                      <p className="text-slate-500">
                        آخر فحص: {new Intl.DateTimeFormat("ar-SA", { hour: "2-digit", minute: "2-digit" }).format(new Date(health.checkedAt))}
                      </p>
                    </div>
                  ) : null}
                  {health.state === "failed" ? (
                    <p className="flex items-center gap-2 text-xs text-rose-700">
                      <CircleAlert className="h-4 w-4" />
                      {health.message}
                    </p>
                  ) : null}
                  {isGoogleMaps ? (
                    <Button asChild type="button" variant="secondary" className="w-full">
                      <a href="https://www.qbl.sa/route-optimizer/login">
                        <ExternalLink className="h-4 w-4" />
                        فتح تأكيد المواقع ومحسن المسارات
                      </a>
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
