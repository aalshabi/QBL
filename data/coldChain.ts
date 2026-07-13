/**
 * Cold-chain mock data layer.
 * Types are designed to be backend-ready: every entity is API-shaped and
 * could be served from a future REST/GraphQL endpoint without UI changes.
 */

export type SlaPriority = "standard" | "express" | "critical";

export type TemperatureZone = "frozen" | "chilled" | "ambient_sensitive";

export type AlertSeverity = "low" | "medium" | "high" | "critical";

export type DeliveryStatus =
  | "booked"
  | "vehicle_pre_cooling"
  | "picked_up"
  | "pickup_temp_recorded"
  | "inbound_received"
  | "cold_storage"
  | "ready_for_dispatch"
  | "out_for_delivery"
  | "in_transit_within_temp"
  | "temp_warning"
  | "delivered"
  | "delivered_with_exception"
  | "not_delivered"
  | "returned_under_cold"
  | "damaged"
  | "closed";

export type RiskLevel = "ok" | "watch" | "at_risk" | "breached";

export type SensorStatus = "connected" | "missing" | "manual";

export type PodStatus = "pending" | "complete" | "incomplete";

export type VehiclePreCooling = "not_started" | "in_progress" | "ready";

export interface TemperatureRange {
  minC: number;
  maxC: number;
}

export interface TemperatureLogEntry {
  timestamp: string; // ISO
  valueC: number;
  source: SensorStatus;
  withinRange: boolean;
  note?: string;
}

export interface ProofOfDelivery {
  receiverName?: string;
  signatureUrl?: string;
  photoUrl?: string;
  gps?: { lat: number; lng: number };
  timestamp?: string;
  deliveryTemperatureC?: number;
  productCondition?: "good" | "minor_issue" | "damaged";
  exceptionNotes?: string;
  driverName?: string;
  vehicleId?: string;
  temperatureCompliant?: boolean;
  status: PodStatus;
}

export interface Alert {
  id: string;
  severity: AlertSeverity;
  type:
    | "temp_out_of_range"
    | "order_delayed"
    | "driver_inactive"
    | "vehicle_not_pre_cooled"
    | "missing_temp"
    | "pod_incomplete"
    | "failed_delivery"
    | "product_at_risk"
    | "sla_breach";
  orderId?: string;
  driverId?: string;
  vehicleId?: string;
  message: string;
  timestamp: string;
  actionRequired: string;
  acknowledged?: boolean;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicleId?: string;
  activeOrders: number;
  completedToday: number;
  onTimeRate: number; // 0..1
  status: "on_route" | "loading" | "idle" | "off_duty";
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  driverName?: string;
  zone: TemperatureZone;
  targetRange: TemperatureRange;
  currentTemperatureC: number;
  preCoolingStatus: VehiclePreCooling;
  sensorStatus: SensorStatus;
  routeStatus: "idle" | "loading" | "on_route" | "returning" | "maintenance";
  lastChecked: string;
}

export interface ColdChainOrder {
  id: string;
  reference: string;
  clientName: string;
  productType: string;
  zone: TemperatureZone;
  temperatureRange: TemperatureRange;
  pickupLocation: string;
  deliveryLocation: string;
  pickupTime: string;
  deliveryWindow: { start: string; end: string };
  maxTransitMinutes: number;
  status: DeliveryStatus;
  slaPriority: SlaPriority;
  driverId?: string;
  vehicleId?: string;
  pickupTemperatureC?: number;
  currentTemperatureC?: number;
  deliveryTemperatureC?: number;
  temperatureLog: TemperatureLogEntry[];
  pod: ProofOfDelivery;
  riskLevel: RiskLevel;
  alerts: string[]; // alert ids
  specialNotes?: string;
  vehiclePreCoolingConfirmed: boolean;
  createdAt: string;
}

export interface DeliveryStatusMeta {
  key: DeliveryStatus;
  labelAr: string;
  labelEn: string;
  group: "intake" | "warehouse" | "transit" | "completion" | "exception";
  description: string;
}

