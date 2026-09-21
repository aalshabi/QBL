import assert from "node:assert/strict";
import { test } from "node:test";
import { mapCourier, maskPhone, type CourierRow } from "../lib/ops/live-data";

/**
 * لوحة العمليات كانت تعرض mock. الخطر عند وصلها بالقاعدة ليس الخطأ الظاهر،
 * بل القيمة الافتراضية التي تبدو معقولة: صفر,صفر إحداثية صالحة، ورقم جوال كامل
 * على شاشة مشتركة تسريب.
 */

const base: CourierRow = {
  id: "courier-1",
  employeeCode: "QBL-C-001",
  displayName: "مندوب تجريبي",
  phone: "0551234567",
  status: "AVAILABLE",
  vehicleId: "vehicle-1",
  pings: [],
};

test("مندوب بلا نبضة موقع لا يحصل على إحداثية مخترعة", () => {
  const courier = mapCourier(base);
  assert.ok(Number.isNaN(courier.latitude), "لا إحداثية افتراضية");
  assert.ok(Number.isNaN(courier.longitude));
  assert.equal(courier.lastPingAt, "");
  assert.notEqual(courier.latitude, 0, "صفر,صفر موقع حقيقي في خليج غينيا");
});

test("آخر نبضة هي المعروضة، ووقتها ظاهر", () => {
  const recordedAt = new Date("2026-09-21T10:00:00.000Z");
  const courier = mapCourier({ ...base, pings: [{ latitude: "24.7136", longitude: "46.6753", recordedAt }] });

  assert.equal(courier.latitude, 24.7136);
  assert.equal(courier.longitude, 46.6753);
  assert.equal(courier.lastPingAt, recordedAt.toISOString());
});

test("رقم الجوال لا يظهر كاملاً على شاشة العمليات", () => {
  assert.equal(maskPhone("0551234567"), "••••4567");
  assert.equal(maskPhone("+966 55 123 4567"), "••••4567");
  assert.ok(!maskPhone("0551234567").includes("055"), "لا يظهر المقدّمة");
  assert.equal(maskPhone("123"), "123", "رقم قصير لا يُقنَّع بما يزيد عن طوله");
});

test("مركبة غير مسندة لا تُكسر الشكل", () => {
  const courier = mapCourier({ ...base, vehicleId: null });
  assert.equal(courier.vehicleId, "");
});
