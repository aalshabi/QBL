import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Info, Sun, Thermometer } from "lucide-react";
import PageHero from "@/components/PageHero";
import { ProtectionLevelSelector } from "@/components/protection-level-selector";

const canonical = "https://qbl.sa/riyadh-heat";

export const metadata: Metadata = {
  title: "حرارة الرياض ومنتجات العناية — متى يصبح التوصيل خطرًا على منتجك؟",
  description: "مرجع عملي لفهم أثر التعرض الحراري أثناء توصيل السيروم والكريمات والعطور، مع التزام تعليمات الحفظ من الشركة المصنّعة.",
  alternates: { canonical },
  openGraph: {
    title: "حرارة الرياض ومنتجات العناية — QBL",
    description: "حرارة الجو المعلنة لا تصف وحدها ما يتعرض له المنتج داخل مركبة مغلقة أو أثناء الانتظار تحت الشمس.",
    url: canonical,
    locale: "ar_SA",
    type: "article",
  },
};

const sensitivityRows = [
  ["فيتامين C", "قد تتسارع الأكسدة بحسب شكل المادة والتركيبة والعبوة", "قد يظهر تغير في اللون أو لا يظهر أثر واضح"],
  ["الريتينويدات", "تختلف الثباتية بشدة بين التركيبات وقد ينخفض المحتوى الفعال مع التخزين", "قد يبدو المنتج سليمًا رغم تغير المادة الفعالة"],
  ["الكريمات والمستحلبات", "قد تتأثر الثباتية الفيزيائية بحسب التركيبة ودورات التسخين والتبريد", "انفصال أو تغير قوام محتمل"],
  ["المستحضرات الطبيعية", "الاستجابة للحرارة تعتمد على المستخلصات والمواد الحافظة والعبوة", "تغير محتمل في الرائحة أو اللون"],
  ["العطور", "الحرارة والضوء قد يغيران بعض المكونات أو يرفعان ضغط العبوة", "تغير محتمل في الرائحة أو أداء الرش"],
  ["العبوات والملصقات", "قد تلين بعض اللواصق أو تتأثر مكونات التغليف", "ملصق مرتخٍ أو مظهر غير متسق"],
] as const;

