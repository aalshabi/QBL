"use client";

import { useState } from "react";

export function WhatsAppManualReply({ confirmationId, disabled }: { confirmationId: string; disabled: boolean }) {
  const [body, setBody] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setState("saving");
    const response = await fetch(`/api/admin/integrations/whatsapp/confirmations/${confirmationId}/reply`, { method: "POST", headers: { "Content-Type": "application/json", "X-QBL-WhatsApp-Request": "manual-reply-v1" }, body: JSON.stringify({ body }) });
    if (!response.ok) { setState("error"); return; }
    setBody(""); setState("saved");
  }
  return <form onSubmit={submit} className="mt-3 flex flex-col gap-2 sm:flex-row">
    <input aria-label="نص الرد اليدوي" value={body} onChange={(event) => setBody(event.target.value)} maxLength={800} disabled={disabled || state === "saving"} className="min-w-0 flex-1 rounded-md border px-3 py-2 text-sm" placeholder={disabled ? "نافذة الرد مغلقة" : "اكتب ردًا تشغيليًا واضحًا"} />
    <button type="submit" disabled={disabled || !body.trim() || state === "saving"} className="rounded-md bg-[#0D1B3A] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">إضافة إلى قائمة الإرسال</button>
    {state === "saved" ? <span className="self-center text-xs text-emerald-700">تمت الإضافة بأمان</span> : null}
    {state === "error" ? <span className="self-center text-xs text-red-700">تعذر الحفظ أو أُغلقت النافذة</span> : null}
  </form>;
}
