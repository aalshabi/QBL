import "server-only";
import { getPrisma } from "@/lib/prisma";
import { toDomainStatus } from "@/lib/orders/transitions";
import { evaluateTemperature, resolveBounds } from "@/lib/cold-chain/thresholds";
import type { OpsColdChainAlert } from "@/lib/cold-chain/alert-labels";

export type { OpsColdChainAlert };
import type {
  ClientAccount,
  Courier,
  CourierStatus,
  DeliveryOrder,
  TemperatureStatus,
  TimelineEvent,
} from "@/lib/domain";

/**
 * بيانات لوحة العمليات من قاعدة البيانات.
 *
 * كانت اللوحة تعرض `lib/mock-data`: أسماء شركات مخترعة وأربعة عشر حدث تدقيق
 * مولّدة بـ index % 5. أي تسليم يُغلقه المندوب لم يكن يظهر هنا أبداً — آخر حلقة
 * في المسار كانت مقطوعة، بينما تبدو الشاشة حيّة.
 */

const ACTIVE_STATUSES = ["CREATED", "PENDING_APPROVAL", "ASSIGNED", "OUT_FOR_DELIVERY", "ARRIVED", "POSTPONED"] as const;

export type OpsAuditEvent = {
  id: string;
  orderCode: string;
  action: string;
  actor: string;
  reason: string | null;
  at: string;
};

export type OpsSnapshot = {
  couriers: Courier[];
  orders: DeliveryOrder[];
  clients: ClientAccount[];
  auditEvents: OpsAuditEvent[];
  coldChainAlerts: OpsColdChainAlert[];
};

/** رقم الجوال لا يخرج كاملاً إلى شاشة مشتركة؛ آخر أربعة تكفي للتمييز. */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length <= 4 ? digits : `••••${digits.slice(-4)}`;
}

function buildTimeline(order: {
  scheduledAt: Date;
  assignedAt: Date | null;
  outForDeliveryAt: Date | null;
  arrivedAt: Date | null;
  deliveredAt: Date | null;
}): TimelineEvent[] {
  return [
    { status: "CREATED", label: "تم إنشاء الطلب", at: order.scheduledAt.toISOString(), done: true },
    { status: "ASSIGNED", label: "تم تعيين المندوب", at: order.assignedAt?.toISOString() ?? null, done: Boolean(order.assignedAt) },
    { status: "OUT_FOR_DELIVERY", label: "خرج للتوصيل", at: order.outForDeliveryAt?.toISOString() ?? null, done: Boolean(order.outForDeliveryAt) },
    { status: "ARRIVED", label: "وصل للموقع", at: order.arrivedAt?.toISOString() ?? null, done: Boolean(order.arrivedAt) },
    { status: "DELIVERED", label: "تم التسليم", at: order.deliveredAt?.toISOString() ?? null, done: Boolean(order.deliveredAt) },
  ];
}

export type CourierRow = {
  id: string;
  employeeCode: string;
  displayName: string;
  phone: string;
  status: string;
  vehicleId: string | null;
  pings: { latitude: unknown; longitude: unknown; recordedAt: Date }[];
};

/**
 * مندوب بلا نبضة موقع يبقى بإحداثية غير رقمية عمداً، ولا يُرسم على الخريطة.
 * صفر,صفر إحداثية صالحة في خليج غينيا — أي أن الافتراضي "الآمن" يضع المندوب
 * على الشاشة في مكان لم يكن فيه قط.
 */
export function mapCourier(row: CourierRow): Courier {
  const ping = row.pings[0];
  return {
    id: row.id,
    employeeCode: row.employeeCode,
    displayName: row.displayName,
    phoneMasked: maskPhone(row.phone),
    status: row.status as CourierStatus,
    vehicleId: row.vehicleId ?? "",
    latitude: ping ? Number(ping.latitude) : Number.NaN,
    longitude: ping ? Number(ping.longitude) : Number.NaN,
    lastPingAt: ping ? ping.recordedAt.toISOString() : "",
  };
}

