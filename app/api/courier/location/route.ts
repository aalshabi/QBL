import { NextResponse } from "next/server";
import { z } from "zod";
import { assertRole, getSession } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

const schema = z.object({
  orderId: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  speedKph: z.number().min(0).max(300).optional(),
  heading: z.number().min(0).max(359).optional(),
  battery: z.number().min(0).max(100).optional(),
});

/**
 * Courier's own device reports its position. The courier is identified from
 * the signed session cookie, never from a client-supplied id, so a driver
 * can only ever write pings under their own account.
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
    select: { id: true },
  });
  if (!courier) {
    return NextResponse.json({ error: "COURIER_PROFILE_NOT_FOUND" }, { status: 404 });
  }

  const ping = await prisma.locationPing.create({
    data: {
      courierId: courier.id,
      orderId: body.data.orderId,
      latitude: body.data.latitude,
      longitude: body.data.longitude,
      speedKph: body.data.speedKph,
      heading: body.data.heading,
      battery: body.data.battery,
    },
    select: { id: true, recordedAt: true },
  });

  return NextResponse.json({ ok: true, ping });
}
