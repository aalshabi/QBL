import { NextRequest, NextResponse } from "next/server";
import { checkCronAuth, cronAuthFailure } from "@/lib/cron/auth";
import { ColdChainPollNotConfiguredError, pollColdChainProvider } from "@/lib/cold-chain/poll";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** سحب مجدول لمزوّد لا يدفع القراءات. معطّل بأمان حتى يُضبط عنوانه ومحوّله. */
export async function GET(request: NextRequest) {
  const auth = checkCronAuth(request.headers);
  if (!auth.ok) {
    const { status, body } = cronAuthFailure("cold-chain-poll", auth);
    return NextResponse.json(body, { status });
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
