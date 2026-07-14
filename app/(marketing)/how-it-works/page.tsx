import type { Metadata } from "next";
import {
  ClipboardList,
  FileSignature,
  type LucideIcon,
  PackageCheck,
  RotateCcw,
  Snowflake,
  Thermometer,
  Wallet,
} from "lucide-react";
import PageHero from "@/components/PageHero";
import { CtaBand, Section } from "@/components/marketing/section";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "كيف تعمل QBL — رحلة الشحنة من المستودع إلى الباب",
  description:
    "خطوات تشغيل واضحة: استلام منظم، رحلة محمية حرارياً، تسليم موثق بتوقيع إلكتروني، وشحن عكسي — داخل الرياض خلال 24–72 ساعة.",
  alternates: { canonical: "/how-it-works" },
};

const steps: { icon: LucideIcon; title: string; desc: string }[] = [
  {
    icon: PackageCheck,
    title: "الاستلام من مقرك",
    desc: "استلام منظم من مستودعك أو نقطة التجهيز داخل الرياض، بمواعيد متفق عليها، مع التحقق من حالة الشحنات عند الاستلام.",
  },
  {
    icon: ClipboardList,
    title: "إدخال الطلب وتجهيز بوليصة الشحن",
    desc: "كل شحنة تُسجل وتحمل بوليصة تحدد المرسل والمستلم ومستوى الحماية المطلوب.",
  },
  {
    icon: Thermometer,
    title: "التجهيز الحراري",
    desc: "فحص أدوات العزل، وتجهيز المركبة وفق مستوى Beauty Shield المتفق عليه، وفصل الفئات غير المتوافقة حرارياً.",
  },
  {
    icon: Snowflake,
    title: "الرحلة المحمية",
    desc: "توصيل داخل الرياض خلال 24–72 ساعة حسب نموذج التشغيل، بمسارات تراعي تقليل زمن التعرض الحراري.",
  },
  {
    icon: FileSignature,
    title: "التسليم الموثق",
    desc: "تسليم عند باب العميل بتوقيع إلكتروني. حتى ثلاث محاولات توصيل لكل شحنة، مع إشعار وتصعيد واضح عند التعذر.",
  },
  {
    icon: Wallet,
    title: "التحصيل عند الاستلام (اختياري)",
    desc: "عند تفعيله ضمن نموذج التشغيل، تُحصّل المبالغ وتُسوّى وفق الاتفاق.",
  },
  {
    icon: RotateCcw,
    title: "الشحن العكسي",
    desc: "المرتجعات تعود ضمن نفس منظومة الحماية، بتوثيق حالة المنتج عند الاستلام من العميل.",
  },
];

const limits = [
  "النطاق الجغرافي: داخل الرياض.",
  "الحد الأقصى لوزن الطرد: 25 كجم.",
  "المواد ذات المتطلبات الخاصة تُقيّم قبل القبول، وتُنقل وفق ملحق تشغيلي مستقل.",
];

export default function HowItWorksPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "الرئيسية", path: "" },
          { name: "طريقة العمل", path: "how-it-works" },
        ])}
      />
      <PageHero
        eyebrow="طريقة العمل"
        title="رحلة شحنتك، خطوة بخطوة"
        description="من الاستلام المنظم في مقرك حتى التسليم الموثق عند باب العميل — كل مرحلة مصممة لتقليل زمن التعرض الحراري وحماية تجربة علامتك."
        ctaHref="/trial"
        ctaLabel="اطلب تقييم المنتج والمسار"
      />

      <Section title="سبع خطوات واضحة" eyebrow="التشغيل">
        <div className="grid gap-4 md:grid-cols-2">
          {steps.map((step, i) => (
            <article key={step.title} className="rounded-lg border border-line bg-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-frost text-accent">
                  <step.icon className="h-5 w-5" />
                </div>
                <span className="font-mono text-sm text-muted-foreground">0{i + 1}</span>
              </div>
              <h3 className="mt-5 text-lg font-extrabold text-primary">{step.title}</h3>
              <p className="mt-2 text-sm leading-7 text-slatebrand">{step.desc}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section eyebrow="حدود التشغيل الحالية — بشفافية" title="نقولها قبل أن تسأل" tone="mist">
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
        title="تريد رؤية التشغيل قبل أي التزام؟ ابدأ بتجربة محدودة مع تقرير ختامي."
        secondary={{ href: "/cold-chain-system", label: "استعرض النظام التشغيلي" }}
      />
    </>
  );
}
