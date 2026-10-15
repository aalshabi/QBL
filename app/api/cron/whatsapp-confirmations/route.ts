import { NextRequest, NextResponse } from "next/server";
import { checkCronAuth, cronAuthFailure } from "@/lib/cron/auth";
import { evaluateWhatsAppDeadlines } from "@/lib/whatsapp/deadlines";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = checkCronAuth(request.headers);
  if (!auth.ok) {
    const failure = cronAuthFailure("whatsapp-confirmations", auth);
    return NextResponse.json(failure.body, { status: failure.status });
  }
  try {
    return NextResponse.json({ ok: true, ...(await evaluateWhatsAppDeadlines()) });
  } catch (error) {
    console.error("whatsapp_confirmation_deadline_failed", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ ok: false, error: "DEADLINE_EVALUATION_FAILED" }, { status: 500 });
  }
}
