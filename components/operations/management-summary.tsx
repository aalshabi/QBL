type Snapshot = {
  day: string;
  kpis: { label: string; value: number | null }[];
  clients: {
    id: string;
    name: string;
    shipments: number;
    returns: number;
    recordedFees: number | null;
  }[];
};
export function ManagementSummary({ snapshot }: { snapshot: Snapshot }) {
  return (
    <section dir="rtl" className="space-y-4">
      <h2 className="text-xl font-bold">متابعة التشغيل والربحية</h2>
      <form className="flex flex-wrap items-end gap-3">
        <label>
          تاريخ موعد التسليم — الرياض
          <input
            type="date"
            name="date"
            defaultValue={snapshot.day}
            className="ms-2 rounded border p-2"
          />
        </label>
        <button className="rounded bg-slate-900 p-2 text-white">
          عرض اليوم
        </button>
      </form>
      <p className="rounded border border-amber-300 bg-amber-50 p-3 text-sm">
        الأعداد تخص سجلات QBL في الفترة المختارة، وليست إثباتًا لاكتمال المصدر.
        تاريخ التسليم المسجل لا يثبت وحده اتفاقية مستوى الخدمة. غير المتاح لا
        يعني صفرًا أو سلامة الأداء.
      </p>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {snapshot.kpis.map((x) => (
          <div key={x.label} className="rounded border bg-white p-3">
            <p className="text-sm">{x.label}</p>
            <strong className="text-xl">
              {x.value === null ? "غير متاح" : x.value.toLocaleString("ar-SA")}
            </strong>
          </div>
        ))}
      </div>
      <p className="text-sm">
        بيانات الحرارة: غير متاحة للتقييم حتى توثيق المزود وربط الحساس والمركبة
        وحدود المنتج. بيانات المسافات والمحاولات والتكاليف والفواتير تحتاج مصادر
        معتمدة.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-right text-sm">
          <caption className="p-2 text-right font-bold">
            مراجعة العميل المالية — لا تمثل ربحًا محققًا
          </caption>
          <thead>
            <tr>
              {[
                "العميل",
                "شحنات",
                "مرتجعات",
                "أجور مسجلة — ر.س",
                "التكلفة والهامش",
                "مطابقة دفترة",
              ].map((x) => (
                <th key={x} className="whitespace-nowrap border p-2">
                  {x}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {snapshot.clients.map((x) => (
              <tr key={x.id}>
                <td className="border p-2">{x.name}</td>
                <td className="border p-2">{x.shipments}</td>
                <td className="border p-2">{x.returns}</td>
                <td className="border p-2">
                  {x.recordedFees === null
                    ? "غير مكتمل"
                    : x.recordedFees.toLocaleString("ar-SA")}
                </td>
                <td className="border p-2">غير متاح</td>
                <td className="border p-2">غير متحقق</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
