import "server-only";

import { getPrisma } from "@/lib/prisma";

const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 5;

export type PasswordChangeRateLimit =
  | { ok: true }
  | { ok: false; retryAfterSeconds: number };

/**
 * Atomically consumes one password-change attempt in Postgres. Unlike an
 * in-memory map, this counter is shared by every Vercel function instance.
 */
export async function consumePasswordChangeAttempt(
  userId: string,
  now = new Date(),
): Promise<PasswordChangeRateLimit> {
  const nextReset = new Date(now.getTime() + WINDOW_MS);
  const [row] = await getPrisma().$queryRaw<Array<{ attempts: number; resetAt: Date }>>`
    INSERT INTO "PasswordChangeRateLimit" ("userId", "attempts", "resetAt", "updatedAt")
    VALUES (${userId}, 1, ${nextReset}, ${now})
    ON CONFLICT ("userId") DO UPDATE SET
      "attempts" = CASE
        WHEN "PasswordChangeRateLimit"."resetAt" <= ${now} THEN 1
        ELSE "PasswordChangeRateLimit"."attempts" + 1
      END,
      "resetAt" = CASE
        WHEN "PasswordChangeRateLimit"."resetAt" <= ${now} THEN ${nextReset}
        ELSE "PasswordChangeRateLimit"."resetAt"
      END,
      "updatedAt" = ${now}
    RETURNING "attempts", "resetAt"
  `;

  if (!row || row.attempts > MAX_ATTEMPTS) {
    const resetAt = row?.resetAt ?? nextReset;
    return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((resetAt.getTime() - now.getTime()) / 1_000)) };
  }
  return { ok: true };
}
