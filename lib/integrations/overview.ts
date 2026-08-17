import "server-only";
import { getLogesTechsConfig } from "@/lib/logestechs/config";

export type IntegrationState = "configured" | "not_configured" | "needs_attention";

export type IntegrationService = {
  id: "logestechs" | "google-maps" | "neon";
  name: string;
  category: string;
  description: string;
  state: IntegrationState;
  stateLabel: string;
  mode: string;
  capabilities: string[];
  boundary: string;
};

function logesTechsState(): Pick<IntegrationService, "state" | "stateLabel"> {
  try {
    getLogesTechsConfig();
    return { state: "configured", stateLabel: "مهيأ — قراءة فقط" };
  } catch {
    return { state: "needs_attention", stateLabel: "يحتاج مراجعة الإعداد" };
  }
}

export function getIntegrationServices(): IntegrationService[] {
  const logesTechs = logesTechsState();
  const googleMapsConfigured = Boolean(process.env.GOOGLE_MAPS_API_KEY?.trim());
  const databaseConfigured = Boolean(process.env.DATABASE_URL?.trim());

  return [
    {
      id: "logestechs",
      name: "LogesTechs",
      category: "الشحن والتتبع",
      description: "قراءة حالة الشحنات ومقارنتها بحالة الطلب داخل QBL دون تعديل المصدر.",
      ...logesTechs,
      mode: "REST API · Server to Server",
      capabilities: ["فحص اتصال الخدمة", "قراءة حالة الشحنة بالباركود", "مطابقة الحالات دون تحديث تلقائي"],
      boundary: "الإنشاء والإلغاء والتعيين والـWebhooks محظورة حتى اعتماد Sandbox والتوقيع.",
    },
    {
      id: "google-maps",
      name: "Google Maps Platform",
      category: "الخرائط وتأكيد المواقع",
      description: "تحويل العناوين المختصرة إلى نتائج مكانية دقيقة لاستخدامها في تخطيط المسارات.",
      state: googleMapsConfigured ? "configured" : "not_configured",
      stateLabel: googleMapsConfigured ? "مهيأ على هذا النشر" : "غير مهيأ على هذا النشر",
      mode: "Places Text Search (New)",
      capabilities: ["البحث بالعنوان المختصر", "إرجاع العنوان المنسق", "الإحداثيات ورابط Google Maps"],
      boundary: googleMapsConfigured
        ? "المفتاح محفوظ كمتغير خادم ولا يظهر في المتصفح."
        : "تم اختبار الخدمة سابقًا، لكن مفتاحها غير موجود حاليًا في بيئة QBL على Vercel.",
    },
    {
      id: "neon",
      name: "Neon PostgreSQL",
      category: "البيانات التشغيلية",
      description: "قاعدة البيانات التي تحفظ الطلبات والعملاء والمناديب وحالات التشغيل في QBL.",
      state: databaseConfigured ? "configured" : "needs_attention",
      stateLabel: databaseConfigured ? "متصل" : "قاعدة البيانات غير مهيأة",
      mode: "PostgreSQL · Prisma",
      capabilities: ["بيانات الطلبات", "العملاء والمناديب", "الفوترة وسجل الحالات"],
      boundary: "بيانات Preview معزولة عن Production، ولا تُعرض سلسلة الاتصال في الواجهة.",
    },
  ];
}
