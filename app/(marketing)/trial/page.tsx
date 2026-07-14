import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Download, FileText, Search, Truck } from "lucide-react";
import PageHero from "@/components/PageHero";
import { QuoteForm } from "@/components/marketing/quote-form";

export const metadata: Metadata = {
  title: "تجربة Beauty Shield — اختبر التشغيل قبل العقد | QBL",
  description: "نراجع منتجاتك، نحدد مستوى الحماية، ننفذ نطاقًا محدودًا من الطلبات الفعلية، ثم نسلمك تقريرًا ختاميًا يساعدك على القرار.",
  alternates: {
    canonical: "https://qbl.sa/trial",
    languages: { "ar-SA": "https://qbl.sa/trial", en: "https://qbl.sa/en/trial", "x-default": "https://qbl.sa/trial" },
  },
};

const steps = [
  [Search, "مراجعة المنتجات", "نراجع تعليمات الحفظ والفئات والعبوات ومناطق التسليم."],
  [CheckCircle2, "تحديد المستويات", "نربط كل فئة بمستوى الحماية المناسب ونثبت نقاط القياس والتوثيق."],
  [Truck, "تشغيل نطاق محدود", "ننّفذ طلبات فعلية متفقًا عليها دون ربطك بعقد طويل قبل ظهور السجلات."],
  [FileText, "تقرير وقرار", "تستلم ملخص التنفيذ والاستثناءات والتوصية، ثم تقرر نموذج التشغيل التالي."],
] as const;

export default function TrialPage() {
  return (
    <main>
      <PageHero
        eyebrow="جرّب قبل أن تتعاقد"
        title="اختبر Beauty Shield على منتجاتك وطلباتك الفعلية"
        description="لا نطلب منك اتخاذ قرار طويل بناءً على عرض تسويقي. نبدأ بمراجعة المنتجات، نشغّل نطاقًا محدودًا، ثم نسلمك تقريرًا ختاميًا يوضح ما نُفذ وما حدث وما نوصي به."
      />

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-sm font-bold text-accent">مسار التجربة</p>
          <h2 className="mt-3 text-3xl font-extrabold text-primary">من المنتج إلى قرار تعاقد مبني على سجل</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {steps.map(([Icon, title, description], index) => (
              <article key={title} className="rounded-xl border border-line p-5">
                <div className="flex items-center justify-between"><Icon className="h-6 w-6 text-accent" /><span className="font-latin text-xs font-bold text-slatebrand/50">0{index + 1}</span></div>
                <h3 className="mt-5 text-lg font-extrabold text-primary">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-slatebrand">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-frost-50">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8">
          <div>
            <p className="text-sm font-bold text-accent">ماذا ستستلم؟</p>
            <h2 className="mt-3 text-3xl font-extrabold text-primary">تقرير ختامي، لا انطباع شفهي</h2>
            <ul className="mt-6 grid gap-3">
              {["ملخص نطاق التجربة والفئات المنفذة", "سجل الشحنات ومستوى الحماية لكل فئة", "الاستثناءات وطريقة الإبلاغ والمعالجة", "توصية بنموذج التشغيل الشهري المقترح"].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm font-semibold leading-7 text-slatebrand"><CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-accent" />{item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-accent/25 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-accent">نموذج توضيحي — البيانات افتراضية</p>
            <h3 className="mt-3 text-2xl font-extrabold text-primary">شاهد شكل التقرير قبل الاتفاق</h3>
            <p className="mt-3 text-sm leading-7 text-slatebrand">الملف يوضح بنية التسليم فقط. لا يمثل عميلًا حقيقيًا ولا أداءً فعليًا لـ QBL.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <a href="/reports/beauty-shield-trial-sample.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-bold text-white hover:bg-primary-800"><Download className="h-4 w-4" />تحميل PDF</a>
              <Link href="/reports/beauty-shield-sample" className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-line px-5 text-sm font-bold text-primary hover:bg-muted/60"><FileText className="h-4 w-4 text-accent" />معاينة HTML</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <p className="text-sm font-bold text-accent">كيف يُحتسب السعر؟</p>
            <h2 className="mt-3 text-3xl font-extrabold text-primary">بحسب نموذج التشغيل، لا بسعر موحد مضلل</h2>
            <p className="mt-4 leading-8 text-slatebrand">التسعير شهري حسب عدد الطلبات، مستوى الحماية لكل فئة، نقاط الاستلام، ومستوى التوثيق. تكلفة التجربة تُحدد بعد مراجعة المنتجات. لم نضف خصم التجربة من أول شهر لأنه ينتظر قرار المالك.</p>
          </div>
          <div className="rounded-xl border border-line bg-card p-6">
            <h2 className="text-xl font-extrabold text-primary">اطلب مراجعة تجربة Beauty Shield</h2>
            <p className="mt-2 text-sm leading-7 text-slatebrand">اذكر في الرسالة فئات المنتجات وتعليمات الحفظ المتاحة وعدد الطلبات التقريبي ومناطق التسليم.</p>
            <div className="mt-6"><QuoteForm /></div>
          </div>
        </div>
      </section>
    </main>
  );
}