export const STATUS_FLOW: DeliveryStatusMeta[] = [
  { key: "booked", labelAr: "محجوز", labelEn: "Booked", group: "intake", description: "تم إنشاء الطلب وتأكيد متطلبات المنتج والحرارة." },
  { key: "vehicle_pre_cooling", labelAr: "تبريد المركبة", labelEn: "Vehicle Pre-Cooling", group: "intake", description: "المركبة تبرد إلى نطاق الحرارة المطلوب قبل التحميل." },
  { key: "picked_up", labelAr: "تم الاستلام", labelEn: "Picked Up", group: "intake", description: "تم تحميل المنتج من نقطة الاستلام." },
  { key: "pickup_temp_recorded", labelAr: "تسجيل حرارة الاستلام", labelEn: "Pickup Temperature Recorded", group: "intake", description: "تسجيل قراءة الحرارة عند نقطة الاستلام." },
  { key: "inbound_received", labelAr: "إدخال للمستودع", labelEn: "Inbound Received", group: "warehouse", description: "وصول الشحنة إلى المستودع المبرد." },
  { key: "cold_storage", labelAr: "في التخزين المبرد", labelEn: "Cold Storage", group: "warehouse", description: "تخزين الشحنة في منطقة الحرارة المناسبة." },
  { key: "ready_for_dispatch", labelAr: "جاهز للإرسال", labelEn: "Ready for Dispatch", group: "warehouse", description: "الشحنة جاهزة لتعيين رحلة وسائق." },
  { key: "out_for_delivery", labelAr: "خرج للتوصيل", labelEn: "Out for Delivery", group: "transit", description: "السائق غادر إلى عنوان التسليم." },
  { key: "in_transit_within_temp", labelAr: "في الطريق ضمن الحرارة", labelEn: "In Transit – Within Temp", group: "transit", description: "الشحنة في الطريق وقراءات الحرارة ضمن النطاق." },
  { key: "temp_warning", labelAr: "تنبيه حرارة", labelEn: "Temperature Warning", group: "transit", description: "قراءة خرجت عن النطاق المتفق عليه." },
  { key: "delivered", labelAr: "تم التسليم", labelEn: "Delivered", group: "completion", description: "تم التسليم مع إثبات تسليم كامل." },
  { key: "delivered_with_exception", labelAr: "تسليم مع ملاحظة", labelEn: "Delivered with Exception", group: "completion", description: "تم التسليم مع تسجيل ملاحظة تشغيلية." },
  { key: "not_delivered", labelAr: "لم يتم التسليم", labelEn: "Not Delivered", group: "exception", description: "تعذر التسليم لأسباب موثقة." },
  { key: "returned_under_cold", labelAr: "مرتجع تحت التبريد", labelEn: "Returned Under Cold", group: "exception", description: "إرجاع الشحنة إلى المستودع مع الحفاظ على الحرارة." },
  { key: "damaged", labelAr: "تلف / فساد", labelEn: "Damaged / Spoiled", group: "exception", description: "تسجيل تلف المنتج مع توثيق السبب." },
  { key: "closed", labelAr: "مغلق", labelEn: "Closed", group: "completion", description: "إغلاق ملف الطلب بعد إنهاء جميع الإجراءات." },
];

export const STATUS_META: Record<DeliveryStatus, DeliveryStatusMeta> = STATUS_FLOW.reduce(
  (acc, s) => ({ ...acc, [s.key]: s }),
  {} as Record<DeliveryStatus, DeliveryStatusMeta>,
);

export const ZONE_LABEL: Record<TemperatureZone, { ar: string; en: string; range: TemperatureRange }> = {
  frozen: { ar: "مجمد", en: "Frozen", range: { minC: -25, maxC: -18 } },
  chilled: { ar: "مبرد", en: "Chilled", range: { minC: 2, maxC: 8 } },
  ambient_sensitive: { ar: "حساس للحرارة", en: "Ambient-sensitive", range: { minC: 15, maxC: 25 } },
};

