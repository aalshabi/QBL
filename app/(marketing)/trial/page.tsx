import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { TrialForm } from "@/components/marketing/trial-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "اطلب تجربة Beauty Shield — QBL",
  description:
    "ابدأ بتجربة تشغيلية محدودة: مراجعة منتجاتك، تحديد مستوى الحماية، تنفيذ طلبات فعلية، وتقرير ختامي — قبل أي التزام طويل.",
  alternates: { canonical: "/trial" },
};

const includes = [
  "مراجعة تعليمات حفظ منتجاتك.",
  "اختيار مستوى الحماية لكل فئة.",
  "تحديد مسار التجربة ونطاقها.",
  "تنفيذ عدد محدود من الطلبات الفعلية.",
  "تقرير ختامي بالنتائج والاستثناءات.",
  "توصية بنموذج التشغيل الشهري المناسب.",
];

export default function TrialPage() {
  return (
    <main className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
      <div>
        <p className="text-sm font-bold text-accent">اطلب تجربة Beauty Shield</p>
        <h1 className="mt-3 text-3xl font-extrabold leading-tight text-primary sm:text-4xl">
          اختبر Beauty Shield على منتجاتك الفعلية — قبل أي عقد
        </h1>
        <p className="mt-4 leading-8 text-slatebrand">
          لا نطلب منك التزاماً طويلاً على وعود. نطلب فرصة نثبت فيها النموذج على طلباتك الحقيقية.
        </p>

        <h2 className="mt-8 text-sm font-bold text-accent">ماذا تشمل التجربة؟</h2>
        <ul className="mt-4 grid gap-3">
          {includes.map((item) => (
            <li key={item} className="flex items-start gap-3 rounded-lg border border-line bg-frost-50 p-4 text-sm leading-7 text-slatebrand">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-sm leading-7 text-slatebrand">
          عدد الطلبات ونطاق التجربة وتكلفتها تُحدد معك بعد مراجعة المنتجات والمسارات.
        </p>
      </div>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>نموذج الطلب</CardTitle>
        </CardHeader>
        <CardContent>
          <TrialForm />
        </CardContent>
      </Card>
    </main>
  );
}
