import { ContentPage } from "@/components/marketing/content-page";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "أسطول مبرّد وتقنية تتبع لتوصيل آخر ميل بالرياض",
  description:
    "تشغيل أسطول QBL المبرّد داخل الرياض: تتبع موقع المندوب أثناء الطلب، قراءات حرارة عند توفر المستشعرات، وطبقة خرائط وإشعارات قابلة للربط. اطلب عرض تشغيل.",
  path: "/fleet-tech",
});

export default function FleetTechPage() {
  return (
    <ContentPage
      eyebrow="الأسطول والتقنيات"
      title="أسطول مبرّد مدعوم بتتبع وقياس وتشغيل لحظي"
      description="التقنية ليست طبقة تجميلية في QBL؛ هي جزء من قرار الإسناد، إدارة التأخير، تنبيهات الحرارة، وإغلاق الطلب."
      items={[
        { title: "أسطول مبرّد قابل للتوسع", description: "أسطول مركّب حسب عقود التشغيل والطلب الموسمي." },
        { title: "تتبع موقع المندوب", description: "تحديثات موقع للمندوبين تظهر في لوحة العمليات ورابط العميل عند وجود طلب فعال." },
        { title: "Temperature Telemetry", description: "قراءات حرارة للمركبة أو الطلب عند توفر المستشعرات وربطها بالتنبيهات." },
        { title: "Route Planning", description: "تصميم قابل للربط بمحرك تخطيط مسارات ذكي وتقدير ETA." },
        { title: "Notification Adapter", description: "طبقة إرسال SMS/WhatsApp قابلة للاستبدال بمزود فعلي." },
        { title: "Map Adapter", description: "تجريد Google Maps أو Mapbox مع mock محلي للتطوير." },
      ]}
    />
  );
}
