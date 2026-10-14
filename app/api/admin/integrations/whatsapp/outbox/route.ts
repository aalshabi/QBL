import { NextResponse } from "next/server";
import { authorizeAdmin } from "@/lib/admin/guard";
import { processWhatsAppOutbox } from "@/lib/whatsapp/outbox";

export async function POST() {
  const authorization = await authorizeAdmin();
  if (!authorization.ok) return authorization.response;
  try { return NextResponse.json({ ok: true, results: await processWhatsAppOutbox() }); }
  catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "OUTBOX_FAILED" }, { status: 503 }); }
}
