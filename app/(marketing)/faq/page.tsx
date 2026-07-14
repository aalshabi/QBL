import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PageHero from "@/components/PageHero";

export const metadata: Metadata = {
  title: "الأسئلة الشائعة عن Beauty Shield والتوصيل المحمي — QBL",
  description: "إجابات واضحة عن مستويات الحماية، التسعير، التوثيق، الادعاءات التنظيمية، وتجربة التشغيل.",
  alternates: { canonical: "https://qbl.sa/faq" },
};

const faqs = [
  ["هل كل مستحضرات التجميل تحتاج توصيلًا مبردًا؟", "لا. المستوى يحدد من تعليمات الشركة المصنّعة وحساسية التركيبة وطبيعة المسار. بعض المنتجات تحتاج حماية من الحرارة فقط، وأخرى تحتاج نطاقًا محكومًا أو تبريدًا صريحًا."],
  ["كيف يُحتسب السعر؟", "التسعير شهري حسب نموذج التشغيل: عدد الطلبات، مستوى الحماية لكل فئة، نقاط الاستلام، ومستوى التوثيق. تكلفة التجربة تُحدد بعد مراجعة المنتجات."],
  ["هل QBL معتمدة من الهيئة العامة للغذاء والدواء؟", "لا ندعي اعتمادًا أو ترخيصًا من الهيئة لخدمة Beauty Shield. نصمم إجراءاتنا للاستعداد والتوثيق، ويظل إدراج المنتج وامتثال الجهة صاحبة المنتج مسؤوليتها."],
  ["هل تسجلون درجات الحرارة في كل طلب؟", "بحسب نطاق الخدمة. نقاط القياس ونوع الجهاز وتكرار القراءة توثق في نموذج التشغيل قبل البدء، ولا نعد بقياس غير متفق عليه."],
  ["ماذا يحدث عند خروج القراءة عن النطاق؟", "يُسجل الاستثناء ويُبلغ العميل وفق الإجراء المتفق عليه، وتُتخذ الخطوة المحددة مسبقًا بدل إغلاق الطلب وكأن شيئًا لم يحدث."],
  ["هل يمكن البدء دون عقد طويل؟", "نعم. تجربة Beauty Shield تبدأ بنطاق محدود من الطلبات الفعلية وتنتهي بتقرير، ثم تقرر نموذج التشغيل المناسب."],
] as const;

export default function FaqPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })),
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <PageHero eyebrow="الأسئلة الشائعة" title="إجابات مباشرة قبل أن تبدأ التجربة" description="لا شهادات ضمنية ولا أسعار عامة لا تعكس التشغيل. هذه أهم الأسئلة التي يحتاجها فريق الجودة أو المشتريات قبل تقييم Beauty Shield." />
      <section className="bg-white">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-4">
            {faqs.map(([question, answer]) => (
              <details key={question} className="group rounded-xl border border-line bg-white p-5 open:border-accent/40 open:bg-frost-50">
                <summary className="cursor-pointer list-none font-extrabold text-primary">{question}</summary>
                <p className="mt-4 border-t border-line pt-4 text-sm leading-8 text-slatebrand">{answer}</p>
              </details>
            ))}
          </div>
          <Link href="/trial" className="mt-8 inline-flex h-12 items-center gap-2 rounded-md bg-primary px-6 text-sm font-bold text-white hover:bg-primary-800">ابدأ تجربة Beauty Shield <ArrowLeft className="h-4 w-4" /></Link>
        </div>
      </section>
    </main>
  );
}
