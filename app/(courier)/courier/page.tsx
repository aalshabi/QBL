import { redirect } from "next/navigation";
import { CourierApp } from "@/components/courier/courier-app";
import { getSession } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import type { DeliveryOrder, OrderStatus, TimelineEvent } from "@/lib/domain";

function toDomainStatus(status: string): OrderStatus {
  switch (status) {
    case "PENDING_APPROVAL":
      return "CREATED";
    case "POSTPONED":
      return "ASSIGNED";
    case "RETURNED":
    case "CANCELLED":
      return "FAILED";
    default:
      return status as OrderStatus;
  }
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

export default async function CourierPage() {
  const session = await getSession();
  if (!session || session.role !== "COURIER") {
    redirect("/courier/login");
  }

  const prisma = getPrisma();
  const courier = await prisma.courier.findUnique({
    where: { userId: session.userId },
    select: { id: true },
  });
  if (!courier) {
    redirect("/courier/login");
  }

  const rows = await prisma.deliveryOrder.findMany({
    where: {
      courierId: courier.id,
      status: { in: ["ASSIGNED", "OUT_FOR_DELIVERY", "ARRIVED"] },
    },
    orderBy: { scheduledAt: "asc" },
    take: 8,
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
      temperatureReadings: {
        orderBy: { recordedAt: "desc" },
        take: 1,
        select: { celsius: true, status: true },
      },
    },
  });

  const orders: DeliveryOrder[] = rows.map((row) => ({
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
    currentTemperature: row.temperatureReadings[0] ? Number(row.temperatureReadings[0].celsius) : undefined,
    temperatureStatus: row.temperatureReadings[0]?.status ?? "NOT_AVAILABLE",
    timeline: buildTimeline(row),
  }));

  if (orders.length === 0) {
    return (
      <main className="grid min-h-screen place-items-center bg-muted/50 px-4 text-center">
        <p className="text-muted-foreground">لا توجد طلبات نشطة معيّنة لك حاليًا.</p>
      </main>
    );
  }

  return <CourierApp orders={orders} />;
}
