// بيانات تجريبية للوحة التحكم الإدارية — مشتقة من lib/mock-data مع إثراء حقول COD/الفوترة
// تُستبدل عبر lib/admin/data.ts بمصدر Prisma عند توفر قاعدة البيانات.

import { clientAccounts, couriers, customers, deliveryOrders, vehicles } from "@/lib/mock-data";
import type {
  AdminCodStatus,
  AdminOrder,
  AdminOrderStatus,
  AdminPaymentMethod,
  CodCustodyRow,
  CodSettlementRow,
  ExpenseRow,
  FleetCourier,
  FleetVehicle,
} from "@/lib/admin/types";
import { VAT_RATE } from "@/lib/admin/types";

const HUBS = ["فرع الرياض الرئيسي", "فرع الشمال", "فرع الغرب"];

const adminStatuses: AdminOrderStatus[] = [
  "CREATED",
  "PENDING_APPROVAL",
  "ASSIGNED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "DELIVERED",
  "POSTPONED",
  "RETURNED",
  "DELIVERED",
  "FAILED",
];

const paymentMethods: AdminPaymentMethod[] = ["CASH", "MADA", "CASH", "VISA", "CASH", "MASTER", "PREPAID"];

function codStatusFor(status: AdminOrderStatus, index: number): AdminCodStatus | null {
  if (status !== "DELIVERED") return null;
  const cycle: AdminCodStatus[] = ["WITH_COURIER", "RECEIVED", "SORTED", "EXPORTED", "SETTLED"];
  return cycle[index % cycle.length];
}

export const adminOrders: AdminOrder[] = deliveryOrders.map((order, index) => {
  const status = adminStatuses[index % adminStatuses.length];
  const client = clientAccounts.find((c) => c.id === order.clientAccountId)!;
  const customer = customers.find((c) => c.id === order.customerId)!;
  const courier = couriers.find((c) => c.id === order.courierId) ?? null;
  const paymentMethod = paymentMethods[index % paymentMethods.length];
  const codAmount = paymentMethod === "PREPAID" ? 0 : 80 + (index % 9) * 45;
  const delivered = status === "DELIVERED";
  return {
    id: order.id,
    publicCode: order.publicCode,
    reference: order.reference,
    barcode: `1004${String(87020000 + index * 7)}`,
    clientAccountId: client.id,
    clientName: client.companyName,
    customerName: customer.name,
    customerArea: order.dropoffAddress,
    courierId: courier?.id ?? null,
    courierName: courier?.displayName ?? null,
    hubName: HUBS[index % HUBS.length],
    status,
    serviceType: order.serviceType,
    paymentMethod,
    codAmount,
    deliveryFee: 18 + (index % 4) * 7,
    codStatus: codStatusFor(status, index),
    isFollowUp: index % 13 === 0,
    isDelayed: order.isDelayed,
    notes: index % 11 === 0 ? "يتطلب تواصلًا قبل الوصول" : null,
    scheduledAt: order.scheduledAt,
    deliveredAt: delivered ? new Date(new Date(order.scheduledAt).getTime() + 55 * 60_000).toISOString() : null,
    postponedAt: status === "POSTPONED" ? new Date(new Date(order.scheduledAt).getTime() + 26 * 3_600_000).toISOString() : null,
  };
});

export const fleetCouriers: FleetCourier[] = couriers.map((courier, index) => {
  const mine = adminOrders.filter((o) => o.courierId === courier.id);
  const delivered = mine.filter((o) => o.status === "DELIVERED");
  const custody = delivered
    .filter((o) => o.codStatus === "WITH_COURIER")
    .reduce((sum, o) => sum + o.codAmount, 0);
  const vehicle = vehicles.find((v) => v.id === courier.vehicleId);
  return {
    id: courier.id,
    employeeCode: courier.employeeCode,
    displayName: courier.displayName,
    phoneMasked: courier.phoneMasked,
    status: courier.status,
    hubName: HUBS[index % HUBS.length],
    vehicleLabel: vehicle?.label ?? "—",
    assignedOrders: mine.filter((o) => ["ASSIGNED", "OUT_FOR_DELIVERY", "ARRIVED"].includes(o.status)).length,
    deliveredToday: delivered.length,
    successRate: mine.length ? Math.round((delivered.length / mine.length) * 100) : 0,
    codCustody: custody,
    lastPingAt: courier.lastPingAt,
  };
});

