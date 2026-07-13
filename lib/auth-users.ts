// التحقق من بيانات الاعتماد لمسار الدخول — Prisma عند توفر قاعدة البيانات،
// وإلا قائمة تطوير مطابقة لبذور prisma/seed.ts (نفس منطق التبديل في lib/admin/data.ts).

import { getPrisma } from "@/lib/prisma";
import { compareOtp } from "@/lib/security";
import type { Role } from "@/lib/auth";

export type AuthenticatedUser = { userId: string; name: string; role: Role };

/** عند تعدد الأدوار يُعتمد الأعلى صلاحية. */
const ROLE_PRIORITY: readonly Role[] = ["ADMIN", "OPS_MANAGER", "DISPATCHER", "COURIER", "CLIENT"];

function primaryRole(roles: string[]): Role | null {
  return ROLE_PRIORITY.find((role) => roles.includes(role)) ?? null;
}

/** مستخدمو التطوير بلا قاعدة بيانات — مطابقون لحسابات seed.ts. */
const DEV_USERS = [
  {
    userId: "dev-ops-manager",
    name: "مدير عمليات QBL",
    email: "ops.manager@qdl.sa",
    password: "Admin123456",
    roles: ["OPS_MANAGER"],
  },
] as const;

async function verifyAgainstDevUsers(email: string, password: string): Promise<AuthenticatedUser | null> {
  const user = DEV_USERS.find((candidate) => candidate.email === email);
  if (!user || user.password !== password) return null;
  const role = primaryRole([...user.roles]);
  return role ? { userId: user.userId, name: user.name, role } : null;
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

/** null عند أي فشل — المسار يعيد رسالة موحّدة كي لا يُكشف سبب الرفض. */
export async function verifyCredentials(email: string, password: string): Promise<AuthenticatedUser | null> {
  if (!process.env.DATABASE_URL) return verifyAgainstDevUsers(email, password);
  return verifyAgainstDatabase(email, password);
}
