import assert from "node:assert/strict";
import { test } from "node:test";
import type { PrismaClient } from "../lib/generated/prisma/client";
import { findSilentSensors, readColdChainLiveState } from "../lib/cold-chain/alerts";
import { getIntegrationServices } from "../lib/integrations/overview";

/**
 * سجل الأجهزة. بدونه كان أي حامل لمفتاح الويبهوك يكتب قراءة بأي معرّف مستشعر
 * لأي مركبة، ولا سبيل للتمييز بين جهاز تعطّل وجهاز لم يوجد قط.
 */

const now = new Date("2026-09-21T12:00:00.000Z");
const ago = (minutes: number) => new Date(now.getTime() - minutes * 60_000);

test("الجهاز الصامت يُكشف، والمرسِل حديثاً لا يُزعج", async () => {
  const prisma = {
    coldChainSensor: {
      findMany: async (args: { where: { OR: unknown[] } }) => {
        assert.ok(args.where.OR, "يجب أن يشمل الاستعلام الأجهزة التي لم ترسل قط");
        return [
          { sensorId: "s-dead", provider: "acme", vehicleId: "v1", lastSeenAt: ago(240) },
          { sensorId: "s-never", provider: "acme", vehicleId: "v2", lastSeenAt: null },
        ];
      },
    },
  } as unknown as PrismaClient;

  const silent = await findSilentSensors(prisma, { now });
  assert.equal(silent.length, 2);
  assert.equal(silent[0].minutesSilent, 240);
  assert.equal(silent[1].minutesSilent, null, "جهاز لم يرسل قط لا عمر صمت له");
});

test("حالة الربط تُقرأ من البيانات لا من الإعداد", async () => {
  const prisma = {
    coldChainSensor: { count: async () => 3 },
    temperatureReading: { findFirst: async () => ({ receivedAt: ago(5) }) },
  } as unknown as PrismaClient;

  const state = await readColdChainLiveState(prisma);
  assert.equal(state.registeredSensors, 3);
  assert.equal(state.lastReadingAt?.toISOString(), ago(5).toISOString());
});

function coldChain(live: Parameters<typeof getIntegrationServices>[0]) {
  return getIntegrationServices(live).find((service) => service.id === "cold-chain")!;
}

test("مفتاح مضبوط بلا جهاز مسجّل ليس ربطاً", () => {
  const previous = process.env.COLD_CHAIN_TELEMETRY_API_KEY;
  process.env.COLD_CHAIN_TELEMETRY_API_KEY = "x".repeat(40);
  try {
    const service = coldChain({ coldChain: { registeredSensors: 0, activeSensors: 0, lastReadingAt: null } });
    assert.notEqual(service.state, "configured", "وجود المفتاح لا يعني أن أحداً يرسل");
    assert.match(service.stateLabel, /لا جهاز مسجّل/);
  } finally {
    if (previous) process.env.COLD_CHAIN_TELEMETRY_API_KEY = previous;
    else delete process.env.COLD_CHAIN_TELEMETRY_API_KEY;
  }
});

test("أجهزة مسجّلة بلا قراءة وصلت تبقى تحتاج مراجعة", () => {
  const previous = process.env.COLD_CHAIN_TELEMETRY_API_KEY;
  process.env.COLD_CHAIN_TELEMETRY_API_KEY = "x".repeat(40);
  try {
    const waiting = coldChain({ coldChain: { registeredSensors: 2, activeSensors: 2, lastReadingAt: null } });
    assert.equal(waiting.state, "needs_attention");

    const live = coldChain({ coldChain: { registeredSensors: 2, activeSensors: 2, lastReadingAt: ago(3) } });
    assert.equal(live.state, "configured");
    assert.match(live.stateLabel, /يستقبل/);
  } finally {
    if (previous) process.env.COLD_CHAIN_TELEMETRY_API_KEY = previous;
    else delete process.env.COLD_CHAIN_TELEMETRY_API_KEY;
  }
});

test("التبريد ظاهر في شاشة التكاملات ولا يدّعي مزوداً", () => {
  const service = coldChain({ coldChain: null });
  assert.equal(service.category, "سلسلة التبريد");
  assert.match(service.boundary, /لا مزود متعاقد/);
  assert.ok(!/LogesTechs|Google/.test(service.name));
});
