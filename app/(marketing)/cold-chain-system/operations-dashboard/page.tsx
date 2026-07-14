import type { Metadata } from "next";
import {
  Activity,
  AlertTriangle,
  ArrowRightLeft,
  BellRing,
  CheckCircle2,
  CircleDot,
  Clock,
  Gauge,
  History,
  PackageX,
  ShieldAlert,
  Snowflake,
  Thermometer,
  Truck,
  UserCog,
  Warehouse,
  Wifi,
  WifiOff,
} from "lucide-react";
import PageHero from "@/components/PageHero";
import { SeverityBadge, ZoneBadge } from "@/components/cold-chain/Badges";
import MetricCard from "@/components/cold-chain/MetricCard";
import OrderRow from "@/components/cold-chain/OrderRow";
import TempGauge from "@/components/cold-chain/TempGauge";
import {
  ALERTS,
  COLD_CHAIN_ORDERS,
  DRIVERS,
  SLA_RULES,
  VEHICLES,
  formatTime,
  getOrder,
  getVehicle,
  isWithinRange,
} from "@/data/coldChain";

export const metadata: Metadata = {
  title: "لوحة العمليات — نظام التوصيل المبرّد",
  description: "لوحة عرض تصميمية لفريق العمليات: الشحنات الحية، تنبيهات الحرارة، الالتزام الزمني، وحالة المركبات والسائقين.",
  alternates: { canonical: "https://qbl.sa/cold-chain-system/operations-dashboard" },
};

