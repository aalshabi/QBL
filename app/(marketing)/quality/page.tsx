import type { Metadata } from "next";
import { CheckCircle2, XCircle } from "lucide-react";
import PageHero from "@/components/PageHero";
import { CtaBand, Section } from "@/components/marketing/section";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "الجودة والاستعداد التنظيمي — QBL",
  description:
    "التزام بتعليمات حفظ المصنّع، سجلات تشغيل، إجراءات انحراف حراري موثقة، وفصل المنتجات غير المتوافقة — دون ادعاءات اعتماد.",
  alternates: { canonical: "/quality" },
};

const commitments = [
  {
    title: "تعليمات المصنّع مرجعنا الأول",
    desc: "ظروف حفظ كل منتج تُؤخذ من تعليماته، وتُترجم إلى مستوى حماية موثق.",
  },
  {
    title: "سجلات تشغيل",
    desc: "الاستلام والتسليم والاستثناءات تُسجل وتُحفظ وفق نموذج التشغيل المتفق عليه.",
  },
  {
    title: "توثيق درجات الحرارة عند الاتفاق",
    desc: "حين يتضمن نموذج التشغيل قياساً حرارياً، تُوثق القراءات في النقاط المحددة.",
  },
  {
    title: "إجراء انحراف حراري",
    desc: "أي خروج عن النطاق المتفق عليه يُسجل ويُبلّغ للعميل ويُعالج وفق إجراء مكتوب.",
  },
  {
    title: "فصل المنتجات",
    desc: "لا تُخلط منتجات غير متوافقة حرارياً أو تشغيلياً في تجهيز واحد.",
  },
  {
    title: "التحقق عند الطرفين",
    desc: "حالة المنتج تُفحص عند الاستلام من العميل وعند التسليم للمستلم.",
  },
];

const disclaimers = [
  "لا ندّعي اعتماداً أو ترخيصاً رسمياً غير حاصلين عليه.",
  "لا نعد بنتائج مضمونة أو نسب نجاح قبل أن تثبتها سجلات فعلية.",
  "لا نعرض قدرات لم تدخل الخدمة بعد.",
];

export default function QualityPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "الرئيسية", path: "" },
          { name: "الجودة والاستعداد التنظيمي", path: "quality" },
        ])}
      />
      <PageHero
        eyebrow="الجودة والاستعداد التنظيمي"
        title="الجودة عندنا إجراءات مكتوبة، لا شعارات"
        description="قطاع مستحضرات التجميل في السعودية يتجه نحو متطلبات حفظ وتوزيع أدق. نبني تشغيلنا ليكون مستعداً لهذا الاتجاه — ونقول بوضوح ما نلتزم به وما لا ندّعيه."
        ctaHref="/trial"
        ctaLabel="اطلب تقييم المنتج والمسار"
      />

      <Section eyebrow="ما نلتزم به" title="ستة التزامات تشغيلية موثقة">
        <div className="grid gap-4 md:grid-cols-2">
          {commitments.map((item) => (
            <article key={item.title} className="rounded-lg border border-line bg-white p-6">
              <CheckCircle2 className="h-6 w-6 text-accent" />
              <h3 className="mt-4 text-lg font-extrabold text-primary">{item.title}</h3>
              <p className="mt-2 text-sm leading-7 text-slatebrand">{item.desc}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section eyebrow="ما لا ندّعيه" title="حدود واضحة نلتزم بها" tone="mist">
        <ul className="grid gap-3">
          {disclaimers.map((point) => (
            <li key={point} className="flex items-start gap-3 rounded-lg border border-line bg-white p-4 text-slatebrand">
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber" />
              <span className="text-sm leading-7">{point}</span>
            </li>
          ))}
        </ul>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-primary">
          حين نحصل على اعتماد أو نوثق قدرة جديدة، ستجدها هنا — بمستندها.
        </p>
      </Section>

      <CtaBand title="نبني معك نموذج تشغيل موثقاً من أول شحنة." />
    </>
  );
}
