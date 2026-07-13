import { cookies } from "next/headers";

export type Role = "ADMIN" | "OPS_MANAGER" | "DISPATCHER" | "COURIER" | "CLIENT";

export type Session = { userId: string | null; role: Role };

const KNOWN_ROLES: readonly Role[] = ["ADMIN", "OPS_MANAGER", "DISPATCHER", "COURIER", "CLIENT"];

function isRole(value: string | undefined): value is Role {
  return value !== undefined && (KNOWN_ROLES as readonly string[]).includes(value);
}

/**
 * الدور يُشتق حصراً من كوكي جلسة يحمل دوراً معروفاً — لا دور افتراضي.
 * زائر بلا كوكي، أو بكوكي دور غير معروف ⇒ null (لا جلسة).
 */
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const role = cookieStore.get("qdl_role")?.value;

  if (!isRole(role)) {
    return null;
  }

  return {
    userId: cookieStore.get("qdl_user")?.value ?? null,
    role,
  };
}

export function assertRole(role: Role | null | undefined, allowed: Role[]) {
  if (!role || !allowed.includes(role)) {
    throw new Error("Forbidden");
  }
}
