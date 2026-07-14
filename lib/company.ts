// تسميات حالات الطلب والمندوب المستخدمة في النظام التشغيلي (لوحة العمليات، الشارات، البيانات).
export const statusLabels = {
  CREATED: "تم إنشاء الطلب",
  ASSIGNED: "تم إسناد المندوب",
  OUT_FOR_DELIVERY: "خرج للتسليم",
  ARRIVED: "وصل المندوب",
  DELIVERED: "تم التسليم",
  FAILED: "تعذر التسليم",
} as const;

export const courierStatusLabels = {
  AVAILABLE: "متاح",
  ON_TASK: "في مهمة",
  LATE: "متأخر",
  OFFLINE: "غير متصل",
} as const;
