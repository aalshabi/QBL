import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FileCheck2 } from "lucide-react";

export const metadata: Metadata = {
  title: "دراسات الحالة — QBL",
  description: "لن تنشر QBL دراسة حالة قبل اكتمال تجربة فعلية واعتماد أرقامها وإذن العميل.",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://qbl.sa/case-studies" },
};

export default function CaseStudiesPage() {
  return (
    <main className="bg-white">
      <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-frost text-accent"><FileCheck2 className="h-7 w-7" /></div>
        <p className="mt-6 text-sm font-bold text-accent">بنية ثقة بلا قصص وهمية</p>
        <h1 className="mt-3 text-4xl font-extrabold text-primary">أول دراسة حالة ستُنشر بعد أول تجربة موثقة</h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slatebrand">لن نحول سيناريو افتراضيًا إلى قصة نجاح. عند اكتمال تجربة فعلية، سننشر نطاقها وأرقامها واستثناءاتها وقرار العميل بعد الحصول على إذن مكتوب.</p>
        <Link href="/trial" className="mt-8 inline-flex h-12 items-center gap-2 rounded-md bg-primary px-6 text-sm font-bold text-white hover:bg-primary-800">كن أول تجربة موثقة <ArrowLeft className="h-4 w-4" /></Link>
      </section>
    </main>
  );
}
