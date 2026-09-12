import { validCronAuthorization } from "@/lib/cron-auth";
import { runCaseAutomation } from "@/lib/operations/automation";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
export async function GET(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  if (!validCronAuthorization(request.headers.get("authorization")))
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401, headers });
  try {
    return Response.json(await runCaseAutomation(), { headers });
  } catch {
    return Response.json(
      { error: "CASE_AUTOMATION_UNAVAILABLE" },
      { status: 503, headers },
    );
  }
}
