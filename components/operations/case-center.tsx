"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { OperationsControls, type ControlsProps } from "./operations-controls";
import { ReconciliationForm } from "./reconciliation-form";
type Item = {
  id: string;
  caseType: string;
  priority: string;
  status: string;
  ownerId: string;
  resolutionDueAt: string;
  ackDueAt: string;
  version: number;
  requiresCustomerConfirmation: boolean;
  resolution: string | null;
  evidence: unknown;
  escalationLevel: number;
  escalatedToUserId: string | null;
};
type Props = ControlsProps & {
  orders: { id: string; publicCode: string; clientAccountId: string }[];
  cases: Item[];
  users: { id: string; name: string }[];
  clients: { id: string; companyName: string }[];
  pending: number;
  review: number;
  jobHealthy: boolean;
};
const states: Record<string, string> = {
  NEW: "جديدة",
  IN_PROGRESS: "قيد التنفيذ",
  WAITING_EXTERNAL: "بانتظار جهة خارجية",
  WAITING_CUSTOMER_CONFIRMATION: "بانتظار تأكيد العميل",
  CLOSED: "مغلقة",
};
const types: Record<string, string> = {
  SHIPMENT_STALLED: "شحنة متوقفة",
  SLA_RISK: "موعد التسليم معرض للتأخر",
  NO_UPDATE: "لا يوجد تحديث",
  FAILED_DELIVERY: "تعذر التسليم",
  STATUS_CONFLICT: "تعارض حالة الشحنة",
  MISSING_SHIPMENT: "شحنة مفقودة من النظام",
  ADDRESS_PROBLEM: "مشكلة عنوان",
  COMMITMENT_AT_RISK: "وعد تسليم معرض للتأخر",
  POD_MISSING: "إثبات تسليم ناقص",
  RETURN_DELAYED: "مرتجع متأخر",
  DRIVER_OVERLOADED: "حمولة تتجاوز السعة",
  WAREHOUSE_DELAY: "تأخر تجهيز المستودع",
  INTEGRATION_FAILURE: "تحديثات النظام متوقفة",
  DELIVERY_DISPUTE: "نزاع تسليم",
  COMMERCIAL_ESCALATION: "تصعيد تجاري",
};
const field =
  "block w-full rounded border border-slate-300 bg-white p-2 text-sm";
