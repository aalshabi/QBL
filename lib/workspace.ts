import type { Role } from "@/lib/auth";

/**
 * Single source of truth for where a signed-in user belongs. Imported by both
 * the client login screen and the server /team entry so the two never diverge.
 *
 * DISPATCHER goes to /ops, not /admin: the admin guard (lib/admin/guard.ts)
 * only admits ADMIN and OPS_MANAGER, so routing a dispatcher to /admin bounced
 * them straight back out. The ops guard is the one that admits DISPATCHER.
 * CLIENT is a customer, not an employee, so it stays on the public site.
 *
 * This is routing only — every workspace keeps enforcing its own access control
 * server-side; nothing here grants access.
 */
export const EMPLOYEE_ROLES: readonly Role[] = ["ADMIN", "OPS_MANAGER", "DISPATCHER", "COURIER"];

export function isEmployeeRole(role: string): boolean {
  return (EMPLOYEE_ROLES as readonly string[]).includes(role);
}

export function employeeHome(role: string): string {
  switch (role) {
    case "ADMIN":
    case "OPS_MANAGER":
      return "/admin";
    case "DISPATCHER":
      return "/ops";
    case "COURIER":
      return "/courier";
    default:
      return "/";
  }
}
