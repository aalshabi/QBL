"use client";
import { useState } from "react";
type Result = {
  receivedCount: number;
  matchedCount: number;
  missingIds: string[];
  duplicateIds: string[];
  unexpectedIds: string[];
  complete: boolean;
};
export function ReconciliationForm({
  clients,
}: {
  clients: { id: string; companyName: string }[];
}) {
  const [result, setResult] = useState<Result | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setResult(null);
    setError("");
    try {
      const data = new FormData(event.currentTarget),
        file = data.get("shipments");
      if (!(file instanceof File) || file.size > 32000) throw new Error();
      const ids = (await file.text())
        .split(/\r?\n/)
        .map((x) => x.trim())
        .filter(Boolean);
      const response = await fetch("/api/operations/reconciliation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-qbl-ops-request": "v1",
        },
        body: JSON.stringify({
          source: "LOGESTECHS_CONTROLLED_EXPORT",
          clientAccountId: data.get("clientAccountId"),
          shipmentIds: ids,
          expectedCount: Number(data.get("expectedCount")),
          windowStart: new Date(String(data.get("windowStart"))).toISOString(),
          windowEnd: new Date(String(data.get("windowEnd"))).toISOString(),
          sourceCapturedAt: new Date(
            String(data.get("sourceCapturedAt")),
          ).toISOString(),
        }),
      });
      if (!response.ok) throw new Error();
      setResult(await response.json());
    } catch {
      setError(
        "لم تحفظ المطابقة. تحقق من ملف المعرفات والعميل وفترة التسليم وتاريخ التصدير.",
      );
    } finally {
      setBusy(false);
    }
  }
  const field = "block w-full rounded border border-slate-300 p-2";
  return (
    <details className="rounded border bg-white p-4">
      <summary className="cursor-pointer font-bold">
        مطابقة شحنات العميل مع المصدر
      </summary>
      <p className="my-3 text-sm">
        استخدم تصديرًا معتمدًا من LogesTechs لنفس العميل وفترة موعد التسليم. ملف
        نصي بمعرف شحنة واحد في كل سطر، حتى ٥٠٠ شحنة، دون أسماء أو هواتف. لا ينشئ
        هذا الإجراء شحنات جديدة.
      </p>
      <form onSubmit={submit} className="grid gap-4 text-sm sm:grid-cols-2">
        <label>
          العميل
          <select name="clientAccountId" className={field} required>
            <option value="">اختر العميل</option>
            {clients.map((x) => (
              <option key={x.id} value={x.id}>
                {x.companyName}
              </option>
            ))}
          </select>
        </label>
        <label>
          عدد الشحنات في المصدر
          <input
            type="number"
            name="expectedCount"
            min="0"
            max="500"
            required
            className={field}
          />
        </label>
        {Object.entries({
          windowStart: "بداية فترة موعد التسليم",
          windowEnd: "نهاية الفترة — غير شاملة",
          sourceCapturedAt: "تاريخ ووقت استخراج الملف",
        }).map(([name, label]) => (
          <label key={name}>
            {label} — بتوقيت جهازك
            <input
              type="datetime-local"
              name={name}
              required
              className={field}
            />
          </label>
        ))}
        <label>
          ملف معرفات الشحنات
          <input
            type="file"
            name="shipments"
            accept=".txt,text/plain"
            required
            className={field}
          />
        </label>
        <button disabled={busy} className="rounded bg-slate-900 p-3 text-white">
          حفظ نتيجة المطابقة
        </button>
      </form>
      <p role="status" className="mt-3">
        {error}
      </p>
      {result && (
        <div role="status" className="mt-3 rounded border p-3">
          <strong>
            {result.complete
              ? "تطابقت القائمة المقدمة لهذه الفترة."
              : "المطابقة غير مكتملة — يلزم إجراء."}
          </strong>
          <p>
            المستلمة: {result.receivedCount} · المطابقة: {result.matchedCount} ·
            الناقصة: {result.missingIds.length} · المكررة:{" "}
            {result.duplicateIds.length} · غير الموجودة في المصدر:{" "}
            {result.unexpectedIds.length}
          </p>
          {result.missingIds.length > 0 && (
            <p className="break-words">
              الشحنات الناقصة: <bdi>{result.missingIds.join("، ")}</bdi>
            </p>
          )}
        </div>
      )}
    </details>
  );
}
