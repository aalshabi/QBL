import { validCronAuthorization } from "@/lib/cron-auth";
import { retryPendingLogesTechsEvents } from "@/lib/logestechs/webhook-store";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  if (!validCronAuthorization(request.headers.get("authorization")))
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401, headers });
  try {
    const result = await retryPendingLogesTechsEvents();
    return Response.json(result, {
      status: result.failed ? 503 : 200,
      headers,
    });
  } catch {
    return Response.json(
      { error: "RECONCILIATION_UNAVAILABLE" },
      { status: 503, headers },
    );
  }
}
