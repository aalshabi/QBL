import Link from "next/link";
import { TrackingView } from "@/components/tracking/tracking-view";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getPublicTrackingSnapshot } from "@/lib/tracking";

export default async function TrackingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const snapshot = await getPublicTrackingSnapshot(token);

  if (!snapshot) {
    return (
      <main className="grid min-h-screen place-items-center bg-muted/50 px-4">
        <Card className="max-w-md rounded-lg">
          <CardContent className="p-6 text-center">
            <h1 className="text-2xl font-bold text-primary">رابط التتبع غير صالح</h1>
            <p className="mt-3 leading-7 text-muted-foreground">قد يكون الرابط منتهي الصلاحية، أو تم إغلاقه بعد التسليم، أو لا يخص طلبًا فعالًا.</p>
            <Button asChild className="mt-6">
              <Link href="/track">العودة إلى التتبع</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return <TrackingView snapshot={snapshot} />;
}
