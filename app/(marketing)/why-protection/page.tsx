import type { Metadata } from "next";
import { Droplets, FlaskConical, Package, Palette } from "lucide-react";
import PageHero from "@/components/PageHero";
import { CtaBand, Section } from "@/components/marketing/section";

export const metadata: Metadata = {
  title: "لماذا تحتاج مستحضرات التجميل حماية حرارية؟",
  description:
    "أثر حرارة السعودية على السيروم والكريمات والعطور، والفرق بين الحماية الحرارية والتبريد الفعلي، ومتى يلزم كل منهما.",
  alternates: { canonical: "/why-protection" },
};

const effects = [
  {
    icon: FlaskConical,
    title: "المكونات النشطة",
    desc: "فيتامين C يتأكسد ويفقد فعاليته وقد يتغير لونه. الريتينول والمستخلصات الطبيعية تتحلل أسرع كلما ارتفعت الحرارة. المنتج يبقى في العبوة، لكن قيمته الفعلية تتراجع.",
  },
  {
    icon: Droplets,
    title: "القوام والاستقرار",
    desc: "المستحلبات — أساس معظم الكريمات — قد تنفصل عند التعرض الحراري الحاد: طبقة زيتية فوق طبقة مائية. الجل قد يسيل، والزبدة قد تذوب ثم تتجمد بقوام مختلف.",
  },
  {
    icon: Palette,
    title: "الرائحة واللون",
    desc: "تغير الرائحة أو اللون أول ما يلاحظه العميل، وأول ما يحوّل تجربة فتح العبوة إلى شكوى.",
  },
  {
    icon: Package,
    title: "العبوة نفسها",
    desc: "اللواصق تلين، الأغطية تتمدد، العبوات الزجاجية تحت ضغط حراري — تفاصيل صغيرة تصنع انطباعاً كبيراً.",
  },
];

const matrix = [
  { case: "تعليمات عامة: بعيداً عن الشمس والحرارة", level: "Heat Protected" },
  { case: "نطاق حراري محدد أو منتج نشط حساس", level: "Temperature Controlled" },
  { case: "تعليمات تنص صراحة على التبريد", level: "Refrigerated Delivery بعد التحقق التشغيلي" },
];

export default function WhyProtectionPage() {
  return (
    <>
      <PageHero
        eyebrow="لماذا الحماية الحرارية"
        title="ليست كل منتجات التجميل طروداً عادية"
        description="عبوة السيروم التي تُشحن في صندوق مركبة مغلق ظهيرة يوليو لا تعيش الظروف نفسها التي صُنعت لها. هذه الصفحة تشرح لماذا، ومتى يصبح الأمر حرجاً."
        ctaHref="/trial"
        ctaLabel="اطلب تقييم المنتج والمسار"
      />

      <Section eyebrow="ماذا تفعل الحرارة بالمنتج؟" title="أربعة مسارات للضرر لا تراها العين دائماً">
        <div className="grid gap-4 md:grid-cols-2">
          {effects.map((item) => (
            <article key={item.title} className="rounded-lg border border-line bg-frost-50 p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-white text-accent">
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-extrabold text-primary">{item.title}</h3>
              <p className="mt-2 text-sm leading-7 text-slatebrand">{item.desc}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section
        eyebrow="الفيصل"
        title="الفرق بين المنتج العادي والمنتج الحساس"
        tone="mist"
      >
        <p className="max-w-3xl text-lg leading-8 text-slatebrand">
          منتجات كثيرة تتحمل رحلة توصيل عادية. الفيصل ليس رأينا ولا رأي شركة التوصيل — بل{" "}
          <strong className="text-primary">تعليمات الحفظ المكتوبة من الشركة المصنّعة</strong>. «يُحفظ بعيداً عن الحرارة
          والشمس» تعني شيئاً. «يُحفظ في درجة حرارة محددة» تعني شيئاً آخر تماماً.
        </p>
      </Section>

      <Section
        eyebrow="متى تكفي الحماية؟ ومتى يلزم تبريد فعلي؟"
        title="من تعليمات الحفظ إلى المستوى المناسب"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-right">
            <thead>
              <tr className="border-b border-line text-sm text-muted-foreground">
                <th className="p-4 font-bold">الحالة</th>
                <th className="p-4 font-bold">المستوى المناسب</th>
              </tr>
            </thead>
            <tbody>
              {matrix.map((row) => (
                <tr key={row.case} className="border-b border-line align-top">
                  <td className="p-4 text-sm leading-7 text-slatebrand">{row.case}</td>
                  <td className="p-4 text-sm font-bold text-primary">{row.level}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-6 max-w-3xl text-lg font-bold leading-8 text-primary">
          القاعدة عندنا ثابتة: تعليمات المصنّع هي المرجع، لكل منتج على حدة.
        </p>
      </Section>

      <Section eyebrow="الكلفة الحقيقية للتجاهل" title="شكوى الجودة لا تكلف قيمة المنتج فقط" tone="mist">
        <p className="max-w-3xl text-lg leading-8 text-slatebrand">
          تكلف شحنة بديلة، ووقت خدمة عملاء، وتقييماً سلبياً، وأحياناً عميلاً لا يعود. حماية آخر ميل أرخص من كل ذلك.
        </p>
      </Section>

      <CtaBand
        eyebrow="ابدأ الآن"
        title="أرسل تعليمات حفظ منتجاتك، ونحدد لك المستوى المناسب لكل فئة."
        primary={{ href: "/trial", label: "اطلب تقييم المنتج والمسار" }}
        secondary={{ href: "/protection-levels", label: "مستويات التحكم الحراري" }}
      />
    </>
  );
}