export async function loadOpsSnapshot(): Promise<OpsSnapshot> {
  const prisma = getPrisma();

  const [courierRows, orderRows, clientRows, auditRows, alertRows] = await Promise.all([
    prisma.courier.findMany({
      take: 60,
      orderBy: { employeeCode: "asc" },
      select: {
        id: true,
        employeeCode: true,
        displayName: true,
        phone: true,
        status: true,
        vehicleId: true,
        pings: {
          orderBy: { recordedAt: "desc" },
          take: 1,
          select: { latitude: true, longitude: true, recordedAt: true },
        },
      },
    }),
    prisma.deliveryOrder.findMany({
      where: { status: { in: [...ACTIVE_STATUSES] } },
      orderBy: { scheduledAt: "asc" },
      take: 120,
      select: {
        id: true,
        publicCode: true,
        reference: true,
        clientAccountId: true,
        customerId: true,
        courierId: true,
        vehicleId: true,
        status: true,
        pickupAddress: true,
        dropoffAddress: true,
        dropoffLatitude: true,
        dropoffLongitude: true,
        serviceType: true,
        temperatureTarget: true,
        etaMinutes: true,
        scheduledAt: true,
        assignedAt: true,
        outForDeliveryAt: true,
        arrivedAt: true,
        deliveredAt: true,
        isDelayed: true,
        requiresIntervention: true,
        vehicle: { select: { coldRangeMin: true, coldRangeMax: true } },
        temperatureReadings: {
          orderBy: { recordedAt: "desc" },
          take: 1,
          select: { celsius: true, recordedAt: true },
        },
      },
    }),
    prisma.clientAccount.findMany({
      take: 200,
      select: { id: true, companyName: true, contactName: true, sector: true },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        action: true,
        reason: true,
        createdAt: true,
        order: { select: { publicCode: true } },
        actor: { select: { name: true } },
      },
    }),
    // الإنذارات المفتوحة فقط: المغلقة تاريخ، والشاشة لقرار الآن.
    prisma.coldChainAlert.findMany({
      where: { resolvedAt: null },
      orderBy: [{ severity: "desc" }, { detectedAt: "desc" }],
      take: 40,
      select: {
        id: true,
        kind: true,
        severity: true,
        celsius: true,
        occurrences: true,
        detectedAt: true,
        note: true,
        order: { select: { publicCode: true } },
      },
    }),
  ]);

  const couriers: Courier[] = courierRows.map((row) => mapCourier(row));

  const now = new Date();
  const orders: DeliveryOrder[] = orderRows.map((row) => {
    const reading = row.temperatureReadings[0];
    // قراءة متقادمة تُصعَّد إلى تنبيه بدل أن تبقى خضراء على شاشة العمليات.
    const evaluation = evaluateTemperature({
      celsius: reading ? Number(reading.celsius) : null,
      recordedAt: reading?.recordedAt ?? null,
      bounds: resolveBounds({
        orderTarget: row.temperatureTarget,
        vehicleMin: row.vehicle ? Number(row.vehicle.coldRangeMin) : null,
        vehicleMax: row.vehicle ? Number(row.vehicle.coldRangeMax) : null,
      }),
      now,
    });
    return {
      id: row.id,
      publicCode: row.publicCode,
      reference: row.reference,
      clientAccountId: row.clientAccountId,
      customerId: row.customerId,
      courierId: row.courierId ?? "",
      vehicleId: row.vehicleId ?? "",
      status: toDomainStatus(row.status),
      pickupAddress: row.pickupAddress,
      dropoffAddress: row.dropoffAddress,
      dropoffLatitude: Number(row.dropoffLatitude),
      dropoffLongitude: Number(row.dropoffLongitude),
      serviceType: row.serviceType,
      temperatureTarget: row.temperatureTarget,
      etaMinutes: row.etaMinutes,
      scheduledAt: row.scheduledAt.toISOString(),
      isDelayed: row.isDelayed,
      requiresIntervention: row.requiresIntervention,
      currentTemperature: reading ? Number(reading.celsius) : undefined,
      temperatureStatus: evaluation.severity as TemperatureStatus,
      timeline: buildTimeline(row),
    };
  });

  const clients: ClientAccount[] = clientRows.map((row) => ({
    id: row.id,
    companyName: row.companyName,
    sector: row.sector,
    contactName: row.contactName,
  }));

  const auditEvents: OpsAuditEvent[] = auditRows.map((row) => ({
    id: row.id,
    orderCode: row.order?.publicCode ?? "—",
    action: row.action,
    actor: row.actor?.name ?? "نظام",
    reason: row.reason,
    at: row.createdAt.toISOString(),
  }));

  const coldChainAlerts: OpsColdChainAlert[] = alertRows.map((row) => ({
    id: row.id,
    orderCode: row.order?.publicCode ?? "—",
    kind: row.kind,
    severity: row.severity,
    celsius: row.celsius === null ? null : Number(row.celsius),
    occurrences: row.occurrences,
    detectedAt: row.detectedAt.toISOString(),
    note: row.note,
  }));

  return { couriers, orders, clients, auditEvents, coldChainAlerts };
}

/** أرقام البث الحي — استعلام عدّ فقط، فالقناة تُحدَّث كل عشر ثوانٍ. */
export async function loadOpsCounters(): Promise<{ activeOrders: number; onlineCouriers: number; delayed: number }> {
  const prisma = getPrisma();
  const [activeOrders, onlineCouriers, delayed] = await Promise.all([
    prisma.deliveryOrder.count({ where: { status: { in: [...ACTIVE_STATUSES] } } }),
    prisma.courier.count({ where: { status: { not: "OFFLINE" } } }),
    prisma.deliveryOrder.count({ where: { status: { in: [...ACTIVE_STATUSES] }, isDelayed: true } }),
  ]);
  return { activeOrders, onlineCouriers, delayed };
}
