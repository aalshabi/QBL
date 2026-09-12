import { z } from "zod";
export const reconciliationSchema = z
  .object({
    clientAccountId: z.string().min(1).max(100),
    source: z.literal("LOGESTECHS_CONTROLLED_EXPORT"),
    sourceCapturedAt: z.iso.datetime(),
    windowStart: z.iso.datetime(),
    windowEnd: z.iso.datetime(),
    expectedCount: z.number().int().min(0).max(500),
    shipmentIds: z
      .array(
        z
          .string()
          .trim()
          .regex(/^[A-Za-z0-9._-]{1,100}$/),
      )
      .max(500),
  })
  .strict();
export function compareShipments(
  sourceIds: string[],
  localIds: string[],
  expectedCount: number,
) {
  const source = new Set(sourceIds),
    local = new Set(localIds);
  const counts = new Map<string, number>();
  for (const id of sourceIds) counts.set(id, (counts.get(id) ?? 0) + 1);
  const duplicateIds = [...counts].filter(([, n]) => n > 1).map(([id]) => id);
  const missingIds = [...source].filter((id) => !local.has(id));
  const unexpectedIds = [...local].filter((id) => !source.has(id));
  return {
    receivedCount: sourceIds.length,
    matchedCount: [...source].filter((id) => local.has(id)).length,
    missingIds,
    duplicateIds,
    unexpectedIds,
    complete:
      source.size === expectedCount &&
      sourceIds.length === expectedCount &&
      !duplicateIds.length &&
      !missingIds.length &&
      !unexpectedIds.length,
  };
}
