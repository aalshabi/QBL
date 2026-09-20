import { getPrisma } from "@/lib/prisma";
import { verifyTrackingToken } from "@/lib/security";
import type { OrderStatus, TrackingSnapshot } from "@/lib/domain";

const maskPhone = (phone: string) => `05******${phone.slice(-2)}`;

/**
 * DB status set is wider than the customer-facing domain status set.
 * PENDING_APPROVAL and POSTPONED still map to an in-progress state so the
 * customer keeps seeing live tracking; DELIVERED/RETURNED/CANCELLED are
 * treated as closed (tracking link stops resolving), matching the previous
 * mock behavior of hiding DELIVERED orders.
 */
function toDomainStatus(status: string): OrderStatus | null {
  switch (status) {
    case "CREATED":
    case "PENDING_APPROVAL":
      return "CREATED";
    case "ASSIGNED":
    case "POSTPONED":
      return "ASSIGNED";
    case "OUT_FOR_DELIVERY":
      return "OUT_FOR_DELIVERY";
    case "ARRIVED":
      return "ARRIVED";
    case "FAILED":
      return "FAILED";
    case "DELIVERED":
    case "RETURNED":
    case "CANCELLED":
      return null;
    default:
      return null;
  }
}

export async function getPublicTrackingSnapshot(token: string): Promise<TrackingSnapshot | null> {
  try {
    const { orderId } = await verifyTrackingToken(token);
    const prisma = getPrisma();

    const order = await prisma.deliveryOrder.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        publicCode: true,
        reference: true,
        status: true,
        dropoffAddress: true,
        temperatureTarget: true,
        etaMinutes: true,
        scheduledAt: true,
        assignedAt: true,
        outForDeliveryAt: true,
        arrivedAt: true,
        deliveredAt: true,
        failedAt: true,
        courier: { select: { employeeCode: true, displayName: true, phone: true } },
        customer: { select: { name: true, phone: true } },
        courierId: true,
        vehicleId: true,
      },
    });

    if (!order || !order.courier || !order.courierId) return null;

    const domainStatus = toDomainStatus(order.status);
    if (!domainStatus) return null;

    const [latestPing, latestOrderReading, latestVehicleReading, activeOtp] = await Promise.all([
      prisma.locationPing.findFirst({
        where: { courierId: order.courierId },
        orderBy: { recordedAt: "desc" },
        select: { latitude: true, longitude: true, recordedAt: true },
      }),
      prisma.temperatureReading.findFirst({
        where: { orderId: order.id },
        orderBy: { recordedAt: "desc" },
        select: { celsius: true, status: true },
      }),
      order.vehicleId
        ? prisma.temperatureReading.findFirst({
            where: { vehicleId: order.vehicleId, orderId: null },
            orderBy: { recordedAt: "desc" },
            select: { celsius: true, status: true },
          })
        : Promise.resolve(null),
      prisma.otpCode.findFirst({
        where: { orderId: order.id, verifiedAt: null, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: "desc" },
        select: { attempts: true, maxAttempts: true },
      }),
    ]);

    const temperatureReading = latestOrderReading ?? latestVehicleReading;

    return {
      order: {
        id: order.id,
        publicCode: order.publicCode,
        reference: order.reference,
        status: domainStatus,
        dropoffAddress: order.dropoffAddress,
        etaMinutes: order.etaMinutes,
        temperatureTarget: order.temperatureTarget,
        currentTemperature: temperatureReading ? Number(temperatureReading.celsius) : undefined,
        temperatureStatus: temperatureReading?.status ?? "NOT_AVAILABLE",
        timeline: [
          { status: "CREATED", label: "تم إنشاء الطلب", at: order.scheduledAt.toISOString(), done: true },
          {
            status: "ASSIGNED",
            label: "تم تعيين المندوب",
            at: order.assignedAt?.toISOString() ?? null,
            done: Boolean(order.assignedAt),
          },
          {
            status: "OUT_FOR_DELIVERY",
            label: "خرج للتوصيل",
            at: order.outForDeliveryAt?.toISOString() ?? null,
            done: Boolean(order.outForDeliveryAt),
          },
          {
            status: "ARRIVED",
            label: "وصل للموقع",
            at: order.arrivedAt?.toISOString() ?? null,
            done: Boolean(order.arrivedAt),
          },
          {
            status: "DELIVERED",
            label: "تم التسليم",
            at: order.deliveredAt?.toISOString() ?? null,
            done: Boolean(order.deliveredAt),
          },
        ],
      },
      courier: {
        employeeCode: order.courier.employeeCode,
        displayName: order.courier.displayName,
        phoneMasked: maskPhone(order.courier.phone),
        latitude: latestPing ? Number(latestPing.latitude) : 0,
        longitude: latestPing ? Number(latestPing.longitude) : 0,
        lastPingAt: latestPing?.recordedAt.toISOString() ?? order.scheduledAt.toISOString(),
      },
      customer: {
        name: order.customer.name,
        phoneMasked: maskPhone(order.customer.phone),
      },
      otp: {
        masked: "••••••",
        required: ["OUT_FOR_DELIVERY", "ARRIVED"].includes(order.status),
        maxAttempts: activeOtp?.maxAttempts ?? 5,
        remainingAttempts: activeOtp ? Math.max(0, activeOtp.maxAttempts - activeOtp.attempts) : 5,
      },
    };
  } catch {
    return null;
  }
}
