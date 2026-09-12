import { NextRequest, NextResponse } from "next/server";
import { demoDataAllowed } from "@/lib/runtime-mode";
export function proxy(request: NextRequest) {
  if (demoDataAllowed()) return NextResponse.next();
  if (request.nextUrl.pathname.startsWith("/api/"))
    return NextResponse.json(
      {
        error: "OPERATIONAL_ADAPTER_UNAVAILABLE",
        message: "هذه الخدمة غير متاحة حتى اكتمال الربط التشغيلي.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  return new NextResponse(
    '<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>الخدمة غير متاحة</title><main><h1>الخدمة غير متاحة حاليًا</h1><p>استخدم نظام التشغيل المعتمد لمتابعة الشحنة. هذه الواجهة لم يكتمل ربطها بعد.</p></main></html>',
    {
      status: 503,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    },
  );
}
export const config = {
  matcher: [
    "/api/orders/:path*",
    "/api/courier/location",
    "/api/ops/stream",
    "/api/tracking/:path*",
    "/courier",
    "/track/:token",
    "/cold-chain-system/operations-dashboard",
    "/cold-chain-system/client-dashboard",
    "/cold-chain-system/driver-app",
  ],
};