export default function RiyadhHeatPage() {
  return (
    <main>
      <PageHero
        eyebrow="مرجع حرارة الرياض ومنتجات العناية"
        title="المنتج لا يقرأ نشرة الطقس — لكنه يعيش الرحلة داخل المركبة"
        description="حرارة الجو المعلنة شيء، والتعرض داخل مركبة مغلقة أو أثناء التحميل تحت الشمس شيء آخر. المرجع الصحيح للقرار ليس اسم المنتج وحده؛ بل تعليمات الشركة المصنّعة، تركيبته، تغليفه، ومدة التعرض الفعلية."
        ctaHref="/why-protection"
        ctaLabel="كيف نحدد مستوى الحماية؟"
      />

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_0.7fr] lg:px-8">
          <div>
            <p className="text-sm font-bold text-accent">الفجوة الحرارية</p>
            <h2 className="mt-3 text-3xl font-extrabold text-primary">حرارة الهواء ليست قياسًا لحرارة حيز الشحنة</h2>
            <p className="mt-5 text-lg leading-8 text-slatebrand">
              أثبتت دراسات المركبات المغلقة أن درجة الحرارة داخلها قد ترتفع بسرعة تحت الشمس حتى عندما تكون حرارة الجو معتدلة. هذا لا يسمح بتحويل النتيجة إلى رقم ثابت لكل مركبة أو صندوق؛ القياس الميداني هو المرجع عند الحاجة إلى رقم تشغيلي.
            </p>
          </div>
          <div className="rounded-xl border border-accent/25 bg-frost-50 p-6">
            <Sun className="h-8 w-8 text-accent" />
            <h3 className="mt-4 text-xl font-extrabold text-primary">قاعدة قرار بسيطة</h3>
            <p className="mt-3 leading-7 text-slatebrand">لا تستخدم درجة حرارة الطقس كبديل عن تعليمات العبوة أو قياس حيز الشحنة. إذا اشترط المصنّع نطاقًا محددًا، فذلك النطاق هو نقطة البداية.</p>
          </div>
        </div>
      </section>

      <section className="bg-frost-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-sm font-bold text-accent">منتج × تعرض حراري</p>
          <h2 className="mt-3 text-3xl font-extrabold text-primary">إشارات محتملة، لا تشخيصًا عامًا</h2>
          <p className="mt-4 max-w-3xl leading-7 text-slatebrand">التركيبة والعبوة وتعليمات المصنّع قد تجعل منتجين من الفئة نفسها مختلفين جذريًا. الجدول أداة أسئلة لفرق الجودة، وليس بديلًا عن ملف ثبات المنتج.</p>
          <div className="mt-8 overflow-x-auto rounded-xl border border-line bg-white">
            <table className="w-full min-w-[760px] text-right text-sm">
              <thead className="bg-primary text-white">
                <tr>
                  <th className="p-4">الفئة</th>
                  <th className="p-4">ما الذي ينبغي تقييمه؟</th>
                  <th className="p-4">إشارة محتملة عند العميل</th>
                </tr>
              </thead>
              <tbody>
                {sensitivityRows.map((row) => (
                  <tr key={row[0]} className="border-t border-line align-top">
                    <th className="p-4 font-extrabold text-primary">{row[0]}</th>
                    <td className="p-4 leading-7 text-slatebrand">{row[1]}</td>
                    <td className="p-4 leading-7 text-slatebrand">{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-xl border-2 border-dashed border-line bg-muted/30 p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <Thermometer className="mt-1 h-6 w-6 shrink-0 text-accent" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-accent">قيد التحقق قبل النشر الرقمي</p>
                <h2 className="mt-2 text-2xl font-extrabold text-primary">جدول متوسطات الرياض الشهرية</h2>
                <p className="mt-3 leading-7 text-slatebrand">سيُضاف بعد اعتماد بيانات شهرية رسمية من المركز الوطني للأرصاد. لن ننشر أرقام حرارة صندوق المركبة بوصفها قياسات QBL قبل تنفيذ قياس ميداني موثق.</p>
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              ["تعرض مرتفع", "شمس مباشرة، توقفات طويلة، أو تعليمات حفظ دقيقة: يلزم تقييم مستوى حماية أعلى."],
              ["تعرض متوسط", "مسار منظم مع منتج نشط أو مرتفع القيمة: يُراجع التغليف والتوثيق المطلوب."],
              ["تعرض منخفض", "مسار مباشر وتعليمات حفظ عامة: تبقى الحماية من الشمس والانتظار قاعدة تشغيلية."],
            ].map(([title, text]) => (
              <article key={title} className="rounded-xl border border-line p-5">
                <h3 className="font-extrabold text-primary">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-slatebrand">{text}</p>
              </article>
            ))}
          </div>

          <div className="mt-12">
            <ProtectionLevelSelector />
          </div>
        </div>
      </section>

      <section className="bg-primary text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_0.8fr] lg:px-8">
          <div>
            <div className="flex items-center gap-2 text-accent"><Info className="h-5 w-5" /><span className="text-sm font-bold">المصادر</span></div>
            <p className="mt-3 text-sm leading-7 text-white/70">تمت مراجعة المصادر في 14 يوليو 2026. الاستنتاج التشغيلي الخاص بأي منتج يبقى خاضعًا لتعليمات مصنّعه وقياس الرحلة الفعلية.</p>
          </div>
          <div className="grid gap-3 text-sm">
            <a href="https://www.ncm.gov.sa/Ar/MediaCenter/Documents/ForecastMayJuneJuly26.pdf" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between rounded-lg border border-white/15 p-4 hover:bg-white/10">المركز الوطني للأرصاد — توقعات 2026 <ExternalLink className="h-4 w-4 text-accent" /></a>
            <a href="https://pubmed.ncbi.nlm.nih.gov/15995010/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between rounded-lg border border-white/15 p-4 hover:bg-white/10">دراسة ارتفاع الحرارة داخل المركبات <ExternalLink className="h-4 w-4 text-accent" /></a>
            <a href="https://pubmed.ncbi.nlm.nih.gov/33206444/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between rounded-lg border border-white/15 p-4 hover:bg-white/10">دراسة ثبات الريتينويدات التجارية <ExternalLink className="h-4 w-4 text-accent" /></a>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
          <Link href="/trial" className="inline-flex h-11 items-center gap-2 rounded-md bg-accent px-5 text-sm font-bold text-primary hover:bg-accent-light">ابدأ بتقييم منتجاتك <ArrowLeft className="h-4 w-4" /></Link>
        </div>
      </section>
    </main>
  );
}
