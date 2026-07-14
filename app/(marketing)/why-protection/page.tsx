import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import PageHero from "@/components/PageHero";
import { ProtectionLevelSelector } from "@/components/protection-level-selector";

export const metadata: Metadata = {
  title: "لماذا تحتاج منتجات العناية حماية حرارية أثناء التوصيل؟ — QBL",
  description: "طريقة عملية لتحويل تعليمات حفظ الشركة المصنّعة إلى مستوى حماية مناسب لرحلة التوصيل داخل الرياض.",
  alternates: { canonical: "https://qbl.sa/why-protection" },
};

const decisionRows = [
  ["تعليمات عامة: يحفظ بعيدًا عن الحرارة والشمس", "Heat Protected", "عزل من الشمس وحرارة المركبة ومسار مباشر"],
  ["نطاق حراري محدد أو منتج نشط/مرتفع القيمة", "Temperature Controlled", "تجهيز وتحكم وتوثيق أعلى حسب الاتفاق"],
  ["تعليمات صريحة بالحفظ المبرد", "Refrigerated Delivery", "تجهيز مبرد يطابق النطاق المحدد من المصنّع"],
] as const;

export default function WhyProtectionPage() {
  return (
    <main>
      <PageHero
        eyebrow="تعليمات الحفظ ← قرار التشغيل"
        title="لا نختار التبريد باسم المنتج — نختاره من تعليمات حفظه"
        description="السيروم والكريم والعطر ليست فئات حرارية ثابتة. قد تختلف المتطلبات بين تركيبتين متشابهتين؛ لذلك يبدأ Beauty Shield من ملصق المنتج وملف الثبات ثم يضيف مخاطر مسار التوصيل."
        ctaHref="/trial"
        ctaLabel="ابدأ مراجعة منتجاتك"
      />

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-sm font-bold text-accent">مصفوفة القرار</p>
          <h2 className="mt-3 text-3xl font-extrabold text-primary">من التعليمات إلى مستوى الحماية</h2>
          <div className="mt-8 overflow-x-auto rounded-xl border border-line">
            <table className="w-full min-w-[720px] text-right text-sm">
              <thead className="bg-primary text-white">
                <tr><th className="p-4">مرجع الحفظ</th><th className="p-4">المستوى الأولي</th><th className="p-4">ما الذي يتغير تشغيليًا؟</th></tr>
              </thead>
              <tbody>
                {decisionRows.map((row) => (
                  <tr key={row[1]} className="border-t border-line align-top">
                    <td className="p-4 leading-7 text-slatebrand">{row[0]}</td>
                    <th className="p-4 font-latin font-extrabold text-primary">{row[1]}</th>
                    <td className="p-4 leading-7 text-slatebrand">{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slatebrand">هذه مصفوفة فرز أولي. أي نص محدد على العبوة أو تعليمات مكتوبة من المصنّع يتقدم عليها.</p>

          <div className="mt-12">
            <ProtectionLevelSelector />
          </div>
        </div>
      </section>

      <section className="bg-frost-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-primary">ما نحتاجه منك قبل التجربة</h2>
          <div className="mt-7 grid gap-4 md:grid-cols-2">
            {["صورة واضحة لتعليمات الحفظ على كل منتج", "قائمة الفئات والأحجام ونوع العبوات", "نقاط الاستلام ومناطق التسليم", "مستوى التوثيق المطلوب عند الاستلام والتسليم"].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-lg border border-line bg-white p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                <span className="text-sm font-bold leading-7 text-primary">{item}</span>
              </div>
            ))}
          </div>
          <Link href="/trial" className="mt-8 inline-flex h-12 items-center gap-2 rounded-md bg-primary px-6 text-sm font-bold text-white hover:bg-primary-800">ابدأ التجربة <ArrowLeft className="h-4 w-4" /></Link>
        </div>
      </section>
    </main>
  );
}
