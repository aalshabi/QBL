import type { Courier, DeliveryOrder } from "@/lib/domain";

export type MapMarker = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  status: string;
};

export function toCourierMarkers(couriers: Courier[]): MapMarker[] {
  return couriers.map((courier) => ({
    id: courier.id,
    label: courier.employeeCode,
    latitude: courier.latitude,
    longitude: courier.longitude,
    status: courier.status,
  }));
}

export function toOrderMarkers(orders: DeliveryOrder[]): MapMarker[] {
  return orders.map((order) => ({
    id: order.id,
    label: order.publicCode,
    latitude: order.dropoffLatitude,
    longitude: order.dropoffLongitude,
    status: order.status,
  }));
}
