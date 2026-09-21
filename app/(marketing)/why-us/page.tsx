import { ContentPage } from "@/components/marketing/content-page";
import { differentiators } from "@/lib/company";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "نموذج تشغيل QBL للتوصيل المبرّد آخر ميل في الرياض",
  description:
    "تشغيل QBL للتوصيل المبرّد آخر ميل داخل الرياض: متابعة حالة الطلب والمندوب، مراقبة درجة الحرارة والتنبيه عند الاستثناء، وتسليم موثق. اطلب عرض تشغيل.",
  path: "/why-us",
});

export default function WhyUsPage() {
  return (
    <ContentPage
      eyebrow="لماذا نحن"
      title="وضوح تشغيلي وسرعة تنفيذ دون التضحية بسلامة المنتج"
      description="نقيس الرحلة من زاوية العميل والشريك وفريق العمليات: أين الطلب؟ من المندوب؟ ما درجة الحرارة؟ وهل تم التسليم بشكل موثق؟"
      items={differentiators.map((item) => ({
        title: item,
        description: "جزء من نموذج تشغيل QBL لبناء خدمة مبرّدة موثوقة وقابلة للتوسع داخل الرياض.",
      }))}
    />
  );
}