export const fleetVehicles: FleetVehicle[] = vehicles.map((vehicle, index) => {
  const courier = couriers.find((c) => c.vehicleId === vehicle.id) ?? null;
  const statuses: FleetVehicle["status"][] = ["ACTIVE", "ACTIVE", "ACTIVE", "MAINTENANCE", "ACTIVE", "OFFLINE"];
  return {
    id: vehicle.id,
    plateNumber: vehicle.plateNumber,
    label: vehicle.label,
    make: "هيونداي",
    model: `H350 مبرد ${2022 + (index % 4)}`,
    coldRange: vehicle.coldRange,
    supportsFrozen: vehicle.supportsFrozen,
    status: statuses[index % statuses.length],
    courierName: courier?.displayName ?? null,
    loadedOrders: adminOrders.filter((o) => o.courierId === courier?.id && o.status === "OUT_FOR_DELIVERY").length,
    insuranceExpiry: new Date(2026, 6 + (index % 6), 20).toISOString(),
    licenseExpiry: new Date(2026, 8 + (index % 5), 10).toISOString(),
  };
});

export const codCustody: CodCustodyRow[] = fleetCouriers
  .map((courier) => {
    const rows = adminOrders.filter((o) => o.courierId === courier.id && o.codStatus === "WITH_COURIER");
    return {
      courierId: courier.id,
      courierName: courier.displayName,
      ordersCount: rows.length,
      totalCod: rows.reduce((s, o) => s + o.codAmount, 0),
      totalFees: rows.reduce((s, o) => s + o.deliveryFee, 0),
    };
  })
  .filter((row) => row.ordersCount > 0);

export const codSettlements: CodSettlementRow[] = clientAccounts.map((client, index) => {
  const rows = adminOrders.filter(
    (o) => o.clientAccountId === client.id && o.codStatus && ["SORTED", "EXPORTED", "SETTLED"].includes(o.codStatus),
  );
  const totalCod = rows.reduce((s, o) => s + o.codAmount, 0);
  const totalFees = rows.reduce((s, o) => s + o.deliveryFee, 0);
  const vatAmount = Math.round(totalFees * VAT_RATE * 100) / 100;
  const statuses: CodSettlementRow["status"][] = ["SORTED", "EXPORTED", "DELIVERED"];
  const status = statuses[index % statuses.length];
  const base = new Date("2026-07-10T09:00:00+03:00").getTime();
  return {
    id: `stl-${String(index + 1).padStart(3, "0")}`,
    clientAccountId: client.id,
    clientName: client.companyName,
    status,
    ordersCount: rows.length,
    totalCod,
    totalFees,
    vatAmount,
    netToClient: Math.round((totalCod - totalFees - vatAmount) * 100) / 100,
    sortedAt: new Date(base + index * 3_600_000).toISOString(),
    exportedAt: status !== "SORTED" ? new Date(base + (index + 6) * 3_600_000).toISOString() : null,
    deliveredAt: status === "DELIVERED" ? new Date(base + (index + 30) * 3_600_000).toISOString() : null,
  };
});

export const expenses: ExpenseRow[] = [
  { id: "exp-001", type: "DRIVER", amount: 350, note: "وقود مركبات — أسبوع 28", spentAt: "2026-07-12T10:00:00+03:00" },
  { id: "exp-002", type: "HUB", amount: 1200, note: "صيانة تبريد مستودع الفرع الرئيسي", spentAt: "2026-07-11T14:30:00+03:00" },
  { id: "exp-003", type: "DRIVER", amount: 180, note: "بدل اتصالات المناديب", spentAt: "2026-07-10T09:15:00+03:00" },
  { id: "exp-004", type: "OTHER", amount: 95, note: "مستلزمات تغليف مبرد", spentAt: "2026-07-09T16:45:00+03:00" },
  { id: "exp-005", type: "PARTNER", amount: 420, note: "رسوم شريك توصيل خارج الرياض", spentAt: "2026-07-08T11:20:00+03:00" },
];
