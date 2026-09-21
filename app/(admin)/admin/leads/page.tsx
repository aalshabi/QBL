import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/admin/format";
import { requireAdminPage } from "@/lib/admin/guard";
import { LeadStorageUnavailableError, listLeads, type LeadRecord } from "@/lib/leads";
import { leadAlertConfigured, leadAlertRecipient } from "@/lib/notifications/lead-alert";

export const dynamic = "force-dynamic";

const statusLabels: Record<string, string> = {
  NEW: "جديد",
  CONTACTED: "تم التواصل",
  QUALIFIED: "مؤهل",
  CLOSED: "مغلق",
};

export default async function AdminLeadsPage() {
  await requireAdminPage();

  let leads: LeadRecord[] = [];
  let storageError: string | null = null;

  try {
    leads = await listLeads();
  } catch (error) {
    storageError =
      error instanceof LeadStorageUnavailableError
        ? "قاعدة البيانات غير مضبوطة في هذه البيئة — الطلبات لا تُحفظ. اضبط DATABASE_URL."
        : "تعذر قراءة الطلبات من قاعدة البيانات.";
  }

  const alertConfigured = leadAlertConfigured();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-[#0D1B3A]">العملاء المحتملون</h1>
        <p className="text-sm text-slate-500">طلبات عروض الأسعار الواردة من الموقع</p>
      </div>

      {storageError ? (
        <Card className="border-rose-200 bg-rose-50">
          <CardContent className="p-4 text-sm font-medium text-rose-800">{storageError}</CardContent>
        </Card>
      ) : null}

      {!alertConfigured ? (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 text-sm text-amber-900">
            <span className="font-semibold">التنبيه الفوري غير مفعّل.</span> الطلبات تُحفظ هنا لكن لا يصلك
            إشعار عند وصولها. فعّله بضبط <code className="font-latin">LEAD_ALERT_PROVIDER</code> و{" "}
            <code className="font-latin">RESEND_API_KEY</code> — وجهة الإرسال الحالية:{" "}
            <span className="font-latin">{leadAlertRecipient()}</span>.
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            الطلبات الواردة{leads.length ? ` (${leads.length})` : ""}
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {leads.length === 0 && !storageError ? (
            <p className="p-6 text-sm text-slate-500">
              لا توجد طلبات بعد. أرسل طلباً تجريبياً من صفحة «اطلب عرض سعر» للتأكد من وصول المسار كاملاً.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="text-start">المنشأة</TableHead>
                  <TableHead className="text-start">الاسم</TableHead>
                  <TableHead className="text-start">البريد</TableHead>
                  <TableHead className="text-start">الجوال</TableHead>
                  <TableHead className="text-start">الرسالة</TableHead>
                  <TableHead className="text-start">الحالة</TableHead>
                  <TableHead className="text-start">تاريخ الطلب</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.company}</TableCell>
                    <TableCell>{lead.name}</TableCell>
                    <TableCell className="font-latin text-sm">
                      <a className="text-[#00A7B6] hover:underline" href={`mailto:${lead.email}`}>
                        {lead.email}
                      </a>
                    </TableCell>
                    <TableCell className="font-latin text-sm">
                      <a className="text-[#00A7B6] hover:underline" href={`tel:${lead.phone}`}>
                        {lead.phone}
                      </a>
                    </TableCell>
                    <TableCell className="max-w-80 truncate text-sm text-slate-600" title={lead.message}>
                      {lead.message}
                    </TableCell>
                    <TableCell className="text-sm">{statusLabels[lead.status] ?? lead.status}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-slate-500">
                      {formatDateTime(lead.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
