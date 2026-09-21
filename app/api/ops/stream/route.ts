import { couriers, deliveryOrders } from "@/lib/mock-data";
import { requireOpsApi } from "@/lib/ops/guard";

export const dynamic = "force-dynamic";

export async function GET() {
  // قناة البث تبقى مفتوحة وتُسرّب حالة الأسطول لحظياً — تُفحص الصلاحية قبل فتحها.
  const denied = await requireOpsApi();
  if (denied) return denied;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = () => {
        controller.enqueue(
          encoder.encode(
            `event: ops-update\ndata: ${JSON.stringify({
              at: new Date().toISOString(),
              activeOrders: deliveryOrders.filter((order) => !["DELIVERED", "FAILED"].includes(order.status)).length,
              onlineCouriers: couriers.filter((courier) => courier.status !== "OFFLINE").length,
            })}\n\n`,
          ),
        );
      };

      send();
      const interval = setInterval(send, 10_000);

      return () => clearInterval(interval);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
