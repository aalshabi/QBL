import assert from "node:assert/strict";
import { test } from "node:test";
import {
  classifyReading,
  evaluateTemperature,
  parseTemperatureTarget,
  resolveBounds,
  TEMPERATURE_STATE_LABEL,
} from "../lib/cold-chain/thresholds";

/**
 * نطاق المركبة الواحد كان يحكم على كل شحنة. الفان يحمل مجمداً عند -18 وطازجاً
 * عند +4 في الرحلة نفسها، فأحدهما يبدو سليماً دائماً والآخر منذراً دائماً.
 * والقراءة الصحيحة تتقادم: قيمتها لا تتغير، لكن دلالتها تنتهي.
 */

test("متطلب الشحنة يُقرأ من نصه العربي", () => {
  assert.deepEqual(parseTemperatureTarget("0 إلى +5"), { min: 0, max: 5 });
  assert.deepEqual(parseTemperatureTarget("-18 إلى -12"), { min: -18, max: -12 });
  assert.deepEqual(parseTemperatureTarget("من 2 إلى 8"), { min: 2, max: 8 });
  assert.deepEqual(parseTemperatureTarget("٠ إلى ٥"), { min: 0, max: 5 }, "الأرقام العربية");
});

test("«حتى -18» سقف لا نطاق — أبرد من المطلوب ليس خرقاً", () => {
  const bounds = parseTemperatureTarget("حتى -18");
  assert.equal(bounds?.max, -18);
  assert.equal(bounds?.min, Number.NEGATIVE_INFINITY);
  assert.equal(classifyReading(-25, bounds), "NORMAL");
  assert.equal(classifyReading(-10, bounds), "CRITICAL");
});

test("ما لا يُفهم لا يُخمَّن", () => {
  assert.equal(parseTemperatureTarget("مبرّد"), null);
  assert.equal(parseTemperatureTarget(""), null);
  assert.equal(parseTemperatureTarget(null), null);
  assert.equal(classifyReading(4, null), "NOT_AVAILABLE", "بلا نطاق لا حكم");
});

test("نطاق الشحنة يسبق نطاق المركبة", () => {
  const bounds = resolveBounds({ orderTarget: "حتى -18", vehicleMin: 0, vehicleMax: 5 });
  assert.equal(bounds?.max, -18, "لا يُستخدم نطاق المركبة عند وجود متطلب الشحنة");

  const fallback = resolveBounds({ orderTarget: null, vehicleMin: 0, vehicleMax: 5 });
  assert.deepEqual(fallback, { min: 0, max: 5 });

  assert.equal(resolveBounds({ orderTarget: null, vehicleMin: null, vehicleMax: null }), null);
});

test("نفس القراءة تُحكم مختلفاً حسب الشحنة", () => {
  const frozen = resolveBounds({ orderTarget: "حتى -18" });
  const chilled = resolveBounds({ orderTarget: "0 إلى +5" });

  assert.equal(classifyReading(4, chilled), "NORMAL");
  assert.equal(classifyReading(4, frozen), "CRITICAL");
});

test("تجاوز طفيف تحذير وتجاوز كبير حرج", () => {
  const bounds = { min: 0, max: 5 };
  assert.equal(classifyReading(7, bounds), "WARNING");
  assert.equal(classifyReading(12, bounds), "CRITICAL");
  assert.equal(classifyReading(-2, bounds), "WARNING");
});

test("قراءة متقادمة لا تُعرض سليمة مهما كانت قيمتها", () => {
  const now = new Date("2026-09-21T12:00:00.000Z");
  const bounds = { min: 0, max: 5 };

  const fresh = evaluateTemperature({
    celsius: 3,
    recordedAt: new Date("2026-09-21T11:55:00.000Z"),
    bounds,
    now,
  });
  assert.equal(fresh.state, "IN_RANGE");
  assert.equal(fresh.ageMinutes, 5);

  const stale = evaluateTemperature({
    celsius: 3,
    recordedAt: new Date("2026-09-21T10:00:00.000Z"),
    bounds,
    now,
  });
  assert.equal(stale.state, "STALE", "قيمة سليمة لكن عمرها ساعتان");
  assert.notEqual(stale.severity, "NORMAL", "لا تبقى خضراء على شاشة العمليات");
  assert.equal(stale.ageMinutes, 120);
});

test("مهلة التقادم قابلة للضبط لكل شحنة", () => {
  const now = new Date("2026-09-21T12:00:00.000Z");
  const recordedAt = new Date("2026-09-21T11:20:00.000Z");
  const bounds = { min: 0, max: 5 };

  assert.equal(evaluateTemperature({ celsius: 3, recordedAt, bounds, now }).state, "STALE");
  assert.equal(
    evaluateTemperature({ celsius: 3, recordedAt, bounds, now, staleAfter: 90 }).state,
    "IN_RANGE",
    "شحنة تتحمل مهلة أطول",
  );
});

test("غياب القراءة حالة مستقلة عن التقادم", () => {
  const missing = evaluateTemperature({ celsius: null, recordedAt: null, bounds: { min: 0, max: 5 } });
  assert.equal(missing.state, "NO_DATA");
  assert.equal(missing.ageMinutes, null);

  const unparsable = evaluateTemperature({ celsius: 3, recordedAt: "ليس تاريخاً", bounds: { min: 0, max: 5 } });
  assert.equal(unparsable.state, "NO_DATA");
});

test("الحالات الأربع متمايزة في النص المعروض", () => {
  const labels = Object.values(TEMPERATURE_STATE_LABEL);
  assert.equal(new Set(labels).size, 4, "لا تكرار بين الحالات");
  assert.equal(TEMPERATURE_STATE_LABEL.STALE, "قراءة قديمة");
  assert.notEqual(TEMPERATURE_STATE_LABEL.STALE, TEMPERATURE_STATE_LABEL.NO_DATA);
});
