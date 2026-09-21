import { NextRequest, NextResponse } from "next/server";
import { ColdChainPollNotConfiguredError, pollColdChainProvider } from "@/lib/cold-chain/poll";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** سحب مجدول لمزوّد لا يدفع القراءات. معطّل بأمان حتى يُضبط عنوانه ومحوّله. */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const result = await pollColdChainProvider();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof ColdChainPollNotConfiguredError) {
      return NextResponse.json({ ok: false, error: "POLL_NOT_CONFIGURED" }, { status: 503 });
    }
    return NextResponse.json({ ok: false, error: "POLL_FAILED", retryable: true }, { status: 503 });
  }
}
