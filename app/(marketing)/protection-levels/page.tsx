import type { Metadata } from "next";
import { Snowflake, Sun, Thermometer } from "lucide-react";
import PageHero from "@/components/PageHero";
import { CtaBand, Section } from "@/components/marketing/section";

export const metadata: Metadata = {
  title: "مستويات التحكم الحراري لتوصيل مستحضرات التجميل",
  description:
    "الفرق بين الحماية من الحرارة، الدرجة المحكومة، والتوصيل المبرد — وكيف يُختار المستوى المناسب وفق تعليمات المصنّع.",
  alternates: { canonical: "/protection-levels" },
};

const levels = [
  {
    icon: Sun,
    tag: "المستوى الأول",
    name: "Heat Protected — الحماية من الحرارة",
    actions: [
      "عزل الشحنة عن أشعة الشمس المباشرة في كل مراحل الرحلة.",
      "تقليل زمن تعرض المنتج لحرارة صندوق المركبة.",
      "ترتيب التحميل بحيث تكون منتجات العناية أبعد ما يكون عن مصادر الحرارة.",
    ],
    fit: "المنتجات التي تنص تعليماتها على الحفظ بعيداً عن الحرارة والشمس دون نطاق رقمي محدد.",
  },
  {
    icon: Thermometer,
    tag: "المستوى الثاني",
    name: "Temperature Controlled — الدرجة المحكومة",
    actions: [
      "الاتفاق على نطاق حراري مستهدف بناءً على تعليمات المصنّع.",
      "استخدام أدوات عزل وتبريد سلبي مناسبة للنطاق ومدة الرحلة.",
      "فحص أدوات العزل قبل كل رحلة.",
      "قراءة درجة الحرارة وتوثيقها في نقاط متفق عليها — تُحدد ضمن نموذج التشغيل المتفق عليه.",
      "تسجيل أي استثناء أو انحراف والتعامل معه وفق الإجراء المتفق عليه.",
    ],
    fit: "المنتجات النشطة والحساسة التي تحتاج نطاقاً محدداً دون تبريد فعلي مستمر.",
  },
  {
    icon: Snowflake,
    tag: "المستوى الثالث",
    name: "Refrigerated Delivery — التوصيل المبرد",
    actions: [
      "يُفعّل للمنتجات التي تنص تعليمات حفظها صراحة على التبريد.",
      "قبل التفعيل: تحقق تشغيلي من المسار والكمية والمدة وقدرة التجهيز على تلبية النطاق المطلوب.",
      "التوثيق والقياس يُحددان ضمن اتفاقية التشغيل.",
    ],
    fit: "فئة محدودة من المنتجات — ونقولها بوضوح: إن لم يكن منتجك يحتاجها، لن نبيعك إياها.",
  },
];

const selection = [
  "نستلم تعليمات الحفظ لكل فئة منتجات.",
  "نقيّم حساسية المنتج مقابل مدة الرحلة وظروف الموسم.",
  "نقترح المستوى ونوثقه في نموذج التشغيل.",
  "عند اختلاف الفئات، تُقسم الشحنات — لا نخلط منتجات غير متوافقة حرارياً في تجهيز واحد.",
];

export default function ProtectionLevelsPage() {
  return (
    <>
      <PageHero
        eyebrow="مستويات الحماية"
        title="ثلاثة مستويات، ومرجع واحد: تعليمات المصنّع"
        description="لا يوجد مستوى «أفضل» بإطلاق. يوجد مستوى مناسب لمنتجك، ومستويان يزيدان الكلفة بلا حاجة أو ينقصان الحماية عند الحاجة. هذه الصفحة تشرح كيف نختار."
        ctaHref="/trial"
        ctaLabel="اطلب تقييم المنتج والمسار"
      />

      {levels.map((level, index) => (
        <Section
          key={level.name}
          eyebrow={level.tag}
          title={level.name}
          tone={index % 2 === 1 ? "mist" : "white"}
        >
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <p className="text-sm font-bold text-accent">ما الذي يحدث فعلياً:</p>
              <ul className="mt-4 grid gap-3">
                {level.actions.map((a) => (
                  <li key={a} className="flex items-start gap-3 rounded-lg border border-line bg-white p-4 text-slatebrand">
                    <level.icon className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                    <span className="text-sm leading-7">{a}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-accent/30 bg-frost-50 p-6">
              <p className="text-sm font-bold text-accent">يناسب</p>
              <p className="mt-3 text-sm leading-7 text-slatebrand">{level.fit}</p>
            </div>
          </div>
        </Section>
      ))}

      <Section eyebrow="كيف يُختار المستوى؟" title="أربع خطوات نوثقها في نموذج التشغيل" tone="mist">
        <ol className="grid gap-3 md:grid-cols-2">
          {selection.map((step, i) => (
            <li key={step} className="flex items-start gap-3 rounded-lg border border-line bg-white p-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                {i + 1}
              </span>
              <span className="text-sm leading-7 text-slatebrand">{step}</span>
            </li>
          ))}
        </ol>
      </Section>

      <Section eyebrow="الاستثناءات والانحراف الحراري" title="الشفافية جزء من الخدمة">
        <p className="max-w-3xl text-lg leading-8 text-slatebrand">
          أي انحراف عن النموذج المتفق عليه يُسجل ويُبلّغ ويُعالج وفق إجراء محدد سلفاً — لا يُخفى ولا يُترك للاجتهاد.
        </p>
      </Section>

      <CtaBand
        title="أرسل تعليمات حفظ منتجاتك، ونقترح المستوى المناسب لكل فئة."
        primary={{ href: "/trial", label: "اطلب تقييم المنتج والمسار" }}
        secondary={{ href: "/why-protection", label: "لماذا تحتاج الحماية الحرارية؟" }}
      />
    </>
  );
}
