import type { Metadata } from "next";
import { BrandLogo } from "@/components/brand-logo";

export const metadata: Metadata = {
  title: "نموذج التقرير الختامي لتجربة Beauty Shield — بيانات افتراضية",
  description: "نموذج توضيحي لبنية التقرير الختامي. جميع البيانات افتراضية ولا تمثل عميلًا أو أداءً فعليًا.",
  robots: { index: false, follow: false, noarchive: true },
};

const rows = [
  ["يوم تجريبي — أ", "شمال الرياض", "Heat Protected", "ضمن الإجراء", "ضمن الإجراء", "مكتمل"],
  ["يوم تجريبي — ب", "شرق الرياض", "Temperature Controlled", "ضمن النطاق", "ضمن النطاق", "مكتمل"],
  ["يوم تجريبي — ج", "وسط الرياض", "Temperature Controlled", "ضمن النطاق", "استثناء مسجل", "مغلق بإجراء"],
] as const;

export default function BeautyShieldSampleReportPage() {
  return (
    <main className="print-profile bg-slate-100 px-3 py-8 print:bg-white print:p-0">
      <article className="mx-auto max-w-[980px] rounded-xl bg-white p-6 shadow-sm print:max-w-none print:rounded-none print:p-6 print:shadow-none sm:p-10" dir="rtl">
        <header className="flex flex-col justify-between gap-5 border-b-2 border-primary pb-6 sm:flex-row sm:items-start">
          <BrandLogo />
          <div className="sm:text-left" dir="rtl"><p className="text-xs font-bold text-accent">نموذج توضيحي — البيانات افتراضية</p><h1 className="mt-2 text-2xl font-extrabold text-primary">التقرير الختامي — تجربة Beauty Shield</h1><p className="mt-2 text-sm text-slatebrand">علامة عناية نموذجية · فترة افتراضية</p></div>
        </header>

        <section className="mt-6 grid gap-3 sm:grid-cols-3">
          {["النطاق: طلبات توضيحية", "الفئات: عناية وسيروم", "المرجع: تعليمات المصنّع"].map((item) => <div key={item} className="rounded-lg bg-frost-50 p-4 text-sm font-bold text-primary">{item}</div>)}
        </section>

        <section className="mt-7">
          <h2 className="text-lg font-extrabold text-primary">سجل الشحنات التوضيحي</h2>
          <div className="mt-3 overflow-x-auto rounded-lg border border-line">
            <table className="w-full min-w-[760px] text-right text-xs">
              <thead className="bg-primary text-white"><tr>{["التاريخ", "المنطقة", "المستوى", "الاستلام", "التسليم", "الحالة"].map((h)=><th key={h} className="p-3">{h}</th>)}</tr></thead>
              <tbody>{rows.map((row)=><tr key={row[0]} className="border-t border-line">{row.map((cell)=><td key={cell} className="p-3 text-slatebrand">{cell}</td>)}</tr>)}</tbody>
            </table>
          </div>
        </section>

        <section className="mt-7 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-line p-5"><h2 className="font-extrabold text-primary">الاستثناءات</h2><p className="mt-2 text-sm leading-7 text-slatebrand">مثال افتراضي: سُجلت قراءة خارج النطاق المتفق عليه، وأُبلغ العميل وفق الإجراء، وعُزل الطلب حتى صدور قرار الجهة صاحبة المنتج.</p></div>
          <div className="rounded-lg border border-line p-5"><h2 className="font-extrabold text-primary">التوصية</h2><p className="mt-2 text-sm leading-7 text-slatebrand">تُكتب بعد التجربة الفعلية بحسب الفئات والمناطق والاستثناءات، ولا تُستبدل بتوصية جاهزة مسبقًا.</p></div>
        </section>

        <footer className="mt-7 border-t border-line pt-4 text-xs leading-6 text-slatebrand"><strong className="text-primary">المرجع الحراري:</strong> تعليمات الشركة المصنّعة لكل منتج. هذا الملف يوضح شكل التقرير فقط ولا يمثل أداءً فعليًا أو عميلًا حقيقيًا.</footer>
      </article>
    </main>
  );
}
