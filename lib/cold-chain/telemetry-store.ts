import "server-only";

import { getPrisma } from "@/lib/prisma";
import { classifyReading, resolveBounds } from "@/lib/cold-chain/thresholds";
import type { NormalizedColdChainTelemetry } from "@/lib/cold-chain/telemetry";
import { safeTelemetryMetadata, telemetryEventId } from "@/lib/cold-chain/telemetry";

export type ColdChainTelemetryOutcome =
  | "RECORDED"
  | "RECORDED_WITH_LOCATION"
  | "IGNORED_VEHICLE_NOT_FOUND"
  | "IGNORED_ORDER_NOT_FOUND"
  | "DUPLICATE";

export type ColdChainTelemetryResult = {
  accepted: true;
  duplicate: boolean;
  outcome: ColdChainTelemetryOutcome;
  eventId: string;
};

function isUniqueConstraintError(error: unknown): boolean {
  return Boolean(
    error && typeof error === "object" && "code" in error && (error as { code?: unknown }).code === "P2002",
  );
}

export async function processColdChainTelemetry(
  event: NormalizedColdChainTelemetry,
): Promise<ColdChainTelemetryResult> {
  if (!process.env.DATABASE_URL?.trim()) throw new Error("DATABASE_NOT_CONFIGURED");

  const prisma = getPrisma();
  const eventId = telemetryEventId(event);
  const baseMetadata = safeTelemetryMetadata(event);

  try {
    return await prisma.$transaction(async (tx) => {
      await tx.auditLog.create({
        data: {
          id: eventId,
          action: "TEMPERATURE_READING",
          reason: "Cold-chain telemetry received",
          metadata: { ...baseMetadata, outcome: "RECEIVED" },
        },
      });

      const vehicle = await tx.vehicle.findFirst({
        where: event.vehicleId ? { id: event.vehicleId } : { plateNumber: event.vehiclePlate! },
        select: {
          id: true,
          coldRangeMin: true,
          coldRangeMax: true,
          courier: { select: { id: true } },
        },
      });

      if (!vehicle) {
        const outcome = "IGNORED_VEHICLE_NOT_FOUND" as const;
        await tx.auditLog.update({
          where: { id: eventId },
          data: { reason: "Cold-chain telemetry ignored: vehicle not found", metadata: { ...baseMetadata, outcome } },
        });
        return { accepted: true, duplicate: false, outcome, eventId };
      }

      let orderId: string | null = null;
      let orderTarget: string | null = null;
      if (event.orderPublicCode || event.orderReference) {
        const order = await tx.deliveryOrder.findFirst({
          where: {
            OR: [
              event.orderPublicCode ? { publicCode: event.orderPublicCode } : undefined,
              event.orderReference ? { reference: event.orderReference } : undefined,
            ].filter(Boolean) as Array<{ publicCode: string } | { reference: string }>,
          },
          select: { id: true, temperatureTarget: true },
        });

        if (!order) {
          const outcome = "IGNORED_ORDER_NOT_FOUND" as const;
          await tx.auditLog.update({
            where: { id: eventId },
            data: {
              reason: "Cold-chain telemetry ignored: order not found",
              metadata: { ...baseMetadata, outcome, vehicleId: vehicle.id },
            },
          });
          return { accepted: true, duplicate: false, outcome, eventId };
        }
        orderId = order.id;
        orderTarget = order.temperatureTarget;
      }

      // نطاق الشحنة يسبق نطاق المركبة: الفان الواحد يحمل مجمداً وطازجاً معاً.
      const bounds = resolveBounds({
        orderTarget,
        vehicleMin: Number(vehicle.coldRangeMin),
        vehicleMax: Number(vehicle.coldRangeMax),
      });
      const status = classifyReading(event.celsius, bounds);

      await tx.temperatureReading.create({
        data: {
          vehicleId: vehicle.id,
          orderId,
          celsius: event.celsius,
          status,
          sensorId: event.sensorId,
          recordedAt: event.recordedAt,
          receivedAt: new Date(),
        },
      });

      let locationRecorded = false;
      if (event.hasLocation && vehicle.courier) {
        await tx.locationPing.create({
          data: {
            courierId: vehicle.courier.id,
            orderId,
            latitude: event.latitude!,
            longitude: event.longitude!,
            speedKph: event.speedKph ?? undefined,
            heading: event.heading ?? undefined,
            recordedAt: event.recordedAt,
          },
        });
        locationRecorded = true;
      }

      const outcome = locationRecorded ? ("RECORDED_WITH_LOCATION" as const) : ("RECORDED" as const);
      await tx.auditLog.update({
        where: { id: eventId },
        data: {
          orderId,
          reason: "Cold-chain telemetry recorded",
          metadata: { ...baseMetadata, outcome, vehicleId: vehicle.id, temperatureStatus: status },
        },
      });

      return { accepted: true, duplicate: false, outcome, eventId };
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { accepted: true, duplicate: true, outcome: "DUPLICATE", eventId };
    }
    throw error;
  }
}
