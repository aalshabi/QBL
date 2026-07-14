import { ContentPage } from "@/components/marketing/content-page";

export default function FleetTechPage() {
  return (
    <ContentPage
      eyebrow="الأسطول والتقنيات"
      title="أسطول مبرّد مدعوم بتتبع وقياس وتشغيل لحظي"
      description="التقنية ليست طبقة تجميلية في QBL؛ هي جزء من قرار الإسناد، إدارة التأخير، تنبيهات الحرارة، وإغلاق الطلب."
      items={[
        { title: "سعة أسطول حسب نطاق العقد", description: "نوع المركبات وعددها وسعتها تُثبت في خطة التشغيل قبل بدء الخدمة." },
        { title: "GPS لحظي", description: "تحديثات موقع للمندوبين تظهر في لوحة العمليات ورابط العميل عند وجود طلب فعال." },
        { title: "Temperature Telemetry", description: "قراءات حرارة للمركبة أو الطلب عند توفر المستشعرات وربطها بالتنبيهات." },
        { title: "Route Planning", description: "تصميم قابل للربط بمحرك تخطيط مسارات ذكي وتقدير ETA." },
        { title: "Notification Adapter", description: "طبقة إرسال SMS/WhatsApp قابلة للاستبدال بمزود فعلي." },
        { title: "Map Adapter", description: "تجريد Google Maps أو Mapbox مع mock محلي للتطوير." },
      ]}
    />
  );
}
