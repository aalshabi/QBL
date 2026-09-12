import "server-only";
import { getPrisma } from "@/lib/prisma";
import { assertOperator } from "./cases";
import type { Session } from "@/lib/auth";
export async function managementSnapshot(
  date: string | undefined,
  session: Session | null,
) {
  const actor = await assertOperator(session);
  if (actor.role === "DISPATCHER") throw new Error("FORBIDDEN");
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const day =
    date &&
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    Number.isFinite(Date.parse(date + "T00:00:00+03:00"))
      ? date
      : today;
  const start = new Date(day + "T00:00:00+03:00"),
    end = new Date(start.getTime() + 86400000),
    now = new Date(),
    prisma = getPrisma();
  const [orders, open, overdue] = await prisma.$transaction(
    [
      prisma.deliveryOrder.findMany({
        where: { scheduledAt: { gte: start, lt: end } },
        select: {
          clientAccountId: true,
          clientAccount: { select: { companyName: true } },
          status: true,
          scheduledAt: true,
          courierId: true,
          deliveryFee: true,
        },
        take: 10001,
      }),
      prisma.operationalCase.count({ where: { status: { not: "CLOSED" } } }),
      prisma.operationalCase.count({
        where: { status: { not: "CLOSED" }, resolutionDueAt: { lt: now } },
      }),
    ],
    { isolationLevel: "RepeatableRead" },
  );
  if (orders.length > 10000) throw new Error("REPORT_SCOPE_EXCEEDS_LIMIT");
  const count = (status: string) =>
      orders.filter((x) => x.status === status).length,
    delivered = orders.filter((x) => x.status === "DELIVERED"),
    drivers = new Set(
      delivered.flatMap((x) => (x.courierId ? [x.courierId] : [])),
    );
  const kpis = [
    { label: "الشحنات المسجلة لليوم", value: orders.length },
    { label: "مسلّمة بحسب المصدر", value: count("DELIVERED") },
    { label: "خرجت للتوصيل", value: count("OUT_FOR_DELIVERY") },
    {
      label: "تجاوزت الموعد المسجل",
      value: orders.filter(
        (x) =>
          !["DELIVERED", "RETURNED", "CANCELLED"].includes(x.status) &&
          x.scheduledAt < now,
      ).length,
    },
    { label: "تعذر تسليمها بحسب المصدر", value: count("FAILED") },
    { label: "مرتجعات بحسب المصدر", value: count("RETURNED") },
    { label: "الالتزام بمستوى الخدمة", value: null },
    { label: "نجاح المحاولة الأولى", value: null },
    {
      label: "مسلّمات لكل مندوب مكلّف",
      value:
        drivers.size && delivered.every((x) => x.courierId)
          ? Math.round((delivered.length / drivers.size) * 10) / 10
          : null,
    },
    { label: "المسافة لكل شحنة", value: null },
    { label: "التكلفة لكل شحنة", value: null },
    { label: "الحالات المفتوحة الآن", value: open },
    { label: "الحالات المتأخرة الآن", value: overdue },
    { label: "استثناءات الحرارة", value: null },
    { label: "هامش الربح", value: null },
  ];
  const clients = [...new Set(orders.map((x) => x.clientAccountId))].map(
    (id) => {
      const rows = orders.filter((x) => x.clientAccountId === id);
      return {
        id,
        name: rows[0].clientAccount.companyName,
        shipments: rows.length,
        returns: rows.filter((x) => x.status === "RETURNED").length,
        recordedFees: rows.every((x) => x.deliveryFee !== null)
          ? rows.reduce((sum, x) => sum + Number(x.deliveryFee), 0)
          : null,
      };
    },
  );
  return { day, kpis, clients };
}
