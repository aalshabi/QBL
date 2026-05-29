import Link from "next/link";
import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function OfflinePage() {
  return (
    <main className="grid min-h-screen place-items-center bg-muted/50 px-4">
      <Card className="w-full max-w-md rounded-lg">
        <CardContent className="p-6 text-center">
          <WifiOff className="mx-auto h-10 w-10 text-accent" />
          <h1 className="mt-5 text-2xl font-bold text-primary">أنت غير متصل الآن</h1>
          <p className="mt-3 leading-7 text-muted-foreground">
            يمكنك العودة للصفحات المحفوظة مؤقتًا، وسيتم تحديث البيانات عند رجوع الاتصال.
          </p>
          <Button asChild className="mt-6 bg-accent text-accent-foreground hover:bg-accent/90">
            <Link href="/">العودة للرئيسية</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
