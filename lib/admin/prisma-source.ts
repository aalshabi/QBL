// تنفيذ AdminDataSource فوق Prisma — يقرأ من قاعدة البيانات بدل mock.

import { getPrisma } from "@/lib/prisma";
import type { AdminDataSource, OrdersFilter } from "@/lib/admin/data";
import type {
  AdminCodStatus,
  AdminOrder,
  AdminOrderStatus,
  AdminPaymentMethod,
  CityDistribution,
  ClientReportRow,
  CodCustodyRow,
  CodSettlementRow,
  DriverReportRow,
  ExpenseRow,
  ExpenseType,
  FinancialSummary,
  FleetCourier,
  FleetVehicle,
  StatusDistribution,
} from "@/lib/admin/types";
import { VAT_RATE } from "@/lib/admin/types";

type Decimalish = { toString(): string } | null | undefined;

const money = (value: Decimalish) => (value == null ? 0 : Number(value.toString()));
const iso = (value: Date | null | undefined) => (value ? value.toISOString() : null);
const round2 = (value: number) => Math.round(value * 100) / 100;
const maskPhone = (phone: string) => `05******${phone.slice(-2)}`;

const ALL_STATUSES: AdminOrderStatus[] = [
  "CREATED",
  "PENDING_APPROVAL",
  "ASSIGNED",
  "OUT_FOR_DELIVERY",
  "ARRIVED",
  "DELIVERED",
  "POSTPONED",
  "RETURNED",
  "FAILED",
  "CANCELLED",
];

const IN_PROGRESS: AdminOrderStatus[] = ["ASSIGNED", "OUT_FOR_DELIVERY", "ARRIVED"];

/** الأعمدة التي يحتاجها جدول الطلبات وكل التقارير — استعلام واحد يُعاد استخدامه. */
const orderSelect = {
  id: true,
  publicCode: true,
  reference: true,
  barcode: true,
  clientAccountId: true,
  courierId: true,
  status: true,
  serviceType: true,
  paymentMethod: true,
  codAmount: true,
  deliveryFee: true,
  codStatus: true,
  isFollowUp: true,
  isDelayed: true,
  notes: true,
  dropoffAddress: true,
  scheduledAt: true,
  deliveredAt: true,
  postponedAt: true,
  clientAccount: { select: { companyName: true, sector: true } },
  customer: { select: { name: true } },
  courier: { select: { displayName: true } },
  hub: { select: { name: true } },
} as const;

type OrderRow = {
  id: string;
  publicCode: string;
  reference: string;
  barcode: string | null;
  clientAccountId: string;
  courierId: string | null;
  status: string;
  serviceType: string;
  paymentMethod: string | null;
  codAmount: Decimalish;
  deliveryFee: Decimalish;
  codStatus: string | null;
  isFollowUp: boolean;
  isDelayed: boolean;
  notes: string | null;
  dropoffAddress: string;
  scheduledAt: Date;
  deliveredAt: Date | null;
  postponedAt: Date | null;
  clientAccount: { companyName: string; sector: string };
  customer: { name: string };
  courier: { displayName: string } | null;
  hub: { name: string } | null;
};

function toAdminOrder(row: OrderRow): AdminOrder {
  return {
    id: row.id,
    publicCode: row.publicCode,
    reference: row.reference,
    barcode: row.barcode ?? "",
    clientAccountId: row.clientAccountId,
    clientName: row.clientAccount.companyName,
    customerName: row.customer.name,
    customerArea: row.dropoffAddress,
    courierId: row.courierId,
    courierName: row.courier?.displayName ?? null,
    hubName: row.hub?.name ?? "—",
    status: row.status as AdminOrderStatus,
    serviceType: row.serviceType,
    paymentMethod: (row.paymentMethod ?? "CASH") as AdminPaymentMethod,
    codAmount: money(row.codAmount),
    deliveryFee: money(row.deliveryFee),
    codStatus: (row.codStatus as AdminCodStatus | null) ?? null,
    isFollowUp: row.isFollowUp,
    isDelayed: row.isDelayed,
    notes: row.notes,
    scheduledAt: row.scheduledAt.toISOString(),
    deliveredAt: iso(row.deliveredAt),
    postponedAt: iso(row.postponedAt),
  };
}

