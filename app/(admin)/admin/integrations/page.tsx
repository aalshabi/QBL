import { CircleAlert, Link2, LockKeyhole, ShieldCheck } from "lucide-react";
import { IntegrationsView } from "@/components/admin/integrations-view";
import { Card, CardContent } from "@/components/ui/card";
import { requireAdminPage } from "@/lib/admin/guard";
import { getIntegrationServices } from "@/lib/integrations/overview";

export default async function AdminIntegrationsPage() {
  await requireAdminPage();
  const services = getIntegrationServices();
  const configured = services.filter((service) => service.state === "configured").length;
  const pending = services.length - configured;
  const readOnly = services.filter(
    (service) => service.id === "logestechs" && service.state === "configured",
  ).length;

  const summary = [
    { label: "خدمات مهيأة", value: configured, icon: Link2, tone: "text-emerald-600" },
    { label: "تكاملات للقراءة فقط", value: readOnly, icon: LockKeyhole, tone: "text-[#00A7B6]" },
    { label: "تحتاج إعدادًا أو مراجعة", value: pending, icon: CircleAlert, tone: "text-amber-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0D1B3A]">التكاملات والخدمات</h1>
          <p className="mt-1 text-sm text-slate-500">
            حالة الخدمات المرتبطة بـQBL وحدود كل تكامل دون عرض المفاتيح أو بيانات الدخول
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
          <ShieldCheck className="h-4 w-4" />
          الأسرار محفوظة على الخادم
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {summary.map((item) => (
          <Card key={item.label} className="border-0 bg-white shadow-sm ring-1 ring-slate-200">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-slate-500">{item.label}</p>
                <p className="mt-1 text-3xl font-bold text-[#0D1B3A]">{item.value}</p>
              </div>
              <item.icon className={`h-8 w-8 ${item.tone}`} />
            </CardContent>
          </Card>
        ))}
      </div>

      <IntegrationsView services={services} />

      <Card className="border-0 bg-[#0D1B3A] text-white shadow-sm">
        <CardContent className="grid gap-4 p-5 md:grid-cols-[auto_1fr] md:items-center">
          <LockKeyhole className="h-8 w-8 text-[#00A7B6]" />
          <div>
            <p className="font-semibold">بوابة أمان التكاملات</p>
            <p className="mt-1 text-sm leading-6 text-white/70">
              أي كتابة إلى نظام خارجي أو استقبال Webhook يبقى معطّلًا حتى اعتماد المصادقة والتوقيع
              ومنع التكرار وبيئة الاختبار. الصفحة تعرض الحالة فقط ولا تكشف أي Secret.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
