import { ZodError } from "zod";
import { getSession } from "@/lib/auth";
import { canOperate } from "@/lib/operations/access";
import { saveOperationsPolicy } from "@/lib/operations/automation";
import { createCommitment } from "@/lib/operations/commitments";
import { readBoundedRequestJson } from "@/lib/logestechs/request-security";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  const session = await getSession(),
    headers = { "Cache-Control": "private, no-store" };
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
    const body = await readBoundedRequestJson(request),
      kind = new URL(request.url).searchParams.get("kind");
    if (!["policy", "commitment"].includes(kind ?? ""))
      return Response.json(
        { error: "INVALID_OPERATION" },
        { status: 422, headers },
      );
    return Response.json(
      await (kind === "policy"
        ? saveOperationsPolicy(body, session)
        : createCommitment(body, session)),
      { headers },
    );
  } catch (error) {
    const forbidden = error instanceof Error && error.message === "FORBIDDEN";
    return Response.json(
      { error: forbidden ? "FORBIDDEN" : "OPERATION_NOT_SAVED" },
      {
        status: forbidden
          ? 403
          : error instanceof ZodError
            ? 422
            : error instanceof RangeError
              ? 413
              : 409,
        headers,
      },
    );
  }
}
