import type { Metadata } from "next";
import { ContentPage } from "@/components/marketing/content-page";
import { services } from "@/lib/company";

export const metadata: Metadata = {
  title: "خدمات التوصيل المبرّد للشركات في الرياض | QBL",
  description:
    "حلول توصيل مبرّد مصممة لحماية جودة المنتج: توصيل B2B2C، خطوط ثابتة، توصيل عند الطلب، اشتراكات مؤسسية، ولوجستيات عكسية داخل الرياض.",
  alternates: { canonical: "/services" },
};

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
