import type { Metadata } from "next";
import { ContentPage } from "@/components/marketing/content-page";
import { differentiators } from "@/lib/company";

export const metadata: Metadata = {
  title: "لماذا QBL؟ وضوح تشغيلي وتسليم موثق | QBL",
  description:
    "نموذج تشغيل QBL مبني على تتبع حالة الطلب، رصد الحرارة حسب المنتج، وتوثيق التسليم — عمليات قابلة للمراجعة لا وعود عامة.",
  alternates: { canonical: "/why-us" },
};

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
