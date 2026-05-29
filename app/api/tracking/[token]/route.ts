import { NextResponse } from "next/server";
import { getPublicTrackingSnapshot } from "@/lib/tracking";

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const snapshot = await getPublicTrackingSnapshot(token);

  if (!snapshot) {
    return NextResponse.json({ error: "Tracking link is invalid, expired, or closed." }, { status: 404 });
  }

  return NextResponse.json(snapshot);
}
