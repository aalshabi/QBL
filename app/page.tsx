import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  FileSignature,
  PackageCheck,
  ShieldCheck,
  Snowflake,
  Sun,
  Thermometer,
} from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { CtaBand, Section } from "@/components/marketing/section";

const problems = [
  "حرارة صندوق المركبة في نهار السعودية.",
  "التعرض المباشر للشمس أثناء التحميل والتسليم.",
  "الانتظار الطويل بين نقاط التوصيل.",
  "تغير قوام السيروم والكريمات أو انفصال مكوناتها.",
  "تلف العبوة الخارجية وانطباع العميل الأول.",
  "شكاوى ومرتجعات تستهلك فريقك وهامشك.",
];

const journey = [
  { icon: ClipboardCheck, title: "مراجعة تعليمات الحفظ", text: "المكتوبة على المنتج أو الواردة من الشركة المصنّعة." },
  { icon: ShieldCheck, title: "تحديد مستوى الحماية", text: "المناسب لحساسية المنتج ومدة الرحلة." },
  { icon: Snowflake, title: "تجهيز المركبة وأدوات العزل", text: "قبل الاستلام." },
  { icon: PackageCheck, title: "استلام منظم", text: "من مستودعك أو نقطة التجهيز." },
  { icon: Thermometer, title: "رحلة محمية حرارياً", text: "وفق المستوى المتفق عليه." },
  { icon: FileSignature, title: "تسليم موثق", text: "بتوقيع إلكتروني عند باب العميل." },
];

const tiers = [
  {
    name: "Heat Protected",
    when: "حماية من الشمس المباشرة وحرارة المركبة للمنتجات متوسطة الحساسية.",
    icon: Sun,
  },
  {
    name: "Temperature Controlled",
    when: "نطاق حراري متفق عليه مع أدوات عزل، وقياس عند تفعيله ضمن نموذج التشغيل.",
    icon: Thermometer,
  },
  {
    name: "Refrigerated Delivery",
    when: "للمنتجات ذات تعليمات حفظ محددة من المصنّع، بعد التحقق من القدرة التشغيلية للمسار.",
    icon: Snowflake,
  },
];

const products = [
  "السيروم ومنتجات فيتامين C",
  "الكريمات الحساسة",
  "المستحضرات الطبيعية والعضوية",
  "منتجات العناية الاحترافية",
  "مستحضرات عيادات الجلدية والتجميل",
  "العناية بالشعر",
  "عينات العلامات التجارية",
  "العبوات الزجاجية الفاخرة",
  "العطور والمنتجات المحتوية على الكحول بعد تحديد متطلبات نقلها",
];

const audiences = [
  "العلامات التجارية العالمية",
  "موزعو مستحضرات التجميل",
  "المتاجر الإلكترونية",
  "شركات D2C",
  "سلاسل الصيدليات",
  "عيادات الجلدية والتجميل",
  "الصالونات ومراكز العناية",
  "العلامات السعودية الناشئة",
];

