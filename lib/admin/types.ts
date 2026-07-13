// أنواع نطاق لوحة التحكم الإدارية (Admin) — مستخلصة من مواصفة docs/migration/spec.md

export type AdminOrderStatus =
  | "CREATED"
  | "PENDING_APPROVAL"
  | "ASSIGNED"
  | "OUT_FOR_DELIVERY"
  | "ARRIVED"
  | "DELIVERED"
  | "POSTPONED"
  | "RETURNED"
  | "FAILED"
  | "CANCELLED";

export type AdminPaymentMethod = "CASH" | "MADA" | "VISA" | "MASTER" | "PREPAID";

export type AdminCodStatus = "WITH_COURIER" | "RECEIVED" | "SORTED" | "EXPORTED" | "SETTLED";

export type CodSettlementStatus = "SORTED" | "EXPORTED" | "DELIVERED";

export type ExpenseType = "DRIVER" | "HUB" | "PARTNER" | "OTHER";

export type AdminOrder = {
  id: string;
  publicCode: string;
  reference: string;
  barcode: string;
  clientAccountId: string;
  clientName: string;
  customerName: string;
  customerArea: string;
  courierId: string | null;
  courierName: string | null;
  hubName: string;
  status: AdminOrderStatus;
  serviceType: string;
  paymentMethod: AdminPaymentMethod;
  codAmount: number;
  deliveryFee: number;
  codStatus: AdminCodStatus | null;
  isFollowUp: boolean;
  isDelayed: boolean;
  notes: string | null;
  scheduledAt: string;
  deliveredAt: string | null;
  postponedAt: string | null;
};

export type FleetCourier = {
  id: string;
  employeeCode: string;
  displayName: string;
  phoneMasked: string;
  status: "AVAILABLE" | "ON_TASK" | "LATE" | "OFFLINE";
  hubName: string;
  vehicleLabel: string;
  assignedOrders: number;
  deliveredToday: number;
  successRate: number;
  codCustody: number;
  lastPingAt: string;
};

export type FleetVehicle = {
  id: string;
  plateNumber: string;
  label: string;
  make: string;
  model: string;
  coldRange: string;
  supportsFrozen: boolean;
  status: "ACTIVE" | "MAINTENANCE" | "OFFLINE";
  courierName: string | null;
  loadedOrders: number;
  insuranceExpiry: string;
  licenseExpiry: string;
};

export type CodCustodyRow = {
  courierId: string;
  courierName: string;
  ordersCount: number;
  totalCod: number;
  totalFees: number;
};

export type CodSettlementRow = {
  id: string;
  clientAccountId: string;
  clientName: string;
  status: CodSettlementStatus;
  ordersCount: number;
  totalCod: number;
  totalFees: number;
  vatAmount: number;
  netToClient: number;
  sortedAt: string;
  exportedAt: string | null;
  deliveredAt: string | null;
};

export type ExpenseRow = {
  id: string;
  type: ExpenseType;
  amount: number;
  note: string;
  spentAt: string;
};

export type FinancialSummary = {
  deliveredCodSum: number;
  deliveryFeesSum: number;
  returnedFeesSum: number;
  expensesSum: number;
  expensesByType: Record<ExpenseType, number>;
  vatSum: number;
  netProfit: number;
  dueToClients: number;
  codWithCouriers: number;
};

export type DriverReportRow = {
  courierId: string;
  courierName: string;
  totalOrders: number;
  delivered: number;
  returned: number;
  postponed: number;
  inProgress: number;
  successRate: number;
  codCollected: number;
};

export type ClientReportRow = {
  clientAccountId: string;
  clientName: string;
  sector: string;
  totalOrders: number;
  delivered: number;
  returned: number;
  codTotal: number;
  feesTotal: number;
  lastOrderAt: string;
};

export type StatusDistribution = { status: AdminOrderStatus; count: number };
export type CityDistribution = { area: string; count: number; delivered: number };

export type AdminDashboard = {
  cards: StatusDistribution[];
  followUpCount: number;
  pendingApprovalCount: number;
  activeCouriers: number;
  totalCouriers: number;
  todayDeliveredCod: number;
  todayFees: number;
};

// ─── تسميات العرض العربية ───

export const orderStatusLabels: Record<AdminOrderStatus, string> = {
  CREATED: "طلب جديد",
  PENDING_APPROVAL: "بانتظار الموافقة",
  ASSIGNED: "معيّن لمندوب",
  OUT_FOR_DELIVERY: "خرج للتوصيل",
  ARRIVED: "وصل للعميل",
  DELIVERED: "تم التوصيل",
  POSTPONED: "مؤجل",
  RETURNED: "مرتجع",
  FAILED: "فشل التوصيل",
  CANCELLED: "ملغي",
};

export const paymentMethodLabels: Record<AdminPaymentMethod, string> = {
  CASH: "نقدًا",
  MADA: "مدى",
  VISA: "فيزا",
  MASTER: "ماستر كارد",
  PREPAID: "مدفوع مسبقًا",
};

export const codStatusLabels: Record<AdminCodStatus, string> = {
  WITH_COURIER: "في عهدة المندوب",
  RECEIVED: "مستلم من المندوب",
  SORTED: "مفرز",
  EXPORTED: "مصدَّر للعميل",
  SETTLED: "مسلَّم للعميل",
};

export const settlementStatusLabels: Record<CodSettlementStatus, string> = {
  SORTED: "مفرز",
  EXPORTED: "مصدَّر",
  DELIVERED: "مسلَّم",
};

export const expenseTypeLabels: Record<ExpenseType, string> = {
  DRIVER: "مصروف مندوب",
  HUB: "مصروف فرع",
  PARTNER: "مصروف شريك",
  OTHER: "أخرى",
};

export const VAT_RATE = 0.15;
