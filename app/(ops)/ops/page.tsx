import { OpsDashboard } from "@/components/ops/ops-dashboard";
import { couriers, deliveryOrders } from "@/lib/mock-data";
import { requireOpsPage } from "@/lib/ops/guard";

export default async function OpsPage() {
  await requireOpsPage();
  return <OpsDashboard couriers={couriers} orders={deliveryOrders} />;
}
