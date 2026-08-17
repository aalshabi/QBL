// التحقق من بيانات الاعتماد لمسار الدخول من قاعدة البيانات فقط.

import { getPrisma } from "@/lib/prisma";
import { compareOtp } from "@/lib/security";
import type { Role } from "@/lib/auth";

export type AuthenticatedUser = { userId: string; name: string; role: Role };

/** عند تعدد الأدوار يُعتمد الأعلى صلاحية. */
const ROLE_PRIORITY: readonly Role[] = ["ADMIN", "OPS_MANAGER", "DISPATCHER", "COURIER", "CLIENT"];

function primaryRole(roles: string[]): Role | null {
  return ROLE_PRIORITY.find((role) => roles.includes(role)) ?? null;
}

async function verifyAgainstDatabase(email: string, password: string): Promise<AuthenticatedUser | null> {
  const user = await getPrisma().user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      status: true,
      passwordHash: true,
      roles: { select: { role: { select: { name: true } } } },
    },
  });

  if (!user || user.status !== "ACTIVE") return null;
  if (!(await compareOtp(password, user.passwordHash))) return null;

  const role = primaryRole(user.roles.map((entry) => entry.role.name));
  return role ? { userId: user.id, name: user.name, role } : null;
}

/** null عند غياب قاعدة البيانات أو فشل التحقق — لا توجد بيانات دخول احتياطية. */
export async function verifyCredentials(email: string, password: string): Promise<AuthenticatedUser | null> {
  if (!process.env.DATABASE_URL) return null;
  return verifyAgainstDatabase(email, password);
}
