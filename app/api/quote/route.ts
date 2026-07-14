import { NextResponse } from "next/server";
import { z } from "zod";
import { saveLead } from "@/lib/leads";

const schema = z.object({
  name: z.string().min(2),
  company: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  message: z.string().min(10),
});

export async function POST(request: Request) {
  const body = schema.safeParse(await request.json().catch(() => null));

  if (!body.success) {
    return NextResponse.json({ error: "Invalid quote request." }, { status: 422 });
  }

  try {
    await saveLead(body.data);
  } catch (error) {
    console.error("[quote] failed to persist lead", error);
    return NextResponse.json({ error: "Could not save the request." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: "Quote request received." }, { status: 201 });
}