async function loadOrders(filter?: OrdersFilter): Promise<AdminOrder[]> {
  const prisma = getPrisma();
  const query = filter?.query?.trim();

  const rows = await prisma.deliveryOrder.findMany({
    where: {
      ...(filter?.status && filter.status !== "ALL" ? { status: filter.status } : {}),
      ...(filter?.clientAccountId && filter.clientAccountId !== "ALL"
        ? { clientAccountId: filter.clientAccountId }
        : {}),
      ...(filter?.followUpOnly ? { isFollowUp: true } : {}),
      ...(query
        ? {
            OR: [
              { publicCode: { contains: query, mode: "insensitive" as const } },
              { reference: { contains: query, mode: "insensitive" as const } },
              { barcode: { contains: query, mode: "insensitive" as const } },
              { clientAccount: { companyName: { contains: query, mode: "insensitive" as const } } },
              { customer: { name: { contains: query, mode: "insensitive" as const } } },
              { courier: { displayName: { contains: query, mode: "insensitive" as const } } },
            ],
          }
        : {}),
    },
    select: orderSelect,
    orderBy: { scheduledAt: "desc" },
  });

  return rows.map(toAdminOrder);
}

export const prismaAdminDataSource: AdminDataSource = {
  async getOrders(filter) {
    return loadOrders(filter);
  },

  async getDashboard() {
    const orders = await loadOrders();
    const delivered = orders.filter((order) => order.status === "DELIVERED");
    const couriers = await getPrisma().courier.findMany({ select: { status: true } });

    return {
      cards: ALL_STATUSES.map((status) => ({
        status,
        count: orders.filter((order) => order.status === status).length,
      })),
      followUpCount: orders.filter((order) => order.isFollowUp).length,
      pendingApprovalCount: orders.filter((order) => order.status === "PENDING_APPROVAL").length,
      activeCouriers: couriers.filter((courier) => courier.status !== "OFFLINE").length,
      totalCouriers: couriers.length,
      todayDeliveredCod: delivered.reduce((sum, order) => sum + order.codAmount, 0),
      todayFees: delivered.reduce((sum, order) => sum + order.deliveryFee, 0),
    };
  },

  async getFleet() {
    const prisma = getPrisma();
    const [courierRows, vehicleRows, orders] = await Promise.all([
      prisma.courier.findMany({
        select: {
          id: true,
          employeeCode: true,
          displayName: true,
          phone: true,
          status: true,
          hub: { select: { name: true } },
          vehicle: { select: { label: true } },
          pings: { select: { recordedAt: true }, orderBy: { recordedAt: "desc" }, take: 1 },
        },
        orderBy: { employeeCode: "asc" },
      }),
      prisma.vehicle.findMany({
        select: {
          id: true,
          plateNumber: true,
          label: true,
          make: true,
          model: true,
          coldRangeMin: true,
          coldRangeMax: true,
          supportsFrozen: true,
          status: true,
          insuranceExpiry: true,
          licenseExpiry: true,
          courier: { select: { id: true, displayName: true } },
        },
        orderBy: { plateNumber: "asc" },
      }),
      loadOrders(),
    ]);

    const couriers: FleetCourier[] = courierRows.map((courier) => {
      const mine = orders.filter((order) => order.courierId === courier.id);
      const delivered = mine.filter((order) => order.status === "DELIVERED");
      return {
        id: courier.id,
        employeeCode: courier.employeeCode,
        displayName: courier.displayName,
        phoneMasked: maskPhone(courier.phone),
        status: courier.status as FleetCourier["status"],
        hubName: courier.hub?.name ?? "—",
        vehicleLabel: courier.vehicle?.label ?? "—",
        assignedOrders: mine.filter((order) => IN_PROGRESS.includes(order.status)).length,
        deliveredToday: delivered.length,
        successRate: mine.length ? Math.round((delivered.length / mine.length) * 100) : 0,
        codCustody: delivered
          .filter((order) => order.codStatus === "WITH_COURIER")
          .reduce((sum, order) => sum + order.codAmount, 0),
        lastPingAt: iso(courier.pings[0]?.recordedAt) ?? new Date().toISOString(),
      };
    });

    const vehicles: FleetVehicle[] = vehicleRows.map((vehicle) => ({
      id: vehicle.id,
      plateNumber: vehicle.plateNumber,
      label: vehicle.label,
      make: vehicle.make,
      model: vehicle.model,
      coldRange: `${money(vehicle.coldRangeMin)}° إلى ${money(vehicle.coldRangeMax)}°`,
      supportsFrozen: vehicle.supportsFrozen,
      status: vehicle.status as FleetVehicle["status"],
      courierName: vehicle.courier?.displayName ?? null,
      loadedOrders: orders.filter(
        (order) => order.courierId === vehicle.courier?.id && order.status === "OUT_FOR_DELIVERY",
      ).length,
      insuranceExpiry: iso(vehicle.insuranceExpiry) ?? "",
      licenseExpiry: iso(vehicle.licenseExpiry) ?? "",
    }));

    return { couriers, vehicles };
  },

  async getCod() {
    const prisma = getPrisma();
    const [collections, settlementRows, expenseRows, orders] = await Promise.all([
      prisma.codCollection.findMany({
        select: {
          courierId: true,
          ordersCount: true,
          totalCod: true,
          totalFees: true,
          courier: { select: { displayName: true } },
        },
      }),
      prisma.codSettlement.findMany({
        select: {
          id: true,
          clientAccountId: true,
          status: true,
          totalCod: true,
          totalFees: true,
          vatAmount: true,
          netToClient: true,
          sortedAt: true,
          exportedAt: true,
          deliveredAt: true,
          clientAccount: { select: { companyName: true } },
          _count: { select: { orders: true } },
        },
        orderBy: { sortedAt: "desc" },
      }),
      prisma.expense.findMany({
        select: { id: true, type: true, amount: true, note: true, spentAt: true },
        orderBy: { spentAt: "desc" },
      }),
      loadOrders(),
    ]);

    const custody: CodCustodyRow[] = collections
      .map((collection) => ({
        courierId: collection.courierId,
        courierName: collection.courier.displayName,
        ordersCount: collection.ordersCount,
        totalCod: money(collection.totalCod),
        totalFees: money(collection.totalFees),
      }))
      .filter((row) => row.ordersCount > 0);

    const settlements: CodSettlementRow[] = settlementRows.map((settlement) => ({
      id: settlement.id,
      clientAccountId: settlement.clientAccountId,
      clientName: settlement.clientAccount.companyName,
      status: settlement.status as CodSettlementRow["status"],
      ordersCount: settlement._count.orders,
      totalCod: money(settlement.totalCod),
      totalFees: money(settlement.totalFees),
      vatAmount: money(settlement.vatAmount),
      netToClient: money(settlement.netToClient),
      sortedAt: settlement.sortedAt.toISOString(),
      exportedAt: iso(settlement.exportedAt),
      deliveredAt: iso(settlement.deliveredAt),
    }));

    const expenses: ExpenseRow[] = expenseRows.map((expense) => ({
      id: expense.id,
      type: expense.type as ExpenseType,
      amount: money(expense.amount),
      note: expense.note ?? "—",
      spentAt: expense.spentAt.toISOString(),
    }));

    return { custody, settlements, expenses, summary: computeSummary(orders, expenses) };
  },

  async getReports() {
    const prisma = getPrisma();
    const [orders, courierRows, clientRows] = await Promise.all([
      loadOrders(),
      prisma.courier.findMany({ select: { id: true, displayName: true }, orderBy: { employeeCode: "asc" } }),
      prisma.clientAccount.findMany({ select: { id: true, companyName: true, sector: true } }),
    ]);

    const drivers: DriverReportRow[] = courierRows.map((courier) => {
      const mine = orders.filter((order) => order.courierId === courier.id);
      const delivered = mine.filter((order) => order.status === "DELIVERED");
      return {
        courierId: courier.id,
        courierName: courier.displayName,
        totalOrders: mine.length,
        delivered: delivered.length,
        returned: mine.filter((order) => order.status === "RETURNED").length,
        postponed: mine.filter((order) => order.status === "POSTPONED").length,
        inProgress: mine.filter((order) => IN_PROGRESS.includes(order.status)).length,
        successRate: mine.length ? Math.round((delivered.length / mine.length) * 100) : 0,
        codCollected: delivered.reduce((sum, order) => sum + order.codAmount, 0),
      };
    });

    const clients: ClientReportRow[] = clientRows.map((client) => {
      const mine = orders.filter((order) => order.clientAccountId === client.id);
      const delivered = mine.filter((order) => order.status === "DELIVERED");
      return {
        clientAccountId: client.id,
        clientName: client.companyName,
        sector: client.sector,
        totalOrders: mine.length,
        delivered: delivered.length,
        returned: mine.filter((order) => order.status === "RETURNED").length,
        codTotal: delivered.reduce((sum, order) => sum + order.codAmount, 0),
        feesTotal: mine.reduce((sum, order) => sum + order.deliveryFee, 0),
        lastOrderAt: mine.reduce((latest, order) => (order.scheduledAt > latest ? order.scheduledAt : latest), ""),
      };
    });

    const statusDistribution: StatusDistribution[] = ALL_STATUSES.map((status) => ({
      status,
      count: orders.filter((order) => order.status === status).length,
    })).filter((row) => row.count > 0);

    const cityDistribution: CityDistribution[] = [...new Set(orders.map((order) => order.customerArea))]
      .map((area) => {
        const mine = orders.filter((order) => order.customerArea === area);
        return {
          area,
          count: mine.length,
          delivered: mine.filter((order) => order.status === "DELIVERED").length,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return { drivers, clients, statusDistribution, cityDistribution };
  },
};

/** الملخص المالي — نفس معادلات المواصفة §2.7 (رسوم الرواجع = 50% من أجرة التوصيل). */
function computeSummary(orders: AdminOrder[], expenses: ExpenseRow[]): FinancialSummary {
  const delivered = orders.filter((order) => order.status === "DELIVERED");
  const returned = orders.filter((order) => order.status === "RETURNED");
  const deliveredCodSum = delivered.reduce((sum, order) => sum + order.codAmount, 0);
  const deliveryFeesSum = delivered.reduce((sum, order) => sum + order.deliveryFee, 0);
  const returnedFeesSum = returned.reduce((sum, order) => sum + order.deliveryFee * 0.5, 0);

  const expensesByType: Record<ExpenseType, number> = {
    DRIVER: 0,
    HUB: 0,
    PARTNER: 0,
    OTHER: 0,
  };
  for (const expense of expenses) expensesByType[expense.type] += expense.amount;
  const expensesSum = Object.values(expensesByType).reduce((sum, value) => sum + value, 0);
  const vatSum = round2((deliveryFeesSum + returnedFeesSum) * VAT_RATE);

  return {
    deliveredCodSum,
    deliveryFeesSum,
    returnedFeesSum,
    expensesSum,
    expensesByType,
    vatSum,
    netProfit: round2(deliveryFeesSum + returnedFeesSum - expensesSum - vatSum),
    dueToClients: round2(
      orders
        .filter((order) => order.codStatus && ["RECEIVED", "SORTED", "EXPORTED"].includes(order.codStatus))
        .reduce((sum, order) => sum + (order.codAmount - order.deliveryFee), 0),
    ),
    codWithCouriers: orders
      .filter((order) => order.codStatus === "WITH_COURIER")
      .reduce((sum, order) => sum + order.codAmount, 0),
  };
}
