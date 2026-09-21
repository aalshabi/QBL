import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { getSession, type Role } from "@/lib/auth";

/** لوحة العمليات: الإدارة ومديرو العمليات والمرسِلون. */
const OPS_ROLES: Role[] = ["ADMIN", "OPS_MANAGER", "DISPATCHER"];

/** حارس صفحات app/(ops)/* — غياب الجلسة يُرفض قبل أي فحص للدور. */
export async function requireOpsPage(): Promise<void> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  if (!OPS_ROLES.includes(session.role)) {
    redirect("/");
  }
}

/** حارس مسارات app/api/ops/* — 401 بلا جلسة، 403 بدور غير مخوّل. */
export async function requireOpsApi(): Promise<NextResponse | null> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "UNAUTHENTICATED", message: "يلزم تسجيل الدخول للوصول إلى هذه الواجهة" },
      { status: 401 },
    );
  }
  if (!OPS_ROLES.includes(session.role)) {
    return NextResponse.json(
      { error: "FORBIDDEN", message: "هذه الواجهة متاحة لفريق العمليات فقط" },
      { status: 403 },
    );
  }
  return null;
}
