import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ExternalLink, ShieldAlert } from "lucide-react";
import PageHero from "@/components/PageHero";

const canonical = "https://qbl.sa/sfda-readiness";
const sfdaGuide = "https://www.sfda.gov.sa/sites/default/files/2025-03/Drug-resourses-3353.pdf";
const sfdaListing = "https://www.sfda.gov.sa/ar/faq/60290";

export const metadata: Metadata = {
  title: "الاستعداد لاشتراطات حفظ وتوزيع مستحضرات التجميل — QBL",
  description: "كيف يدعم نموذج Beauty Shield الاستعداد الإجرائي لحفظ ونقل مستحضرات التجميل وفق تعليمات الشركة المصنّعة ومتطلبات التوثيق.",
  alternates: { canonical },
  openGraph: {
    title: "الاستعداد الإجرائي لحفظ وتوزيع مستحضرات التجميل — QBL",
    description: "مرجعية الحفظ، السجلات، قياس الحرارة عند الاتفاق، وإدارة الانحرافات دون ادعاء اعتماد تنظيمي.",
    url: canonical,
    locale: "ar_SA",
    type: "article",
  },
};

const procedures = [
  ["المرجعية", "تُترجم تعليمات حفظ الشركة المصنّعة إلى مستوى حماية موثق لكل فئة قبل أول شحنة."],
  ["السجلات", "يُسجل الاستلام والتسليم والاستثناء وفق نموذج التشغيل المتفق عليه، بما يتيح استرجاعه عند المراجعة."],
  ["القياس عند الاتفاق", "تُوثق قراءات الحرارة في النقاط المحددة سلفًا عندما يتضمنها نطاق الخدمة."],
  ["إجراء الانحراف", "أي خروج عن النطاق يُسجل ويُبلغ ويُعالج وفق إجراء مكتوب، بدل إخفائه أو افتراض سلامة المنتج."],
  ["الفصل", "تُفصل الفئات غير المتوافقة حراريًا ولا تُجمع في تجهيز واحد دون تقييم مسبق."],
  ["إثبات التسليم", "تُوثق حالة التسليم بالطريقة المتفق عليها، مثل رمز الاستلام أو التوقيع أو الصورة."],
] as const;

export default function SfdaReadinessPage() {
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "الرئيسية", item: "https://qbl.sa/" },
      { "@type": "ListItem", position: 2, name: "الاستعداد لاشتراطات الهيئة", item: canonical },
    ],
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <PageHero
        eyebrow="استعداد وتوافق إجرائي"
        title="التنظيم قائم — وتشغيلنا مصمم للاستعداد له"
        description="تشمل مدونة الهيئة العامة للغذاء والدواء أسس توزيع وتخزين ونقل المنتجات التجميلية، وتؤكد المحافظة على ظروف الحفظ الموصى بها من الشركة المصنّعة والاحتفاظ بالسجلات. Beauty Shield يحول هذه المبادئ إلى مسار تشغيلي قابل للتوثيق دون ادعاء اعتماد لا نملكه."
        ctaHref="/trial"
        ctaLabel="ابدأ تجربة Beauty Shield"
      />

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-bold text-accent">ما الذي يعنيه ذلك لعلامتك؟</p>
            <h2 className="mt-3 text-3xl font-extrabold text-primary">مسؤولية الحفظ لا تتوقف عند باب المستودع</h2>
            <p className="mt-5 text-lg leading-8 text-slatebrand">
              تعليمات الحفظ المكتوبة على العبوة يجب أن تبقى مرجع القرار أثناء النقل. وعندما يسأل فريق الجودة أو شريك تجاري عن آخر ميل، فالجواب الأقوى هو إجراء موثق وسجل قابل للمراجعة، لا وعد عام.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-frost-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-bold text-accent">نموذج QBL</p>
            <h2 className="mt-3 text-3xl font-extrabold text-primary">ستة إجراءات قابلة للتدقيق</h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {procedures.map(([title, description]) => (
              <article key={title} className="rounded-xl border border-line bg-white p-6">
                <CheckCircle2 className="h-6 w-6 text-accent" />
                <h3 className="mt-4 text-lg font-extrabold text-primary">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-slatebrand">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_0.8fr] lg:px-8">
          <div className="rounded-xl border border-amber/35 bg-amber/10 p-6">
            <div className="flex items-start gap-4">
              <ShieldAlert className="mt-1 h-6 w-6 shrink-0 text-amber" />
              <div>
                <h2 className="text-2xl font-extrabold text-primary">ما لا ندعيه</h2>
                <ul className="mt-4 grid gap-3 text-sm leading-7 text-slatebrand">
                  <li>لا ندعي اعتمادًا أو ترخيصًا من الهيئة لخدمة Beauty Shield.</li>
                  <li>إدراج المنتج والالتزام باشتراطاته مسؤولية العلامة أو الجهة صاحبة المنتج؛ دور QBL هو تنفيذ نطاق النقل المتفق عليه وتوثيقه.</li>
                  <li>لا نعد بنتيجة لا تثبتها سجلات التشغيل، وأي شهادة مستقبلية ستُنشر بمستندها.</li>
                </ul>
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-primary">المصادر الرسمية</h2>
            <p className="mt-3 text-sm leading-7 text-slatebrand">تمت مراجعة الروابط في 14 يوليو 2026. المرجع النهائي دائمًا هو أحدث نسخة منشورة من الهيئة.</p>
            <div className="mt-5 grid gap-3">
              <a href={sfdaGuide} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between rounded-lg border border-line p-4 text-sm font-bold text-primary hover:border-accent">
                مدونة أسس ممارسة التوزيع والتخزين الجيدة
                <ExternalLink className="h-4 w-4 text-accent" />
              </a>
              <a href={sfdaListing} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between rounded-lg border border-line p-4 text-sm font-bold text-primary hover:border-accent">
                متطلبات إدراج منتج تجميلي
                <ExternalLink className="h-4 w-4 text-accent" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-primary text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 py-12 sm:px-6 lg:flex-row lg:items-center lg:px-8">
          <div>
            <p className="text-sm text-white/65">اجعل آخر ميل جزءًا موثقًا من ملف الجودة</p>
            <h2 className="mt-2 text-3xl font-extrabold">ابدأ بنطاق صغير، ثم قرر من التقرير</h2>
          </div>
          <Link href="/trial" className="inline-flex h-12 items-center gap-2 rounded-md bg-accent px-6 text-sm font-bold text-primary hover:bg-accent-light">
            ابدأ التجربة
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
