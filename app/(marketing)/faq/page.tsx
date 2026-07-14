import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import { JsonLd } from "@/components/JsonLd";
import { CtaBand } from "@/components/marketing/section";
import { breadcrumbJsonLd } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "الأسئلة الشائعة عن توصيل مستحضرات التجميل المبرد — QBL",
  description:
    "إجابات مباشرة: متى يلزم التبريد؟ كيف يُحدد مستوى Beauty Shield؟ هل تُسجل الحرارة؟ وكيف تبدأ التجربة؟",
  alternates: { canonical: "/faq" },
};

const faqs = [
  {
    q: "هل كل مستحضرات التجميل تحتاج تبريداً؟",
    a: "لا. معظمها يحتاج حماية من الحرارة والشمس فقط. التبريد الفعلي يلزم فئة محدودة تنص تعليمات حفظها عليه صراحة. المرجع دائماً تعليمات الشركة المصنّعة.",
  },
  {
    q: "ما الفرق بين الحماية الحرارية والتبريد؟",
    a: "الحماية الحرارية تمنع التعرض للشمس وحرارة المركبة وتقلل زمن التعرض. التبريد يحافظ على نطاق حراري منخفض محدد طوال الرحلة. الأولى تكفي لأغلب المنتجات؛ الثاني لمن تشترطه تعليماته.",
  },
  {
    q: "كيف يُحدد مستوى Beauty Shield المناسب؟",
    a: "نراجع تعليمات حفظ منتجاتك، ونقيّمها مقابل مدة الرحلة وظروف الموسم، ثم نقترح المستوى ونوثقه في نموذج التشغيل قبل أول شحنة.",
  },
  {
    q: "هل تتعاملون مع المنتجات المجمدة؟",
    a: "المنتجات ذات المتطلبات الخاصة — ومنها المجمدة — تُقيّم حالة بحالة، ولا تُقبل إلا بعد التحقق من القدرة التشغيلية وضمن ملحق تشغيلي مستقل.",
  },
  {
    q: "هل يتم تسجيل درجة الحرارة؟",
    a: "عند تفعيل القياس ضمن نموذج التشغيل المتفق عليه، تُقرأ درجة الحرارة وتُوثق في نقاط محددة سلفاً. نطاق التوثيق يعتمد على مستوى الخدمة المتفق عليه.",
  },
  {
    q: "ماذا يحدث إذا خرج المنتج عن النطاق الحراري؟",
    a: "يُسجل الانحراف، ويُبلّغ العميل، ويُطبق الإجراء المتفق عليه — من إعادة التقييم إلى إيقاف التسليم حسب الحالة. لا نسلّم منتجاً نعرف أنه خرج عن شروطه دون علمك.",
  },
  {
    q: "هل الخدمة متاحة خارج الرياض؟",
    a: "النطاق الحالي داخل الرياض. التوسع الجغرافي يُعلن عند جاهزيته التشغيلية.",
  },
  {
    q: "هل تقدمون توصيلاً في اليوم نفسه؟",
    a: "نموذجنا القياسي 24–72 ساعة. الرحلات المخصصة والجدولة الخاصة تُدرس ضمن نموذج التشغيل حسب الحالة.",
  },
  {
    q: "هل يمكن ربط الطلبات بمتجرنا الإلكتروني؟",
    a: "آلية استقبال الطلبات — يدوية أو مؤتمتة — تُحدد ضمن نموذج التشغيل المتفق عليه بما يناسب حجمك الحالي.",
  },
  {
    q: "كيف تبدأ التجربة؟",
    a: "ترسل قائمة منتجاتك وتعليمات حفظها عبر نموذج «اطلب تجربة»، نراجعها ونقترح مستوى الحماية ونطاق التجربة، ثم ننفذ طلبات فعلية محدودة وتستلم تقريراً ختامياً قبل أي التزام.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function FaqPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "الرئيسية", path: "" },
          { name: "الأسئلة الشائعة", path: "faq" },
        ])}
      />
      <PageHero
        eyebrow="الأسئلة الشائعة"
        title="أسئلة يطرحها علينا مدراء العلامات — بإجابات مباشرة"
        description="جمعنا أكثر ما يُسأل عن التبريد، مستويات الحماية، توثيق الحرارة، وكيفية بدء التجربة."
        ctaHref="/trial"
        ctaLabel="ابدأ تجربة Beauty Shield"
      />

      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="divide-y divide-line">
            {faqs.map((f) => (
              <details key={f.q} className="group py-5">
                <summary className="flex cursor-pointer items-center justify-between gap-4 text-lg font-bold text-primary marker:content-none">
                  {f.q}
                  <span className="text-accent transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-7 text-slatebrand">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <CtaBand title="لم تجد سؤالك؟ أرسل قائمة منتجاتك وسنجيبك عملياً ضمن تقييم قصير." />
    </>
  );
}
