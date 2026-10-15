"use client";

import { useState } from "react";

const actions = [
  ["CONTACTED", "تم التواصل"],
  ["CONFIRMED_READY", "تأكيد الجاهزية"],
  ["RESCHEDULED", "إعادة الجدولة"],
  ["HOLD_REORDER", "تعليق/إعادة ترتيب"],
  ["PROCEED_WITH_REASON", "متابعة بسبب موثق"],
] as const;

export function WhatsAppOpsReview({ confirmationId }: { confirmationId: string }) {
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState("");
  async function submit(decision: string) {
    setStatus("جارٍ الحفظ…");
    const response = await fetch(`/api/admin/integrations/whatsapp/confirmations/${confirmationId}/review`, { method: "POST", headers: { "Content-Type": "application/json", "X-QBL-WhatsApp-Request": "ops-review-v1" }, body: JSON.stringify({ decision, reason }) });
    const result = await response.json() as { ok?: boolean; error?: string };
    setStatus(result.ok ? "تم حفظ القرار دون تغيير حالة الشحنة." : result.error ?? "تعذر الحفظ");
    if (result.ok) window.location.reload();
  }
  return <div className="mt-3 space-y-2">
    <input value={reason} onChange={(event) => setReason(event.target.value)} maxLength={240} placeholder="سبب أو ملاحظة تشغيلية" className="w-full rounded border px-3 py-2 text-sm" />
    <div className="flex flex-wrap gap-2">{actions.map(([value, label]) => <button key={value} type="button" onClick={() => submit(value)} className="rounded border px-3 py-1.5 text-xs hover:bg-slate-50">{label}</button>)}</div>
    {status ? <p className="text-xs text-slate-500">{status}</p> : null}
  </div>;
}
