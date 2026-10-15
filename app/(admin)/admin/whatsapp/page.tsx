import { requireAdminPage } from "@/lib/admin/guard";
import { getPrisma } from "@/lib/prisma";
import { WhatsAppManualReply } from "@/components/admin/whatsapp-manual-reply";
import { WhatsAppOpsReview } from "@/components/admin/whatsapp-ops-review";

const fmt = (value: Date | null) => value ? new Intl.DateTimeFormat("ar-SA", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Riyadh" }).format(value) : "—";

export default async function WhatsAppExceptionsPage() {
  await requireAdminPage();
  const prisma = getPrisma();
  const [confirmations, deadLetters, alerts] = await Promise.all([
    prisma.whatsAppConfirmation.findMany({ include: { order: { select: { publicCode: true, status: true, courier: { select: { displayName: true } } } }, messages: { where: { direction: "INBOUND" }, orderBy: { createdAt: "desc" }, take: 1 } }, orderBy: { updatedAt: "desc" }, take: 200 }),
    prisma.whatsAppOutbox.findMany({ where: { status: "DEAD_LETTER" }, include: { order: { select: { publicCode: true } } }, orderBy: { updatedAt: "desc" }, take: 100 }),
    prisma.whatsAppOpsAlert.findMany({ where: { status: "OPEN" }, include: { order: { select: { publicCode: true, courier: { select: { displayName: true } } } } }, orderBy: { createdAt: "desc" }, take: 100 }),
  ]);
  const groups = [
    ["بانتظار الرد", confirmations.filter((item) => item.status === "PENDING")],
    ["جاهز", confirmations.filter((item) => item.status === "CONFIRMED")],
    ["متأخر", confirmations.filter((item) => item.status === "NO_REPLY")],
    ["فشل التسليم", confirmations.filter((item) => item.communicationStatus === "FAILED")],
    ["يحتاج مراجعة", confirmations.filter((item) => ["MANUAL_REVIEW", "RESCHEDULE_REQUESTED", "DECLINED"].includes(item.status))],
  ] as const;
  return <div className="space-y-6" dir="rtl">
    <div><h1 className="text-2xl font-bold text-[#0D1B3A]">تأكيدات تسليم واتساب</h1><p className="mt-1 text-sm text-slate-500">لوحة تشغيل محمية — التوقيت Asia/Riyadh، ولا تُعرض الأرقام أو الحمولة الكاملة.</p></div>
    {alerts.length ? <section className="rounded-xl border border-amber-300 bg-amber-50 p-5"><h2 className="font-bold">تنبيهات التشغيل المفتوحة ({alerts.length})</h2><div className="mt-3 grid gap-2 md:grid-cols-2">{alerts.map((alert) => <div key={alert.id} className="rounded bg-white p-3 text-sm"><strong>{alert.order.publicCode}</strong><p>بانتظار تأكيد العميل — راجع قبل التوجه</p><p className="text-slate-500">{alert.kind} · {alert.order.courier?.displayName ?? "غير مسند"} · {fmt(alert.dueAt)}</p></div>)}</div></section> : null}
    {groups.map(([title, items]) => <section key={title} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><h2 className="font-bold">{title} ({items.length})</h2><div className="mt-4 space-y-3">{items.length ? items.map((item) => <article key={item.id} className="rounded-lg border p-3"><div className="flex flex-wrap justify-between gap-3"><strong>{item.order.publicCode}</strong><span className="text-sm text-amber-700">{item.status} · {item.communicationStatus}</span></div><p className="mt-1 text-xs text-slate-500">المندوب: {item.order.courier?.displayName ?? "غير مسند"} · أرسل: {fmt(item.sentAt)} · سُلّم: {fmt(item.deliveredAt)} · المهلة: {fmt(item.responseDeadlineAt)}</p><p className="mt-2 text-sm text-slate-600">{item.messages[0]?.bodyRedacted ?? "لا يوجد رد نصي"}</p>{item.status !== "CONFIRMED" ? <WhatsAppOpsReview confirmationId={item.id} /> : null}<WhatsAppManualReply confirmationId={item.id} disabled={!item.lastInboundAt || Boolean(item.optedOutAt)} /></article>) : <p className="text-sm text-slate-500">لا توجد حالات.</p>}</div></section>)}
    <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><h2 className="font-bold">رسائل متوقفة بعد المحاولات ({deadLetters.length})</h2><div className="mt-4 space-y-2">{deadLetters.length ? deadLetters.map((item) => <div key={item.id} className="flex justify-between rounded-lg border p-3 text-sm"><span>{item.order.publicCode}</span><span>{item.lastError ?? "SEND_FAILED"}</span></div>) : <p className="text-sm text-slate-500">لا توجد رسائل متوقفة.</p>}</div></section>
  </div>;
}
