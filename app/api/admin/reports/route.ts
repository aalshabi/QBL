import { NextResponse } from "next/server";
import { getAdminDataSource } from "@/lib/admin/data";
import { requireAdmin } from "@/lib/admin/guard";

export async function GET() {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;

  const reports = await getAdminDataSource().getReports();
  return NextResponse.json(reports);
}
