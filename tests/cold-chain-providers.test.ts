import assert from "node:assert/strict";
import { test } from "node:test";
import {
  applyProviderMapping,
  applyProviderMappingBatch,
  NATIVE_MAPPING,
  resolveProviderMapping,
  toCelsius,
  type ProviderMapping,
} from "../lib/cold-chain/providers";
import { normalizeColdChainTelemetryPayload } from "../lib/cold-chain/telemetry";

/**
 * نقطة الاستقبال كانت تقبل شكلاً واحداً. مزوّد يرسل {device_id, temp_f, ts}
 * — وهو الشكل الأشيع — كان يُرفض، فيصير إدخال أي مزوّد تعديلَ كود ونشراً.
 */

const VENDOR: ProviderMapping = {
  id: "acme",
  sensorId: "device.id",
  celsius: "readings.temp_f",
  vehiclePlate: "vehicle.plate",
  recordedAt: "readings.ts",
  unit: "F",
};

test("فهرنهايت يتحول لا يُمرَّر كما هو", () => {
  assert.equal(toCelsius(39.2, "F"), 4);
  assert.equal(toCelsius(-0.4, "F"), -18);
  assert.equal(toCelsius(4, "C"), 4);
  assert.equal(toCelsius(4, undefined), 4, "غياب الوحدة يعني مئوية");
});

test("شكل مزوّد مختلف يُحوَّل إلى الشكل الأصلي ويمر بالتحقق نفسه", () => {
  const vendorPayload = {
    device: { id: "probe-A1" },
    vehicle: { plate: "ر ي د 3201" },
    readings: { temp_f: 39.2, ts: "2026-09-21T10:00:00.000Z" },
  };

  const mapped = applyProviderMapping(vendorPayload, VENDOR);
  assert.equal(mapped.celsius, 4);
  assert.equal(mapped.sensorId, "probe-A1");
  assert.equal(mapped.vehiclePlate, "ر ي د 3201");

  // الشرط: مسار الدخول يختلف وحدود العقل والأمان واحدة.
  const event = normalizeColdChainTelemetryPayload(mapped);
  assert.equal(event.celsius, 4);
  assert.equal(event.sensorId, "probe-A1");
  assert.equal(event.vehiclePlate, "ر ي د 3201");
});

test("حقل مفقود يُحذف ولا يُمرَّر undefined يكسر التحقق", () => {
  const mapped = applyProviderMapping({ device: {}, readings: { temp_f: 39.2 } }, VENDOR);
  assert.ok(!("vehiclePlate" in mapped));
  assert.ok(!("sensorId" in mapped));
  assert.equal(mapped.celsius, 4);
});

test("دفعة قراءات في نداء واحد تُحوَّل عنصراً عنصراً", () => {
  const batch: ProviderMapping = { ...VENDOR, batchPath: "data" };
  const entries = applyProviderMappingBatch(
    {
      data: [
        { device: { id: "p1" }, readings: { temp_f: 39.2, ts: "2026-09-21T10:00:00.000Z" } },
        { device: { id: "p2" }, readings: { temp_f: 32, ts: "2026-09-21T10:01:00.000Z" } },
      ],
    },
    batch,
  );

  assert.equal(entries.length, 2);
  assert.equal(entries[0].celsius, 4);
  assert.equal(entries[1].celsius, 0);
});

test("مسار دفعة ليس مصفوفة يُرفض ولا يُفسَّر بالتخمين", () => {
  assert.throws(
    () => applyProviderMappingBatch({ data: { not: "an array" } }, { ...VENDOR, batchPath: "data" }),
    /BATCH_PATH_NOT_ARRAY/,
  );
});

test("غياب اسم المزوّد يعني الشكل الأصلي، واسم مجهول يُرفض", () => {
  assert.equal(resolveProviderMapping(null)?.id, NATIVE_MAPPING.id);
  assert.equal(resolveProviderMapping("not-registered"), null, "لا تخمين لشكل بيانات مجهول");
});

test("التعريفات تُقرأ من البيئة، وتعريف ناقص يُهمل بلا إسقاط الاستقبال", () => {
  const previous = process.env.COLD_CHAIN_PROVIDER_MAPPINGS;
  process.env.COLD_CHAIN_PROVIDER_MAPPINGS = JSON.stringify([
    { id: "good", celsius: "t" },
    { id: "no-celsius" },
    { celsius: "t" },
  ]);
  try {
    assert.equal(resolveProviderMapping("good")?.celsius, "t");
    assert.equal(resolveProviderMapping("no-celsius"), null, "محوّل لا يعرف أين الحرارة لا يحوّل");
    assert.equal(resolveProviderMapping(NATIVE_MAPPING.id)?.id, NATIVE_MAPPING.id, "الأصلي يبقى دائماً");
  } finally {
    if (previous) process.env.COLD_CHAIN_PROVIDER_MAPPINGS = previous;
    else delete process.env.COLD_CHAIN_PROVIDER_MAPPINGS;
  }
});

test("تعريف تالف لا يُسقط الاستقبال", () => {
  const previous = process.env.COLD_CHAIN_PROVIDER_MAPPINGS;
  process.env.COLD_CHAIN_PROVIDER_MAPPINGS = "{ not json";
  try {
    assert.equal(resolveProviderMapping(NATIVE_MAPPING.id)?.id, NATIVE_MAPPING.id);
  } finally {
    if (previous) process.env.COLD_CHAIN_PROVIDER_MAPPINGS = previous;
    else delete process.env.COLD_CHAIN_PROVIDER_MAPPINGS;
  }
});
