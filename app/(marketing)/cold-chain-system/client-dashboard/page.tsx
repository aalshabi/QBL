import type { Metadata } from "next";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  LifeBuoy,
  Plus,
  Search,
  Snowflake,
  Thermometer,
  Truck,
  Upload,
} from "lucide-react";
import PageHero from "@/components/PageHero";
import MetricCard from "@/components/cold-chain/MetricCard";
import OrderRow from "@/components/cold-chain/OrderRow";
import {
  COLD_CHAIN_ORDERS,
  REPORT_TYPES,
  formatTime,
  isWithinRange,
} from "@/data/coldChain";

export const metadata: Metadata = {
  title: "لوحة العميل — نظام التوصيل المبرّد",
  description: "لوحة عرض تصميمية للعميل: إنشاء طلبات، تتبع، تنزيل إثبات التسليم، وتقارير SLA والحرارة.",
  alternates: { canonical: "https://qbl.sa/cold-chain-system/client-dashboard" },
};

export default function ClientDashboardPage() {
  const orders = COLD_CHAIN_ORDERS;
  const onTime = orders.filter((o) => o.status === "delivered").length;
  const tempBreaches = orders.filter(
    (o) => o.currentTemperatureC != null && !isWithinRange(o.currentTemperatureC, o.temperatureRange),
  ).length;
  const atRisk = orders.filter((o) => o.riskLevel === "at_risk" || o.riskLevel === "breached").length;

  return (
    <>
      <PageHero
        eyebrow="لوحة العميل · عرض تصميمي"
        title="متابعة طلباتك المبرّدة بوضوح"
        description="أنشئ الطلبات، تابع الحرارة والحالة، نزّل إثبات التسليم، واطّلع على تقارير SLA. هذه الواجهة عرض تصميمي يوضح بنية اللوحة المخصصة للعملاء المتعاقدين."
      />

      <section className="bg-muted/40">
        <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
          {/* Quick actions */}
          <div className="flex flex-wrap gap-3">
            <ActionButton icon={Plus} label="طلب جديد" tone="primary" />
            <ActionButton icon={Upload} label="رفع جماعي (CSV)" />
            <ActionButton icon={Download} label="تنزيل تقرير SLA" />
            <ActionButton icon={LifeBuoy} label="فتح بلاغ دعم" />
          </div>

          {/* KPIs */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard icon={Truck} label="إجمالي الطلبات اليوم" value={orders.length} hint="آخر 24 ساعة" />
            <MetricCard
              icon={CheckCircle2}
              label="تم تسليمها"
              value={onTime}
              tone="success"
              hint="إثبات تسليم متاح للتنزيل"
            />
            <MetricCard
              icon={Thermometer}
              label="تجاوزات حرارة"
              value={tempBreaches}
              tone={tempBreaches > 0 ? "danger" : "success"}
            />
            <MetricCard
              icon={AlertTriangle}
              label="طلبات تحت الخطر"
              value={atRisk}
              tone={atRisk > 0 ? "warning" : "default"}
            />
          </div>

          {/* New order form */}
          <Card title="إنشاء طلب جديد" subtitle="جميع الحقول التشغيلية الأساسية لطلب مبرّد">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Field label="نوع المنتج" placeholder="مثال: ألبان طازجة" />
              <Field label="منطقة الحرارة" select options={["مبرد (2°–8°)", "مجمد (-22° إلى -18°)", "حساس للحرارة (15°–25°)"]} />
              <Field label="نطاق الحرارة المطلوب (°م)" placeholder="2 إلى 6" />
              <Field label="نقطة الاستلام" placeholder="عنوان الاستلام" />
              <Field label="نقطة التسليم" placeholder="عنوان المستلم" />
              <Field label="المستلم" placeholder="الاسم ورقم الجوال" />
              <Field label="موعد الاستلام" type="datetime-local" />
              <Field label="نافذة التسليم — من" type="datetime-local" />
              <Field label="نافذة التسليم — إلى" type="datetime-local" />
              <Field label="أولوية SLA" select options={["قياسي", "سريع", "حرج"]} />
              <Field label="أقصى مدة عبور (دقائق)" placeholder="60" />
              <Field
                label="متطلبات إثبات التسليم"
                select
                options={["توقيع + صورة + حرارة", "توقيع + حرارة", "صورة + حرارة"]}
              />
              <div className="md:col-span-2 lg:col-span-3">
                <Field label="ملاحظات تشغيلية" textarea placeholder="تعليمات مناولة، طلبات استثنائية، رقم تواصل بديل..." />
              </div>
            </div>
            <p className="mt-4 text-xs text-slatebrand">
              يتم تأكيد دورة تبريد المركبة وتسجيل قراءة حرارة الاستلام تلقائياً عبر تطبيق السائق قبل الانتقال إلى حالة «تم الاستلام».
            </p>
          </Card>

          {/* Orders table */}
          <Card
            title="طلباتي"
            subtitle="تابع جميع الطلبات وحالة الحرارة وSLA"
            action={
              <div className="flex gap-2">
                <FilterPill label="الحالة" />
                <FilterPill label="منطقة الحرارة" />
                <FilterPill label="التزام الحرارة" />
                <div className="relative">
                  <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slatebrand" />
                  <input
                    type="search"
                    placeholder="ابحث برقم الطلب"
                    className="h-9 w-56 rounded-md border border-muted bg-white pe-8 ps-3 text-sm text-primary placeholder:text-slatebrand/70 focus:border-accent focus:outline-none"
                  />
                </div>
              </div>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-right">
                <thead>
                  <tr className="bg-muted/40 text-xs font-bold uppercase tracking-wide text-slatebrand">
                    <Th>الطلب</Th>
                    <Th>المنتج</Th>
                    <Th>المسار</Th>
                    <Th>نافذة التسليم</Th>
                    <Th>الحرارة</Th>
                    <Th>الحالة</Th>
                    <Th>SLA</Th>
                    <Th>المخاطر</Th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <OrderRow key={o.id} order={o} />
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* POD sample + reports + exceptions */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Card title="نموذج إثبات تسليم بارد" subtitle={`الطلب QBL-1044 · ${formatTime("2026-05-07T09:14:00+03:00")}`}>
              <PODCard />
            </Card>

            <Card title="التقارير المتاحة" subtitle="جاهزة للتنزيل عند تفعيلها لحسابك">
              <ul className="grid gap-2">
                {REPORT_TYPES.map((r) => (
                  <li key={r.ar} className="flex items-start gap-3 rounded-md border border-muted p-3">
                    <FileSpreadsheet className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-primary">{r.ar}</p>
                      <p className="mt-0.5 text-xs text-slatebrand">{r.desc}</p>
                    </div>
                    <button
                      type="button"
                      className="ms-auto inline-flex h-8 items-center gap-1 rounded-md border border-muted bg-white px-2 text-xs font-bold text-primary hover:bg-muted/40"
                    >
                      <Download className="h-3.5 w-3.5" />
                      تنزيل
                    </button>
                  </li>
                ))}
              </ul>
            </Card>

            <Card title="الاستثناءات الأخيرة" subtitle="تظهر هنا أي حالات تحتاج انتباهك">
              <ul className="grid gap-2 text-sm">
                <Exception
                  icon={Thermometer}
                  title="تجاوز حرارة — QBL-1043"
                  meta="9.2°م خارج النطاق (2–8°)"
                  severity="danger"
                />
                <Exception
                  icon={Clock}
                  title="فشل تسليم — QBL-1046"
                  meta="المستلم غير متاح، تم إعادة الجدولة"
                  severity="warning"
                />
                <Exception
                  icon={Snowflake}
                  title="مركبة غير مبردة — QBL-1045"
                  meta="تأجيل التحميل حتى اكتمال التبريد"
                  severity="warning"
                />
              </ul>
              <div className="mt-4 rounded-md border border-dashed border-muted p-3 text-xs text-slatebrand">
                لا يتم عرض أي استثناءات وهمية. عند عدم وجود حالات، تظهر حالة فارغة واضحة.
              </div>
            </Card>
          </div>
        </div>
      </section>
    </>
  );
}

function Card({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-muted bg-white p-5">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-primary">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-slatebrand">{subtitle}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-3 text-right">{children}</th>;
}

function ActionButton({
  icon: Icon,
  label,
  tone = "ghost",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  tone?: "primary" | "ghost";
}) {
  const styles =
    tone === "primary"
      ? "bg-primary text-white hover:bg-primary-800"
      : "border border-muted bg-white text-primary hover:bg-muted/40";
  return (
    <button
      type="button"
      className={`inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm font-bold ${styles}`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function FilterPill({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="inline-flex h-9 items-center gap-1 rounded-md border border-muted bg-white px-3 text-xs font-bold text-primary hover:bg-muted/40"
    >
      {label}
      <span className="text-slatebrand">▾</span>
    </button>
  );
}

function Field({
  label,
  placeholder,
  type = "text",
  textarea,
  select,
  options = [],
}: {
  label: string;
  placeholder?: string;
  type?: string;
  textarea?: boolean;
  select?: boolean;
  options?: string[];
}) {
  const className =
    "mt-1 block w-full rounded-md border border-muted bg-white px-3 py-2 text-sm text-primary placeholder:text-slatebrand/70 focus:border-accent focus:outline-none";
  return (
    <label className="block">
      <span className="text-xs font-bold text-slatebrand">{label}</span>
      {textarea ? (
        <textarea rows={3} placeholder={placeholder} className={className} />
      ) : select ? (
        <select className={className} defaultValue="">
          <option value="" disabled>
            اختر…
          </option>
          {options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      ) : (
        <input type={type} placeholder={placeholder} className={className} />
      )}
    </label>
  );
}

function PODCard() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-slatebrand">المستلم</p>
          <p className="text-sm font-bold text-primary">فهد العتيبي</p>
        </div>
        <div className="text-left">
          <p className="text-xs font-bold text-slatebrand">السائق</p>
          <p className="text-sm font-bold text-primary">محمد القحطاني</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <PodChip label="حرارة التسليم" value="-19.6°C" tone="success" />
        <PodChip label="حالة المنتج" value="جيد" tone="success" />
        <PodChip label="المركبة" value="veh_04" />
        <PodChip label="التزام الحرارة" value="مطابق" tone="success" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Placeholder label="صورة التسليم" subLabel="JPG · 1.2MB" />
        <Placeholder label="توقيع المستلم" subLabel="SVG" />
      </div>
      <div className="flex items-center justify-between gap-3 rounded-md border border-muted p-3 text-xs text-slatebrand">
        <span className="inline-flex items-center gap-1.5">
          <Thermometer className="h-3.5 w-3.5 text-accent" />
          سجل الحرارة كامل (3 قراءات)
        </span>
        <button
          type="button"
          className="inline-flex h-8 items-center gap-1 rounded-md bg-primary px-3 text-xs font-bold text-white"
        >
          <Download className="h-3.5 w-3.5" />
          تنزيل PDF
        </button>
      </div>
    </div>
  );
}

function PodChip({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "success" }) {
  const styles =
    tone === "success" ? "border-emerald-200 bg-emerald-50" : "border-muted bg-white";
  return (
    <div className={`rounded-md border p-3 ${styles}`}>
      <p className="text-xs font-bold text-slatebrand">{label}</p>
      <p className="mt-1 font-latin text-sm font-extrabold text-primary ltr">{value}</p>
    </div>
  );
}

function Placeholder({ label, subLabel }: { label: string; subLabel: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-muted bg-muted/30 p-4 text-center">
      <FileText className="h-5 w-5 text-slatebrand" />
      <p className="mt-2 text-xs font-bold text-primary">{label}</p>
      <p className="text-[10px] text-slatebrand">{subLabel}</p>
    </div>
  );
}

function Exception({
  icon: Icon,
  title,
  meta,
  severity,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  meta: string;
  severity: "warning" | "danger";
}) {
  const tone =
    severity === "danger"
      ? "border-rose-200 bg-rose-50/60 text-rose-800"
      : "border-amber-200 bg-amber-50/60 text-amber-800";
  return (
    <li className={`flex items-start gap-3 rounded-md border p-3 ${tone}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">
        <p className="font-bold">{title}</p>
        <p className="text-xs">{meta}</p>
      </div>
    </li>
  );
}

