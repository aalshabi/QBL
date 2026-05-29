import { BarChart3, CalendarCheck, Send, ShieldCheck } from "lucide-react";
import { submitLead } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
          <form action={submitLead} className="grid gap-5">
            <div className="grid gap-2">
              <Label htmlFor="name">اسم المسؤول</Label>
              <Input id="name" name="name" placeholder="مثال: مدير العمليات أو المشتريات" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="company">اسم الشركة</Label>
              <Input id="company" name="company" placeholder="اسم الشركة أو العلامة التجارية" required />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="email">البريد الرسمي</Label>
                <Input id="email" name="email" type="email" placeholder="name@company.com" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">رقم التواصل</Label>
                <Input id="phone" name="phone" placeholder="05xxxxxxxx" required />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="message">ما الذي تحتاجه شركتك؟</Label>
              <Textarea
                id="message"
                name="message"
                rows={6}
                placeholder="مثال: 80 طلب يوميًا، منتجات طازجة 0 إلى +5، تغطية شمال وشرق الرياض، نحتاج تتبع للعميل وكود استلام."
                required
              />
            </div>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Send className="h-4 w-4" />
              اطلب دراسة تشغيل وسعر
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
