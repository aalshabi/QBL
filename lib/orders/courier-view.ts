import type { OrderStatus } from "@/lib/domain";
import type { TemperatureState } from "@/lib/cold-chain/thresholds";

/**
 * ما تحتاجه شاشة المندوب فعلاً، لا أكثر. الشاشة تُقرأ في الشارع بيد واحدة،
 * وكل حقل زائد هنا يتحول إلى سطر يزاحم الخطوة التالية على الانتباه.
 * لا يمر عبرها رقم جوال أو اسم إلا لطلب مسند لهذا المندوب.
 */
export type CourierOrderView = {
  id: string;
  publicCode: string;
  status: OrderStatus;
  dropoffAddress: string;
  dropoffLatitude: number;
  dropoffLongitude: number;
  customerName: string;
  customerPhone: string;
  serviceType: string;
  temperatureTarget: string;
  scheduledAt: string;
  isDelayed: boolean;
  temperature: { celsius: number; state: TemperatureState; ageMinutes: number | null } | null;
};

/** الخطوة الواحدة المطلوبة الآن من المندوب في هذه الحالة. */
export type NextStep =
  | { kind: "START"; label: "ابدأ التوصيل"; target: "OUT_FOR_DELIVERY" }
  | { kind: "ARRIVE"; label: "وصلت"; target: "ARRIVED" }
  | { kind: "DELIVER"; label: "تأكيد التسليم"; target: "DELIVERED" }
  | { kind: "DONE"; label: "انتهى الطلب"; target: null };

export function nextStepFor(status: OrderStatus): NextStep {
  switch (status) {
    case "ASSIGNED":
      return { kind: "START", label: "ابدأ التوصيل", target: "OUT_FOR_DELIVERY" };
    case "OUT_FOR_DELIVERY":
      return { kind: "ARRIVE", label: "وصلت", target: "ARRIVED" };
    case "ARRIVED":
      return { kind: "DELIVER", label: "تأكيد التسليم", target: "DELIVERED" };
    default:
      return { kind: "DONE", label: "انتهى الطلب", target: null };
  }
}

/**
 * رابط ملاحة عبر Google Maps URLs — لا يستهلك مفتاحاً ولا حصة، ويفتح تطبيق
 * الخرائط المثبت على الجهاز. Routes API غير مفعّل ولا يلزم لهذه الخطوة.
 */
export function navigationUrl(latitude: number, longitude: number): string {
  const destination = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`;
}

/** رقم الهاتف كما يقبله المتصفح في tel: — أرقام و+ فقط. */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
