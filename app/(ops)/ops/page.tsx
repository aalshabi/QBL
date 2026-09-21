import { OpsDashboard } from "@/components/ops/ops-dashboard";
import { loadOpsSnapshot } from "@/lib/ops/live-data";
import { requireOpsPage } from "@/lib/ops/guard";

export const dynamic = "force-dynamic";

export default async function OpsPage() {
  await requireOpsPage();
  const snapshot = await loadOpsSnapshot();
  return (
    <OpsDashboard
      couriers={snapshot.couriers}
      orders={snapshot.orders}
      clients={snapshot.clients}
      auditEvents={snapshot.auditEvents}
    />
  );
}
