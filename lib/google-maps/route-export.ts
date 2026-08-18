export type RouteExportRow = {
  tracking: string;
  address: string;
  location:
    | {
        ok: true;
        status: "VERIFIED" | "NEEDS_REVIEW";
        latitude?: number;
        longitude?: number;
        formattedAddress?: string;
      }
    | { ok: false }
    | undefined;
};

export class RouteExportBlockedError extends Error {
  constructor(public readonly blockedCount: number) {
    super(`${blockedCount} locations are not verified`);
    this.name = "RouteExportBlockedError";
  }
}

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/** Builds the exact coordinate columns consumed by the existing route optimizer. */
export function buildVerifiedRouteCsv(rows: RouteExportRow[]): string {
  const blockedCount = rows.filter(
    ({ location }) =>
      !location?.ok ||
      location.status !== "VERIFIED" ||
      typeof location.latitude !== "number" ||
      typeof location.longitude !== "number",
  ).length;

  if (blockedCount) throw new RouteExportBlockedError(blockedCount);

  const dataRows = rows.map(({ tracking, address, location }) => {
    if (!location?.ok || location.status !== "VERIFIED") {
      throw new RouteExportBlockedError(1);
    }
    return [
      tracking,
      location.formattedAddress ?? address,
      location.latitude!,
      location.longitude!,
    ]
      .map(csvCell)
      .join(",");
  });

  return `\uFEFFTracking,Address,Latitude,Longitude\r\n${dataRows.join("\r\n")}`;
}
