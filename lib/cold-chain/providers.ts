import "server-only";

/**
 * طبقة محوّلات المزوّدين.
 *
 * نقطة الاستقبال كانت تقبل شكلاً واحداً: {sensorId, celsius, recordedAt}.
 * مزوّد يرسل {device_id, temp_f, ts} — وهو الشكل الأشيع — كان يُرفض، فيصبح
 * إدخال أي مزوّد تعديلَ كود ونشراً. المطلوب أن يكون إعداداً.
 *
 * المحوّل تعريف بيانات لا شيفرة: مسارات حقول، ووحدة حرارة، وصيغة وقت.
 * يُقرأ من متغيّر بيئة فلا يحتاج إدخال مزوّد جديد إلى دورة نشر، ولا يحمل
 * التعريف أي سر — المفتاح يبقى في متغيّره المنفصل.
 */

export type TemperatureUnit = "C" | "F";

export type ProviderMapping = {
  id: string;
  label?: string;
  /** مسار الحقل داخل الكائن، بنقاط: "data.device.id" */
  sensorId?: string;
  celsius?: string;
  vehiclePlate?: string;
  vehicleId?: string;
  orderPublicCode?: string;
  orderReference?: string;
  recordedAt?: string;
  latitude?: string;
  longitude?: string;
  unit?: TemperatureUnit;
  /** مسار المصفوفة حين يرسل المزوّد دفعة قراءات في نداء واحد. */
  batchPath?: string;
};

export class ProviderMappingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProviderMappingError";
  }
}

/** الشكل الأصلي: ما تقبله نقطة الاستقبال بلا محوّل. */
export const NATIVE_MAPPING: ProviderMapping = {
  id: "qbl-native",
  label: "الشكل الأصلي",
  sensorId: "sensorId",
  celsius: "celsius",
  vehiclePlate: "vehiclePlate",
  vehicleId: "vehicleId",
  orderPublicCode: "orderPublicCode",
  orderReference: "orderReference",
  recordedAt: "recordedAt",
  latitude: "latitude",
  longitude: "longitude",
  unit: "C",
};

function readPath(source: unknown, path: string | undefined): unknown {
  if (!path) return undefined;
  return path.split(".").reduce<unknown>((value, key) => {
    if (value === null || typeof value !== "object") return undefined;
    return (value as Record<string, unknown>)[key];
  }, source);
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function toText(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim() !== "") return value.trim();
  if (typeof value === "number") return String(value);
  return undefined;
}

/** فهرنهايت إلى مئوية. مزوّد يرسل 39.2°F يعني +4°م لا حرارة مستحيلة. */
export function toCelsius(value: number, unit: TemperatureUnit | undefined): number {
  const celsius = unit === "F" ? ((value - 32) * 5) / 9 : value;
  return Math.round(celsius * 100) / 100;
}

/**
 * يُطبّق المحوّل فيُنتج الشكل الأصلي. لا يتحقق من صحة القيم — هذا عمل
 * normalizeColdChainTelemetryPayload بعده، وهو الذي يملك حدود العقل والأمان.
 */
export function applyProviderMapping(payload: unknown, mapping: ProviderMapping): Record<string, unknown> {
  const celsiusRaw = toNumber(readPath(payload, mapping.celsius));
  const latitude = toNumber(readPath(payload, mapping.latitude));
  const longitude = toNumber(readPath(payload, mapping.longitude));

  const mapped: Record<string, unknown> = {
    sensorId: toText(readPath(payload, mapping.sensorId)),
    vehiclePlate: toText(readPath(payload, mapping.vehiclePlate)),
    vehicleId: toText(readPath(payload, mapping.vehicleId)),
    orderPublicCode: toText(readPath(payload, mapping.orderPublicCode)),
    orderReference: toText(readPath(payload, mapping.orderReference)),
    recordedAt: readPath(payload, mapping.recordedAt),
  };

  if (celsiusRaw !== undefined) mapped.celsius = toCelsius(celsiusRaw, mapping.unit);
  if (latitude !== undefined) mapped.latitude = latitude;
  if (longitude !== undefined) mapped.longitude = longitude;

  for (const key of Object.keys(mapped)) {
    if (mapped[key] === undefined) delete mapped[key];
  }
  return mapped;
}

/** دفعة في نداء واحد: يُعاد كل عنصر محوّلاً على حدة. */
export function applyProviderMappingBatch(payload: unknown, mapping: ProviderMapping): Record<string, unknown>[] {
  if (!mapping.batchPath) return [applyProviderMapping(payload, mapping)];
  const batch = readPath(payload, mapping.batchPath);
  if (!Array.isArray(batch)) throw new ProviderMappingError("BATCH_PATH_NOT_ARRAY");
  return batch.map((entry) => applyProviderMapping(entry, mapping));
}

let cached: { raw: string; mappings: Map<string, ProviderMapping> } | null = null;

/**
 * تعريفات المزوّدين من البيئة. الشكل: مصفوفة JSON من ProviderMapping.
 * تعريف بلا id أو بلا مسار حرارة يُهمل — محوّل لا يعرف أين الحرارة لا يحوّل.
 */
export function getProviderMappings(): Map<string, ProviderMapping> {
  const raw = process.env.COLD_CHAIN_PROVIDER_MAPPINGS?.trim() ?? "";
  if (cached && cached.raw === raw) return cached.mappings;

  const mappings = new Map<string, ProviderMapping>([[NATIVE_MAPPING.id, NATIVE_MAPPING]]);

  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      const entries = Array.isArray(parsed) ? parsed : [parsed];
      for (const entry of entries) {
        if (!entry || typeof entry !== "object") continue;
        const mapping = entry as ProviderMapping;
        if (!mapping.id || !mapping.celsius) continue;
        mappings.set(mapping.id, { unit: "C", ...mapping });
      }
    } catch {
      // تعريف تالف لا يُسقط الاستقبال: الشكل الأصلي يبقى عاملاً.
    }
  }

  cached = { raw, mappings };
  return mappings;
}

export function resolveProviderMapping(providerId: string | null | undefined): ProviderMapping | null {
  if (!providerId) return NATIVE_MAPPING;
  return getProviderMappings().get(providerId) ?? null;
}
