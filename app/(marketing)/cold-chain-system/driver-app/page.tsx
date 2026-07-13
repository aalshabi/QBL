import type { Metadata } from "next";
import {
  Battery,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ClipboardList,
  Cog,
  MapPin,
  Navigation,
  PenLine,
  PlayCircle,
  ScanLine,
  Signal,
  Snowflake,
  Thermometer,
  Truck,
  Wifi,
} from "lucide-react";
import PageHero from "@/components/PageHero";
import { FAILED_DELIVERY_REASONS, formatTime } from "@/data/coldChain";

export const metadata: Metadata = {
  title: "تطبيق السائق — نظام التوصيل المبرّد",
  description: "معاينة تصميمية لتطبيق السائق: تأكيد التبريد، تسجيل الحرارة، إثبات التسليم، وأسباب فشل التسليم.",
  alternates: { canonical: "https://qbl.sa/cold-chain-system/driver-app" },
};

export default function DriverAppPage() {
  return (
    <>
      <PageHero
        eyebrow="تطبيق السائق · معاينة تصميمية"
        title="تطبيق يقلل الأخطاء قبل أن يطالب بالسرعة"
        description="مهمة السائق ليست فقط التوصيل، بل تأكيد التبريد، تسجيل قراءات الحرارة، وتوثيق التسليم. التطبيق مصمم ليصعب نسيان خطوة، ويسهل تنفيذها."
      />

      <section className="bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid items-start gap-6 lg:grid-cols-[auto_1fr]">
            {/* Phones */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <Phone title="بدء الرحلة">
                <ScreenStartRoute />
              </Phone>
              <Phone title="تسليم وإثبات">
                <ScreenDelivery />
              </Phone>
            </div>

            {/* Feature explanation */}
            <div className="space-y-4">
              <FeatureCard
                icon={Snowflake}
                title="تأكيد دورة تبريد المركبة"
                desc="حقل إلزامي مع طابع زمني قبل الانتقال إلى الاستلام. يمنع التحميل في مركبة غير جاهزة."
              />
              <FeatureCard
                icon={ScanLine}
                title="مسح الطلب"
                desc="مسح الباركود أو إدخال الرقم لربط القراءات وإثبات التسليم بالطلب الصحيح."
              />
              <FeatureCard
                icon={Thermometer}
                title="تسجيل حرارة الاستلام والتسليم"
                desc="إدخال يدوي أو قراءة من الحساس عند التفعيل، مع التحقق من النطاق وتنبيه فوري عند الخروج."
              />
              <FeatureCard
                icon={Camera}
                title="صورة + توقيع"
                desc="إثبات تسليم متكامل: صورة المنتج عند التسليم، توقيع المستلم، وحالة المنتج."
              />
              <FeatureCard
                icon={ClipboardList}
                title="أسباب فشل التسليم"
                desc="قائمة موحدة من الأسباب لتجنب الإدخال الحر العشوائي ولتمكين التحليل لاحقاً."
              />
              <FeatureCard
                icon={Truck}
                title="إرجاع تحت التبريد"
                desc="عند تعذر التسليم، يفعّل التطبيق مسار الإرجاع مع الحفاظ على سلسلة التبريد."
              />
              <div className="rounded-lg border border-dashed border-muted bg-white p-4 text-xs text-slatebrand">
                المعاينة لا تتصل بسيرفر مباشر. الواجهة جاهزة للربط بطبقة API لاحقاً، مع تخزين محلي مؤقت يدعم العمل عند انقطاع الشبكة (Offline-ready design).
              </div>
            </div>
          </div>

          {/* Failed delivery reasons */}
          <section className="mt-10 rounded-lg border border-muted bg-white p-5">
            <header className="mb-4">
              <h2 className="text-lg font-extrabold text-primary">قائمة أسباب فشل التسليم</h2>
              <p className="mt-1 text-sm text-slatebrand">
                مغلقة، قابلة للتحليل، وتربط مباشرة بإجراء التصعيد في لوحة العمليات.
              </p>
            </header>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {FAILED_DELIVERY_REASONS.map((r) => (
                <li
                  key={r.key}
                  className="flex items-center gap-2 rounded-md border border-muted p-3 text-sm text-primary"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />
                  {r.labelAr}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </section>
    </>
  );
}

function Phone({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[320px]">
      <p className="mb-2 text-center text-xs font-bold text-slatebrand">{title}</p>
      <div className="overflow-hidden rounded-[36px] border-[10px] border-primary bg-white shadow-xl">
        <PhoneStatusBar />
        {children}
      </div>
    </div>
  );
}

function PhoneStatusBar() {
  return (
    <div className="flex items-center justify-between bg-primary px-5 py-1.5 font-latin text-[10px] font-bold text-white ltr">
      <span>9:41</span>
      <span className="inline-flex items-center gap-1">
        <Signal className="h-3 w-3" />
        <Wifi className="h-3 w-3" />
        <Battery className="h-3 w-3" />
      </span>
    </div>
  );
}

function ScreenStartRoute() {
  return (
    <div className="flex h-[520px] flex-col bg-white">
      <div className="flex items-center justify-between border-b border-muted px-4 py-3">
        <ChevronLeft className="h-5 w-5 text-primary" />
        <p className="text-sm font-extrabold text-primary">رحلة الصباح</p>
        <Cog className="h-5 w-5 text-slatebrand" />
      </div>
      <div className="space-y-3 overflow-y-auto px-4 py-4">
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700">
              <Snowflake className="h-3.5 w-3.5" /> دورة تبريد المركبة
            </span>
            <span className="font-latin text-xs font-bold text-emerald-700 ltr">3.8°C</span>
          </div>
          <p className="mt-1 text-[11px] text-emerald-800">المركبة جاهزة ضمن نطاق 2°–8°</p>
          <button className="mt-2 inline-flex h-8 w-full items-center justify-center rounded-md bg-emerald-600 text-xs font-bold text-white">
            تأكيد الجاهزية
          </button>
        </div>

        <div className="rounded-md border border-muted p-3">
          <div className="flex items-center justify-between text-xs font-bold text-slatebrand">
            <span>قائمة الاستلام (2)</span>
            <span className="font-latin ltr">{formatTime("2026-05-07T08:00:00+03:00")}</span>
          </div>
          <ul className="mt-2 grid gap-2">
            <PickupItem code="QBL-1042" addr="مستودع المالقا" zone="مبرد" />
            <PickupItem code="QBL-1047" addr="مزرعة الخرج" zone="مجمد" />
          </ul>
        </div>

        <div className="rounded-md border border-muted p-3">
          <div className="flex items-center justify-between text-xs font-bold text-slatebrand">
            <span>قائمة التسليم (3)</span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span className="font-latin ltr">14 km</span>
            </span>
          </div>
          <ul className="mt-2 grid gap-2">
            <DeliveryItem code="QBL-1042" addr="فرع حطين" eta="10:30" />
            <DeliveryItem code="QBL-1043" addr="صيدلية الياسمين" eta="11:00" warn />
            <DeliveryItem code="QBL-1047" addr="مستودع التوزيع" eta="11:45" />
          </ul>
        </div>

        <button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-bold text-white">
          <PlayCircle className="h-4 w-4" />
          بدء الرحلة
        </button>
        <button className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-muted text-xs font-bold text-primary">
          <ScanLine className="h-3.5 w-3.5" />
          مسح طلب
        </button>
      </div>
    </div>
  );
}

function ScreenDelivery() {
  return (
    <div className="flex h-[520px] flex-col bg-white">
      <div className="flex items-center justify-between border-b border-muted px-4 py-3">
        <ChevronLeft className="h-5 w-5 text-primary" />
        <p className="text-sm font-extrabold text-primary">QBL-1042</p>
        <Navigation className="h-5 w-5 text-accent" />
      </div>
      <div className="space-y-3 overflow-y-auto px-4 py-4">
        <div className="rounded-md border border-muted p-3">
          <p className="text-[11px] font-bold text-slatebrand">المستلم</p>
          <p className="mt-0.5 text-sm font-bold text-primary">مطعم حطين — أحمد العتيبي</p>
          <p className="mt-1 font-latin text-[11px] text-slatebrand ltr">+966 55 000 1234</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <TempInput label="حرارة الاستلام" value="3.4°" ok />
          <TempInput label="حرارة التسليم" value="—" />
        </div>

        <button className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-accent/10 text-xs font-bold text-primary">
          <Thermometer className="h-3.5 w-3.5 text-accent" />
          سجّل قراءة حرارة التسليم
        </button>

        <div className="grid grid-cols-2 gap-2">
          <ProofTile icon={Camera} label="صورة المنتج" />
          <ProofTile icon={PenLine} label="توقيع المستلم" />
        </div>

        <div className="rounded-md border border-muted p-3">
          <p className="text-[11px] font-bold text-slatebrand">حالة المنتج</p>
          <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
            <ConditionChip label="جيد" active />
            <ConditionChip label="ملاحظة" />
            <ConditionChip label="تالف" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button className="inline-flex h-10 items-center justify-center rounded-md bg-primary text-xs font-bold text-white">
            تم التسليم
          </button>
          <button className="inline-flex h-10 items-center justify-center rounded-md border border-rose-300 text-xs font-bold text-rose-700">
            لم يتم التسليم
          </button>
        </div>
        <p className="text-center text-[10px] text-slatebrand">
          الإثبات لا يكتمل بدون: صورة، توقيع، حرارة تسليم، وحالة منتج.
        </p>
      </div>
    </div>
  );
}

function PickupItem({ code, addr, zone }: { code: string; addr: string; zone: string }) {
  return (
    <li className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
      <div className="min-w-0">
        <p className="font-latin text-xs font-bold text-primary ltr">{code}</p>
        <p className="text-[11px] text-slatebrand">{addr}</p>
      </div>
      <span className="rounded-md border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-[10px] font-bold text-cyan-700">
        {zone}
      </span>
    </li>
  );
}

function DeliveryItem({ code, addr, eta, warn }: { code: string; addr: string; eta: string; warn?: boolean }) {
  return (
    <li
      className={`flex items-center justify-between rounded-md px-3 py-2 ${
        warn ? "border border-rose-200 bg-rose-50" : "bg-muted/50"
      }`}
    >
      <div className="min-w-0">
        <p className="font-latin text-xs font-bold text-primary ltr">{code}</p>
        <p className="text-[11px] text-slatebrand">{addr}</p>
      </div>
      <span className="font-latin text-[11px] font-bold text-primary ltr">{eta}</span>
    </li>
  );
}

function TempInput({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div
      className={`rounded-md border p-2 ${
        ok ? "border-emerald-200 bg-emerald-50/60" : "border-muted bg-white"
      }`}
    >
      <p className="text-[10px] font-bold text-slatebrand">{label}</p>
      <p
        className={`mt-1 font-latin text-base font-extrabold ltr ${
          ok ? "text-emerald-700" : "text-slatebrand"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function ProofTile({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button className="flex flex-col items-center justify-center gap-1 rounded-md border border-dashed border-muted bg-muted/30 py-4 text-[11px] font-bold text-primary">
      <Icon className="h-5 w-5 text-accent" />
      {label}
    </button>
  );
}

function ConditionChip({ label, active }: { label: string; active?: boolean }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-md border px-2 py-1 font-bold ${
        active
          ? "border-emerald-300 bg-emerald-50 text-emerald-800"
          : "border-muted bg-white text-slatebrand"
      }`}
    >
      {label}
    </span>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <article className="rounded-lg border border-muted bg-white p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-accent/10 text-accent">
          <Icon className="h-4 w-4" />
        </span>
        <h3 className="text-sm font-extrabold text-primary">{title}</h3>
      </div>
      <p className="mt-2 text-sm leading-6 text-slatebrand">{desc}</p>
    </article>
  );
}
