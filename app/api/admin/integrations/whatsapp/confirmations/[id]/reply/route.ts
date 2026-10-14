import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizeAdmin } from "@/lib/admin/guard";
import { readBoundedRequestJson, secureJsonHeaders } from "@/lib/logestechs/request-security";
import { queueManualReply } from "@/lib/whatsapp/manual-reply";

const schema = z.object({ body: z.string().trim().min(1).max(800) });

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const authorization = await authorizeAdmin();
  if (!authorization.ok) return authorization.response;
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return NextResponse.json({ ok: false, error: "UNSUPPORTED_MEDIA_TYPE" }, { status: 415, headers: secureJsonHeaders });
  if (request.headers.get("x-qbl-whatsapp-request") !== "manual-reply-v1") return NextResponse.json({ ok: false, error: "REQUEST_MARKER_REQUIRED" }, { status: 403, headers: secureJsonHeaders });
  const origin = request.headers.get("origin");
  if ((origin && origin !== new URL(request.url).origin) || request.headers.get("sec-fetch-site") === "cross-site") return NextResponse.json({ ok: false, error: "CROSS_ORIGIN_REQUEST" }, { status: 403, headers: secureJsonHeaders });
  let raw: unknown;
  try { raw = await readBoundedRequestJson(request); } catch { return NextResponse.json({ ok: false, error: "INVALID_JSON" }, { status: 400, headers: secureJsonHeaders }); }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "INVALID_PAYLOAD" }, { status: 422, headers: secureJsonHeaders });
  try {
    const { id } = await context.params;
    return NextResponse.json({ ok: true, ...(await queueManualReply({ confirmationId: id, actorId: authorization.session.userId, body: parsed.data.body })) }, { headers: secureJsonHeaders });
  } catch (error) {
    const code = error instanceof Error ? error.message : "MANUAL_REPLY_FAILED";
    const status = ["CONFIRMATION_NOT_FOUND"].includes(code) ? 404 : ["CUSTOMER_OPTED_OUT", "NO_CUSTOMER_SERVICE_WINDOW", "CUSTOMER_SERVICE_WINDOW_CLOSED"].includes(code) ? 409 : 503;
    return NextResponse.json({ ok: false, error: code }, { status, headers: secureJsonHeaders });
  }
}
