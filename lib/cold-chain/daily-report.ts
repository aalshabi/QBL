import "server-only";

import { getPrisma } from "@/lib/prisma";

export type DailyTemperatureReportRow = {
  orderId: string;
  orderPublicCode: string;
  orderReference: string;
  vehiclePlate: string;
  minCelsius: number;
  maxCelsius: number;
  avgCelsius: number;
  readingCount: number;
  outOfRangeCount: number;
  worstStatus: "NORMAL" | "WARNING" | "CRITICAL";
};

export type DailyTemperatureReport = {
  date: string; // YYYY-MM-DD
  generatedAt: string;
  rows: DailyTemperatureReportRow[];
};

const STATUS_RANK: Record<string, number> = { NORMAL: 0, WARNING: 1, CRITICAL: 2, NOT_AVAILABLE: 0 };

function dayRange(dateKey: string): { start: Date; end: Date } {
  const start = new Date(`${dateKey}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime())) throw new TypeError("INVALID_DATE");
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

export function yesterdayKey(now = new Date()): string {
  const d = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

/**
 * Aggregates real TemperatureReading rows per shipment for one calendar day
 * (UTC). Returns an empty rows array — never fabricated data — when no
 * readings exist yet, e.g. before a real refrigeration/telemetry provider is
 * connected to POST /api/webhooks/cold-chain-telemetry.
 */
export async function buildDailyTemperatureReport(dateKey: string): Promise<DailyTemperatureReport> {
  const { start, end } = dayRange(dateKey);
  const prisma = getPrisma();

  const readings = await prisma.temperatureReading.findMany({
    where: { orderId: { not: null }, recordedAt: { gte: start, lt: end } },
    select: {
      celsius: true,
      status: true,
      order: { select: { id: true, publicCode: true, reference: true } },
      vehicle: { select: { plateNumber: true } },
    },
    orderBy: { recordedAt: "asc" },
  });

  const byOrder = new Map<string, DailyTemperatureReportRow>();

  for (const reading of readings) {
    if (!reading.order) continue;
    const celsius = Number(reading.celsius);
    const existing = byOrder.get(reading.order.id);

    if (!existing) {
      byOrder.set(reading.order.id, {
        orderId: reading.order.id,
        orderPublicCode: reading.order.publicCode,
        orderReference: reading.order.reference,
        vehiclePlate: reading.vehicle.plateNumber,
        minCelsius: celsius,
        maxCelsius: celsius,
        avgCelsius: celsius,
        readingCount: 1,
        outOfRangeCount: reading.status === "NORMAL" ? 0 : 1,
        worstStatus: reading.status === "CRITICAL" ? "CRITICAL" : reading.status === "WARNING" ? "WARNING" : "NORMAL",
      });
      continue;
    }

    const totalBefore = existing.avgCelsius * existing.readingCount;
    existing.readingCount += 1;
    existing.minCelsius = Math.min(existing.minCelsius, celsius);
    existing.maxCelsius = Math.max(existing.maxCelsius, celsius);
    existing.avgCelsius = Math.round(((totalBefore + celsius) / existing.readingCount) * 100) / 100;
    if (reading.status !== "NORMAL") existing.outOfRangeCount += 1;
    if (STATUS_RANK[reading.status] > STATUS_RANK[existing.worstStatus]) {
      existing.worstStatus = reading.status === "CRITICAL" ? "CRITICAL" : "WARNING";
    }
  }

  return {
    date: dateKey,
    generatedAt: new Date().toISOString(),
    rows: Array.from(byOrder.values()).sort((a, b) => a.orderPublicCode.localeCompare(b.orderPublicCode)),
  };
}

export async function recordDailyTemperatureReport(report: DailyTemperatureReport): Promise<void> {
  const prisma = getPrisma();
  await prisma.notificationLog.create({
    data: {
      channel: "INTERNAL",
      recipient: "ops-team",
      templateKey: "daily_temperature_report",
      payload: report,
      status: "SENT",
      sentAt: new Date(),
    },
  });
}
