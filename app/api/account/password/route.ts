import { NextResponse } from "next/server";
import { z } from "zod";
import { changeOwnPassword } from "@/lib/account/change-password";
import { consumePasswordChangeAttempt } from "@/lib/account/password-change-rate-limit";
import { MAX_PASSWORD_LENGTH } from "@/lib/account/password-policy";
import { ACCOUNT_REQUEST_MARKER } from "@/lib/account/request-marker";
import { getSession } from "@/lib/auth";
import { readBoundedRequestJson, secureJsonHeaders } from "@/lib/logestechs/request-security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z.object({
  currentPassword: z.string().min(1).max(MAX_PASSWORD_LENGTH),
  newPassword: z.string().min(1).max(MAX_PASSWORD_LENGTH),
});

function json(body: unknown, status = 200, extra: Record<string, string> = {}) {
  return NextResponse.json(body, { status, headers: { ...secureJsonHeaders, "Cache-Control": "no-store", ...extra } });
}

function sameOriginJson(request: Request): string | null {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("application/json")) return "UNSUPPORTED_MEDIA_TYPE";
  if (request.headers.get(ACCOUNT_REQUEST_MARKER.name) !== ACCOUNT_REQUEST_MARKER.value) return "REQUEST_MARKER_REQUIRED";
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return "CROSS_ORIGIN_REQUEST";
  if (request.headers.get("sec-fetch-site") === "cross-site") return "CROSS_SITE_REQUEST";
  return null;
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return json({ ok: false, error: "UNAUTHORIZED" }, 401);

  const rejected = sameOriginJson(request);
  if (rejected) return json({ ok: false, error: rejected }, rejected === "UNSUPPORTED_MEDIA_TYPE" ? 415 : 403);

  try {
    // عدّاد مشترك في Postgres: خمس محاولات في الدقيقة لكل حساب عبر جميع نسخ Vercel.
    const rateLimit = await consumePasswordChangeAttempt(session.userId);
    if (!rateLimit.ok) {
      return json({ ok: false, error: "RATE_LIMITED" }, 429, {
        "Retry-After": String(rateLimit.retryAfterSeconds),
      });
    }

    let raw: unknown;
    try {
      raw = await readBoundedRequestJson(request);
    } catch {
      return json({ ok: false, error: "INVALID_JSON" }, 400);
    }
    const body = schema.safeParse(raw);
    if (!body.success) return json({ ok: false, error: "INVALID_PAYLOAD" }, 422);

    const result = await changeOwnPassword({ userId: session.userId, ...body.data });
    if (!result.ok) {
      const status = result.error === "INVALID_CURRENT_PASSWORD" ? 403 : 422;
      return json({ ok: false, error: result.error, message: result.message }, status);
    }

    console.info("account_password_changed");
    return json({ ok: true });
  } catch {
    console.warn("account_password_change_failed");
    return json({ ok: false, error: "PASSWORD_CHANGE_FAILED" }, 503);
  }
}
