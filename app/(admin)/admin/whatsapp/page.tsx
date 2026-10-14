import { requireAdminPage } from "@/lib/admin/guard";
import { getPrisma } from "@/lib/prisma";
import { WhatsAppManualReply } from "@/components/admin/whatsapp-manual-reply";

export default async function WhatsAppExceptionsPage() {
  await requireAdminPage();
  const prisma = getPrisma();
  const [exceptions, deadLetters] = await Promise.all([
    prisma.whatsAppConfirmation.findMany({ where: { status: { in: ["MANUAL_REVIEW", "RESCHEDULE_REQUESTED", "NO_REPLY", "DECLINED"] } }, include: { order: { select: { publicCode: true } }, messages: { where: { direction: "INBOUND" }, orderBy: { createdAt: "desc" }, take: 1 } }, orderBy: { updatedAt: "desc" }, take: 100 }),
    prisma.whatsAppOutbox.findMany({ where: { status: "DEAD_LETTER" }, include: { order: { select: { publicCode: true } } }, orderBy: { updatedAt: "desc" }, take: 100 }),
  ]);
  return <div className="space-y-6" dir="rtl">
    <div><h1 className="text-2xl font-bold text-[#0D1B3A]">استثناءات واتساب</h1><p className="mt-1 text-sm text-slate-500">مراجعة بشرية محمية؛ لا تُعرض الأرقام أو الحمولة الكاملة.</p></div>
    <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><h2 className="font-bold">ردود تحتاج إجراء ({exceptions.length})</h2><div className="mt-4 space-y-3">{exceptions.length ? exceptions.map((item) => <article key={item.id} className="rounded-lg border p-3"><div className="flex justify-between gap-3"><strong>{item.order.publicCode}</strong><span className="text-sm text-amber-700">{item.status}</span></div><p className="mt-2 text-sm text-slate-600">{item.messages[0]?.bodyRedacted ?? "لا يوجد نص متاح"}</p><WhatsAppManualReply confirmationId={item.id} disabled={!item.lastInboundAt || Boolean(item.optedOutAt)} /></article>) : <p className="text-sm text-slate-500">لا توجد استثناءات حالية.</p>}</div></section>
    <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><h2 className="font-bold">رسائل متوقفة بعد المحاولات ({deadLetters.length})</h2><div className="mt-4 space-y-2">{deadLetters.length ? deadLetters.map((item) => <div key={item.id} className="flex justify-between rounded-lg border p-3 text-sm"><span>{item.order.publicCode}</span><span>{item.lastError ?? "SEND_FAILED"}</span></div>) : <p className="text-sm text-slate-500">لا توجد رسائل متوقفة.</p>}</div></section>
  </div>;
}
