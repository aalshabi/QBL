import { NextResponse } from "next/server";
import { assertRole, getSession } from "@/lib/auth";
import { secureJsonHeaders } from "@/lib/logestechs/request-security";
import { checkColdChainHealth } from "@/lib/cold-chain/health";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** فحص اتصال التبريد للإدارة. لا يُعيد أي سر — وجود وأعداد وأعمار فقط. */
export async function GET() {
  const session = await getSession();
  try {
    assertRole(session?.role, ["ADMIN", "OPS_MANAGER"]);
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401, headers: secureJsonHeaders });
  }

  try {
    const health = await checkColdChainHealth(getPrisma());
    return NextResponse.json({ ok: true, health }, { headers: secureJsonHeaders });
  } catch {
    return NextResponse.json({ ok: false, error: "HEALTH_CHECK_FAILED" }, { status: 503, headers: secureJsonHeaders });
  }
}
