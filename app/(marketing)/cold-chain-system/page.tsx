import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  BellRing,
  Boxes,
  ClipboardList,
  FileCheck,
  Fingerprint,
  Gauge,
  LayoutDashboard,
  MapPinned,
  MonitorCog,
  PackageCheck,
  RefreshCcw,
  ShieldAlert,
  Smartphone,
  Snowflake,
  Thermometer,
  Truck,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import PageHero from "@/components/PageHero";
import { STATUS_FLOW } from "@/data/coldChain";

export const metadata: Metadata = {
  title: "نظام التوصيل المبرّد",
  description:
    "نظام تشغيلي مصمم للتوصيل المبرّد داخل الرياض: من إنشاء الطلب إلى إثبات التسليم، مع ضبط الحرارة، التنبيهات، وقواعد الالتزام الزمني.",
  alternates: { canonical: "https://qbl.sa/cold-chain-system" },
  openGraph: {
    title: "نظام التوصيل المبرّد | QBL",
    description: "تشغيل واضح للسلسلة الباردة: طلبات، حرارة، تخزين، إرسال، إثبات تسليم.",
    url: "https://qbl.sa/cold-chain-system",
    type: "website",
  },
};

const PILLARS: { icon: LucideIcon; title: string; desc: string }[] = [
  {
    icon: Thermometer,
    title: "ضبط الحرارة",
    desc: "نطاق حرارة محدد لكل منتج، مع تسجيل قراءات الاستلام، الرحلة، والتسليم.",
  },
  {
    icon: Truck,
    title: "جاهزية المركبة",
    desc: "تأكيد دورة التبريد قبل التحميل، وفحص الحساسات والمسار قبل الانطلاق.",
  },
  {
    icon: Warehouse,
    title: "تخزين مبرّد منظم",
    desc: "فصل بين المجمد، المبرد، والحساس للحرارة مع منطق إدخال وإخراج واضح.",
  },
  {
    icon: FileCheck,
    title: "إثبات تسليم بارد",
    desc: "إثبات تسليم يتضمن الحرارة عند التسليم، حالة المنتج، والمستلم.",
  },
];

const MODULES: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: ClipboardList, title: "إنشاء وجدولة الطلبات", desc: "طلب فردي أو رفع جماعي مع تحديد المنتج، النطاق الحراري، نافذة التسليم، وأولوية SLA." },
  { icon: Snowflake, title: "مراقبة الحرارة", desc: "سجل قراءات لكل طلب، حالة الحساس، وإمكانية إدخال يدوي مع تسجيل السبب." },
  { icon: BellRing, title: "تنبيهات وتصعيد", desc: "تنبيهات حسب الخطورة عند الخروج عن النطاق، التأخر، أو عدم اكتمال الإثبات." },
  { icon: Warehouse, title: "إدارة المستودع المبرد", desc: "إدخال، تخزين حسب المنطقة الحرارية، تجهيز للإرسال، وفرز المسارات." },
  { icon: MonitorCog, title: "لوحة عمليات حية", desc: "شحنات، طلبات تحت الخطر، تنبيهات الحرارة، وإسناد السائقين." },
  { icon: Smartphone, title: "تطبيق السائق", desc: "قائمة استلام/تسليم، تأكيد التبريد، تسجيل الحرارة، صورة، توقيع، وأسباب فشل التسليم." },
  { icon: LayoutDashboard, title: "لوحة العميل", desc: "إنشاء طلبات، تتبع، تنزيل إثبات التسليم، وعرض تقارير SLA والحرارة." },
  { icon: ShieldAlert, title: "الاستثناءات وRTO", desc: "أسباب موثقة لفشل التسليم، إعادة جدولة، إرجاع تحت التبريد، وتسجيل التلف." },
  { icon: Gauge, title: "تقارير الأداء", desc: "تسليم في الوقت، التزام الحرارة، أسباب الفشل، أداء السائقين، واستخدام المركبات." },
];

