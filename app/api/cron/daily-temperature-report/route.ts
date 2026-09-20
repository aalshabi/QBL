import { NextRequest, NextResponse } from "next/server";
import { buildDailyTemperatureReport, recordDailyTemperatureReport, yesterdayKey } from "@/lib/cold-chain/daily-report";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  return header === `Bearer ${secret}`;
}

/**
 * Meant to be invoked once daily (e.g. by Vercel Cron) to aggregate the day's
 * real TemperatureReading rows per shipment and record them as an auditable
 * NotificationLog entry. Optionally accepts ?date=YYYY-MM-DD (UTC) to
 * regenerate a specific day's report; defaults to yesterday (UTC).
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const dateParam = request.nextUrl.searchParams.get("date");
  const dateKey = dateParam ?? yesterdayKey();
  if (!DATE_PATTERN.test(dateKey)) {
    return NextResponse.json({ ok: false, error: "INVALID_DATE" }, { status: 400 });
  }

  try {
    const report = await buildDailyTemperatureReport(dateKey);
    await recordDailyTemperatureReport(report);
    return NextResponse.json({ ok: true, report });
  } catch (error) {
    console.error("daily_temperature_report_failed", { dateKey, error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ ok: false, error: "REPORT_GENERATION_FAILED" }, { status: 500 });
  }
}
