import { couriers, customers, deliveryOrders } from "@/lib/mock-data";
import { verifyTrackingToken } from "@/lib/security";
import type { TrackingSnapshot } from "@/lib/domain";

export async function getPublicTrackingSnapshot(token: string): Promise<TrackingSnapshot | null> {
  try {
    const { orderId } = await verifyTrackingToken(token);
    const order = deliveryOrders.find((item) => item.id === orderId);

    if (!order || order.status === "DELIVERED") {
      return null;
    }

    const courier = couriers.find((item) => item.id === order.courierId);
    const customer = customers.find((item) => item.id === order.customerId);

    if (!courier || !customer) {
      return null;
    }

    return {
      order: {
        id: order.id,
        publicCode: order.publicCode,
        reference: order.reference,
        status: order.status,
        dropoffAddress: order.dropoffAddress,
        etaMinutes: order.etaMinutes,
        temperatureTarget: order.temperatureTarget,
        currentTemperature: order.currentTemperature,
        temperatureStatus: order.temperatureStatus,
        timeline: order.timeline,
      },
      courier: {
        employeeCode: courier.employeeCode,
        displayName: courier.displayName,
        phoneMasked: courier.phoneMasked,
        latitude: courier.latitude,
        longitude: courier.longitude,
        lastPingAt: courier.lastPingAt,
      },
      customer: {
        name: customer.name,
        phoneMasked: customer.phoneMasked,
      },
      otp: {
        masked: "••••••",
        required: ["OUT_FOR_DELIVERY", "ARRIVED"].includes(order.status),
        maxAttempts: 5,
        remainingAttempts: 5,
      },
    };
  } catch {
    return null;
  }
}
