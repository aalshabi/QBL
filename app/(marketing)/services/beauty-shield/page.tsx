import Link from "next/link";
import {
  ArrowLeft,
  Beaker,
  Box,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Droplets,
  FileCheck,
  FlaskConical,
  Heart,
  type LucideIcon,
  MapPinned,
  Package,
  Pill,
  ShieldCheck,
  ShoppingBag,
  Snowflake,
  Sparkles,
  Store,
  Sun,
  Thermometer,
  Truck,
} from "lucide-react";
import PageHero from "@/components/PageHero";
import { SITE } from "@/lib/site";

export const metadata = {
  title: "توصيل منتجات التجميل والعناية بدرجة حرارة محمية في الرياض | QBL Beauty Shield",
  description:
    "خدمة توصيل مخصصة لحماية منتجات التجميل والعناية من حرارة الجو أثناء النقل داخل الرياض. مناسبة للسيروم، فيتامين C، المنتجات العضوية، عيادات الجلدية، والمتاجر الإلكترونية.",
  keywords: [
    "توصيل منتجات تجميل الرياض",
    "توصيل عناية بالبشرة",
    "توصيل منتجات حساسة للحرارة",
    "توصيل سيروم الرياض",
    "توصيل منتجات عيادات جلدية",
    "توصيل كوزماتيك مبرد",
    "توصيل محمي حراريا",
    "QBL Beauty Shield",
  ],
  alternates: {
    canonical: "https://qbl.sa/services/beauty-shield",
  },
  openGraph: {
    title: "QBL Beauty Shield — توصيل محمي حرارياً لمنتجات التجميل والعناية",
    description:
      "خدمة توصيل مخصصة لحماية منتجات التجميل والعناية من حرارة الجو أثناء النقل داخل الرياض.",
    url: "https://qbl.sa/services/beauty-shield",
    type: "website",
    locale: "ar_SA",
  },
};

const SUITABLE_PRODUCTS: { icon: LucideIcon; label: string }[] = [
  { icon: Droplets, label: "كريمات العناية بالبشرة" },
  { icon: FlaskConical, label: "السيروم" },
  { icon: Sparkles, label: "منتجات فيتامين C" },
  { icon: Heart, label: "المنتجات الطبيعية والعضوية" },
  { icon: Sun, label: "الماسكات والكريمات الحساسة للحرارة" },
  { icon: Pill, label: "منتجات عيادات الجلدية" },
  { icon: Beaker, label: "عينات المختبرات والصيدليات" },
  { icon: ShoppingBag, label: "منتجات البراندات المحلية" },
];

const TIERS: {
  badge: string;
  title: string;
  desc: string;
  equipment: string;
  icon: LucideIcon;
}[] = [
  {
    badge: "المستوى الأول",
    title: "توصيل محمي من الحرارة",
    desc: "للمنتجات الأقل حساسية التي تحتاج حماية من الشمس وحرارة السيارة.",
    equipment: "حقيبة حرارية + سيارة مكيفة + توثيق تسليم.",
    icon: ShieldCheck,
  },
  {
    badge: "المستوى الثاني",
    title: "توصيل بدرجة حرارة محكومة",
    desc: "للسيروم، فيتامين C، المنتجات العضوية، والمنتجات الأعلى قيمة.",
    equipment: "صندوق عازل + تبريد خفيف + قراءة حرارة عند الحاجة.",
    icon: Thermometer,
  },
  {
    badge: "المستوى الثالث",
    title: "توصيل مبرد للمنتجات الأكثر حساسية",
    desc: "للمنتجات التي تذكر تعليمات حفظ محددة من الشركة الصانعة.",
    equipment: "صندوق مبرد أو مركبة مجهزة + توثيق أعلى حسب الاتفاق.",
    icon: Snowflake,
  },
];

const AUDIENCES: { icon: LucideIcon; label: string }[] = [
  { icon: Store, label: "متاجر التجميل والعناية" },
  { icon: ShoppingBag, label: "المتاجر الإلكترونية" },
  { icon: Building2, label: "عيادات الجلدية والتجميل" },
  { icon: Pill, label: "الصيدليات" },
  { icon: Beaker, label: "مختبرات المنتجات" },
  { icon: Sparkles, label: "براندات العناية المحلية" },
  { icon: Truck, label: "موزعو منتجات التجميل" },
];

