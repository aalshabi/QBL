import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { getSession, type Role } from "@/lib/auth";

const ADMIN_ROLES: Role[] = ["ADMIN", "OPS_MANAGER"];

/**
 * حارس صفحات app/(admin)/admin/* — يوجّه غير الإداريين بعيدًا قبل تحميل أي بيانات.
 * يُستدعى في الـ layout وفي كل صفحة: صفحات Next.js قد تُنفَّذ بالتوازي مع الـ layout،
 * فلا يُعتمد على الـ layout وحده لحماية البيانات.
 */
export async function requireAdminPage(): Promise<void> {
  const session = await getSession();
  if (!ADMIN_ROLES.includes(session.role)) {
    redirect("/");
  }
}

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
