"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
type Policy = {
  clientAccountId: string;
  ownerId: string;
  backupOwnerId: string;
  firstEscalationOwnerId: string;
  secondEscalationOwnerId: string;
  ackMinutes: number;
  resolutionMinutes: number;
  stalledMinutes: number;
  noUpdateMinutes: number;
  riskMinutes: number;
  driverCapacity: number | null;
};
export type ControlsProps = {
  users: { id: string; name: string }[];
  clients: { id: string; companyName: string }[];
  orders: { id: string; publicCode: string; clientAccountId: string }[];
  policies: Policy[];
  canConfigure: boolean;
  automationHealthy: boolean;
  commitments: {
    id: string;
    orderId: string;
    windowEnd: string;
    status: string;
    feasibility: string;
  }[];
};
const field =
  "block w-full rounded border border-slate-300 bg-white p-2 text-sm";
export function OperationsControls(props: ControlsProps) {
  const router = useRouter(),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [policyClient, setPolicyClient] = useState(""),
    [commitmentClient, setCommitmentClient] = useState("");
  const existing = props.policies.find(
    (x) => x.clientAccountId === policyClient,
  );
  async function save(
    event: React.FormEvent<HTMLFormElement>,
    kind: "policy" | "commitment",
  ) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget),
      body: Record<string, unknown> = Object.fromEntries(form);
    try {
      if (kind === "policy") {
        for (const key of [
          "ackMinutes",
          "resolutionMinutes",
          "stalledMinutes",
          "noUpdateMinutes",
          "riskMinutes",
        ])
          body[key] = Number(body[key]);
        body.driverCapacity = body.driverCapacity
          ? Number(body.driverCapacity)
          : null;
      } else {
        body.windowStart = new Date(String(body.windowStart)).toISOString();
        body.windowEnd = new Date(String(body.windowEnd)).toISOString();
        body.planConfirmed = form.get("planConfirmed") === "on";
      }
      const response = await fetch("/api/operations/controls?kind=" + kind, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-qbl-ops-request": "v1",
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error();
      setMessage("تم حفظ الإجراء.");
      router.refresh();
    } catch {
      setMessage(
        "لم يحفظ الإجراء. تحقق من المسؤولين والمواعيد وخطة التنفيذ، وعدم وجود التزام نشط للشحنة.",
      );
    } finally {
      setBusy(false);
    }
  }
  const owner = (name: string, label: string, value?: string) => (
    <label key={name}>
      {label}
      <select name={name} className={field} defaultValue={value ?? ""} required>
        <option value="">اختر المسؤول</option>
        {props.users.map((x) => (
          <option key={x.id} value={x.id}>
            {x.name}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <section className="space-y-4">
      <p role="status">{message}</p>
      {!props.automationHealthy && (
        <p className="rounded border border-amber-300 bg-amber-50 p-3">
          المتابعة الآلية غير مؤكدة. يحتاج كل عميل إلى مسؤولين ومهل معتمدة، ثم
          التحقق من تشغيل المتابعة.
        </p>
      )}
      {props.canConfigure && (
        <details className="rounded border bg-white p-4">
          <summary className="cursor-pointer font-bold">
            مسؤولو المتابعة ومهل التصعيد
          </summary>
          <p className="my-3 text-sm">
            الموظف ← سلمان ← محمد. اختر الحساب الفعلي لكل مستوى؛ لا يُعيّن أحد
            تلقائيًا. جميع المهل بالدقائق وتعتمدها الإدارة. التصعيد يظهر في
            قائمة العمل، ولا يرسل رسائل خارجية.
          </p>
          <label>
            العميل
            <select
              value={policyClient}
              onChange={(e) => setPolicyClient(e.target.value)}
              className={field}
            >
              <option value="">اختر العميل</option>
              {props.clients.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.companyName}
                </option>
              ))}
            </select>
          </label>
          {policyClient && (
            <form
              key={policyClient + JSON.stringify(existing)}
              onSubmit={(e) => save(e, "policy")}
              className="mt-4 grid gap-4 sm:grid-cols-2"
            >
              <input
                type="hidden"
                name="clientAccountId"
                value={policyClient}
              />
              {owner("ownerId", "المسؤول الأساسي", existing?.ownerId)}
              {owner(
                "backupOwnerId",
                "المسؤول البديل",
                existing?.backupOwnerId,
              )}
              {owner(
                "firstEscalationOwnerId",
                "التصعيد الأول — سلمان",
                existing?.firstEscalationOwnerId,
              )}
              {owner(
                "secondEscalationOwnerId",
                "التصعيد الثاني — محمد",
                existing?.secondEscalationOwnerId,
              )}
              {Object.entries({
                ackMinutes: "مهلة بدء المتابعة",
                resolutionMinutes: "مهلة حل الحالة",
                stalledMinutes: "مدة بقاء الشحنة خرجت للتوصيل",
                noUpdateMinutes: "المدة دون تحديث من المصدر",
                riskMinutes: "التنبيه قبل موعد التسليم",
              }).map(([key, label]) => (
                <label key={key}>
                  {label}
                  <input
                    name={key}
                    type="number"
                    min="1"
                    required
                    className={field}
                    defaultValue={existing?.[key as keyof Policy] ?? ""}
                  />
                </label>
              ))}
              <label>
                سعة المندوب المعتمدة — اختياري
                <input
                  type="number"
                  name="driverCapacity"
                  min="1"
                  max="500"
                  className={field}
                  defaultValue={existing?.driverCapacity ?? ""}
                />
                <span className="text-xs">
                  تبقى مراقبة السعة غير متاحة حتى اعتماد قيمة.
                </span>
              </label>
              <button
                disabled={busy}
                className="rounded bg-slate-900 p-3 text-white"
              >
                حفظ قواعد المتابعة
              </button>
            </form>
          )}
        </details>
      )}
      <details className="rounded border bg-white p-4">
        <summary className="cursor-pointer font-bold">
          تسجيل موعد تسليم محدد
        </summary>
        <p className="my-3 text-sm">
          اربط الموعد بمرجع خطة التنفيذ والمسؤول. يبقى بحاجة لمراجعة حتى يوثق
          المسؤول التحقق من المندوب والمسار والسعة. لا تُرسل وعود للعميل
          تلقائيًا.
        </p>
        <form
          onSubmit={(e) => save(e, "commitment")}
          className="grid gap-4 sm:grid-cols-2"
        >
          <label>
            العميل
            <select
              name="clientAccountId"
              value={commitmentClient}
              onChange={(e) => setCommitmentClient(e.target.value)}
              required
              className={field}
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
            الشحنة
            <select
              key={commitmentClient}
              name="orderId"
              className={field}
              required
            >
              <option value="">اختر الشحنة</option>
              {props.orders
                .filter((x) => x.clientAccountId === commitmentClient)
                .map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.publicCode}
                  </option>
                ))}
            </select>
          </label>
          {owner("ownerId", "المسؤول عن التنفيذ")}
          {Object.entries({
            windowStart: "بداية نافذة التسليم",
            windowEnd: "نهاية نافذة التسليم",
          }).map(([name, label]) => (
            <label key={name}>
              {label} — بتوقيت جهازك
              <input
                type="datetime-local"
                name={name}
                className={field}
                required
              />
            </label>
          ))}
          <label>
            مرجع خطة التنفيذ
            <input
              name="planReference"
              className={field}
              minLength={5}
              maxLength={500}
              required
            />
          </label>
          <label>
            <input name="planConfirmed" type="checkbox" /> راجعت المندوب والمسار
            والسعة وموعد المصدر ووثقت ذلك في المرجع
          </label>
          <button
            disabled={busy}
            className="rounded bg-slate-900 p-3 text-white"
          >
            حفظ الموعد والمتابعة
          </button>
        </form>
        {props.commitments.map((x) => (
          <p key={x.id} className="mt-3 rounded border p-3">
            <bdi>
              {props.orders.find((o) => o.id === x.orderId)?.publicCode ??
                "شحنة مسجلة"}
            </bdi>{" "}
            ·{" "}
            {x.status === "MISSED"
              ? "فات الموعد"
              : x.status === "AT_RISK"
                ? "الموعد معرض للتأخر"
                : "موعد مسجل"}{" "}
            ·{" "}
            {x.feasibility === "MANUALLY_CONFIRMED"
              ? "خطة راجعها المسؤول"
              : "تحتاج مراجعة التنفيذ"}{" "}
            ·{" "}
            {new Date(x.windowEnd).toLocaleString("ar-SA", {
              timeZone: "Asia/Riyadh",
            })}{" "}
            — الرياض
          </p>
        ))}
      </details>
    </section>
  );
}
