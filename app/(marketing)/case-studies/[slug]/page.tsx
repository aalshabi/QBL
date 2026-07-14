import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "قالب دراسة حالة Beauty Shield — مسودة داخلية",
  description: "قالب غير مفهرس يُعبأ فقط من تقرير تجربة فعلية.",
  robots: { index: false, follow: false, noarchive: true },
};

const fields = [
  ["العلامة", "الاسم بعد إذن كتابي، أو وصف القطاع مع إذن بالنشر دون تسمية."],
  ["المنتج والتحدي", "الفئات، تعليمات الحفظ، ولماذا كان مسار التوصيل يحتاج حماية إضافية."],
  ["المستوى المختار ولماذا", "القرار الموثق من تعليمات الشركة المصنّعة ومخاطر المسار."],
  ["التجربة بالأرقام", "الطلبات المنفذة، الفترة، المناطق، القراءات المتفق عليها، والاستثناءات وكيف عولجت — من التقرير الختامي فقط."],
  ["القرار", "ما اختاره العميل بعد مراجعة التقرير."],
  ["اقتباس العميل", "جملة حقيقية مع الاسم والصفة أو بدون تسمية وفق الإذن الكتابي."],
] as const;

export default async function CaseStudyDraftPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug !== "beauty-shield-template") notFound();
  return (
    <main className="bg-muted/30">
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="inline-flex rounded-md bg-amber/15 px-3 py-1 text-xs font-bold text-primary">مسودة مخفية · noindex · ليست دراسة منشورة</p>
        <h1 className="mt-5 text-4xl font-extrabold text-primary">قالب دراسة حالة Beauty Shield</h1>
        <p className="mt-4 leading-8 text-slatebrand">لا يُملأ أي حقل بتقدير. المصدر الوحيد للأرقام هو التقرير الختامي لتجربة فعلية مع إذن النشر.</p>
        <div className="mt-8 grid gap-4">
          {fields.map(([title, guidance], index) => (
            <section key={title} className="rounded-xl border border-line bg-white p-6">
              <p className="font-latin text-xs font-bold text-accent">0{index + 1}</p>
              <h2 className="mt-2 text-xl font-extrabold text-primary">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-slatebrand">{guidance}</p>
              <div className="mt-4 min-h-16 rounded-lg border-2 border-dashed border-line bg-muted/20" aria-label={`مساحة تعبئة ${title}`} />
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}
