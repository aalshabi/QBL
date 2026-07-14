import type { Metadata } from "next";
import { AlertTriangle, CheckCircle2, Snowflake, Sun, Thermometer } from "lucide-react";
import PageHero from "@/components/PageHero";
import { CtaBand, Section } from "@/components/marketing/section";

export const metadata: Metadata = {
  title: "حماية منتجات التجميل من حرارة السعودية — QBL Beauty Shield",
  description:
    "ثلاثة مستويات حماية حرارية لمستحضرات التجميل خلال آخر ميل في الرياض، مبنية على تعليمات حفظ المصنّع، مع تجربة تشغيلية قبل التعاقد.",
  alternates: { canonical: "/beauty-shield" },
};

const problems = [
  "تركيبات نشطة (فيتامين C، الريتينول، المستخلصات الطبيعية) تتأثر بالحرارة المرتفعة.",
  "قوام الكريم أو السيروم قد يتغير أو ينفصل قبل أن يفتح العميل العبوة.",
  "العبوة الخارجية جزء من تجربة العلامة، وتلفها خسارة انطباع لا يُعوّض.",
  "كل شكوى جودة تعني مرتجعاً، وتعويضاً، وثقة تتآكل.",
];

const tiers = [
  {
    icon: Sun,
    tag: "المستوى الأول",
    name: "Heat Protected",
    desc: "حماية من أشعة الشمس المباشرة وحرارة صندوق المركبة، للمنتجات التي تتحمل الظروف المحيطة لكنها تتضرر من التعرض الحاد.",
  },
  {
    icon: Thermometer,
    tag: "المستوى الثاني",
    name: "Temperature Controlled",
    desc: "نطاق حراري يُتفق عليه بناءً على تعليمات المصنّع، مع أدوات عزل مخصصة. قياس درجة الحرارة وتوثيقها يُحددان ضمن نموذج التشغيل المتفق عليه.",
  },
  {
    icon: Snowflake,
    tag: "المستوى الثالث",
    name: "Refrigerated Delivery",
    desc: "للمنتجات التي تنص تعليمات حفظها على تبريد فعلي. يُفعّل بعد التحقق من القدرة التشغيلية للمسار والكمية والمدة، ويُوثق ضمن اتفاقية التشغيل.",
  },
];

const products = [
  "سيروم وأمصال",
  "فيتامين C ومشتقاته",
  "كريمات ومرطبات حساسة",
  "مستحضرات عضوية وطبيعية",
  "منتجات احترافية للصالونات",
  "مستحضرات العيادات",
  "عينات تسويقية",
  "عبوات زجاجية فاخرة",
  "عطور ومنتجات كحولية بعد تقييم متطلباتها",
];

const steps = [
  "ترسل قائمة منتجاتك وتعليمات حفظها.",
  "نراجعها ونقترح مستوى الحماية لكل فئة.",
  "نحدد مسار التجربة ونطاقها معاً.",
  "ننفذ عدداً محدوداً من الطلبات الفعلية.",
  "تستلم تقريراً ختامياً بالنتائج والاستثناءات إن وُجدت.",
  "نقترح نموذج التشغيل الشهري المناسب — والقرار لك.",
];

const outcomes = [
  "مستوى حماية موثق لكل فئة منتجات.",
  "استلام منظم من نقطة واحدة أو أكثر داخل الرياض.",
  "تسليم بتوقيع إلكتروني خلال 24–72 ساعة.",
  "حتى ثلاث محاولات توصيل لكل شحنة.",
  "شحن عكسي للمرتجعات ضمن نفس منظومة الحماية.",
  "تحصيل عند الاستلام عند الحاجة.",
  "نقطة تواصل واحدة ومسار تصعيد واضح.",
];

const limits = [
  "مستوى الحماية والتوثيق والقياس تُحدد ضمن نموذج التشغيل المتفق عليه قبل البدء.",
  "المرجع الحراري هو تعليمات الشركة المصنّعة لكل منتج.",
  "تقليل الشكاوى والمرتجعات هدف نعمل عليه معك، ولا يُقدَّم كنتيجة مضمونة.",
  "الحد الأقصى لوزن الطرد 25 كجم، والنطاق الحالي داخل الرياض.",
];

