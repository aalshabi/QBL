import { ZodError } from "zod";
import { getSession } from "@/lib/auth";
import { canOperate } from "@/lib/operations/access";
import {
  caseWorklist,
  createOperationalCase,
  updateOperationalCase,
} from "@/lib/operations/cases";
import { readBoundedRequestJson } from "@/lib/logestechs/request-security";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
export async function GET() {
  const session = await getSession();
  if (!session || !canOperate(session.role))
    return Response.json(
      { error: "FORBIDDEN" },
      { status: session ? 403 : 401, headers },
    );
  try {
    return Response.json(await caseWorklist(session), { headers });
  } catch {
    return Response.json(
      { error: "OPERATIONS_UNAVAILABLE" },
      { status: 503, headers },
    );
  }
}
async function mutate(request: Request, update: boolean) {
  const session = await getSession();
  if (!session || !canOperate(session.role))
    return Response.json(
      { error: "FORBIDDEN" },
      { status: session ? 403 : 401, headers },
    );
  if (
    request.headers.get("x-qbl-ops-request") !== "v1" ||
    request.headers.get("sec-fetch-site") === "cross-site" ||
    (request.headers.get("origin") &&
      request.headers.get("origin") !== new URL(request.url).origin)
  )
    return Response.json({ error: "FORBIDDEN" }, { status: 403, headers });
  if (
    !/^application\/json(?:\s*;|$)/i.test(
      request.headers.get("content-type") ?? "",
    )
  )
    return Response.json(
      { error: "INVALID_CONTENT_TYPE" },
      { status: 415, headers },
    );
  try {
    const body = await readBoundedRequestJson(request);
    return Response.json(
      await (update
        ? updateOperationalCase(body, session)
        : createOperationalCase(body, session)),
      { headers },
    );
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const expected = [
      "FORBIDDEN",
      "INVALID_CASE",
      "INVALID_OWNERS",
      "CASE_TENANT_MISMATCH",
      "CLOSURE_EVIDENCE_REQUIRED",
      "CASE_ALREADY_CLOSED",
      "CASE_CHANGED_RELOAD",
    ];
    return Response.json(
      { error: expected.includes(code) ? code : "CASE_NOT_SAVED" },
      {
        status:
          code === "FORBIDDEN"
            ? 403
            : error instanceof RangeError
              ? 413
              : expected.includes(code)
                ? 409
                : error instanceof ZodError
                  ? 422
                  : 503,
        headers,
      },
    );
  }
}
export async function POST(request: Request) {
  return mutate(request, false);
}
export async function PATCH(request: Request) {
  return mutate(request, true);
}
