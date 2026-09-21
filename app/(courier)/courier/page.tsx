import { redirect } from "next/navigation";
import { CourierApp } from "@/components/courier/courier-app";
import { getSession } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { toDomainStatus } from "@/lib/orders/transitions";
import type { CourierOrderView } from "@/lib/orders/courier-view";
import { evaluateTemperature, resolveBounds } from "@/lib/cold-chain/thresholds";

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
      vehicle: { select: { coldRangeMin: true, coldRangeMax: true } },
      temperatureReadings: {
        orderBy: { recordedAt: "desc" },
        take: 1,
        select: { celsius: true, recordedAt: true },
      },
    },
  });

  const now = new Date();
  const orders: CourierOrderView[] = rows.map((row) => {
    const reading = row.temperatureReadings[0];
    // التقييم على الخادم: الشاشة لا تقرر وحدها أن قراءة عمرها ساعة "سليمة".
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
        ? { celsius: Number(reading.celsius), state: evaluation.state, ageMinutes: evaluation.ageMinutes }
        : null,
    };
  });

  return <CourierApp orders={orders} courierName={courier.displayName} />;
}
