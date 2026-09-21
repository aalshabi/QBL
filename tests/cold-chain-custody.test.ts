import assert from "node:assert/strict";
import { test } from "node:test";
import { canDepart, toEvidence } from "../lib/cold-chain/custody";
import { evaluateTemperature } from "../lib/cold-chain/thresholds";

/**
 * ربط القياس بالعهدة. المصدر هنا أسطول QBL نفسه عبر جهاز المندوب، لا مزود
 * خارجي — وبلا إلزام كان الطلب يُفتح ويُغلق بلا قراءة واحدة، وإثبات التسليم
 * لا يذكر الحرارة إطلاقاً.
 */

const bounds = { min: 0, max: 5 };
const now = new Date("2026-09-21T12:00:00.000Z");

function at(minutesAgo: number) {
  return new Date(now.getTime() - minutesAgo * 60_000);
}

test("لا تبدأ رحلة مبرّدة بلا قراءة أساس", () => {
  const missing = evaluateTemperature({ celsius: null, recordedAt: null, bounds, now });
  assert.equal(canDepart({ evaluation: missing, celsius: null, recordedAt: null }), false);
});

test("قراءة الرحلة السابقة ليست أساساً لهذه الرحلة", () => {
  const stale = evaluateTemperature({ celsius: 3, recordedAt: at(180), bounds, now });
  assert.equal(stale.state, "STALE");
  assert.equal(canDepart({ evaluation: stale, celsius: 3, recordedAt: at(180) }), false);
});

test("قراءة حديثة خارج النطاق تسمح بالبدء — الإنذار مفتوح والقرار للتشغيل", () => {
  const hot = evaluateTemperature({ celsius: 11, recordedAt: at(2), bounds, now });
  assert.equal(hot.state, "OUT_OF_RANGE");
  assert.equal(
    canDepart({ evaluation: hot, celsius: 11, recordedAt: at(2) }),
    true,
    "حجب البدء يخفي المشكلة بدل أن يوثّقها",
  );
});

test("قراءة حديثة ضمن النطاق تسمح بالبدء", () => {
  const ok = evaluateTemperature({ celsius: 3, recordedAt: at(2), bounds, now });
  assert.equal(canDepart({ evaluation: ok, celsius: 3, recordedAt: at(2) }), true);
});

test("إثبات التسليم يحمل ما عُرف لحظة الإغلاق — بما فيه أنه لم يُعرف شيء", () => {
  assert.equal(toEvidence("IN_RANGE"), "IN_RANGE");
  assert.equal(toEvidence("OUT_OF_RANGE"), "OUT_OF_RANGE");
  assert.equal(toEvidence("STALE"), "STALE");
  assert.equal(toEvidence("NO_DATA"), "MISSING", "غياب الدليل يُسجَّل غياباً لا فراغاً");
});

test("الحالات الأربع لا تنهار إلى اثنتين", () => {
  const evidence = (["IN_RANGE", "OUT_OF_RANGE", "STALE", "NO_DATA"] as const).map(toEvidence);
  assert.equal(new Set(evidence).size, 4, "قراءة قديمة ليست قراءة مفقودة وليست سليمة");
});
