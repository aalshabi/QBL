import { courierStatusLabels, statusLabels } from "@/lib/company";
import type { ClientAccount, Courier, Customer, DeliveryOrder, OrderStatus, TimelineEvent, Vehicle } from "@/lib/domain";

const now = new Date("2026-04-30T17:30:00+03:00");

const riyadhPoints = [
  { area: "الروضة", lat: 24.7442, lng: 46.7814 },
  { area: "النرجس", lat: 24.8428, lng: 46.6801 },
  { area: "العليا", lat: 24.7136, lng: 46.6753 },
  { area: "الملز", lat: 24.6636, lng: 46.7376 },
  { area: "قرطبة", lat: 24.8097, lng: 46.7317 },
  { area: "النسيم", lat: 24.7346, lng: 46.8151 },
  { area: "الياسمين", lat: 24.8285, lng: 46.6378 },
  { area: "السليمانية", lat: 24.7047, lng: 46.7004 },
  { area: "حطين", lat: 24.764, lng: 46.6099 },
  { area: "طويق", lat: 24.5829, lng: 46.5727 },
  { area: "المروج", lat: 24.7575, lng: 46.6614 },
  { area: "الشفا", lat: 24.582, lng: 46.7189 },
];

export const clientAccounts: ClientAccount[] = [
  { id: "client-001", companyName: "مورد الرياض للأغذية الطازجة", sector: "FOOD_SUPPLIER", contactName: "سلمان العتيبي" },
  { id: "client-002", companyName: "صيدليات العناية الحديثة", sector: "PHARMACY_CLINIC", contactName: "نورة القحطاني" },
  { id: "client-003", companyName: "مطابخ وكافيهات مدار", sector: "RESTAURANT_CAFE", contactName: "فهد الحربي" },
  { id: "client-004", companyName: "متاجر نخبة التجزئة", sector: "RETAIL", contactName: "ريم الدوسري" },
  { id: "client-005", companyName: "منصة سلة مبردة", sector: "ECOMMERCE", contactName: "عبدالعزيز الشهراني" },
];

export const customers: Customer[] = riyadhPoints.map((point, index) => ({
  id: `customer-${String(index + 1).padStart(3, "0")}`,
  name: ["فرع الروضة", "عميل النرجس", "مستلم العليا", "فرع الملز", "مركز قرطبة", "عميل النسيم"][index % 6],
  phoneMasked: `05******${String(40 + index).slice(-2)}`,
  sector: clientAccounts[index % clientAccounts.length].sector,
  address: `الرياض، حي ${point.area}`,
  latitude: point.lat,
  longitude: point.lng,
}));

export const vehicles: Vehicle[] = Array.from({ length: 10 }, (_, index) => ({
  id: `vehicle-${String(index + 1).padStart(3, "0")}`,
  plateNumber: `ر ي د ${3200 + index}`,
  label: `فان مبرد QBL-${String(index + 1).padStart(2, "0")}`,
  coldRange: index % 4 === 0 ? "-18 إلى +5" : "0 إلى +5",
  supportsFrozen: index % 4 === 0,
}));

export const couriers: Courier[] = Array.from({ length: 10 }, (_, index) => {
  const point = riyadhPoints[index];
  const statuses = ["AVAILABLE", "ON_TASK", "ON_TASK", "LATE", "OFFLINE"] as const;
  return {
    id: `courier-${String(index + 1).padStart(3, "0")}`,
    employeeCode: `QBL-C${String(index + 1).padStart(3, "0")}`,
    displayName: ["أحمد", "محمد", "سعود", "خالد", "عبدالله", "راكان", "فيصل", "تركي", "ماجد", "بندر"][index],
    phoneMasked: `05******${String(10 + index).slice(-2)}`,
    status: statuses[index % statuses.length],
    vehicleId: vehicles[index].id,
    latitude: point.lat + 0.004,
    longitude: point.lng - 0.004,
    lastPingAt: new Date(now.getTime() - index * 90_000).toISOString(),
  };
});

