import "server-only";
import { getLogesTechsConfig } from "@/lib/logestechs/config";

export type IntegrationState = "configured" | "not_configured" | "needs_attention";

export type IntegrationService = {
  id: "logestechs" | "google-maps" | "neon" | "cold-chain";
  name: string;
  category: string;
  description: string;
  state: IntegrationState;
  stateLabel: string;
  mode: string;
  capabilities: string[];
  boundary: string;
};

function logesTechsState(): Pick<IntegrationService, "state" | "stateLabel"> & {
  webhookConfigured: boolean;
} {
  const webhookConfigured = (process.env.LOGESTECHS_WEBHOOK_API_KEY?.trim().length ?? 0) >= 32;
  try {
    getLogesTechsConfig();
    return {
      state: "configured",
      stateLabel: webhookConfigured ? "مهيأ — قراءة + Webhooks" : "مهيأ — قراءة فقط",
      webhookConfigured,
    };
  } catch {
    return { state: "needs_attention", stateLabel: "يحتاج مراجعة الإعداد", webhookConfigured };
  }
}

/**
 * حالة سلسلة التبريد تُقرأ من الواقع لا من متغيّر بيئة: مفتاح ويبهوك مضبوط
 * لا يعني أن جهازاً واحداً يرسل. الحالة هنا تحتاج عدد الأجهزة المسجّلة وآخر
 * قراءة وصلت، ولذلك تُمرَّر من المستدعي الذي يملك الوصول إلى القاعدة.
 */
export type ColdChainLiveState = {
  registeredSensors: number;
  activeSensors: number;
  lastReadingAt: Date | null;
};

function coldChainService(live: ColdChainLiveState | null): IntegrationService {
  const secretConfigured = (process.env.COLD_CHAIN_TELEMETRY_API_KEY?.trim().length ?? 0) >= 32;
  const receiving = Boolean(live && live.lastReadingAt);

  const state: IntegrationState = !secretConfigured
    ? "not_configured"
    : live && live.activeSensors > 0 && receiving
      ? "configured"
      : "needs_attention";

  const stateLabel = !secretConfigured
    ? "المفتاح غير مضبوط"
    : !live || live.registeredSensors === 0
      ? "لا جهاز مسجّل — لم يبدأ الربط"
      : !receiving
        ? "أجهزة مسجّلة ولا قراءة وصلت بعد"
        : `يستقبل — ${live.activeSensors} جهاز نشط`;

  return {
    id: "cold-chain",
    name: "تتبع التبريد",
    category: "سلسلة التبريد",
    description:
      "استقبال قراءات حرارة المركبات من أجهزة مسجّلة، وربطها بالشحنة، وفتح إنذار عند الخرق أو انقطاع القراءات.",
    state,
    stateLabel,
    mode: "Webhook · POST موثق بـX-API-Key",
    capabilities: [
      "قبول القراءات من الأجهزة المسجّلة فقط",
      "حدود حرارة حسب متطلب الشحنة لا نطاق المركبة",
      "تمييز القراءة القديمة عن المفقودة",
      "إنذار واحد مفتوح لكل طلب ونوع، مع كشف الصمت",
    ],
    boundary:
      "لا مزود متعاقد بعد. نقطة الاستقبال محايدة المزود: تسجيل الجهاز يربطه بمركبة ومزود مسمّى، ومعرّف غير مسجّل يُرفض بدل أن يُكتب.",
  };
}

export function getIntegrationServices(live?: { coldChain?: ColdChainLiveState | null }): IntegrationService[] {
  const logesTechs = logesTechsState();
  const googleMapsConfigured = Boolean(process.env.GOOGLE_MAPS_API_KEY?.trim());
  const databaseConfigured = Boolean(process.env.DATABASE_URL?.trim());

  return [
    coldChainService(live?.coldChain ?? null),
    {
      id: "logestechs",
      name: "LogesTechs",
      category: "الشحن والتتبع",
      description: logesTechs.webhookConfigured
        ? "قراءة حالة الشحنات واستقبال تحديثات الحالة الموثقة داخل QBL دون تعديل المصدر."
        : "قراءة حالة الشحنات ومقارنتها بحالة الطلب داخل QBL دون تعديل المصدر.",
      state: logesTechs.state,
      stateLabel: logesTechs.stateLabel,
      mode: "REST API · Server to Server",
      capabilities: [
        "فحص اتصال الخدمة",
        "قراءة حالة الشحنة بالباركود",
        ...(logesTechs.webhookConfigured
          ? ["استقبال POST موثق بـX-API-Key", "منع التكرار والتراجع غير الصحيح للحالات"]
          : ["مطابقة الحالات دون تحديث تلقائي"]),
      ],
      boundary: logesTechs.webhookConfigured
        ? "سر Webhook محفوظ على الخادم؛ لا تُحفظ الرسالة الخام أو بيانات السائق، والحالات غير المعروفة أو القديمة لا تعدّل الطلب."
        : "استقبال Webhooks معطل بأمان حتى إضافة السر الإنتاجي وتسجيل الرابط لدى المزود؛ الإنشاء والإلغاء والتعيين تظل محظورة.",
    },
    {
      id: "google-maps",
      name: "Google Maps Platform",
      category: "الخرائط وتأكيد المواقع",
      description: "تحويل العناوين المختصرة إلى نتائج مكانية دقيقة لاستخدامها في تخطيط المسارات.",
      state: googleMapsConfigured ? "configured" : "not_configured",
      stateLabel: googleMapsConfigured ? "مهيأ على هذا النشر" : "غير مهيأ على هذا النشر",
      mode: "Places Text Search (New) · Server only",
      capabilities: [
        "فحص حي لـText Search وPlace Details",
        "تنقية بيانات العميل قبل الإرسال",
        "بوابة الرياض والمراجعة اليدوية",
        "تصدير الإحداثيات المؤكدة لمحسن المسارات",
        "حدود طلبات وسجلات تشغيل بلا بيانات عملاء",
      ],
      boundary: googleMapsConfigured
        ? "المفتاح محفوظ كمتغير خادم ولا يظهر في المتصفح؛ النتائج غير الدقيقة لا تمر إلى التخطيط."
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
