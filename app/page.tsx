import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  FileCheck2,
  MapPinned,
  PackageCheck,
  Route,
  ShieldCheck,
  Snowflake,
  Thermometer,
  Truck,
} from "lucide-react";
import { MockMap } from "@/components/maps/mock-map";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { operatingMetrics, sectors, services } from "@/lib/company";
import { couriers, deliveryOrders } from "@/lib/mock-data";
import { toCourierMarkers, toOrderMarkers } from "@/lib/maps/adapter";

const proofPoints = [
  { icon: Thermometer, label: "تبريد 0 إلى +5" },
  { icon: MapPinned, label: "تتبع مباشر" },
  { icon: ShieldCheck, label: "كود استلام OTP" },
];

const flow = [
  { icon: PackageCheck, title: "استلام", text: "نستلم الطلب من مستودعك أو فرعك." },
  { icon: Route, title: "تشغيل", text: "نختار المندوب والمسار المناسب." },
  { icon: MapPinned, title: "تتبع", text: "عميلك يرى الحالة ووقت الوصول." },
  { icon: FileCheck2, title: "تسليم", text: "إغلاق موثق بكود استلام." },
];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden bg-primary text-primary-foreground">
          <div className="absolute inset-0 opacity-15 map-grid" />
          <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_0.95fr] lg:px-8 lg:py-16">
            <div className="self-center">
              <Badge className="bg-accent text-accent-foreground">Last-Mile Cold Chain · Riyadh</Badge>
              <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
                توصيل مبرّد يحافظ على جودة منتجك حتى باب العميل
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-8 text-white/82">
                حلول توصيل مبرّد للشركات في الرياض، مع تتبع مباشر وكود استلام يقلل النزاعات ويرفع ثقة العميل.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {proofPoints.map((item) => (
                  <span key={item.label} className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/8 px-3 py-2 text-sm">
                    <item.icon className="h-4 w-4 text-accent" />
                    {item.label}
                  </span>
                ))}
              </div>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Link href="/quote">
                    اطلب تصور تشغيل
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <Link href="/track">جرّب التتبع</Link>
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-lg border border-white/15 bg-white/8 p-3 shadow-2xl">
                <MockMap markers={toCourierMarkers(couriers.slice(0, 7))} orderMarkers={toOrderMarkers(deliveryOrders.slice(0, 8))} compact />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {operatingMetrics.map((stat) => (
                  <div key={stat.label} className="rounded-lg border border-white/15 bg-white/8 p-4">
                    <p className="text-2xl font-bold ltr text-right">{stat.value}</p>
                    <p className="mt-1 text-xs text-white/70">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b bg-background">
          <div className="mx-auto grid max-w-7xl gap-3 px-4 py-6 sm:px-6 md:grid-cols-3 lg:px-8">
            {["للغذاء والدواء والتجزئة", "تقليل الهدر والاتصالات", "لوحة عمليات وتتبع لحظي"].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm font-semibold">
                <CheckCircle2 className="h-5 w-5 text-accent" />
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="font-bold text-accent">الخدمات</p>
              <h2 className="mt-2 text-3xl font-bold text-primary">كل ما تحتاجه لتوصيل مبرّد موثوق</h2>
            </div>
            <Button asChild variant="outline">
              <Link href="/services">كل الخدمات</Link>
            </Button>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {services.slice(0, 4).map((service) => (
              <Card key={service.title} className="rounded-lg">
                <CardContent className="p-5">
                  <Snowflake className="h-6 w-6 text-accent" />
                  <h3 className="mt-4 text-base font-bold text-primary">{service.title}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="bg-muted/60">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <p className="font-bold text-accent">طريقة العمل</p>
            <h2 className="mt-2 text-3xl font-bold text-primary">مسار واضح من الطلب إلى التسليم</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {flow.map((step, index) => (
                <Card key={step.title} className="rounded-lg">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <step.icon className="h-6 w-6 text-accent" />
                      <span className="font-mono text-sm text-muted-foreground">0{index + 1}</span>
                    </div>
                    <h3 className="mt-4 font-bold text-primary">{step.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{step.text}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="font-bold text-accent">القطاعات</p>
              <h2 className="mt-2 text-3xl font-bold text-primary">نخدم الشركات الحساسة للوقت والحرارة</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {sectors.map((sector) => (
                <Badge key={sector} variant="secondary" className="px-3 py-1 text-sm">
                  {sector}
                </Badge>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-primary text-primary-foreground">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 py-12 sm:px-6 lg:flex-row lg:items-center lg:px-8">
            <div>
              <p className="text-sm text-white/70">جاهز لتجربة تشغيل أوضح؟</p>
              <h2 className="mt-2 text-3xl font-bold">احصل على تصور تشغيل مبرّد لشركتك</h2>
            </div>
            <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link href="/quote">
                اطلب الآن
                <Truck className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
