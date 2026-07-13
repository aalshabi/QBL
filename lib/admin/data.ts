// طبقة وصول بيانات لوحة التحكم — Adapter قابل للاستبدال:
// اليوم يقرأ من mock، وعند توفر قاعدة البيانات يُستبدل التنفيذ بـ Prisma
// (lib/prisma.ts) دون تغيير الواجهات أو الصفحات.

import {
  adminOrders,
  codCustody,
  codSettlements,
  expenses,
  fleetCouriers,
  fleetVehicles,
} from "@/lib/admin/mock";
import type {
  AdminDashboard,
  AdminOrder,
  AdminOrderStatus,
  CityDistribution,
  ClientReportRow,
  CodCustodyRow,
  CodSettlementRow,
  DriverReportRow,
  ExpenseRow,
  FinancialSummary,
  FleetCourier,
  FleetVehicle,
  StatusDistribution,
} from "@/lib/admin/types";
import { VAT_RATE } from "@/lib/admin/types";
import { clientAccounts } from "@/lib/mock-data";

export type OrdersFilter = {
  status?: AdminOrderStatus | "ALL";
  clientAccountId?: string | "ALL";
  query?: string;
  followUpOnly?: boolean;
};

export interface AdminDataSource {
  getOrders(filter?: OrdersFilter): Promise<AdminOrder[]>;
  getDashboard(): Promise<AdminDashboard>;
  getFleet(): Promise<{ couriers: FleetCourier[]; vehicles: FleetVehicle[] }>;
  getCod(): Promise<{
    custody: CodCustodyRow[];
    settlements: CodSettlementRow[];
    expenses: ExpenseRow[];
    summary: FinancialSummary;
  }>;
  getReports(): Promise<{
    drivers: DriverReportRow[];
    clients: ClientReportRow[];
    statusDistribution: StatusDistribution[];
    cityDistribution: CityDistribution[];
  }>;
}

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