export const RISK_LABEL: Record<RiskLevel, { ar: string; en: string; tone: string }> = {
  ok: { ar: "ضمن المسار", en: "On track", tone: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  watch: { ar: "قيد المراقبة", en: "Watch", tone: "bg-amber-50 text-amber-700 border-amber-200" },
  at_risk: { ar: "معرّض للخطر", en: "At risk", tone: "bg-orange-50 text-orange-700 border-orange-200" },
  breached: { ar: "تجاوز", en: "Breached", tone: "bg-rose-50 text-rose-700 border-rose-200" },
};

export const SLA_LABEL: Record<SlaPriority, { ar: string; en: string; tone: string }> = {
  standard: { ar: "قياسي", en: "Standard", tone: "bg-slate-100 text-slate-700 border-slate-200" },
  express: { ar: "سريع", en: "Express", tone: "bg-sky-50 text-sky-700 border-sky-200" },
  critical: { ar: "حرج", en: "Critical", tone: "bg-rose-50 text-rose-700 border-rose-200" },
};

export const SEVERITY_LABEL: Record<AlertSeverity, { ar: string; en: string; tone: string; dot: string }> = {
  low: { ar: "منخفض", en: "Low", tone: "bg-slate-50 text-slate-700 border-slate-200", dot: "bg-slate-400" },
  medium: { ar: "متوسط", en: "Medium", tone: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  high: { ar: "عالي", en: "High", tone: "bg-orange-50 text-orange-700 border-orange-200", dot: "bg-orange-500" },
  critical: { ar: "حرج", en: "Critical", tone: "bg-rose-50 text-rose-700 border-rose-200", dot: "bg-rose-500" },
};

// ---------- Mock data ----------

export const COLD_CHAIN_ORDERS: ColdChainOrder[] = [
  {
    id: "ord_1042",
    reference: "QBL-1042",
    clientName: "مطابخ الندى المركزية",
    productType: "ألبان طازجة",
    zone: "chilled",
    temperatureRange: { minC: 2, maxC: 6 },
    pickupLocation: "مستودع المالقا، الرياض",
    deliveryLocation: "فرع حطين، الرياض",
    pickupTime: "2026-05-07T08:30:00+03:00",
    deliveryWindow: { start: "2026-05-07T10:00:00+03:00", end: "2026-05-07T12:00:00+03:00" },
    maxTransitMinutes: 90,
    status: "in_transit_within_temp",
    slaPriority: "express",
    driverId: "drv_03",
    vehicleId: "veh_07",
    pickupTemperatureC: 3.4,
    currentTemperatureC: 4.1,
    temperatureLog: [
      { timestamp: "2026-05-07T08:30:00+03:00", valueC: 3.4, source: "connected", withinRange: true },
      { timestamp: "2026-05-07T09:00:00+03:00", valueC: 3.9, source: "connected", withinRange: true },
      { timestamp: "2026-05-07T09:30:00+03:00", valueC: 4.1, source: "connected", withinRange: true },
    ],
    pod: { status: "pending" },
    riskLevel: "ok",
    alerts: [],
    vehiclePreCoolingConfirmed: true,
    createdAt: "2026-05-07T07:55:00+03:00",
  },
  {
    id: "ord_1043",
    reference: "QBL-1043",
    clientName: "صيدليات شفاء",
    productType: "لقاحات حساسة للحرارة",
    zone: "chilled",
    temperatureRange: { minC: 2, maxC: 8 },
    pickupLocation: "مستودع شفاء، السلي",
    deliveryLocation: "فرع الياسمين، الرياض",
    pickupTime: "2026-05-07T09:00:00+03:00",
    deliveryWindow: { start: "2026-05-07T10:30:00+03:00", end: "2026-05-07T11:30:00+03:00" },
    maxTransitMinutes: 75,
    status: "temp_warning",
    slaPriority: "critical",
    driverId: "drv_01",
    vehicleId: "veh_03",
    pickupTemperatureC: 4.6,
    currentTemperatureC: 9.2,
    temperatureLog: [
      { timestamp: "2026-05-07T09:00:00+03:00", valueC: 4.6, source: "connected", withinRange: true },
      { timestamp: "2026-05-07T09:25:00+03:00", valueC: 6.8, source: "connected", withinRange: true },
      { timestamp: "2026-05-07T09:40:00+03:00", valueC: 9.2, source: "connected", withinRange: false, note: "خروج عن النطاق" },
    ],
    pod: { status: "pending" },
    riskLevel: "breached",
    alerts: ["alr_01"],
    specialNotes: "تواصل مسبق مع الصيدلي قبل التسليم.",
    vehiclePreCoolingConfirmed: true,
    createdAt: "2026-05-07T08:40:00+03:00",
  },
  {
    id: "ord_1044",
    reference: "QBL-1044",
    clientName: "آيس بِيك للمجمدات",
    productType: "آيس كريم",
    zone: "frozen",
    temperatureRange: { minC: -22, maxC: -18 },
    pickupLocation: "مستودع السلي المركزي",
    deliveryLocation: "فرع النخيل مول",
    pickupTime: "2026-05-07T07:00:00+03:00",
    deliveryWindow: { start: "2026-05-07T08:30:00+03:00", end: "2026-05-07T10:00:00+03:00" },
    maxTransitMinutes: 90,
    status: "delivered",
    slaPriority: "express",
    driverId: "drv_02",
    vehicleId: "veh_04",
    pickupTemperatureC: -20.4,
    currentTemperatureC: -19.6,
    deliveryTemperatureC: -19.6,
    temperatureLog: [
      { timestamp: "2026-05-07T07:00:00+03:00", valueC: -20.4, source: "connected", withinRange: true },
      { timestamp: "2026-05-07T08:00:00+03:00", valueC: -19.8, source: "connected", withinRange: true },
      { timestamp: "2026-05-07T09:10:00+03:00", valueC: -19.6, source: "connected", withinRange: true },
    ],
    pod: {
      receiverName: "فهد العتيبي",
      timestamp: "2026-05-07T09:14:00+03:00",
      deliveryTemperatureC: -19.6,
      productCondition: "good",
      driverName: "محمد القحطاني",
      vehicleId: "veh_04",
      temperatureCompliant: true,
      status: "complete",
    },
    riskLevel: "ok",
    alerts: [],
    vehiclePreCoolingConfirmed: true,
    createdAt: "2026-05-07T06:30:00+03:00",
  },
  {
    id: "ord_1045",
    reference: "QBL-1045",
    clientName: "مخبز ضاد",
    productType: "معجنات حساسة",
    zone: "ambient_sensitive",
    temperatureRange: { minC: 15, maxC: 22 },
    pickupLocation: "ورشة الإنتاج، العليا",
    deliveryLocation: "متجر الملقا",
    pickupTime: "2026-05-07T10:15:00+03:00",
    deliveryWindow: { start: "2026-05-07T11:00:00+03:00", end: "2026-05-07T12:30:00+03:00" },
    maxTransitMinutes: 60,
    status: "ready_for_dispatch",
    slaPriority: "standard",
    vehicleId: "veh_09",
    temperatureLog: [],
    pod: { status: "pending" },
    riskLevel: "watch",
    alerts: ["alr_02"],
    vehiclePreCoolingConfirmed: false,
    createdAt: "2026-05-07T09:50:00+03:00",
  },
  {
    id: "ord_1046",
    reference: "QBL-1046",
    clientName: "سوق الطازج",
    productType: "خضار ورقية",
    zone: "chilled",
    temperatureRange: { minC: 4, maxC: 8 },
    pickupLocation: "السوق المركزي",
    deliveryLocation: "فرع الورود",
    pickupTime: "2026-05-07T06:00:00+03:00",
    deliveryWindow: { start: "2026-05-07T07:00:00+03:00", end: "2026-05-07T08:30:00+03:00" },
    maxTransitMinutes: 60,
    status: "not_delivered",
    slaPriority: "standard",
    driverId: "drv_04",
    vehicleId: "veh_05",
    pickupTemperatureC: 5.2,
    currentTemperatureC: 5.8,
    temperatureLog: [
      { timestamp: "2026-05-07T06:00:00+03:00", valueC: 5.2, source: "connected", withinRange: true },
      { timestamp: "2026-05-07T07:30:00+03:00", valueC: 5.8, source: "connected", withinRange: true },
    ],
    pod: {
      status: "incomplete",
      exceptionNotes: "المستلم غير متاح، تم التواصل وإعادة الجدولة.",
    },
    riskLevel: "at_risk",
    alerts: ["alr_03"],
    vehiclePreCoolingConfirmed: true,
    createdAt: "2026-05-07T05:30:00+03:00",
  },
  {
    id: "ord_1047",
    reference: "QBL-1047",
    clientName: "مزارع الخير",
    productType: "ألبان مجمدة",
    zone: "frozen",
    temperatureRange: { minC: -22, maxC: -18 },
    pickupLocation: "مزرعة الخرج",
    deliveryLocation: "مستودع التوزيع، الرياض",
    pickupTime: "2026-05-07T05:30:00+03:00",
    deliveryWindow: { start: "2026-05-07T08:00:00+03:00", end: "2026-05-07T09:00:00+03:00" },
    maxTransitMinutes: 150,
    status: "cold_storage",
    slaPriority: "standard",
    vehicleId: "veh_02",
    pickupTemperatureC: -19.2,
    currentTemperatureC: -19.0,
    temperatureLog: [
      { timestamp: "2026-05-07T05:30:00+03:00", valueC: -19.2, source: "connected", withinRange: true },
      { timestamp: "2026-05-07T07:50:00+03:00", valueC: -19.0, source: "connected", withinRange: true },
    ],
    pod: { status: "pending" },
    riskLevel: "ok",
    alerts: [],
    vehiclePreCoolingConfirmed: true,
    createdAt: "2026-05-07T04:55:00+03:00",
  },
];

export const DRIVERS: Driver[] = [
  { id: "drv_01", name: "محمد القحطاني", phone: "+966 55 000 0001", vehicleId: "veh_03", activeOrders: 1, completedToday: 4, onTimeRate: 0.94, status: "on_route" },
  { id: "drv_02", name: "خالد الزهراني", phone: "+966 55 000 0002", vehicleId: "veh_04", activeOrders: 0, completedToday: 6, onTimeRate: 0.97, status: "loading" },
  { id: "drv_03", name: "أحمد الحربي", phone: "+966 55 000 0003", vehicleId: "veh_07", activeOrders: 1, completedToday: 3, onTimeRate: 0.92, status: "on_route" },
  { id: "drv_04", name: "سعد الدوسري", phone: "+966 55 000 0004", vehicleId: "veh_05", activeOrders: 0, completedToday: 5, onTimeRate: 0.89, status: "idle" },
];

export const VEHICLES: Vehicle[] = [
  { id: "veh_02", plateNumber: "أ ب ج 2402", driverName: undefined, zone: "frozen", targetRange: { minC: -22, maxC: -18 }, currentTemperatureC: -19.5, preCoolingStatus: "ready", sensorStatus: "connected", routeStatus: "loading", lastChecked: "2026-05-07T08:00:00+03:00" },
  { id: "veh_03", plateNumber: "ب د ر 7813", driverName: "محمد القحطاني", zone: "chilled", targetRange: { minC: 2, maxC: 8 }, currentTemperatureC: 9.2, preCoolingStatus: "ready", sensorStatus: "connected", routeStatus: "on_route", lastChecked: "2026-05-07T09:40:00+03:00" },
  { id: "veh_04", plateNumber: "س ص ع 1199", driverName: "خالد الزهراني", zone: "frozen", targetRange: { minC: -22, maxC: -18 }, currentTemperatureC: -19.6, preCoolingStatus: "ready", sensorStatus: "connected", routeStatus: "returning", lastChecked: "2026-05-07T09:14:00+03:00" },
  { id: "veh_05", plateNumber: "ع ل م 3322", driverName: "سعد الدوسري", zone: "chilled", targetRange: { minC: 4, maxC: 8 }, currentTemperatureC: 5.6, preCoolingStatus: "ready", sensorStatus: "manual", routeStatus: "idle", lastChecked: "2026-05-07T08:30:00+03:00" },
  { id: "veh_07", plateNumber: "ر ف ق 4781", driverName: "أحمد الحربي", zone: "chilled", targetRange: { minC: 2, maxC: 6 }, currentTemperatureC: 4.1, preCoolingStatus: "ready", sensorStatus: "connected", routeStatus: "on_route", lastChecked: "2026-05-07T09:30:00+03:00" },
  { id: "veh_09", plateNumber: "ج ب ل 9027", driverName: undefined, zone: "ambient_sensitive", targetRange: { minC: 15, maxC: 22 }, currentTemperatureC: 24.1, preCoolingStatus: "in_progress", sensorStatus: "connected", routeStatus: "idle", lastChecked: "2026-05-07T09:55:00+03:00" },
];

export const ALERTS: Alert[] = [
  { id: "alr_01", severity: "critical", type: "temp_out_of_range", orderId: "ord_1043", vehicleId: "veh_03", message: "حرارة المركبة 9.2°م خارج النطاق 2–8°م", timestamp: "2026-05-07T09:40:00+03:00", actionRequired: "تواصل فوري مع السائق وفحص وحدة التبريد." },
  { id: "alr_02", severity: "high", type: "vehicle_not_pre_cooled", orderId: "ord_1045", vehicleId: "veh_09", message: "المركبة لم تكتمل دورة التبريد قبل التحميل", timestamp: "2026-05-07T09:55:00+03:00", actionRequired: "تأجيل التحميل حتى وصول الحرارة للنطاق." },
  { id: "alr_03", severity: "medium", type: "failed_delivery", orderId: "ord_1046", message: "تعذر التسليم — المستلم غير متاح", timestamp: "2026-05-07T08:10:00+03:00", actionRequired: "إعادة جدولة وإرجاع تحت التبريد." },
  { id: "alr_04", severity: "low", type: "missing_temp", orderId: "ord_1045", message: "لا توجد قراءة حرارة مسجلة للطلب", timestamp: "2026-05-07T09:50:00+03:00", actionRequired: "إدخال قراءة يدوية مع السبب." },
];

export const FAILED_DELIVERY_REASONS = [
  { key: "customer_unavailable", labelAr: "المستلم غير متاح" },
  { key: "wrong_location", labelAr: "عنوان خاطئ" },
  { key: "window_missed", labelAr: "تم تفويت نافذة التسليم" },
  { key: "rejected_condition", labelAr: "رفض الاستلام بسبب حالة المنتج" },
  { key: "temp_breach", labelAr: "تجاوز الحرارة" },
  { key: "damaged", labelAr: "تلف المنتج" },
  { key: "payment_issue", labelAr: "مشكلة في الدفع" },
  { key: "access_issue", labelAr: "صعوبة الوصول" },
  { key: "rescheduled", labelAr: "إعادة جدولة من العميل" },
  { key: "vehicle_issue", labelAr: "عطل في المركبة" },
  { key: "route_delay", labelAr: "تأخر المسار" },
] as const;

export const SLA_RULES = [
  { ar: "أقصى مدة بقاء في حالة جاهز للإرسال", value: "30 دقيقة" },
  { ar: "أقصى انحراف عن نافذة التسليم", value: "15 دقيقة" },
  { ar: "أقصى مدة خروج عن نطاق الحرارة", value: "5 دقائق" },
  { ar: "أقصى توقف للسائق دون سبب", value: "10 دقائق" },
  { ar: "أقصى مدة انتظار في التخزين المبرد", value: "حسب نوع المنتج" },
];

export const REPORT_TYPES = [
  { ar: "تقرير الطلبات اليومي", desc: "إجمالي الطلبات، الحالة، ونسب الإنجاز." },
  { ar: "تقرير الالتزام الزمني (SLA)", desc: "معدل التسليم في الوقت ونوافذ التأخير." },
  { ar: "تقرير التزام الحرارة", desc: "نسبة الطلبات ضمن النطاق ومدد الخروج عنه." },
  { ar: "تقرير أسباب التسليم الفاشل", desc: "تصنيف الأسباب وتكرارها." },
  { ar: "تقرير أداء السائقين", desc: "الالتزام، التسليم في الوقت، والاستثناءات." },
  { ar: "تقرير استخدام المركبات", desc: "معدل التشغيل، فحوص ما قبل الرحلة، التنبيهات." },
  { ar: "تقرير أداء العميل", desc: "حجم الطلبات، الاستثناءات، نسب الالتزام." },
  { ar: "تقرير التلف والاستثناءات", desc: "الحالات الموثقة وأسباب التلف." },
];

// Helpers
export function getOrder(id: string) {
  return COLD_CHAIN_ORDERS.find((o) => o.id === id);
}

export function getDriver(id?: string) {
  return id ? DRIVERS.find((d) => d.id === id) : undefined;
}

export function getVehicle(id?: string) {
  return id ? VEHICLES.find((v) => v.id === id) : undefined;
}

export function getAlert(id: string) {
  return ALERTS.find((a) => a.id === id);
}

export function isWithinRange(value: number, range: TemperatureRange) {
  return value >= range.minC && value <= range.maxC;
}

export function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("ar-SA", { day: "2-digit", month: "2-digit", year: "numeric" });
}
