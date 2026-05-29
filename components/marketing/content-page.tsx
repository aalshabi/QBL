import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeading } from "@/components/marketing/section-heading";

export function ContentPage({
  eyebrow,
  title,
  description,
  items,
}: {
  eyebrow: string;
  title: string;
  description: string;
  items: { title: string; description: string }[];
}) {
  return (
    <main>
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <SectionHeading eyebrow={eyebrow} title={title} description={description} />
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card key={item.title} className="rounded-lg">
              <CardContent className="p-6">
                <CheckCircle2 className="h-6 w-6 text-accent" />
                <h2 className="mt-4 text-lg font-bold text-primary">{item.title}</h2>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Link href="/quote">
              اطلب عرض سعر
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/contact">تواصل مع فريق التشغيل</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
