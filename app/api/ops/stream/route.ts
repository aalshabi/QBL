import { loadOpsCounters } from "@/lib/ops/live-data";
import { requireOpsApi } from "@/lib/ops/guard";

export const dynamic = "force-dynamic";

/** عدّادات اللوحة الحية — من القاعدة، لا من مصفوفة ثابتة تبدو متحركة. */
export async function GET() {
  const denied = await requireOpsApi();
  if (denied) return denied;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;

      const send = async () => {
        if (closed) return;
        try {
          const counters = await loadOpsCounters();
          controller.enqueue(
            encoder.encode(`event: ops-update\ndata: ${JSON.stringify({ at: new Date().toISOString(), ...counters })}\n\n`),
          );
        } catch {
          // تعذّر القراءة لا يُسقط القناة، لكنه لا يُرسل رقماً مخترعاً أيضاً.
          controller.enqueue(encoder.encode(`event: ops-error\ndata: {"error":"COUNTERS_UNAVAILABLE"}\n\n`));
        }
      };

      await send();
      const interval = setInterval(() => void send(), 10_000);

      return () => {
        closed = true;
        clearInterval(interval);
      };
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
