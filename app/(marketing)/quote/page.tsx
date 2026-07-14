import { BarChart3, CalendarCheck, ShieldCheck } from "lucide-react";
import { QuoteForm } from "@/components/marketing/quote-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function QuotePage() {
  return (
    <main className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
      <div>
        <p className="font-bold text-accent">طلب عرض سعر للشركات</p>
        <h1 className="mt-3 text-4xl font-bold leading-tight text-primary">
          دعنا نصمم لك نموذج تشغيل مبرّد يناسب حجم طلباتك ومناطقك
        </h1>
        <p className="mt-4 leading-8 text-muted-foreground">
          QBL ليست مجرد مندوب يوصل الطلب. نحن نبني مع شركتك مسار آخر ميل يحمي جودة المنتج، يقلل مكالمات المتابعة، ويوفر إثبات تسليم واضح لفريق العمليات وخدمة العملاء.
        </p>
        <div className="mt-8 grid gap-3">
          {[
            { icon: BarChart3, text: "تحليل حجم الطلبات اليومية ومناطق التغطية داخل الرياض." },
            { icon: ShieldCheck, text: "تحديد نطاق الحرارة وآلية إثبات الاستلام المناسبة لمنتجاتك." },
            { icon: CalendarCheck, text: "اقتراح نموذج تشغيل: خطوط ثابتة، عند الطلب، أو اشتراك مؤسسي." },
          ].map((item) => (
            <div key={item.text} className="flex items-start gap-3 rounded-lg border bg-card p-4 text-sm font-medium">
              <item.icon className="mt-0.5 h-5 w-5 text-accent" />
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>بيانات التواصل والتشغيل</CardTitle>
        </CardHeader>
        <CardContent>
          <QuoteForm />
        </CardContent>
      </Card>
    </main>
  );
}
