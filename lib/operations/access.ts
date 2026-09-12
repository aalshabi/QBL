import type { Role } from "@/lib/auth";
export function canOperate(role: Role | null | undefined): boolean {
  return role === "ADMIN" || role === "OPS_MANAGER" || role === "DISPATCHER";
}
