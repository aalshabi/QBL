import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2),
  company: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  message: z.string().min(10),
});

export async function POST(request: Request) {
  const body = schema.safeParse(await request.json());

  if (!body.success) {
    return NextResponse.json({ error: "Invalid quote request." }, { status: 422 });
  }

  return NextResponse.json({
    ok: true,
    leadId: `lead-${Date.now()}`,
    message: "Quote request accepted by mock adapter.",
  });
}
