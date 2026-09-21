import { redirect } from "next/navigation";
import { CourierApp } from "@/components/courier/courier-app";
import { getSession } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { toDomainStatus } from "@/lib/orders/transitions";
import type { CourierOrderView } from "@/lib/orders/courier-view";
import type { TemperatureStatus } from "@/lib/domain";

export const dynamic = "force-dynamic";

export default async function CourierPage() {
  const session = await getSession();
  if (!session || session.role !== "COURIER") {
    redirect("/courier/login");
  }

  const prisma = getPrisma();
  const courier = await prisma.courier.findUnique({
    where: { userId: session.userId },
    select: { id: true, displayName: true },
  });
  if (!courier) {
    redirect("/courier/login");
  }

  const rows = await prisma.deliveryOrder.findMany({
    where: { courierId: courier.id, status: { in: ["ASSIGNED", "OUT_FOR_DELIVERY", "ARRIVED", "POSTPONED"] } },
    orderBy: { scheduledAt: "asc" },
    take: 12,
    select: {
      id: true,
      publicCode: true,
      status: true,
      dropoffAddress: true,
      dropoffLatitude: true,
      dropoffLongitude: true,
      serviceType: true,
      temperatureTarget: true,
      scheduledAt: true,
      isDelayed: true,
      customer: { select: { name: true, phone: true } },
      temperatureReadings: {
        orderBy: { recordedAt: "desc" },
        take: 1,
        select: { celsius: true, status: true, recordedAt: true },
      },
    },
  });

  const orders: CourierOrderView[] = rows.map((row) => {
    const reading = row.temperatureReadings[0];
    return {
      id: row.id,
      publicCode: row.publicCode,
      status: toDomainStatus(row.status),
      dropoffAddress: row.dropoffAddress,
      dropoffLatitude: Number(row.dropoffLatitude),
      dropoffLongitude: Number(row.dropoffLongitude),
      customerName: row.customer.name,
      customerPhone: row.customer.phone,
      serviceType: row.serviceType,
      temperatureTarget: row.temperatureTarget,
      scheduledAt: row.scheduledAt.toISOString(),
      isDelayed: row.isDelayed,
      temperature: reading
        ? {
            celsius: Number(reading.celsius),
            status: reading.status as TemperatureStatus,
            recordedAt: reading.recordedAt.toISOString(),
          }
        : null,
    };
  });

  return <CourierApp orders={orders} courierName={courier.displayName} />;
}