const STATUS_GROUPS = [
  { id: "intake", title: "الاستلام", color: "bg-slate-100 text-slate-700 border-slate-200" },
  { id: "warehouse", title: "التخزين المبرد", color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  { id: "transit", title: "الرحلة", color: "bg-sky-100 text-sky-700 border-sky-200" },
  { id: "completion", title: "الإكمال", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { id: "exception", title: "الاستثناءات", color: "bg-rose-100 text-rose-700 border-rose-200" },
] as const;

const ENTRY_POINTS = [
  {
    icon: LayoutDashboard,
    title: "لوحة العميل",
    desc: "إنشاء طلبات، تتبع، إثبات تسليم، وتقارير.",
    href: "/cold-chain-system/client-dashboard",
  },
  {
    icon: MonitorCog,
    title: "لوحة العمليات",
    desc: "متابعة الشحنات، التنبيهات، السائقين، والمستودع.",
    href: "/cold-chain-system/operations-dashboard",
  },
  {
    icon: Smartphone,
    title: "تطبيق السائق",
    desc: "تأكيد التبريد، تسجيل الحرارة، إثبات التسليم.",
    href: "/cold-chain-system/driver-app",
  },
];

export default function ColdChainSystemPage() {
  return (
    <>
      <PageHero
        eyebrow="النظام التشغيلي"
        title="نظام تشغيلي مصمم للتوصيل المبرّد"
        description="من الاستلام إلى التسليم، كل خطوة قابلة للتتبع، وكل قراءة حرارة قابلة للتسجيل. النظام مصمم لدعم سلامة المنتج، ضبط الوقت، وإثبات التسليم — بدون ادعاءات عمليات حية لم يتم تفعيلها بعد."
        ctaHref="/quote"
        ctaLabel="اطلب تجربة تشغيل"
      />

      {/* Honesty banner */}
      <section className="border-b border-muted bg-muted/40">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 text-sm text-slatebrand sm:flex-row sm:items-center sm:gap-6 sm:px-6 lg:px-8">
          <span className="inline-flex h-7 items-center gap-2 rounded-md border border-accent/30 bg-accent/10 px-3 text-xs font-bold text-primary">
            <Fingerprint className="h-3.5 w-3.5" />
            وضوح
          </span>
          <p className="leading-7">
            الواجهات أدناه عرض تصميمي يوضح بنية النظام وقدراته. التشغيل الحي، تكامل حساسات IoT، والتقارير المباشرة يتم تفعيلها ضمن إعدادات العميل المتعاقد، وليست عمليات قائمة افتراضياً.
          </p>
        </div>
      </section>

      {/* Pillars */}
      <Section eyebrow="الركائز" title="أربع ركائز تشغيلية تفصل التوصيل المبرّد عن التوصيل العام">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((p) => (
            <Card key={p.title} icon={p.icon} title={p.title} desc={p.desc} />
          ))}
        </div>
      </Section>

      {/* Modules */}
      <Section eyebrow="الوحدات" title="نظام متكامل، لا واجهة تجميلية" tone="mist">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m) => (
            <Card key={m.title} icon={m.icon} title={m.title} desc={m.desc} />
          ))}
        </div>
      </Section>

      {/* Workflow */}
      <Section
        eyebrow="مسار التسليم المبرّد"
        title="من الحجز حتى الإغلاق… مسار يضبط الحرارة، الوقت، والإثبات"
      >
        <div className="grid gap-4">
          {STATUS_GROUPS.map((group) => {
            const items = STATUS_FLOW.filter((s) => s.group === group.id);
            return (
              <div key={group.id} className="rounded-lg border border-muted bg-white p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-extrabold text-primary">{group.title}</h3>
                  <span className={`rounded-md border px-2 py-1 text-xs font-bold ${group.color}`}>
                    {items.length} حالة
                  </span>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {items.map((s, i) => (
                    <div key={s.key} className="rounded-md border border-muted p-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-xs font-extrabold text-white">
                          {i + 1}
                        </span>
                        <p className="font-bold text-primary">{s.labelAr}</p>
                      </div>
                      <p className="mt-2 text-xs leading-6 text-slatebrand">{s.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Cold-chain order requirements */}
      <Section
        eyebrow="بنية الطلب المبرّد"
        title="كل طلب يحمل بصمة حرارية كاملة"
        tone="mist"
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: PackageCheck, t: "نوع المنتج وحساسيته", d: "تصنيف المنتج ومنطقة الحرارة المطلوبة قبل الجدولة." },
            { icon: Thermometer, t: "نطاق الحرارة المطلوب", d: "قيمة دنيا وعليا تستخدم في تقييم الالتزام طوال الرحلة." },
            { icon: RefreshCcw, t: "أقصى مدة عبور", d: "حد زمني لمنع التعرض الطويل خارج التخزين المبرد." },
            { icon: Snowflake, t: "تأكيد تبريد المركبة", d: "حقل إلزامي قبل الانتقال إلى حالة الاستلام." },
            { icon: FileCheck, t: "متطلبات إثبات التسليم", d: "صورة، توقيع، حرارة عند التسليم، وحالة المنتج." },
            { icon: Boxes, t: "أولوية SLA", d: "قياسي، سريع، أو حرج — تؤثر على ترتيب الإرسال والتنبيهات." },
          ].map((i) => (
            <Card key={i.t} icon={i.icon} title={i.t} desc={i.d} />
          ))}
        </div>
      </Section>

      {/* Entry points */}
      <Section eyebrow="ادخل النظام" title="ثلاث واجهات لتشغيل واحد">
        <div className="grid gap-4 md:grid-cols-3">
          {ENTRY_POINTS.map((e) => (
            <Link
              key={e.href}
              href={e.href}
              className="group rounded-lg border border-muted bg-white p-5 transition-colors hover:border-accent"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-accent/10 text-accent">
                <e.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-extrabold text-primary">{e.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slatebrand">{e.desc}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-accent">
                ادخل العرض
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </Section>

      {/* Quality wording */}
      <section className="border-t border-muted bg-primary text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_1fr] lg:px-8">
          <div>
            <p className="text-sm font-bold text-accent">الجودة والالتزام</p>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight">
              التوصيل المبرّد يحتاج انضباطاً حرارياً قبل أن يحتاج سرعة
            </h2>
            <p className="mt-4 leading-7 text-white/70">
              النظام مصمم لدعم سلامة المنتج، التتبع، إثبات التسليم، والضبط التشغيلي. لا نستخدم عبارات مثل «متوافق رسمياً» أو «مراقبة مباشرة» إلا حيث يكون التكامل مفعلاً ومثبتاً.
            </p>
          </div>
          <ul className="grid gap-3">
            {[
              "تحديد نطاق الحرارة لكل نوع منتج قبل بدء التشغيل.",
              "تسجيل قراءات الاستلام والتسليم بحد أدنى، مع سجل كامل عند تفعيل الحساسات.",
              "فصل واضح بين التسليم الناجح، التسليم مع ملاحظة، وعدم التسليم.",
              "إجراءات استثناء موثقة بدلاً من التعامل اليدوي العشوائي.",
              "جاهزية لتكامل حساسات IoT وأنظمة العميل عبر واجهات API مستقبلاً.",
            ].map((p) => (
              <li key={p} className="rounded-md border border-white/10 bg-white/10 p-4 text-sm leading-7 text-white/90">
                {p}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-muted bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_0.6fr] lg:px-8">
          <div>
            <p className="text-sm font-bold text-accent">ابدأ بنموذج تشغيل</p>
            <h2 className="mt-3 text-3xl font-extrabold text-primary sm:text-4xl">
              نصمم نموذج التشغيل المبرّد المناسب لمنتجك
            </h2>
            <p className="mt-4 max-w-2xl leading-7 text-slatebrand">
              أرسل لنا نوع المنتج، نقاط الاستلام والتسليم، نوافذ الوقت، ومستوى التوثيق المطلوب. سنقترح إعداداً مناسباً للنظام دون وعود غير محسوبة.
            </p>
          </div>
          <div className="flex flex-col justify-center gap-3">
            <Link
              href="/quote"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-bold text-white transition-colors hover:bg-primary-800"
            >
              اطلب عرض تشغيل
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <Link
              href="/cold-chain-system/operations-dashboard"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-muted bg-white px-6 text-sm font-bold text-primary transition-colors hover:bg-muted/60"
            >
              شاهد لوحة العمليات
              <MapPinned className="h-4 w-4 text-accent" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function Section({
  eyebrow,
  title,
  children,
  tone = "white",
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  tone?: "white" | "mist";
}) {
  return (
    <section className={tone === "mist" ? "bg-muted/40" : "bg-white"}>
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-bold text-accent">{eyebrow}</p>
          <h2 className="mt-3 text-3xl font-extrabold leading-tight text-primary sm:text-4xl">{title}</h2>
        </div>
        {children}
      </div>
    </section>
  );
}

function Card({ icon: Icon, title, desc }: { icon: LucideIcon; title: string; desc: string }) {
  return (
    <article className="h-full rounded-lg border border-muted bg-white p-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-md bg-accent/10 text-accent">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-5 text-lg font-extrabold text-primary">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slatebrand">{desc}</p>
    </article>
  );
}
