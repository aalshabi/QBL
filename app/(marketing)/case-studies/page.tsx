import { ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { caseStudies } from "@/lib/company";

export default function CaseStudiesPage() {
  return (
    <main>
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="دراسات حالة تشغيلية"
          title="سيناريوهات جاهزة للنقاش مع عملاء الغذاء والدواء والتجزئة"
          description="هذه أمثلة تشغيلية مبنية على قطاعات QBL المستهدفة. عند توفر عملاء فعليين يمكن تحويلها إلى قصص نجاح موثقة بالأرقام والصور."
        />
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {caseStudies.map((study) => (
            <Card key={study.title} className="rounded-lg">
              <CardContent className="p-6">
                <Badge className="bg-accent text-accent-foreground">{study.sector}</Badge>
                <h2 className="mt-5 text-xl font-bold text-primary">{study.title}</h2>
                <div className="mt-5 space-y-4 text-sm leading-7 text-muted-foreground">
                  <p>
                    <strong className="text-primary">التحدي: </strong>
                    {study.challenge}
                  </p>
                  <p>
                    <strong className="text-primary">الحل: </strong>
                    {study.solution}
                  </p>
                  <p>
                    <strong className="text-primary">الأثر المتوقع: </strong>
                    {study.outcome}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-muted/60">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-4 md:grid-cols-3">
            {["قياس زمن التسليم", "رصد استثناءات الحرارة", "توثيق التسليم والمرتجعات"].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-lg bg-background p-4 font-medium shadow-sm">
                <CheckCircle2 className="h-5 w-5 text-accent" />
                {item}
              </div>
            ))}
          </div>
          <Button asChild className="mt-8 bg-accent text-accent-foreground hover:bg-accent/90">
            <Link href="/quote">
              اطلب دراسة تشغيل لقطاعك
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
