import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  courierId: z.string(),
  orderId: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  speedKph: z.number().optional(),
  battery: z.number().min(0).max(100).optional(),
});

export async function POST(request: Request) {
  const body = schema.safeParse(await request.json());

  if (!body.success) {
    return NextResponse.json({ error: "Invalid location payload." }, { status: 422 });
  }

  return NextResponse.json({
    ok: true,
    ping: {
      ...body.data,
      recordedAt: new Date().toISOString(),
    },
  });
}
