import { cookies } from "next/headers";

export type Role = "ADMIN" | "OPS_MANAGER" | "DISPATCHER" | "COURIER" | "CLIENT";

export async function getSession() {
  const cookieStore = await cookies();
  const role = cookieStore.get("qdl_role")?.value as Role | undefined;

  return {
    userId: cookieStore.get("qdl_user")?.value ?? "dev-ops-user",
    role: role ?? "OPS_MANAGER",
  };
}

export function assertRole(role: Role, allowed: Role[]) {
  if (!allowed.includes(role)) {
    throw new Error("Forbidden");
  }
}
