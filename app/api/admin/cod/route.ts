import { NextRequest, NextResponse } from "next/server";
import { getAdminDataSource } from "@/lib/admin/data";
import { requireAdmin } from "@/lib/admin/guard";

export async function GET() {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;

  const cod = await getAdminDataSource().getCod();
  return NextResponse.json(cod);
}

/**
 * دورة حياة كشوفات التحصيل: استلام عهدة مندوب / تصدير كشف / تسليم كشف.
 * mock حاليًا — يُستبدل بكتابة Prisma (CodCollection/CodSettlement) عند توفر قاعدة البيانات.
 */
export async function PATCH(request: NextRequest) {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;

  const body = (await request.json()) as {
    action: "RECEIVE_CUSTODY" | "EXPORT_SETTLEMENT" | "DELIVER_SETTLEMENT";
    courierId?: string;
    settlementId?: string;
  };

  if (body.action === "RECEIVE_CUSTODY" && !body.courierId) {
    return NextResponse.json({ error: "VALIDATION", message: "حدد المندوب" }, { status: 400 });
  }
  if (body.action !== "RECEIVE_CUSTODY" && !body.settlementId) {
    return NextResponse.json({ error: "VALIDATION", message: "حدد الكشف" }, { status: 400 });
  }

  // TODO(prisma): تنفيذ فعلي — إنشاء CodCollection أو ترقية حالة CodSettlement.
  return NextResponse.json({ ok: true, action: body.action });
}
