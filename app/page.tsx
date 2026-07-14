import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, FlaskConical, MessageCircle, ShieldCheck, Snowflake, Sparkles, Thermometer } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "QBL Beauty Shield | توصيل محمي حراريًا لمستحضرات التجميل في الرياض",
  description: "توصيل آخر ميل لمنتجات التجميل والعناية في الرياض بمستوى حماية يُحدد من تعليمات الشركة المصنّعة، مع تجربة محدودة وتقرير ختامي.",
  alternates: {
    canonical: "https://qbl.sa/",
    languages: { "ar-SA": "https://qbl.sa/", en: "https://qbl.sa/en", "x-default": "https://qbl.sa/" },
  },
  openGraph: {
    title: "QBL Beauty Shield — حماية منتجات العناية حتى باب العميل",
    description: "ثلاثة مستويات حماية، تُحدد من تعليمات حفظ المنتج ومخاطر مسار التوصيل داخل الرياض.",
    url: "https://qbl.sa/",
    locale: "ar_SA",
    type: "website",
  },
};

const levels = [
  [ShieldCheck, "Heat Protected", "حماية من الشمس وحرارة المركبة للمنتجات ذات تعليمات الحفظ العامة."],
  [Thermometer, "Temperature Controlled", "تحكم وتوثيق أعلى للمنتجات ذات النطاق المحدد أو مخاطر التعرض الأعلى."],
  [Snowflake, "Refrigerated Delivery", "تجهيز مبرد عندما تنص تعليمات الشركة المصنّعة على الحفظ المبرد."],
] as const;

export default function Home() {
  const whatsapp = `https://wa.me/${SITE.phone.replace(/[^\d]/g, "")}?text=${encodeURIComponent("السلام عليكم، أرغب بمراجعة منتجاتنا وبدء تجربة QBL Beauty Shield في الرياض.")}`;
  return (
    <>
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden bg-primary text-white">
          <div className="absolute inset-0 map-grid opacity-15" aria-hidden="true" />
          <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_0.65fr] lg:px-8 lg:py-24">
            <div>
              <p className="inline-flex rounded-md border border-accent/30 bg-accent/10 px-3 py-1 text-sm font-bold text-accent">QBL Beauty Shield · الرياض</p>
              <h1 className="mt-6 max-w-4xl text-4xl font-extrabold leading-tight sm:text-6xl">توصيل محمي حراريًا لمستحضرات التجميل والعناية</h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-white/72">نحمي منتجات العناية في آخر ميل بمستوى يُحدد لكل فئة من تعليمات الشركة المصنّعة — لا بتبريد موحد لكل شيء، ولا بوعود لا تثبتها السجلات.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/trial" className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-accent px-6 text-sm font-bold text-primary hover:bg-accent-light">ابدأ تجربة Beauty Shield <ArrowLeft className="h-4 w-4" /></Link>
                <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-white/20 px-6 text-sm font-bold text-white hover:bg-white/10">تحدث معنا على واتساب <MessageCircle className="h-4 w-4 text-accent" /></a>
              </div>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/8 p-6 backdrop-blur-sm">
              <FlaskConical className="h-8 w-8 text-accent" />
              <h2 className="mt-5 text-2xl font-extrabold">ابدأ من ملصق المنتج</h2>
              <p className="mt-3 leading-8 text-white/70">أرسل صورة تعليمات الحفظ، الفئات، نقاط الاستلام، ومناطق التسليم. نعيدها لك في مصفوفة مستوى حماية ونطاق تجربة واضح.</p>
              <Link href="/why-protection" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-accent">كيف نحدد المستوى؟ <ArrowLeft className="h-4 w-4" /></Link>
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <p className="text-sm font-bold text-accent">المشكلة</p>
            <h2 className="mt-3 max-w-4xl text-3xl font-extrabold text-primary">التوصيل العادي لا يبدأ من تعليمات حفظ منتجك</h2>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slatebrand">التعرض للشمس والانتظار داخل المركبة قد يتعارض مع شروط الحفظ المكتوبة. الحل ليس المبالغة في التبريد؛ بل اختيار الحماية المناسبة وتوثيق ما اتُفق عليه.</p>
            <Link href="/riyadh-heat" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary">اقرأ مرجع حرارة الرياض ومنتجات العناية <ArrowLeft className="h-4 w-4 text-accent" /></Link>
          </div>
        </section>

        <section className="bg-frost-50">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <p className="text-sm font-bold text-accent">ثلاثة مستويات</p>
            <h2 className="mt-3 text-3xl font-extrabold text-primary">اختيار مبني على المنتج، لا قالب واحد</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {levels.map(([Icon, title, text]) => <article key={title} className="rounded-xl border border-line bg-white p-6"><Icon className="h-7 w-7 text-accent" /><h3 className="mt-5 font-latin text-xl font-extrabold text-primary">{title}</h3><p className="mt-3 text-sm leading-7 text-slatebrand">{text}</p></article>)}
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div><p className="text-sm font-bold text-accent">لمن؟</p><h2 className="mt-3 text-3xl font-extrabold text-primary">للعلامات التي تريد آخر ميل قابلًا للشرح والمراجعة</h2><div className="mt-6 grid gap-3 sm:grid-cols-2">{["علامات التجميل والعناية", "الموزعون", "التجارة الإلكترونية", "سلاسل الصيدليات", "عيادات الجلدية", "الصالونات"].map(item=><div key={item} className="flex items-center gap-2 rounded-lg border border-line p-3 text-sm font-semibold text-primary"><CheckCircle2 className="h-4 w-4 text-accent" />{item}</div>)}</div></div>
            <div className="rounded-xl bg-primary p-7 text-white"><Sparkles className="h-7 w-7 text-accent"/><p className="mt-5 text-sm font-bold text-accent">تجربة قبل عقد</p><h2 className="mt-3 text-3xl font-extrabold">نراجع. نشغّل. نوثق. ثم تقرر.</h2><p className="mt-4 leading-8 text-white/70">نبدأ بنطاق محدود من الطلبات الفعلية، ثم نسلمك تقريرًا ختاميًا يوضح التنفيذ والاستثناءات والتوصية.</p><Link href="/trial" className="mt-7 inline-flex h-11 items-center gap-2 rounded-md bg-accent px-5 text-sm font-bold text-primary">شاهد مسار التجربة <ArrowLeft className="h-4 w-4" /></Link></div>
          </div>
        </section>

        <section className="border-t border-line bg-white">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><p className="text-sm font-bold text-accent">ثقة بلا مبالغة</p><h2 className="mt-3 max-w-4xl text-2xl font-extrabold text-primary">لا ندعي اعتمادًا لا نملكه، ولا ننشر دراسة حالة قبل وجود عميل وأرقام وإذن مكتوب</h2><div className="mt-5 flex flex-wrap gap-4 text-sm font-bold"><Link href="/sfda-readiness" className="text-primary hover:text-accent">الاستعداد التنظيمي</Link><Link href="/case-studies" className="text-primary hover:text-accent">سياسة دراسات الحالة</Link><Link href="/faq" className="text-primary hover:text-accent">الأسئلة الشائعة</Link></div></div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