const whyQbl = [
  "تخصص كامل في آخر ميل لمستحضرات التجميل — لا نتشتت بين عشرة قطاعات.",
  "نموذج حماية يتغير حسب المنتج، لا حسب حجم الطرد.",
  "تشغيل مصمم من البداية لحرارة الرياض.",
  "توثيق استلام وتسليم يناسب قيمة منتجك.",
  "رحلات مخصصة للعلامات ذات القيمة العالية.",
  "تجربة تشغيل محدودة قبل أي التزام طويل.",
  "مسار تصعيد واضح عند التأخير أو رفض التسليم.",
];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden bg-primary text-primary-foreground">
          <div className="absolute inset-0 opacity-15 map-grid" />
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <p className="text-sm font-bold text-accent">QBL Beauty Shield</p>
            <h1 className="mt-4 max-w-4xl text-3xl font-extrabold leading-tight sm:text-5xl">
              نقل محمي حرارياً ومبرد لمستحضرات التجميل في الرياض
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-white/78">
              قدام بابك QBL تحمي مستحضرات التجميل ومنتجات العناية الحساسة من حرارة الجو أثناء التوصيل، من مستودع
              العلامة التجارية حتى باب العميل، وفق تعليمات حفظ المنتج ومستوى الحماية المتفق عليه.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/trial"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-accent px-6 text-sm font-bold text-accent-foreground transition-colors hover:bg-accent/90"
              >
                ابدأ تجربة Beauty Shield
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <Link
                href="/trial"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-white/20 bg-white/5 px-6 text-sm font-bold text-white transition-colors hover:bg-white/10"
              >
                اطلب تقييم المنتج والمسار
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-2 text-xs text-white/70">
              {["الرياض", "B2B وB2B2C", "حماية حرارية حسب المنتج", "توثيق تسليم حسب الاتفاق"].map((chip) => (
                <span key={chip} className="rounded-lg border border-white/15 bg-white/8 px-3 py-2">
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </section>

        <Section
          eyebrow="المشكلة"
          title="التوصيل العادي لا يحمي دائماً منتجات العناية"
          description="المنتج الذي غادر مستودعك بجودة كاملة قد يصل مختلفاً. الأسباب معروفة، لكنها نادراً ما تُعالج:"
        >
          <ul className="grid gap-3 md:grid-cols-2">
            {problems.map((p) => (
              <li key={p} className="flex items-start gap-3 rounded-lg border border-line bg-frost-50 p-4 text-slatebrand">
                <Sun className="mt-0.5 h-5 w-5 shrink-0 text-amber" />
                <span className="text-sm leading-7">{p}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 max-w-3xl text-lg font-bold leading-8 text-primary">
            آخر ميل هو أخطر مرحلة في رحلة منتج التجميل — وهو تخصصنا الوحيد.
          </p>
        </Section>

        <Section
          eyebrow="الحل"
          title="Beauty Shield يحمي المنتج خلال آخر ميل"
          description="رحلة كل شحنة تمر بست خطوات واضحة:"
          tone="mist"
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {journey.map((step, i) => (
              <article key={step.title} className="rounded-lg border border-line bg-white p-5">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-md bg-frost text-accent">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <span className="font-mono text-sm text-muted-foreground">0{i + 1}</span>
                </div>
                <h3 className="mt-5 text-lg font-extrabold text-primary">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slatebrand">{step.text}</p>
              </article>
            ))}
          </div>
        </Section>

        <Section
          eyebrow="المستويات"
          title="مستويات Beauty Shield الثلاثة"
          description="المرجع الحراري لكل منتج هو تعليمات الشركة المصنّعة — لا نعتمد نطاقاً واحداً لكل المنتجات."
        >
          <div className="grid gap-4 md:grid-cols-3">
            {tiers.map((tier, index) => (
              <article
                key={tier.name}
                className={`flex flex-col rounded-lg border bg-white p-6 ${
                  index === 1 ? "border-accent shadow-sm" : "border-line"
                }`}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-frost text-accent">
                  <tier.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 ltr text-right text-xl font-extrabold text-primary">{tier.name}</h3>
                <p className="mt-3 text-sm leading-7 text-slatebrand">{tier.when}</p>
              </article>
            ))}
          </div>
          <div className="mt-4">
            <Link href="/protection-levels" className="inline-flex items-center gap-2 text-sm font-bold text-accent hover:underline">
              تفاصيل المستويات وكيف نختار
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
        </Section>

        <Section eyebrow="المنتجات" title="منتجات نعرف كيف نحميها" tone="mist">
          <div className="flex flex-wrap gap-2">
            {products.map((item) => (
              <span key={item} className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium text-primary">
                {item}
              </span>
            ))}
          </div>
        </Section>

        <Section eyebrow="لمن صُمم Beauty Shield؟" title="عملاء نبني حولهم نموذج التشغيل">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {audiences.map((item) => (
              <article key={item} className="flex items-center gap-3 rounded-lg border border-line bg-white p-4">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-accent" />
                <p className="text-sm font-bold text-primary">{item}</p>
              </article>
            ))}
          </div>
        </Section>

        <Section eyebrow="لماذا QBL؟" title="تخصص واحد نتقنه بدل عشرة قطاعات" tone="mist">
          <ul className="grid gap-3 md:grid-cols-2">
            {whyQbl.map((point) => (
              <li key={point} className="flex items-start gap-3 rounded-lg border border-line bg-white p-4 text-slatebrand">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                <span className="text-sm font-medium leading-7 text-primary">{point}</span>
              </li>
            ))}
          </ul>
        </Section>

        <CtaBand
          eyebrow="ابدأ بتجربة، لا بعقد"
          title="نراجع منتجاتك، نحدد مستوى الحماية، وننفذ عدداً محدوداً من الطلبات مع تقرير ختامي — ثم تقرر."
          secondary={{ href: "/beauty-shield", label: "تعرّف على Beauty Shield" }}
        />
      </main>
      <SiteFooter />
    </>
  );
}
