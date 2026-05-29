import { AlertTriangle, Clock3, FileCheck2, MapPinned, ShieldCheck, Thermometer } from "lucide-react";
import Link from "next/link";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { slaHighlights } from "@/lib/company";

const slaTable = [
  { metric: "تفعيل رابط التتبع", target: "عند حالة Out for Delivery", owner: "النظام / العمليات" },
  { metric: "تحديث موقع المندوب", target: "كل 10-15 ثانية أو عند تغير الموقع", owner: "واجهة المندوب" },
  { metric: "محاولات OTP", target: "حد أقصى 5 محاولات", owner: "النظام" },
  { metric: "إعادة إرسال الكود", target: "مسار موثق عبر NotificationLog", owner: "SMS/WhatsApp Adapter" },
  { metric: "استثناءات الحرارة", target: "Warning / Critical حسب النطاق", owner: "العمليات" },
  { metric: "التجاوز اليدوي", target: "مدير عمليات + سبب إلزامي", owner: "Ops Manager" },
];

export default function SlaPage() {
  return (
    <main>
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Service Level Agreement"
          title="نموذج SLA تشغيلي للتوصيل المبرّد آخر ميل"
          description="يعرض هذا النموذج كيف يمكن تحويل الخدمة إلى مؤشرات قابلة للقياس في العقود المؤسسية، مع ضبط القيم النهائية حسب القطاع والمنطقة وحجم الطلبات."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {slaHighlights.map((item, index) => {
            const icons = [Clock3, MapPinned, ShieldCheck, Thermometer];
            const Icon = icons[index] ?? FileCheck2;
            return (
              <Card key={item.title} className="rounded-lg">
                <CardContent className="p-5">
                  <Icon className="h-6 w-6 text-accent" />
                  <h2 className="mt-4 font-bold text-primary">{item.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="bg-muted/60">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-lg border bg-background shadow-sm">
            <div className="grid grid-cols-3 bg-primary px-4 py-3 text-sm font-bold text-primary-foreground">
              <span>المؤشر</span>
              <span>المستهدف</span>
              <span>المالك</span>
            </div>
            {slaTable.map((row) => (
              <div key={row.metric} className="grid grid-cols-3 gap-3 border-t px-4 py-4 text-sm">
                <span className="font-semibold text-primary">{row.metric}</span>
                <span className="text-muted-foreground">{row.target}</span>
                <span className="text-muted-foreground">{row.owner}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-950">
            <AlertTriangle className="mt-1 h-5 w-5" />
            <p>الأرقام هنا نموذج تشغيلي قابل للتعاقد وليست ادعاء أداء تاريخي. يتم تثبيت SLA النهائي بعد دراسة المسارات والسعات.</p>
          </div>
          <Button asChild className="mt-8 bg-accent text-accent-foreground hover:bg-accent/90">
            <Link href="/quote">اطلب SLA مخصص</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
