import { NextRequest, NextResponse } from "next/server";
import { assertWebhookConfigured } from "@/lib/whatsapp/config";
import { DIALOG_WEBHOOK_HEADER, META_SIGNATURE_HEADER, verifyMetaSignature, verifySharedSecret } from "@/lib/whatsapp/security";
import { ingestWhatsAppWebhook } from "@/lib/whatsapp/webhook";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const headers = { "Cache-Control": "no-store", "Content-Type": "application/json", Vary: `${META_SIGNATURE_HEADER}, ${DIALOG_WEBHOOK_HEADER}` };

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get("hub.mode");
  const token = request.nextUrl.searchParams.get("hub.verify_token");
  const challenge = request.nextUrl.searchParams.get("hub.challenge");
  try {
    const config = assertWebhookConfigured();
    if (config.provider !== "meta") return NextResponse.json({ ok: false, error: "VERIFICATION_NOT_USED_BY_PROVIDER" }, { status: 405, headers });
    if (mode === "subscribe" && verifySharedSecret(token, config.verifyToken) && challenge) return new NextResponse(challenge, { status: 200, headers: { "Cache-Control": "no-store", "Content-Type": "text/plain" } });
  } catch {
    return NextResponse.json({ ok: false, error: "WEBHOOK_NOT_CONFIGURED" }, { status: 503, headers });
  }
  return NextResponse.json({ ok: false, error: "VERIFICATION_FAILED" }, { status: 403, headers });
}

export async function POST(request: NextRequest) {
  let config;
  try { config = assertWebhookConfigured(); } catch { return NextResponse.json({ ok: false, error: "WEBHOOK_NOT_CONFIGURED" }, { status: 503, headers }); }
  const rawBody = Buffer.from(await request.arrayBuffer());
  if (rawBody.length > 1024 * 1024) return NextResponse.json({ ok: false, error: "PAYLOAD_TOO_LARGE" }, { status: 413, headers });
  const authenticated = config.provider === "360dialog"
    ? verifySharedSecret(request.headers.get(DIALOG_WEBHOOK_HEADER), config.dialogWebhookSecret)
    : verifyMetaSignature(rawBody, request.headers.get(META_SIGNATURE_HEADER), config.appSecret);
  if (!authenticated) return NextResponse.json({ ok: false, error: "INVALID_SIGNATURE" }, { status: 401, headers });
  let payload: unknown;
  try { payload = JSON.parse(rawBody.toString("utf8")); } catch { return NextResponse.json({ ok: false, error: "INVALID_JSON" }, { status: 400, headers }); }
  try {
    const result = await ingestWhatsAppWebhook(payload, rawBody);
    return NextResponse.json({ ok: true, ...result }, { status: 200, headers });
  } catch {
    return NextResponse.json({ ok: false, error: "STORE_FAILED", retryable: true }, { status: 503, headers });
  }
}
