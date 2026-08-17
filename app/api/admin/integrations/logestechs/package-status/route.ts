import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/guard";
import type { AdminOrderStatus } from "@/lib/admin/types";
import { getLogesTechsPackageStatus, LogesTechsApiError } from "@/lib/logestechs/client";
import { LogesTechsConfigurationError } from "@/lib/logestechs/config";
import { mapLogesTechsStatus } from "@/lib/logestechs/status-map";

export const dynamic = "force-dynamic";

const noStoreHeaders = { "Cache-Control": "no-store" };
const requestSchema = z.object({
  shipments: z
    .array(
      z.object({
        barcode: z.string().trim().min(1).max(100),
        currentStatus: z.string().trim().min(1).max(100),
      }),
    )
    .min(1)
    .max(20),
});

type StatusResult =
  | {
      ok: true;
      barcode: string;
      externalStatus: string;
      suggestedStatus: AdminOrderStatus | null;
      matchesCurrent: boolean | null;
      packageId: number | null;
      cost: number | null;
      cod: number | null;
      notes: string | null;
    }
  | {
      ok: false;
      barcode: string;
      error: string;
      upstreamStatus: number | null;
    };

async function inspectShipment(shipment: {
  barcode: string;
  currentStatus: string;
}): Promise<StatusResult> {
  try {
    const external = await getLogesTechsPackageStatus(shipment.barcode);
    const suggestedStatus = mapLogesTechsStatus(external.status);
    return {
      ok: true,
      barcode: external.barcode,
      externalStatus: external.status,
      suggestedStatus,
      matchesCurrent: suggestedStatus ? suggestedStatus === shipment.currentStatus : null,
      packageId: external.packageId,
      cost: external.cost,
      cod: external.cod,
      notes: external.notes,
    };
  } catch (error) {
    if (error instanceof LogesTechsApiError) {
      return {
        ok: false,
        barcode: shipment.barcode,
        error: `LOGESTECHS_${error.code}`,
        upstreamStatus: error.upstreamStatus ?? null,
      };
    }
    throw error;
  }
}

async function inspectInBatches(
  shipments: { barcode: string; currentStatus: string }[],
): Promise<StatusResult[]> {
  const results: StatusResult[] = [];
  for (let index = 0; index < shipments.length; index += 5) {
    results.push(...(await Promise.all(shipments.slice(index, index + 5).map(inspectShipment))));
  }
  return results;
}

export async function POST(request: NextRequest) {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION", message: "حدد من 1 إلى 20 شحنة تحتوي على باركود صالح" },
      { status: 400, headers: noStoreHeaders },
    );
  }

  try {
    const uniqueShipments = [
      ...new Map(parsed.data.shipments.map((shipment) => [shipment.barcode, shipment])).values(),
    ];
    const results = await inspectInBatches(uniqueShipments);
    const checked = results.filter((result) => result.ok);
    const summary = {
      requested: results.length,
      succeeded: checked.length,
      failed: results.length - checked.length,
      matched: checked.filter((result) => result.matchesCurrent === true).length,
      mismatched: checked.filter((result) => result.matchesCurrent === false).length,
      unmapped: checked.filter((result) => result.matchesCurrent === null).length,
    };

    if (!checked.length) {
      const timedOut = results.every(
        (result) => !result.ok && result.error === "LOGESTECHS_TIMEOUT",
      );
      return NextResponse.json(
        {
          ok: false,
          readOnly: true,
          error: timedOut ? "LOGESTECHS_TIMEOUT" : "LOGESTECHS_BATCH_FAILED",
          message: "تعذر فحص جميع الشحنات المحددة",
          checkedAt: new Date().toISOString(),
          summary,
          results,
        },
        { status: timedOut ? 504 : 502, headers: noStoreHeaders },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        readOnly: true,
        checkedAt: new Date().toISOString(),
        summary,
        results,
      },
      { headers: noStoreHeaders },
    );
  } catch (error) {
    if (error instanceof LogesTechsConfigurationError) {
      return NextResponse.json(
        {
          ok: false,
          error: "LOGESTECHS_CONFIGURATION",
          message: "إعدادات تكامل LogesTechs غير مكتملة",
          variable: error.variable,
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json(
      { ok: false, error: "LOGESTECHS_UNKNOWN", message: "تعذر فحص حالات الشحنات" },
      { status: 502, headers: noStoreHeaders },
    );
  }
}
