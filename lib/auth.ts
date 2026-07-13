import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/security";

export type Role = "ADMIN" | "OPS_MANAGER" | "DISPATCHER" | "COURIER" | "CLIENT";

export type Session = { userId: string; role: Role };

export const SESSION_COOKIE = "qbl_session";
export const SESSION_MAX_AGE_SECONDS = 12 * 60 * 60;

const KNOWN_ROLES: readonly Role[] = ["ADMIN", "OPS_MANAGER", "DISPATCHER", "COURIER", "CLIENT"];

function isRole(value: string): value is Role {
  return (KNOWN_ROLES as readonly string[]).includes(value);
}

/**
 * الجلسة تُشتق حصراً من JWT موقّع (HS256) يُصدره /api/auth/login — لا دور افتراضي،
 * ولا ثقة بأي كوكي دور خام. توكن غائب/معدّل/منتهي ⇒ null (لا جلسة).
 */
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload || !isRole(payload.role)) return null;

  return { userId: payload.userId, role: payload.role };
}

export function assertRole(role: Role | null | undefined, allowed: Role[]) {
  if (!role || !allowed.includes(role)) {
    throw new Error("Forbidden");
  }
}
