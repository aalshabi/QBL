export type OrderStatus =
  | "CREATED"
  | "ASSIGNED"
  | "OUT_FOR_DELIVERY"
  | "ARRIVED"
  | "DELIVERED"
  | "FAILED";

export type CourierStatus = "AVAILABLE" | "ON_TASK" | "LATE" | "OFFLINE";
export type TemperatureStatus = "NORMAL" | "WARNING" | "CRITICAL" | "NOT_AVAILABLE";

export type ClientSector =
  | "FOOD_SUPPLIER"
  | "PHARMACY_CLINIC"
  | "RESTAURANT_CAFE"
  | "RETAIL"
  | "HOTEL_HOSPITAL"
  | "ECOMMERCE";

export type Courier = {
  id: string;
  employeeCode: string;
  displayName: string;
  phoneMasked: string;
  status: CourierStatus;
  vehicleId: string;
  latitude: number;
  longitude: number;
  lastPingAt: string;
};

export type Vehicle = {
  id: string;
  plateNumber: string;
  label: string;
  coldRange: string;
  supportsFrozen: boolean;
};

export type Customer = {
  id: string;
  name: string;
  phoneMasked: string;
  sector: ClientSector;
  address: string;
  latitude: number;
  longitude: number;
};

export type ClientAccount = {
  id: string;
  companyName: string;
  sector: ClientSector;
  contactName: string;
};

export type TimelineEvent = {
  status: OrderStatus;
  label: string;
  at: string | null;
  done: boolean;
};

export type DeliveryOrder = {
  id: string;
  publicCode: string;
  reference: string;
  clientAccountId: string;
  customerId: string;
  courierId: string;
  vehicleId: string;
  status: OrderStatus;
  pickupAddress: string;
  dropoffAddress: string;
  dropoffLatitude: number;
  dropoffLongitude: number;
  serviceType: string;
  temperatureTarget: string;
  etaMinutes: number;
  scheduledAt: string;
  isDelayed: boolean;
  requiresIntervention: boolean;
  currentTemperature?: number;
  temperatureStatus: TemperatureStatus;
  timeline: TimelineEvent[];
};

export type TrackingSnapshot = {
  order: Pick<
    DeliveryOrder,
    | "id"
    | "publicCode"
    | "reference"
    | "status"
    | "dropoffAddress"
    | "etaMinutes"
    | "temperatureTarget"
    | "currentTemperature"
    | "temperatureStatus"
    | "timeline"
  >;
  courier: Pick<Courier, "employeeCode" | "displayName" | "phoneMasked" | "latitude" | "longitude" | "lastPingAt">;
  customer: Pick<Customer, "name" | "phoneMasked">;
  otp: {
    masked: string;
    required: boolean;
    maxAttempts: number;
    remainingAttempts: number;
  };
};
