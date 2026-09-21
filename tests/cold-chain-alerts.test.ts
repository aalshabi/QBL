import assert from "node:assert/strict";
import { test } from "node:test";
import type { PrismaClient } from "../lib/generated/prisma/client";
import { applyReadingToAlerts, raiseColdChainAlert, sweepTelemetrySilence } from "../lib/cold-chain/alerts";
import { evaluateTemperature, resolveBounds } from "../lib/cold-chain/thresholds";

/**
 * الإنذارات هي ما يحوّل القراءات إلى حماية. الخطران هنا متعاكسان: إنذار لا
 * يُفتح عند خرق، وإنذار يتكرر حتى يغرق التشغيل فيتوقف عن النظر إلى الشاشة.
 */

type Recorded = { created: Record<string, unknown>[]; updated: Record<string, unknown>[]; resolved: number };

function stub(options: { openAlert?: { id: string; occurrences: number; severity: string } | null } = {}) {
  const recorded: Recorded = { created: [], updated: [], resolved: 0 };
  const prisma = {
    coldChainAlert: {
      findFirst: async () => options.openAlert ?? null,
      create: async (args: { data: Record<string, unknown> }) => {
        recorded.created.push(args.data);
        return { id: "alert-new" };
      },
      update: async (args: { data: Record<string, unknown> }) => {
        recorded.updated.push(args.data);
        return { id: options.openAlert?.id ?? "alert-1", occurrences: (options.openAlert?.occurrences ?? 0) + 1 };
      },
      updateMany: async () => {
        recorded.resolved += 1;
        return { count: 1 };
      },
    },
  } as unknown as PrismaClient;
  return { prisma, recorded };
}

test("خرق النطاق يفتح إنذاراً يحمل القراءة وحدودها", async () => {
  const { prisma, recorded } = stub();
  const bounds = resolveBounds({ orderTarget: "0 إلى +5" });
  const evaluation = evaluateTemperature({ celsius: 12, recordedAt: new Date(), bounds });

  const outcome = await applyReadingToAlerts({
    prisma,
    orderId: "order-1",
    vehicleId: "vehicle-1",
    evaluation,
    celsius: 12,
    readingAt: new Date(),
  });

  assert.equal(outcome.action, "OPENED");
  assert.equal(recorded.created.length, 1);
  assert.equal(recorded.created[0].kind, "OUT_OF_RANGE");
  assert.equal(recorded.created[0].severity, "CRITICAL");
  assert.equal(recorded.created[0].boundsMax, 5);
});

test("تكرار الخرق يرفع العدّاد ولا ينشئ صفاً جديداً", async () => {
  const { prisma, recorded } = stub({ openAlert: { id: "alert-1", occurrences: 3, severity: "WARNING" } });
  const bounds = { min: 0, max: 5 };

  const outcome = await applyReadingToAlerts({
    prisma,
    orderId: "order-1",
    vehicleId: "vehicle-1",
    evaluation: evaluateTemperature({ celsius: 7, recordedAt: new Date(), bounds }),
    celsius: 7,
    readingAt: new Date(),
  });

  assert.equal(outcome.action, "UPDATED");
  assert.deepEqual(recorded.created, [], "مستشعر يرسل كل عشر ثوانٍ لا يُنتج مئات الصفوف");
  assert.equal(recorded.updated.length, 1);
});

test("التصعيد يمر والتهدئة لا: إنذار حرج لا يعود تحذيراً وهو مفتوح", async () => {
  const { prisma, recorded } = stub({ openAlert: { id: "alert-1", occurrences: 1, severity: "CRITICAL" } });

  await raiseColdChainAlert({
    prisma,
    orderId: "order-1",
    vehicleId: null,
    kind: "OUT_OF_RANGE",
    severity: "WARNING",
  });

  assert.equal(recorded.updated[0].severity, undefined, "لا يُخفَّض التصنيف");
});

test("قراءة سليمة حديثة تُغلق ما فُتح", async () => {
  const { prisma, recorded } = stub();
  const outcome = await applyReadingToAlerts({
    prisma,
    orderId: "order-1",
    vehicleId: "vehicle-1",
    evaluation: evaluateTemperature({ celsius: 3, recordedAt: new Date(), bounds: { min: 0, max: 5 } }),
    celsius: 3,
    readingAt: new Date(),
  });

  assert.equal(outcome.action, "RESOLVED");
  assert.equal(recorded.resolved, 1);
});

test("قراءة متقادمة لا تُغلق إنذاراً ولا تُفتح خرقاً", async () => {
  const { prisma, recorded } = stub();
  const now = new Date("2026-09-21T12:00:00.000Z");
  const outcome = await applyReadingToAlerts({
    prisma,
    orderId: "order-1",
    vehicleId: "vehicle-1",
    evaluation: evaluateTemperature({
      celsius: 3,
      recordedAt: new Date("2026-09-21T09:00:00.000Z"),
      bounds: { min: 0, max: 5 },
      now,
    }),
    celsius: 3,
    readingAt: new Date("2026-09-21T09:00:00.000Z"),
    now,
  });

  assert.equal(outcome.action, "NONE");
  assert.equal(recorded.resolved, 0, "قيمة قديمة سليمة ليست دليل سلامة الآن");
});

test("الصمت يُكتشف: طلب بلا قراءة وطلب بقراءة متقادمة", async () => {
  const created: Record<string, unknown>[] = [];
  const now = new Date("2026-09-21T12:00:00.000Z");
  const prisma = {
    deliveryOrder: {
      findMany: async () => [
        { id: "order-silent", vehicleId: "v1", temperatureReadings: [] },
        {
          id: "order-stale",
          vehicleId: "v2",
          temperatureReadings: [{ recordedAt: new Date("2026-09-21T09:00:00.000Z") }],
        },
        {
          id: "order-fresh",
          vehicleId: "v3",
          temperatureReadings: [{ recordedAt: new Date("2026-09-21T11:55:00.000Z") }],
        },
      ],
    },
    coldChainAlert: {
      findFirst: async () => null,
      create: async (args: { data: Record<string, unknown> }) => {
        created.push(args.data);
        return { id: `alert-${created.length}` };
      },
    },
  } as unknown as PrismaClient;

  const result = await sweepTelemetrySilence(prisma, { now });

  assert.equal(result.checked, 3);
  assert.equal(result.opened, 2, "الطلب الحديث وحده يُترك");
  assert.deepEqual(
    created.map((row) => row.kind),
    ["NO_TELEMETRY", "STALE_READING"],
    "غياب القراءة يختلف عن تقادمها",
  );
});

test("لا إنذار بلا طلب ولا مركبة", async () => {
  const { prisma, recorded } = stub();
  const outcome = await raiseColdChainAlert({
    prisma,
    orderId: null,
    vehicleId: null,
    kind: "NO_TELEMETRY",
    severity: "WARNING",
  });
  assert.equal(outcome.action, "NONE");
  assert.deepEqual(recorded.created, []);
});

test("الحد المفتوح لا يُخزَّن رقماً", async () => {
  const { prisma, recorded } = stub();
  await raiseColdChainAlert({
    prisma,
    orderId: "order-1",
    vehicleId: null,
    kind: "OUT_OF_RANGE",
    severity: "CRITICAL",
    bounds: resolveBounds({ orderTarget: "حتى -18" }),
  });

  assert.equal(recorded.created[0].boundsMin, null, "-Infinity ليس قيمة عمود عشري");
  assert.equal(recorded.created[0].boundsMax, -18);
});