function timelineFor(status: OrderStatus, scheduledAt: string): TimelineEvent[] {
  const order: OrderStatus[] = ["CREATED", "ASSIGNED", "OUT_FOR_DELIVERY", "ARRIVED", "DELIVERED", "FAILED"];
  const currentIndex = order.indexOf(status);
  return order
    .filter((item) => item !== "FAILED" || status === "FAILED")
    .map((item, index) => ({
      status: item,
      label: statusLabels[item],
      done: index <= currentIndex,
      at: index <= currentIndex ? new Date(new Date(scheduledAt).getTime() + index * 18 * 60_000).toISOString() : null,
    }));
}

const statuses: OrderStatus[] = [
  "CREATED",
  "ASSIGNED",
  "OUT_FOR_DELIVERY",
  "ARRIVED",
  "DELIVERED",
  "FAILED",
  "OUT_FOR_DELIVERY",
  "ASSIGNED",
];

export const deliveryOrders: DeliveryOrder[] = Array.from({ length: 40 }, (_, index) => {
  const point = riyadhPoints[index % riyadhPoints.length];
  const status = statuses[index % statuses.length];
  const scheduledAt = new Date(now.getTime() + (index - 18) * 11 * 60_000).toISOString();
  const temp = index % 11 === 0 ? 8.4 : index % 9 === 0 ? -16.8 : Number((2.1 + (index % 4) * 0.7).toFixed(1));
  return {
    id: `order-${String(index + 1).padStart(3, "0")}`,
    publicCode: `QBL-${20260430}-${String(index + 1).padStart(4, "0")}`,
    reference: `REF-RUH-${String(9000 + index)}`,
    clientAccountId: clientAccounts[index % clientAccounts.length].id,
    customerId: customers[index % customers.length].id,
    courierId: couriers[index % couriers.length].id,
    vehicleId: vehicles[index % vehicles.length].id,
    status,
    pickupAddress: "الرياض، طريق أبو عبيدة عامر بن الجراح، مركز تشغيل QBL",
    dropoffAddress: `الرياض، حي ${point.area}`,
    dropoffLatitude: point.lat,
    dropoffLongitude: point.lng,
    serviceType: index % 5 === 0 ? "دوائي مبرد" : index % 4 === 0 ? "مجمدات" : "أغذية طازجة B2B2C",
    temperatureTarget: index % 4 === 0 ? "حتى -18" : "0 إلى +5",
    etaMinutes: Math.max(8, 65 - (index % 8) * 6),
    scheduledAt,
    isDelayed: index % 7 === 0,
    requiresIntervention: index % 13 === 0 || temp > 6,
    currentTemperature: temp,
    temperatureStatus: temp > 6 ? "CRITICAL" : temp > 5 ? "WARNING" : "NORMAL",
    timeline: timelineFor(status, scheduledAt),
  };
});

export const auditEvents = deliveryOrders.slice(0, 14).map((order, index) => ({
  id: `audit-${index + 1}`,
  orderCode: order.publicCode,
  action:
    index % 5 === 0
      ? "OTP_MANUAL_OVERRIDE"
      : index % 3 === 0
        ? "TEMPERATURE_READING"
        : index % 2 === 0
          ? "STATUS_CHANGED"
          : "LOCATION_PING",
  actor: index % 5 === 0 ? "مدير العمليات" : couriers[index % couriers.length].displayName,
  reason: index % 5 === 0 ? "تجاوز يدوي موثق بسبب تعطل جهاز العميل" : null,
  at: new Date(now.getTime() - index * 8 * 60_000).toISOString(),
}));

export const sectorLabels: Record<ClientAccount["sector"], string> = {
  FOOD_SUPPLIER: "الموردون الغذائيون",
  PHARMACY_CLINIC: "الصيدليات والمستوصفات",
  RESTAURANT_CAFE: "المطاعم والكافيهات",
  RETAIL: "متاجر التجزئة",
  HOTEL_HOSPITAL: "الفنادق والمستشفيات",
  ECOMMERCE: "منصات التجارة الإلكترونية",
};

export const courierStatusText = courierStatusLabels;
