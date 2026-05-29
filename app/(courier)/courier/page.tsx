import { CourierApp } from "@/components/courier/courier-app";
import { deliveryOrders } from "@/lib/mock-data";

export default function CourierPage() {
  return <CourierApp orders={deliveryOrders.slice(0, 8)} />;
}