export default function OperationsDashboardPage() {
  const orders = COLD_CHAIN_ORDERS;
  const active = orders.filter((o) => !["delivered", "closed", "damaged"].includes(o.status));
  const tempBreaches = orders.filter(
    (o) => o.currentTemperatureC != null && !isWithinRange(o.currentTemperatureC, o.temperatureRange),
  );
  const atRisk = orders.filter((o) => o.riskLevel === "at_risk" || o.riskLevel === "breached");
  const failed = orders.filter((o) => o.status === "not_delivered");
  const inColdStorage = orders.filter((o) => ["cold_storage", "inbound_received"].includes(o.status));
  const readyForDispatch = orders.filter((o) => o.status === "ready_for_dispatch");
  const sortedAlerts = [...ALERTS].sort((a, b) => severityRank(b.severity) - severityRank(a.severity));

  return (
    <>
      <PageHero
        eyebrow="لوحة العمليات · عرض تصميمي"
        title="رؤية تشغيلية كاملة، لا مجرد عداد طلبات"
        description="ركّز فريقك على ما يحتاج تدخلاً: الشحنات تحت الخطر، تجاوزات الحرارة، تأخر الإرسال، وفشل التسليم — ضمن لوحة واحدة قابلة للتطوير وفق نطاق العمل."
      />

      <section className="bg-muted/40">
        <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
          {/* Top KPIs */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard icon={Activity} label="شحنات نشطة" value={active.length} />
            <MetricCard
              icon={Thermometer}
              label="تجاوزات حرارة"
              value={tempBreaches.length}
              tone={tempBreaches.length > 0 ? "danger" : "success"}
            />
            <MetricCard
              icon={AlertTriangle}
              label="تحت الخطر"
              value={atRisk.length}
              tone={atRisk.length > 0 ? "warning" : "default"}
            />
            <MetricCard
              icon={CheckCircle2}
              label="في الوقت اليوم"
              value={`${Math.round(((orders.length - failed.length - atRisk.length) / Math.max(orders.length, 1)) * 100)}%`}
              tone="success"
              hint="بناءً على الطلبات الحالية"
            />
          </div>

          {/* Live shipment board + Alerts */}
          <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
            <Card
              title="لوحة الشحنات"
              subtitle="حالة، حرارة، SLA، ومخاطر لكل طلب نشط"
              action={
                <div className="flex gap-2">
                  <FilterPill label="المنطقة" />
                  <FilterPill label="السائق" />
                  <FilterPill label="نطاق المخاطر" />
                </div>
              }
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-right">
                  <thead>
                    <tr className="bg-muted/40 text-xs font-bold uppercase tracking-wide text-slatebrand">
                      <Th>الطلب</Th>
                      <Th>المنتج</Th>
                      <Th>المسار</Th>
                      <Th>نافذة التسليم</Th>
                      <Th>الحرارة</Th>
                      <Th>الحالة</Th>
                      <Th>SLA</Th>
                      <Th>المخاطر</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <OrderRow key={o.id} order={o} />
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card
              title="تنبيهات حية"
              subtitle="مرتبة حسب الخطورة · يدعم التصعيد التلقائي"
              action={
                <span className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-bold text-rose-700">
                  <BellRing className="h-3 w-3" /> {sortedAlerts.length}
                </span>
              }
            >
              <ul className="grid gap-3">
                {sortedAlerts.map((a) => {
                  const order = a.orderId ? getOrder(a.orderId) : undefined;
                  return (
                    <li key={a.id} className="rounded-md border border-muted bg-white p-3">
                      <div className="flex items-center justify-between gap-2">
                        <SeverityBadge severity={a.severity} />
                        <span className="font-latin text-xs text-slatebrand ltr">{formatTime(a.timestamp)}</span>
                      </div>
                      <p className="mt-2 text-sm font-bold text-primary">{a.message}</p>
                      {order && (
                        <p className="mt-1 text-xs text-slatebrand">
                          <span className="font-latin font-bold ltr">{order.reference}</span> · {order.clientName}
                        </p>
                      )}
                      <p className="mt-2 text-xs text-slatebrand">
                        <span className="font-bold text-primary">الإجراء: </span>
                        {a.actionRequired}
                      </p>
                      <div className="mt-3 flex gap-2">
                        <button className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-bold text-white hover:bg-primary-800">
                          تصعيد
                        </button>
                        <button className="inline-flex h-8 items-center rounded-md border border-muted bg-white px-3 text-xs font-bold text-primary hover:bg-muted/40">
                          تأكيد المعالجة
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </div>

          {/* Vehicles + Drivers */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="جاهزية المركبات" subtitle="حرارة، حالة الحساس، ودورة التبريد">
              <ul className="grid gap-3">
                {VEHICLES.map((v) => {
                  const within = isWithinRange(v.currentTemperatureC, v.targetRange);
                  return (
                    <li
                      key={v.id}
                      className="grid gap-3 rounded-md border border-muted bg-white p-3 sm:grid-cols-[1fr_auto]"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-latin text-sm font-bold text-primary ltr">{v.plateNumber}</p>
                          <ZoneBadge zone={v.zone} />
                        </div>
                        <div className="mt-1 text-xs text-slatebrand">
                          {v.driverName ?? "—"} · {routeStatusLabel(v.routeStatus)}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                          <span
                            className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-bold ${
                              within
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-rose-200 bg-rose-50 text-rose-700"
                            }`}
                          >
                            <Thermometer className="h-3 w-3" />
                            <span className="font-latin ltr">{v.currentTemperatureC.toFixed(1)}°C</span>
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-md border border-muted bg-muted/30 px-2 py-0.5 font-bold text-slatebrand">
                            <Snowflake className="h-3 w-3" />
                            {preCoolLabel(v.preCoolingStatus)}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-bold ${
                              v.sensorStatus === "connected"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : v.sensorStatus === "manual"
                                ? "border-amber-200 bg-amber-50 text-amber-700"
                                : "border-rose-200 bg-rose-50 text-rose-700"
                            }`}
                          >
                            {v.sensorStatus === "connected" ? (
                              <Wifi className="h-3 w-3" />
                            ) : (
                              <WifiOff className="h-3 w-3" />
                            )}
                            {sensorLabel(v.sensorStatus)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-end gap-2">
                        <button className="inline-flex h-8 items-center gap-1 rounded-md border border-muted bg-white px-2 text-xs font-bold text-primary hover:bg-muted/40">
                          <ArrowRightLeft className="h-3 w-3" />
                          إعادة إسناد
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>

            <Card title="السائقون" subtitle="الحالة، الطلبات النشطة، ومعدل الالتزام">
              <ul className="grid gap-3">
                {DRIVERS.map((d) => (
                  <li
                    key={d.id}
                    className="grid gap-3 rounded-md border border-muted bg-white p-3 sm:grid-cols-[1fr_auto]"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <CircleDot
                          className={`h-3 w-3 ${
                            d.status === "on_route"
                              ? "text-emerald-600"
                              : d.status === "loading"
                              ? "text-amber-600"
                              : "text-slate-400"
                          }`}
                        />
                        <p className="text-sm font-bold text-primary">{d.name}</p>
                      </div>
                      <div className="mt-1 font-latin text-xs text-slatebrand ltr">{d.phone}</div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <Pill>نشطة: {d.activeOrders}</Pill>
                        <Pill>منجزة اليوم: {d.completedToday}</Pill>
                        <Pill tone="success">الالتزام: {(d.onTimeRate * 100).toFixed(0)}%</Pill>
                      </div>
                    </div>
                    <div className="flex items-end gap-2">
                      <button className="inline-flex h-8 items-center gap-1 rounded-md border border-muted bg-white px-2 text-xs font-bold text-primary hover:bg-muted/40">
                        <UserCog className="h-3 w-3" />
                        إسناد
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Cold storage + queues */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Card title="المستودع المبرد" subtitle="حسب منطقة الحرارة">
              <ul className="grid gap-2">
                <QueueLine icon={Warehouse} label="مجمد (-22° إلى -18°)" value={countByZone(orders, "frozen")} />
                <QueueLine icon={Warehouse} label="مبرد (2°–8°)" value={countByZone(orders, "chilled")} />
                <QueueLine icon={Warehouse} label="حساس للحرارة (15°–25°)" value={countByZone(orders, "ambient_sensitive")} />
              </ul>
              <div className="mt-4 grid gap-2 text-xs">
                <Pill>في التخزين: {inColdStorage.length}</Pill>
                <Pill tone="warning">جاهز للإرسال: {readyForDispatch.length}</Pill>
              </div>
            </Card>

            <Card title="طابور الفشل وRTO" subtitle="إجراءات قابلة للتنفيذ">
              {failed.length === 0 ? (
                <EmptyState text="لا توجد طلبات فشل تسليم حالياً." />
              ) : (
                <ul className="grid gap-3">
                  {failed.map((o) => (
                    <li key={o.id} className="rounded-md border border-rose-200 bg-rose-50/50 p-3">
                      <div className="flex items-center justify-between">
                        <p className="font-latin text-sm font-bold text-primary ltr">{o.reference}</p>
                        <PackageX className="h-4 w-4 text-rose-700" />
                      </div>
                      <p className="mt-1 text-xs text-slatebrand">{o.pod.exceptionNotes}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <ActionMini label="إعادة جدولة" />
                        <ActionMini label="إرجاع تحت التبريد" />
                        <ActionMini label="تصعيد" tone="danger" />
                        <ActionMini label="إغلاق باستثناء" />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card title="قواعد الالتزام (SLA)" subtitle="معايير تشغيلية للتنبيه والتصعيد">
              <ul className="grid gap-2">
                {SLA_RULES.map((r) => (
                  <li key={r.ar} className="flex items-center justify-between rounded-md border border-muted p-3">
                    <span className="text-sm text-primary">{r.ar}</span>
                    <span className="font-latin text-xs font-bold text-accent ltr">{r.value}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Critical shipment detail */}
          {(() => {
            const crit = orders.find((o) => o.status === "temp_warning") ?? orders[0];
            const veh = getVehicle(crit.vehicleId);
            return (
              <Card
                title={`متابعة شحنة حرجة — ${crit.reference}`}
                subtitle={`${crit.clientName} · ${crit.productType}`}
                action={
                  <span className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-bold text-rose-700">
                    <ShieldAlert className="h-3 w-3" /> تجاوز حرارة
                  </span>
                }
              >
                <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr]">
                  <TempGauge
                    current={crit.currentTemperatureC ?? crit.temperatureRange.minC}
                    range={crit.temperatureRange}
                    label="حرارة الشحنة الحالية"
                  />
                  {veh && (
                    <TempGauge
                      current={veh.currentTemperatureC}
                      range={veh.targetRange}
                      label={`حرارة المركبة ${veh.plateNumber}`}
                    />
                  )}
                  <div className="rounded-lg border border-muted bg-white p-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-slatebrand">
                      <History className="h-4 w-4 text-accent" />
                      سجل الحرارة
                    </div>
                    <ul className="mt-3 grid gap-2">
                      {crit.temperatureLog.map((l) => (
                        <li
                          key={l.timestamp}
                          className="flex items-center justify-between rounded-md border border-muted px-3 py-2 text-xs"
                        >
                          <span className="font-latin text-slatebrand ltr">{formatTime(l.timestamp)}</span>
                          <span
                            className={`font-latin font-bold ltr ${
                              l.withinRange ? "text-emerald-700" : "text-rose-700"
                            }`}
                          >
                            {l.valueC.toFixed(1)}°C
                          </span>
                          <span className="text-slatebrand">
                            {l.source === "connected" ? "حساس" : l.source === "manual" ? "يدوي" : "—"}
                          </span>
                        </li>
                      ))}
                      {crit.temperatureLog.length === 0 && (
                        <li className="rounded-md border border-dashed border-muted p-3 text-xs text-slatebrand">
                          لا توجد قراءات. أضف قراءة يدوية مع السبب.
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 lg:grid-cols-3">
                  <DetailRow label="السائق" value={crit.driverId ? "محمد القحطاني" : "غير معيّن"} icon={Truck} />
                  <DetailRow label="نافذة التسليم" value={`${formatTime(crit.deliveryWindow.start)} – ${formatTime(crit.deliveryWindow.end)}`} icon={Clock} />
                  <DetailRow label="الأولوية" value="حرج" icon={Gauge} tone="danger" />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-xs font-bold text-white">
                    تصعيد لمشرف العمليات
                  </button>
                  <button className="inline-flex h-9 items-center rounded-md border border-muted bg-white px-4 text-xs font-bold text-primary">
                    إرجاع تحت التبريد
                  </button>
                  <button className="inline-flex h-9 items-center rounded-md border border-muted bg-white px-4 text-xs font-bold text-primary">
                    تسجيل تجاوز يدوي
                  </button>
                </div>
                <p className="mt-4 text-xs text-slatebrand">
                  جميع الإجراءات اليدوية يتم تسجيلها في سجل تدقيق (Audit log) — جاهز للتفعيل عند ربط الواجهة بقاعدة البيانات.
                </p>
              </Card>
            );
          })()}
        </div>
      </section>
    </>
  );
}

function severityRank(s: string) {
  return { critical: 4, high: 3, medium: 2, low: 1 }[s] ?? 0;
}
function countByZone(orders: typeof COLD_CHAIN_ORDERS, zone: "frozen" | "chilled" | "ambient_sensitive") {
  return orders.filter((o) => o.zone === zone).length;
}
function preCoolLabel(s: string) {
  return s === "ready" ? "تبريد جاهز" : s === "in_progress" ? "قيد التبريد" : "لم يبدأ";
}
function sensorLabel(s: string) {
  return s === "connected" ? "حساس متصل" : s === "manual" ? "إدخال يدوي" : "حساس مفقود";
}
function routeStatusLabel(s: string) {
  return (
    {
      idle: "خامل",
      loading: "تحميل",
      on_route: "في الطريق",
      returning: "عودة",
      maintenance: "صيانة",
    } as Record<string, string>
  )[s] ?? s;
}

function Card({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-muted bg-white p-5">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-primary">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-slatebrand">{subtitle}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-3 text-right">{children}</th>;
}

function Pill({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "success" | "warning" }) {
  const styles =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "warning"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : "border-muted bg-muted/30 text-slatebrand";
  return <span className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-bold ${styles}`}>{children}</span>;
}

function FilterPill({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="inline-flex h-9 items-center gap-1 rounded-md border border-muted bg-white px-3 text-xs font-bold text-primary hover:bg-muted/40"
    >
      {label}
      <span className="text-slatebrand">▾</span>
    </button>
  );
}

function ActionMini({ label, tone = "default" }: { label: string; tone?: "default" | "danger" }) {
  const styles =
    tone === "danger"
      ? "border-rose-300 bg-white text-rose-700 hover:bg-rose-50"
      : "border-muted bg-white text-primary hover:bg-muted/40";
  return (
    <button className={`inline-flex h-7 items-center rounded-md border px-2 text-[11px] font-bold ${styles}`}>
      {label}
    </button>
  );
}

function QueueLine({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <li className="flex items-center justify-between rounded-md border border-muted p-3">
      <span className="inline-flex items-center gap-2 text-sm text-primary">
        <Icon className="h-4 w-4 text-accent" />
        {label}
      </span>
      <span className="font-latin text-sm font-extrabold text-primary ltr">{value}</span>
    </li>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-md border border-dashed border-muted p-6 text-center text-sm text-slatebrand">
      {text}
    </div>
  );
}

function DetailRow({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "default" | "danger";
}) {
  const styles = tone === "danger" ? "border-rose-200 bg-rose-50/60 text-rose-800" : "border-muted bg-white text-primary";
  return (
    <div className={`flex items-center justify-between rounded-md border p-3 ${styles}`}>
      <span className="inline-flex items-center gap-2 text-xs font-bold">
        <Icon className="h-4 w-4" />
        {label}
      </span>
      <span className="text-sm font-bold">{value}</span>
    </div>
  );
}