function filterOrders(filter?: OrdersFilter): AdminOrder[] {
  let rows = adminOrders;
  if (!filter) return rows;
  if (filter.status && filter.status !== "ALL") rows = rows.filter((o) => o.status === filter.status);
  if (filter.clientAccountId && filter.clientAccountId !== "ALL")
    rows = rows.filter((o) => o.clientAccountId === filter.clientAccountId);
  if (filter.followUpOnly) rows = rows.filter((o) => o.isFollowUp);
  if (filter.query) {
    const q = filter.query.trim().toLowerCase();
    rows = rows.filter((o) =>
      [o.publicCode, o.reference, o.barcode, o.clientName, o.customerName, o.courierName ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }
  return rows;
}

function computeSummary(): FinancialSummary {
  const delivered = adminOrders.filter((o) => o.status === "DELIVERED");
  const returned = adminOrders.filter((o) => o.status === "RETURNED");
  const deliveredCodSum = delivered.reduce((s, o) => s + o.codAmount, 0);
  const deliveryFeesSum = delivered.reduce((s, o) => s + o.deliveryFee, 0);
  const returnedFeesSum = returned.reduce((s, o) => s + o.deliveryFee * 0.5, 0);
  const expensesByType = {
    DRIVER: expenses.filter((e) => e.type === "DRIVER").reduce((s, e) => s + e.amount, 0),
    HUB: expenses.filter((e) => e.type === "HUB").reduce((s, e) => s + e.amount, 0),
    PARTNER: expenses.filter((e) => e.type === "PARTNER").reduce((s, e) => s + e.amount, 0),
    OTHER: expenses.filter((e) => e.type === "OTHER").reduce((s, e) => s + e.amount, 0),
  };
  const expensesSum = Object.values(expensesByType).reduce((s, v) => s + v, 0);
  const vatSum = Math.round((deliveryFeesSum + returnedFeesSum) * VAT_RATE * 100) / 100;
  const codWithCouriers = adminOrders
    .filter((o) => o.codStatus === "WITH_COURIER")
    .reduce((s, o) => s + o.codAmount, 0);
  const dueToClients = adminOrders
    .filter((o) => o.codStatus && ["RECEIVED", "SORTED", "EXPORTED"].includes(o.codStatus))
    .reduce((s, o) => s + (o.codAmount - o.deliveryFee), 0);
  return {
    deliveredCodSum,
    deliveryFeesSum,
    returnedFeesSum,
    expensesSum,
    expensesByType,
    vatSum,
    netProfit: Math.round((deliveryFeesSum + returnedFeesSum - expensesSum - vatSum) * 100) / 100,
    dueToClients: Math.round(dueToClients * 100) / 100,
    codWithCouriers,
  };
}

export const mockAdminDataSource: AdminDataSource = {
  async getOrders(filter) {
    return filterOrders(filter);
  },

  async getDashboard() {
    const cards: StatusDistribution[] = ALL_STATUSES.map((status) => ({
      status,
      count: adminOrders.filter((o) => o.status === status).length,
    }));
    const delivered = adminOrders.filter((o) => o.status === "DELIVERED");
    return {
      cards,
      followUpCount: adminOrders.filter((o) => o.isFollowUp).length,
      pendingApprovalCount: adminOrders.filter((o) => o.status === "PENDING_APPROVAL").length,
      activeCouriers: fleetCouriers.filter((c) => c.status !== "OFFLINE").length,
      totalCouriers: fleetCouriers.length,
      todayDeliveredCod: delivered.reduce((s, o) => s + o.codAmount, 0),
      todayFees: delivered.reduce((s, o) => s + o.deliveryFee, 0),
    };
  },

  async getFleet() {
    return { couriers: fleetCouriers, vehicles: fleetVehicles };
  },

  async getCod() {
    return { custody: codCustody, settlements: codSettlements, expenses, summary: computeSummary() };
  },

  async getReports() {
    const drivers: DriverReportRow[] = fleetCouriers.map((courier) => {
      const mine = adminOrders.filter((o) => o.courierId === courier.id);
      const delivered = mine.filter((o) => o.status === "DELIVERED");
      return {
        courierId: courier.id,
        courierName: courier.displayName,
        totalOrders: mine.length,
        delivered: delivered.length,
        returned: mine.filter((o) => o.status === "RETURNED").length,
        postponed: mine.filter((o) => o.status === "POSTPONED").length,
        inProgress: mine.filter((o) => ["ASSIGNED", "OUT_FOR_DELIVERY", "ARRIVED"].includes(o.status)).length,
        successRate: mine.length ? Math.round((delivered.length / mine.length) * 100) : 0,
        codCollected: delivered.reduce((s, o) => s + o.codAmount, 0),
      };
    });

    const clients: ClientReportRow[] = clientAccounts.map((client) => {
      const mine = adminOrders.filter((o) => o.clientAccountId === client.id);
      const delivered = mine.filter((o) => o.status === "DELIVERED");
      const last = mine.reduce((max, o) => (o.scheduledAt > max ? o.scheduledAt : max), "");
      return {
        clientAccountId: client.id,
        clientName: client.companyName,
        sector: client.sector,
        totalOrders: mine.length,
        delivered: delivered.length,
        returned: mine.filter((o) => o.status === "RETURNED").length,
        codTotal: delivered.reduce((s, o) => s + o.codAmount, 0),
        feesTotal: mine.reduce((s, o) => s + o.deliveryFee, 0),
        lastOrderAt: last,
      };
    });

    const statusDistribution: StatusDistribution[] = ALL_STATUSES.map((status) => ({
      status,
      count: adminOrders.filter((o) => o.status === status).length,
    })).filter((row) => row.count > 0);

    const areas = [...new Set(adminOrders.map((o) => o.customerArea))];
    const cityDistribution: CityDistribution[] = areas
      .map((area) => {
        const mine = adminOrders.filter((o) => o.customerArea === area);
        return {
          area,
          count: mine.length,
          delivered: mine.filter((o) => o.status === "DELIVERED").length,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return { drivers, clients, statusDistribution, cityDistribution };
  },
};

/** نقطة التبديل: أعِد هنا تنفيذ Prisma عند توفر قاعدة البيانات. */
export function getAdminDataSource(): AdminDataSource {
  return mockAdminDataSource;
}