export function CaseCenter(props: Props) {
  const router = useRouter(),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [clientId, setClientId] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>, item?: Item) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const body = item
        ? {
            id: item.id,
            version: item.version,
            status: String(form.get("status")),
            resolution: String(form.get("resolution") ?? ""),
            evidence: String(form.get("evidence") ?? "")
              .split("\n")
              .map((x) => x.trim())
              .filter(Boolean),
            customerConfirmed: form.get("customerConfirmed") === "on",
          }
        : {
            ...(form.get("orderId")
              ? { orderId: String(form.get("orderId")) }
              : {}),
            clientAccountId: form.get("clientAccountId"),
            caseType: form.get("caseType"),
            priority: form.get("priority"),
            ownerId: form.get("ownerId"),
            backupOwnerId: form.get("backupOwnerId"),
            ackDueAt: new Date(String(form.get("ackDueAt"))).toISOString(),
            resolutionDueAt: new Date(
              String(form.get("resolutionDueAt")),
            ).toISOString(),
          };
      const response = await fetch("/api/operations/cases", {
        method: item ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          "x-qbl-ops-request": "v1",
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error();
      setMessage("تم حفظ الحالة.");
      router.refresh();
    } catch {
      setMessage(
        "لم تحفظ الحالة. تحقق من المسؤول والموعد، وأضف النتيجة والإثبات قبل الإغلاق.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main dir="rtl" className="mx-auto max-w-5xl space-y-6 p-4 sm:p-8">
      <header>
        <h1 className="text-2xl font-bold">ما الذي يحتاج إجراء الآن؟</h1>
        <p className="mt-2 text-slate-600">
          حالات التشغيل والعملاء · لكل حالة مسؤول وموعد ونتيجة موثقة.
        </p>
      </header>
      <nav className="flex flex-wrap gap-4 text-sm">
        <a href="/admin/orders">التشغيل اليومي</a>
        <a href="/ops/cases" aria-current="page">
          الاستثناءات وحالات العملاء
        </a>
        <a href="/admin/integrations">الأنظمة والأتمتة</a>
        <a href="/admin/reports">الإدارة والربحية</a>
      </nav>
      {(props.pending > 0 || props.review > 0 || !props.jobHealthy) && (
        <aside className="rounded border border-amber-300 bg-amber-50 p-4">
          <strong>تحديثات تحتاج متابعة</strong>
          <p>
            {props.pending} تحديثًا بانتظار المطابقة، و{props.review} تحديثًا
            يحتاج مراجعة.
          </p>
          {!props.jobHealthy && (
            <p>لم نتأكد من انتظام المراجعة الآلية. يلزم فحص مسؤول الأنظمة.</p>
          )}
        </aside>
      )}
      <p role="status" aria-live="polite">
        {message}
      </p>
      <details className="rounded border bg-white p-4">
        <summary className="cursor-pointer font-bold">تسجيل حالة جديدة</summary>
        <form
          onSubmit={(e) => submit(e)}
          className="mt-4 grid gap-4 sm:grid-cols-2"
        >
          <label>
            العميل
            <select
              name="clientAccountId"
              className={field}
              required
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            >
              <option value="">اختر العميل</option>
              {props.clients.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.companyName}
                </option>
              ))}
            </select>
          </label>
          <label>
            الشحنة — عند ارتباط الحالة بشحنة
            <select name="orderId" key={clientId} className={field}>
              <option value="">حالة عامة للعميل</option>
              {props.orders
                .filter((x) => x.clientAccountId === clientId)
                .map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.publicCode}
                  </option>
                ))}
            </select>
            <span className="text-xs text-slate-500">
              تظهر أحدث ٥٠٠ شحنة مسجلة.
            </span>
          </label>
          <label>
            نوع الحالة
            <select name="caseType" className={field}>
              {Object.entries(types).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label>
            الأولوية
            <select name="priority" className={field}>
              <option value="P1">عالية</option>
              <option value="P0">حرجة</option>
              <option value="P2">متابعة</option>
            </select>
          </label>
          {["ownerId", "backupOwnerId"].map((name, i) => (
            <label key={name}>
              {i ? "المسؤول البديل" : "المسؤول"}
              <select name={name} className={field} required>
                <option value="">اختر المسؤول</option>
                {props.users.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <label>
            آخر موعد لبدء المتابعة — بتوقيت جهازك
            <input
              type="datetime-local"
              name="ackDueAt"
              className={field}
              required
            />
          </label>
          <label>
            آخر موعد للحل — بتوقيت جهازك
            <input
              type="datetime-local"
              name="resolutionDueAt"
              className={field}
              required
            />
          </label>
          <button
            disabled={busy}
            className="rounded bg-slate-900 p-3 text-white"
          >
            حفظ الحالة
          </button>
        </form>
      </details>
      <OperationsControls {...props} />
      <ReconciliationForm clients={props.clients} />
      {!props.cases.length && (
        <p className="rounded border bg-white p-6">
          لا توجد حالات مفتوحة مسجلة في هذه القائمة. لا يعني ذلك اكتمال مطابقة
          الشحنات مع المصدر.
        </p>
      )}
      {props.cases.map((item) => (
        <article key={item.id} className="rounded border bg-white p-4">
          <h2 className="font-bold">
            {types[item.caseType] ?? "حالة تشغيلية"} · {states[item.status]}
            {item.escalationLevel > 0 && (
              <span className="ms-2 text-rose-700">
                {" "}
                · مصعّدة إلى{" "}
                {props.users.find((x) => x.id === item.escalatedToUserId)
                  ?.name ?? "المسؤول المعين"}
              </span>
            )}
          </h2>
          <p className="my-2 text-sm">
            المسؤول:{" "}
            {props.users.find((x) => x.id === item.ownerId)?.name ?? "غير متاح"}{" "}
            · موعد الحل:{" "}
            {new Date(item.resolutionDueAt).toLocaleString("ar-SA", {
              timeZone: "Asia/Riyadh",
            })}{" "}
            — الرياض
          </p>
          <form
            onSubmit={(e) => submit(e, item)}
            className="grid gap-3 sm:grid-cols-2"
          >
            <label>
              الحالة
              <select
                name="status"
                defaultValue={item.status}
                className={field}
              >
                {Object.entries(states).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label>
              النتيجة
              <textarea
                name="resolution"
                defaultValue={item.resolution ?? ""}
                className={field}
                maxLength={4000}
              />
            </label>
            <label>
              مرجع الإثبات — مرجع لكل سطر
              <textarea
                name="evidence"
                defaultValue={
                  Array.isArray(item.evidence) ? item.evidence.join("\n") : ""
                }
                className={field}
                placeholder="مرجع إثبات التسليم أو محضر الإجراء"
              />
            </label>
            {item.requiresCustomerConfirmation && (
              <label>
                <input type="checkbox" name="customerConfirmed" /> تم توثيق
                تأكيد العميل ضمن الإثبات
              </label>
            )}
            <button
              disabled={busy}
              className="rounded bg-slate-900 p-3 text-white"
            >
              حفظ المتابعة
            </button>
          </form>
        </article>
      ))}
    </main>
  );
}
