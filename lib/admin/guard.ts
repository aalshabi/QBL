import { NextResponse } from "next/server";
import { getSession, type Role } from "@/lib/auth";

const ADMIN_ROLES: Role[] = ["ADMIN", "OPS_MANAGER"];

/**
 * حارس صلاحيات مسارات app/api/admin/* — يسمح فقط لأدوار الإدارة.
 * يعيد null عند السماح، أو استجابة 403 عند الرفض.
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const session = await getSession();
  if (!ADMIN_ROLES.includes(session.role)) {
    return NextResponse.json(
      { error: "FORBIDDEN", message: "هذه الواجهة متاحة لأدوار الإدارة فقط" },
      { status: 403 },
    );
  }
  return null;
}
