import { isWithinRiyadh } from './coverage';

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
  const raw = String(value);
  const text = typeof value === 'string' && /^[=+@\-\t\r]/.test(raw) ? "'" + raw : raw;
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/** Builds the exact coordinate columns consumed by the existing route optimizer. */
export function buildVerifiedRouteCsv(rows: RouteExportRow[]): string {
  const blockedCount = rows.filter(
    ({ location }) =>
      !location?.ok ||
      location.status !== "VERIFIED" ||
      typeof location.latitude !== "number" ||
      typeof location.longitude !== "number" ||
      !isWithinRiyadh(location.latitude, location.longitude),
  ).length;

  if (blockedCount) throw new RouteExportBlockedError(blockedCount);

  const dataRows = rows.map(({ tracking, address, location }) => {
    if (!location?.ok || location.status !== "VERIFIED") {
      throw new RouteExportBlockedError(1);
    }
    return [
      tracking,
      address,
      location.latitude!,
      location.longitude!,
    ]
      .map(csvCell)
      .join(",");
  });

  return `\uFEFFTracking,Address,Latitude,Longitude\r\n${dataRows.join("\r\n")}`;
}
