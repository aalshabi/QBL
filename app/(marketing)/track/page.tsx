import Link from "next/link";
import { createTrackingToken } from "@/lib/security";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// التوكن يُوقَّع عند كل طلب: صفحة ثابتة تخبز توكناً منتهي الصلاحية (8h) بعد البناء،
// والتوقيع وقت البناء يصطدم بإلزامية الأسرار في الإنتاج.
export const dynamic = "force-dynamic";

export default async function TrackEntryPage() {
  const token = await createTrackingToken("order-003", "8h");
  const sampleHref = `/track/${token}`;

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="font-bold text-accent">تتبع الشحنة</p>
      <h1 className="mt-3 text-4xl font-bold text-primary">رابط تتبع آمن ومؤقت لكل طلب</h1>
      <p className="mt-4 leading-8 text-muted-foreground">
        في التشغيل الحقيقي يتم إنشاء الرابط عند خروج الطلب للتسليم وإرساله للعميل عبر SMS أو WhatsApp. الرابط أدناه عينة موقعة صالحة للتجربة المحلية.
      </p>
      <Card className="mt-8 rounded-lg">
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">رابط تجربة</p>
          <p className="mt-3 break-all rounded-md bg-muted p-3 text-xs ltr text-left">{sampleHref}</p>
          <Button asChild className="mt-5 bg-accent text-accent-foreground hover:bg-accent/90">
            <Link href={sampleHref}>فتح صفحة التتبع</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