const WHY_QBL_BEAUTY: string[] = [
  "تشغيل داخل الرياض",
  "فهم المنتجات الحساسة للحرارة",
  "حقائب وصناديق عازلة حسب نوع المنتج",
  "توثيق استلام وتسليم",
  "تقليل الشكاوى والتعويضات",
  "إمكانية تجربة محدودة قبل الاشتراك",
];

export default function BeautyShieldPage() {
  const whatsappHref = `https://wa.me/${SITE.phone.replace(/[^\d]/g, "")}?text=${encodeURIComponent(
    "السلام عليكم، أرغب بالاستفسار عن خدمة Beauty Shield لتوصيل منتجات التجميل والعناية."
  )}`;

  return (
    <>
      <PageHero
        eyebrow="QBL Beauty Shield"
        title="توصيل منتجات التجميل والعناية بحماية من حرارة الجو"
        description="منتجات السيروم، فيتامين C، الكريمات الحساسة، والمنتجات العضوية تحتاج توصيلاً مختلفاً عن الطرود العادية. قدام بابك توفر خدمة توصيل محمي حرارياً داخل الرياض، تساعد المتاجر والعيادات على حماية جودة المنتج وتجربة العميل."
        ctaHref="/quote?service=beauty-shield"
        ctaLabel="اطلب تجربة 10 طلبات"
        secondaryCtaHref={whatsappHref}
        secondaryCtaLabel="تحدث مع فريق التشغيل"
        secondaryCtaExternal
      />

      {/* المشكلة */}
      <Section eyebrow="المشكلة" title="التوصيل العادي قد لا يحمي منتجات العناية">
        <p className="max-w-3xl text-lg leading-8 text-slatebrand">
          التوصيل العادي قد يعرّض منتجات العناية لحرارة السيارة، الشمس، أو التأخير أثناء المسار. النتيجة قد تكون تغير القوام، ضعف تجربة العميل، شكاوى، أو تعويضات تؤثر على سمعة المتجر.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            { icon: Sun, title: "حرارة الجو", desc: "تعرض المنتج لأشعة الشمس أثناء التحميل أو الانتظار." },
            { icon: Truck, title: "داخل السيارة", desc: "ترتفع الحرارة بسرعة داخل المركبات غير المهيأة." },
            { icon: MapPinned, title: "التأخير في المسار", desc: "كل دقيقة إضافية على منتج حساس قد تعني فرقاً في القوام." },
          ].map((item) => (
            <article key={item.title} className="rounded-lg border border-line bg-frost-50 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-white text-accent">
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-extrabold text-primary">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slatebrand">{item.desc}</p>
            </article>
          ))}
        </div>
      </Section>

      {/* الحل */}
      <Section eyebrow="الحل" title="QBL Beauty Shield — توصيل محمي حرارياً مصمم حول المنتج" tone="mist">
        <p className="max-w-3xl text-lg leading-8 text-slatebrand">
          QBL Beauty Shield ليست خدمة تبريد غذائي مكلفة لكل طلب. هي خدمة توصيل محمية حرارياً، تستخدم أدوات مناسبة حسب حساسية المنتج: حقيبة حرارية، صندوق عازل، تبريد خفيف عند الحاجة، وتوثيق تسليم واضح.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Package, title: "حقيبة حرارية", desc: "حماية أساسية من الحرارة والضوء أثناء النقل." },
            { icon: Box, title: "صندوق عازل", desc: "طبقة عزل إضافية للمنتجات الأعلى حساسية." },
            { icon: Snowflake, title: "تبريد خفيف", desc: "يُضاف حسب نوع المنتج والاتفاق التشغيلي." },
            { icon: FileCheck, title: "توثيق تسليم", desc: "إثبات استلام وتسليم منظم لكل طلب." },
          ].map((item) => (
            <article key={item.title} className="rounded-lg border border-line bg-white p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-frost text-accent">
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-extrabold text-primary">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slatebrand">{item.desc}</p>
            </article>
          ))}
        </div>
      </Section>

      {/* المنتجات المناسبة */}
      <Section eyebrow="المنتجات المناسبة" title="مصمم للمنتجات التي تتأثر بالحرارة والضوء">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SUITABLE_PRODUCTS.map((item) => (
            <article
              key={item.label}
              className="flex items-center gap-3 rounded-lg border border-line bg-white p-4"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent">
                <item.icon className="h-5 w-5" />
              </div>
              <p className="text-sm font-bold text-primary">{item.label}</p>
            </article>
          ))}
        </div>
      </Section>

      {/* مستويات الخدمة */}
      <Section eyebrow="مستويات الخدمة" title="ثلاثة مستويات حسب حساسية المنتج" tone="mist">
        <div className="grid gap-4 md:grid-cols-3">
          {TIERS.map((tier, index) => (
            <article
              key={tier.title}
              className={`flex flex-col rounded-lg border bg-white p-6 ${
                index === 1 ? "border-accent shadow-sm" : "border-line"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-frost text-accent">
                  <tier.icon className="h-5 w-5" />
                </div>
                <span className="rounded-md bg-accent/10 px-2.5 py-1 text-xs font-bold text-accent">
                  {tier.badge}
                </span>
              </div>
              <h3 className="mt-5 text-xl font-extrabold text-primary">{tier.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slatebrand">{tier.desc}</p>
              <div className="mt-5 rounded-md bg-frost-50 p-4">
                <p className="text-xs font-bold text-accent">المعدات والتجهيز</p>
                <p className="mt-2 text-sm leading-6 text-slatebrand">{tier.equipment}</p>
              </div>
            </article>
          ))}
        </div>
        <p className="mt-6 max-w-3xl text-sm leading-7 text-slatebrand">
          يتم اختيار المستوى المناسب حسب نوع المنتج، تعليمات الحفظ من الشركة الصانعة، ومسار التسليم — وليس قالباً واحداً لكل الطلبات.
        </p>
      </Section>

      {/* لمن هذه الخدمة */}
      <Section eyebrow="لمن هذه الخدمة؟" title="مناسبة للشركات التي تبيع منتجات عناية حساسة">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {AUDIENCES.map((item) => (
            <article
              key={item.label}
              className="flex items-center gap-3 rounded-lg border border-line bg-white p-4"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-frost text-accent">
                <item.icon className="h-5 w-5" />
              </div>
              <p className="text-sm font-bold text-primary">{item.label}</p>
            </article>
          ))}
        </div>
      </Section>

      {/* لماذا قدام بابك */}
      <Section eyebrow="لماذا قدام بابك؟" title="مزايا تشغيلية واضحة لحماية تجربة العميل" tone="mist">
        <ul className="grid gap-3 md:grid-cols-2">
          {WHY_QBL_BEAUTY.map((point) => (
            <li
              key={point}
              className="flex items-start gap-3 rounded-lg border border-line bg-white p-4 text-slatebrand"
            >
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              <span className="text-sm font-bold leading-7 text-primary">{point}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* تجربة الإطلاق */}
      <section className="border-t border-muted bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-accent/30 bg-frost-50 p-8 lg:p-12">
            <div className="grid gap-8 lg:grid-cols-[1fr_0.6fr] lg:items-center">
              <div>
                <p className="text-sm font-bold text-accent">تجربة الإطلاق</p>
                <h2 className="mt-3 text-3xl font-extrabold leading-tight text-primary sm:text-4xl">
                  ابدأ بتجربة صغيرة
                </h2>
                <p className="mt-4 max-w-2xl leading-8 text-slatebrand">
                  جرّب 10 طلبات توصيل محمي داخل الرياض، ثم قيّم الخدمة قبل الاشتراك الشهري. التجربة مناسبة للمتاجر والعيادات التي تريد اختبار الخدمة على منتجات محددة دون التزام طويل.
                </p>
                <ul className="mt-6 grid gap-2 text-sm text-slatebrand sm:grid-cols-2">
                  {[
                    "تشغيل داخل الرياض",
                    "بدون التزام طويل",
                    "تقييم بعد التجربة",
                    "مناسبة للمنتجات المختارة",
                  ].map((point) => (
                    <li key={point} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col gap-3">
                <Link
                  href="/quote?service=beauty-shield"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-bold text-white transition-colors hover:bg-primary-800"
                >
                  اطلب التجربة الآن
                  <ArrowLeft className="h-4 w-4" />
                </Link>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-line bg-white px-6 text-sm font-bold text-primary transition-colors hover:bg-muted/60"
                >
                  تحدث مع فريق التشغيل
                  <ClipboardCheck className="h-4 w-4 text-accent" />
                </a>
              </div>
            </div>
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
    <section className={tone === "mist" ? "bg-frost-50" : "bg-white"}>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-bold text-accent">{eyebrow}</p>
          <h2 className="mt-3 text-3xl font-extrabold leading-tight text-primary sm:text-4xl">{title}</h2>
        </div>
        {children}
      </div>
    </section>
  );
}
