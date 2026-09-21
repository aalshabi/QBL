/**
 * حدود الحرارة وصلاحية القراءة.
 *
 * كان التقييم يقارن كل قراءة بنطاق المركبة الواحد (coldRangeMin/Max): فان
 * مبرّد يحمل شحنة مجمدة عند -18 وشحنة طازجة عند +4 في الرحلة نفسها، ونطاق
 * واحد يجعل إحداهما تبدو سليمة دائماً والأخرى منذرة دائماً. المطلوب هو نطاق
 * الشحنة، والمركبة ليست إلا سقفاً لما تستطيع تحقيقه.
 *
 * والصلاحية مسألة منفصلة: قراءة صحيحة عمرها ساعتان ليست "ضمن النطاق"، هي
 * قراءة لا نعرف ما بعدها. الحالة المخزّنة تصف لحظة القياس، والحالة المعروضة
 * تُحسب وقت العرض.
 */

export type TemperatureBounds = { min: number; max: number };

export type TemperatureState = "IN_RANGE" | "OUT_OF_RANGE" | "STALE" | "NO_DATA";

export type TemperatureEvaluation = {
  state: TemperatureState;
  severity: "NORMAL" | "WARNING" | "CRITICAL" | "NOT_AVAILABLE";
  ageMinutes: number | null;
  bounds: TemperatureBounds | null;
};

/** بعد هذه المدة تُعدّ القراءة قديمة ما لم تُضبط مدة للشحنة. */
export const DEFAULT_STALE_AFTER_MINUTES = 30;

/** تجاوز النطاق بأكثر من هذا يُصعّد الإنذار. */
const CRITICAL_MARGIN_C = 3;

const ARABIC_DIGITS = /[٠-٩]/g;

function normalizeNumerals(value: string): string {
  return value.replace(ARABIC_DIGITS, (digit) => String(digit.charCodeAt(0) - 0x0660));
}

/**
 * يقرأ متطلب الشحنة المكتوب بالعربية إلى حدّين رقميين.
 * الصيغ المدعومة: «0 إلى +5»، «-18 إلى -12»، «حتى -18»، «من 2 إلى 8».
 * ما لا يُفهم يُعاد null بدل تخمين نطاق — نطاق مخمّن أسوأ من غياب النطاق.
 */
export function parseTemperatureTarget(target: string | null | undefined): TemperatureBounds | null {
  if (!target) return null;
  const text = normalizeNumerals(String(target))
    .replace(/[−–—]/g, "-")
    .replace(/°\s*(م|c)/gi, " ")
    .trim();

  const range = text.match(/(-?\+?\d+(?:\.\d+)?)\s*(?:إلى|الى|to|~|\.\.)\s*(-?\+?\d+(?:\.\d+)?)/i);
  if (range) {
    const first = Number(range[1].replace("+", ""));
    const second = Number(range[2].replace("+", ""));
    if (Number.isFinite(first) && Number.isFinite(second)) {
      return { min: Math.min(first, second), max: Math.max(first, second) };
    }
  }

  // «حتى -18»: سقف علوي، ولا حدّ سفلي معلن — أبرد من المطلوب ليس خرقاً هنا.
  const ceiling = text.match(/(?:حتى|اقل من|أقل من|below|under|max)\s*(-?\+?\d+(?:\.\d+)?)/i);
  if (ceiling) {
    const value = Number(ceiling[1].replace("+", ""));
    if (Number.isFinite(value)) return { min: Number.NEGATIVE_INFINITY, max: value };
  }

  return null;
}

/**
 * نطاق الشحنة أولاً، ثم نطاق المركبة كبديل. لا يُخترع نطاق عند غياب الاثنين.
 */
export function resolveBounds(input: {
  orderTarget?: string | null;
  vehicleMin?: number | null;
  vehicleMax?: number | null;
}): TemperatureBounds | null {
  const fromOrder = parseTemperatureTarget(input.orderTarget);
  if (fromOrder) return fromOrder;

  const { vehicleMin, vehicleMax } = input;
  if (typeof vehicleMin === "number" && typeof vehicleMax === "number" && Number.isFinite(vehicleMin) && Number.isFinite(vehicleMax)) {
    return { min: Math.min(vehicleMin, vehicleMax), max: Math.max(vehicleMin, vehicleMax) };
  }

  return null;
}

/** حالة القياس لحظة أخذه — هذه هي التي تُخزَّن. */
export function classifyReading(celsius: number, bounds: TemperatureBounds | null): "NORMAL" | "WARNING" | "CRITICAL" | "NOT_AVAILABLE" {
  if (!bounds) return "NOT_AVAILABLE";
  if (celsius >= bounds.min && celsius <= bounds.max) return "NORMAL";
  const nearest = celsius < bounds.min ? bounds.min : bounds.max;
  return Math.abs(celsius - nearest) > CRITICAL_MARGIN_C ? "CRITICAL" : "WARNING";
}

export function staleAfterMinutes(override?: number | null): number {
  if (typeof override === "number" && Number.isFinite(override) && override > 0) return override;
  const fromEnv = Number(process.env.COLD_CHAIN_STALE_AFTER_MINUTES);
  return Number.isFinite(fromEnv) && fromEnv > 0 ? fromEnv : DEFAULT_STALE_AFTER_MINUTES;
}

/**
 * الحالة المعروضة. قراءة مفقودة أو قديمة لا تُعرض أبداً كحالة سليمة، حتى لو
 * كانت قيمتها وقت القياس ضمن النطاق تماماً.
 */
export function evaluateTemperature(input: {
  celsius?: number | null;
  recordedAt?: Date | string | null;
  bounds: TemperatureBounds | null;
  now?: Date;
  staleAfter?: number | null;
}): TemperatureEvaluation {
  const { celsius, recordedAt, bounds } = input;
  if (celsius == null || recordedAt == null) {
    return { state: "NO_DATA", severity: "NOT_AVAILABLE", ageMinutes: null, bounds };
  }

  const now = input.now ?? new Date();
  const recorded = recordedAt instanceof Date ? recordedAt : new Date(recordedAt);
  if (Number.isNaN(recorded.getTime())) {
    return { state: "NO_DATA", severity: "NOT_AVAILABLE", ageMinutes: null, bounds };
  }

  const ageMinutes = Math.max(0, Math.floor((now.getTime() - recorded.getTime()) / 60_000));
  if (ageMinutes > staleAfterMinutes(input.staleAfter)) {
    return { state: "STALE", severity: "WARNING", ageMinutes, bounds };
  }

  const severity = classifyReading(celsius, bounds);
  if (severity === "NOT_AVAILABLE") {
    return { state: "NO_DATA", severity, ageMinutes, bounds };
  }

  return {
    state: severity === "NORMAL" ? "IN_RANGE" : "OUT_OF_RANGE",
    severity,
    ageMinutes,
    bounds,
  };
}

export const TEMPERATURE_STATE_LABEL: Record<TemperatureState, string> = {
  IN_RANGE: "ضمن النطاق",
  OUT_OF_RANGE: "خارج النطاق",
  STALE: "قراءة قديمة",
  NO_DATA: "لا توجد بيانات",
};
