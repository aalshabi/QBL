import { ContentPage } from "@/components/marketing/content-page";
import { services } from "@/lib/company";

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
