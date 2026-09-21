import { ContentPage } from "@/components/marketing/content-page";
import { services } from "@/lib/company";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "خدمات التوصيل المبرّد للشركات في الرياض | QBL",
  description:
    "خدمات QBL للتوصيل المبرّد داخل الرياض: B2B2C، الأغذية الطازجة، المجمدات، التوصيل الدوائي، الخطوط الثابتة، والتوصيل عند الطلب. اطلب عرض تشغيل.",
  path: "/services",
});

export default function ServicesPage() {
  return (
    <ContentPage
      eyebrow="خدمات للشركات"
      title="حلول توصيل مبرّد مصممة لحماية جودة المنتج وتجربة العميل"
      description="كل خدمة في QBL مبنية حول احتياج الشركات: تقليل الهدر، رفع وضوح العمليات، تحسين تجربة العميل النهائي، وتوثيق التسليم بطريقة قابلة للمراجعة."
      items={services}
    />
  );
}
