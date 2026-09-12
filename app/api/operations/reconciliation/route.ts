import { ZodError } from "zod";
import { createHash } from "node:crypto";
import { getSession } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { assertOperator } from "@/lib/operations/cases";
import { canOperate } from "@/lib/operations/access";
import {
  compareShipments,
  reconciliationSchema,
} from "@/lib/operations/reconciliation";
import { readBoundedRequestJson } from "@/lib/logestechs/request-security";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  const headers = { "Cache-Control": "private, no-store" },
    session = await getSession();
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
    const actor = await assertOperator(session),
      data = reconciliationSchema.parse(await readBoundedRequestJson(request));
    const start = new Date(data.windowStart),
      end = new Date(data.windowEnd),
      captured = new Date(data.sourceCapturedAt);
    if (start >= end || end > captured || captured > new Date())
      return Response.json(
        { error: "INVALID_SOURCE_WINDOW" },
        { status: 422, headers },
      );
    const prisma = getPrisma();
    if (
      !(await prisma.clientAccount.findUnique({
        where: { id: data.clientAccountId },
        select: { id: true },
      }))
    )
      return Response.json(
        { error: "CLIENT_NOT_FOUND" },
        { status: 404, headers },
      );
    const local = await prisma.deliveryOrder.findMany({
      where: {
        clientAccountId: data.clientAccountId,
        scheduledAt: { gte: start, lt: end },
      },
      select: { barcode: true, publicCode: true },
    });
    const comparison = compareShipments(
      data.shipmentIds,
      local.map((x) => x.barcode ?? x.publicCode),
      data.expectedCount,
    );
    const saved = await prisma.$transaction(async (tx) => {
      const result = await tx.shipmentReconciliation.create({
        data: {
          clientAccountId: data.clientAccountId,
          source: data.source,
          sourceCapturedAt: captured,
          windowStart: start,
          windowEnd: end,
          expectedCount: data.expectedCount,
          ...comparison,
          createdBy: actor.userId,
          sourceHash: createHash("sha256")
            .update(JSON.stringify(data))
            .digest("hex"),
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: actor.userId,
          action: "STATUS_CHANGED",
          reason: "Shipment source reconciliation",
          metadata: {
            reconciliationId: result.id,
            windowStart: data.windowStart,
            windowEnd: data.windowEnd,
            missingCount: comparison.missingIds.length,
            complete: comparison.complete,
          },
        },
      });
      return result;
    });
    return Response.json({ id: saved.id, ...comparison }, { headers });
  } catch (error) {
    return Response.json(
      { error: "RECONCILIATION_NOT_SAVED" },
      {
        status:
          error instanceof Error && error.message === "FORBIDDEN"
            ? 403
            : error instanceof ZodError
              ? 422
              : error instanceof RangeError
                ? 413
                : 503,
        headers,
      },
    );
  }
}
