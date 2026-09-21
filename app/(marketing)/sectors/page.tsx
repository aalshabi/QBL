import { ContentPage } from "@/components/marketing/content-page";
import { sectors } from "@/lib/company";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "توصيل مبرّد للصيدليات والمطاعم والتجزئة في الرياض",
  description:
    "قطاعات يخدمها QBL بتوصيل مبرّد داخل الرياض: موردو الأغذية، الصيدليات والمستوصفات، المطاعم، التجزئة، الفنادق والمستشفيات، والتجارة الإلكترونية. اطلب عرض تشغيل.",
  path: "/sectors",
});

export default function SectorsPage() {
  return (
    <ContentPage
      eyebrow="القطاعات المستهدفة"
      title="نخدم القطاعات التي تتأثر مباشرة بالوقت ودرجة الحرارة"
      description="يركز نموذج QBL على آخر ميل مبرد للشركات التي تريد الحفاظ على الجودة من نقطة الخروج حتى باب العميل."
      items={sectors.map((sector) => ({
        title: sector,
        description: "تشغيل مبرّد مع تتبع لحظي، قراءات حرارة عند توفرها، وإثبات تسليم بكود استلام.",
      }))}
    />
  );
}
