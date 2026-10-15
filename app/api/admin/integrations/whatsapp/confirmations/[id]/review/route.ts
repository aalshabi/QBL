import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authorizeAdmin } from "@/lib/admin/guard";
import { reviewWhatsAppConfirmation } from "@/lib/whatsapp/ops-review";

const schema = z.object({
  decision: z.enum(["CONTACTED", "CONFIRMED_READY", "RESCHEDULED", "HOLD_REORDER", "PROCEED_WITH_REASON"]),
  reason: z.string().max(240).default(""),
});
const secureHeaders = { "Cache-Control": "no-store", "Content-Type": "application/json" };

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authorization = await authorizeAdmin();
  if (!authorization.ok) return authorization.response;
  if (request.headers.get("x-qbl-whatsapp-request") !== "ops-review-v1") return NextResponse.json({ ok: false, error: "REQUEST_MARKER_REQUIRED" }, { status: 403, headers: secureHeaders });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "INVALID_REQUEST" }, { status: 400, headers: secureHeaders });
  try {
    const { id } = await params;
    return NextResponse.json({ ok: true, ...(await reviewWhatsAppConfirmation({ confirmationId: id, actorId: authorization.session.userId, ...parsed.data })) }, { headers: secureHeaders });
  } catch (error) {
    const code = error instanceof Error ? error.message : "REVIEW_FAILED";
    return NextResponse.json({ ok: false, error: code }, { status: code === "CONFIRMATION_NOT_FOUND" ? 404 : 409, headers: secureHeaders });
  }
}