export default function BeautyShieldPage() {
  return (
    <>
      <PageHero
        eyebrow="QBL Beauty Shield"
        title="Beauty Shield — الحماية الحرارية لمنتجك خلال أخطر مرحلة"
        description="منتج التجميل يقطع آلاف الكيلومترات محفوظاً بعناية، ثم يواجه أعلى خطر حراري في آخر كيلومترات قبل باب العميل. Beauty Shield صُمم لهذه المرحلة تحديداً."
        ctaHref="/trial"
        ctaLabel="ابدأ تجربة Beauty Shield"
        secondaryCtaHref="/trial"
        secondaryCtaLabel="اطلب تقييم المنتج والمسار"
      />

      <Section eyebrow="المشكلة التي نعالجها" title="أخطر ما يمر به منتج التجميل يحدث في آخر ميل">
        <ul className="grid gap-3 md:grid-cols-2">
          {problems.map((p) => (
            <li key={p} className="flex items-start gap-3 rounded-lg border border-line bg-frost-50 p-4 text-slatebrand">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber" />
              <span className="text-sm leading-7">{p}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        eyebrow="المستويات الثلاثة"
        title="مستوى حماية مبني على تعليمات المصنّع"
        tone="mist"
      >
        <div className="grid gap-4 md:grid-cols-3">
          {tiers.map((tier, index) => (
            <article
              key={tier.name}
              className={`flex flex-col rounded-lg border bg-white p-6 ${
                index === 1 ? "border-accent shadow-sm" : "border-line"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-frost text-accent">
                  <tier.icon className="h-5 w-5" />
                </div>
                <span className="rounded-md bg-accent/10 px-2.5 py-1 text-xs font-bold text-accent">{tier.tag}</span>
              </div>
              <h3 className="mt-5 ltr text-right text-xl font-extrabold text-primary">{tier.name}</h3>
              <p className="mt-3 text-sm leading-7 text-slatebrand">{tier.desc}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section eyebrow="المنتجات المناسبة" title="مصمم للمنتجات التي تتأثر بالحرارة والضوء">
        <div className="flex flex-wrap gap-2">
          {products.map((item) => (
            <span key={item} className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium text-primary">
              {item}
            </span>
          ))}
        </div>
      </Section>

      <Section eyebrow="كيف تبدأ — التجربة التشغيلية" title="ست خطوات من قائمة المنتجات إلى قرارك" tone="mist">
        <ol className="grid gap-3 md:grid-cols-2">
          {steps.map((step, i) => (
            <li key={step} className="flex items-start gap-3 rounded-lg border border-line bg-white p-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                {i + 1}
              </span>
              <span className="text-sm leading-7 text-slatebrand">{step}</span>
            </li>
          ))}
        </ol>
      </Section>

      <Section eyebrow="ما يحصل عليه العميل" title="خدمة كاملة حول الشحنة، لا مجرد توصيل">
        <ul className="grid gap-3 md:grid-cols-2">
          {outcomes.map((point) => (
            <li key={point} className="flex items-start gap-3 rounded-lg border border-line bg-frost-50 p-4 text-slatebrand">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              <span className="text-sm leading-7">{point}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section eyebrow="حدود المسؤولية — بوضوح" title="نقول ما نلتزم به وما لا نضمنه" tone="mist">
        <ul className="grid gap-3">
          {limits.map((point) => (
            <li key={point} className="flex items-start gap-3 rounded-lg border border-line bg-white p-4 text-slatebrand">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span className="text-sm leading-7">{point}</span>
            </li>
          ))}
        </ul>
      </Section>

      <CtaBand
        title="ابدأ تجربة Beauty Shield على منتجاتك الفعلية — قبل أي عقد."
        secondary={{ href: "/protection-levels", label: "مستويات التحكم الحراري" }}
      />
    </>
  );
}
