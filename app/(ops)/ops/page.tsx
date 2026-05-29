import { OpsDashboard } from "@/components/ops/ops-dashboard";
import { couriers, deliveryOrders } from "@/lib/mock-data";

export default function OpsPage() {
  return <OpsDashboard couriers={couriers} orders={deliveryOrders} />;
}
