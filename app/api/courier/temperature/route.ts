import { NextResponse } from "next/server";
import { z } from "zod";
import { assertRole, getSession } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { classifyReading, evaluateTemperature, resolveBounds } from "@/lib/cold-chain/thresholds";
import { applyReadingToAlerts } from "@/lib/cold-chain/alerts";

const schema = z.object({
  orderId: z.string().optional(),
  celsius: z.number().min(-40).max(40),
});

const MANUAL_SENSOR_ID = "manual-driver-app";

/**
 * Manual temperature reading logged by the courier from inside the vehicle
 * cabin, via the courier PWA. This is the interim data source until a real
 * in-vehicle sensor/telematics provider is contracted and wired to
 * POST /api/webhooks/cold-chain-telemetry — both paths write to the same
 * TemperatureReading table, so the tracking page and daily report work
 * identically regardless of which source produced the reading.
 */
export async function POST(request: Request) {
  const session = await getSession();
  try {
    assertRole(session?.role, ["COURIER"]);
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = schema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 422 });
  }

  const prisma = getPrisma();
  const courier = await prisma.courier.findUnique({
    where: { userId: session!.userId },
    select: { vehicleId: true },
  });
  if (!courier?.vehicleId) {
    return NextResponse.json({ error: "NO_VEHICLE_ASSIGNED" }, { status: 404 });
  }

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: courier.vehicleId },
    select: { coldRangeMin: true, coldRangeMax: true },
  });
  if (!vehicle) {
    return NextResponse.json({ error: "VEHICLE_NOT_FOUND" }, { status: 404 });
  }

  // متطلب الشحنة يسبق نطاق المركبة: قراءة +4 سليمة لشحنة طازجة وخرق لشحنة مجمدة.
  const order = body.data.orderId
    ? await prisma.deliveryOrder.findUnique({
        where: { id: body.data.orderId },
        select: { temperatureTarget: true },
      })
    : null;

  const bounds = resolveBounds({
    orderTarget: order?.temperatureTarget,
    vehicleMin: Number(vehicle.coldRangeMin),
    vehicleMax: Number(vehicle.coldRangeMax),
  });
  const status = classifyReading(body.data.celsius, bounds);

  const reading = await prisma.temperatureReading.create({
    data: {
      vehicleId: courier.vehicleId,
      orderId: body.data.orderId,
      celsius: body.data.celsius,
      status,
      sensorId: MANUAL_SENSOR_ID,
      // القراءة اليدوية تُقاس وتُستقبل في اللحظة نفسها؛ التساوي هنا معلومة لا حشو.
      receivedAt: new Date(),
    },
    select: { id: true, status: true, recordedAt: true },
  });

  // القراءة اليدوية تمر بنفس محرك الإنذارات: مصدر القراءة لا يغيّر واجبها.
  await applyReadingToAlerts({
    prisma,
    orderId: body.data.orderId ?? null,
    vehicleId: courier.vehicleId,
    evaluation: evaluateTemperature({
      celsius: body.data.celsius,
      recordedAt: reading.recordedAt,
      bounds,
    }),
    celsius: body.data.celsius,
    readingAt: reading.recordedAt,
  }).catch(() => undefined);

  return NextResponse.json({ ok: true, reading });
}
