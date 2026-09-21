import "server-only";
import type { PrismaClient } from "@/lib/generated/prisma/client";
import type { TemperatureBounds, TemperatureEvaluation } from "@/lib/cold-chain/thresholds";
import { staleAfterMinutes } from "@/lib/cold-chain/thresholds";

/**
 * محرك إنذارات سلسلة التبريد.
 *
 * تخزين القراءات لا يحمي شحنة. ما يحميها أن الخرق يتحول إلى حالة مفتوحة
 * يراها التشغيل ويغلقها، وأن انقطاع القراءات نفسه إنذار — فالصمت في سلسلة
 * التبريد لا يعني أن كل شيء بخير، يعني أننا توقفنا عن المعرفة.
 *
 * ثلاثة أنواع: خرق النطاق، تقادم آخر قراءة، وانقطاع كامل. وإنذار واحد مفتوح
 * لكل (طلب، نوع): مستشعر يرسل كل عشر ثوانٍ خارج النطاق ينتج مئات الصفوف في
 * الساعة فيغرق التشغيل ويتوقف عن النظر — التكرار يرفع العدّاد لا عدد الصفوف.
 */

export type AlertKind = "OUT_OF_RANGE" | "STALE_READING" | "NO_TELEMETRY";

export type AlertOutcome =
  | { action: "OPENED"; alertId: string }
  | { action: "UPDATED"; alertId: string; occurrences: number }
  | { action: "RESOLVED"; alertId: string }
  | { action: "NONE" };

type RaiseInput = {
  prisma: PrismaClient;
  orderId: string | null;
  vehicleId: string | null;
  kind: AlertKind;
  severity: "WARNING" | "CRITICAL";
  celsius?: number | null;
  bounds?: TemperatureBounds | null;
  readingAt?: Date | null;
  note?: string;
  now?: Date;
};

/** ±Infinity حدّ مفتوح («حتى -18»)، ولا يُخزَّن رقماً في عمود عشري. */
function finiteOrNull(value: number | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export async function raiseColdChainAlert(input: RaiseInput): Promise<AlertOutcome> {
  const { prisma, orderId, vehicleId, kind, severity } = input;
  if (!orderId && !vehicleId) return { action: "NONE" };

  const now = input.now ?? new Date();
  const open = await prisma.coldChainAlert.findFirst({
    where: { orderId, kind, resolvedAt: null },
    orderBy: { detectedAt: "desc" },
    select: { id: true, occurrences: true, severity: true },
  });

  if (open) {
    const updated = await prisma.coldChainAlert.update({
      where: { id: open.id },
      data: {
        occurrences: { increment: 1 },
        lastSeenAt: now,
        readingAt: input.readingAt ?? undefined,
        celsius: input.celsius ?? undefined,
        // التصعيد يمر، والتهدئة لا: إنذار بلغ CRITICAL لا يعود WARNING وهو مفتوح.
        severity: open.severity === "CRITICAL" ? undefined : severity,
      },
      select: { id: true, occurrences: true },
    });
    return { action: "UPDATED", alertId: updated.id, occurrences: updated.occurrences };
  }

  const created = await prisma.coldChainAlert.create({
    data: {
      orderId,
      vehicleId,
      kind,
      severity,
      celsius: input.celsius ?? null,
      boundsMin: finiteOrNull(input.bounds?.min),
      boundsMax: finiteOrNull(input.bounds?.max),
      readingAt: input.readingAt ?? null,
      detectedAt: now,
      lastSeenAt: now,
      note: input.note,
    },
    select: { id: true },
  });

  return { action: "OPENED", alertId: created.id };
}

/** قراءة سليمة وحديثة تُغلق ما فُتح — وإلا بقيت اللوحة حمراء إلى الأبد. */
export async function resolveColdChainAlerts(
  prisma: PrismaClient,
  orderId: string,
  kinds: AlertKind[] = ["OUT_OF_RANGE", "STALE_READING", "NO_TELEMETRY"],
  now = new Date(),
): Promise<number> {
  const { count } = await prisma.coldChainAlert.updateMany({
    where: { orderId, kind: { in: kinds }, resolvedAt: null },
    data: { resolvedAt: now },
  });
  return count;
}

/**
 * يترجم تقييم القراءة إلى إجراء إنذاري. تُستدعى من كل مسار يكتب قراءة —
 * الويبهوك والقراءة اليدوية — فلا يعتمد الإنذار على مصدر بعينه.
 */
export async function applyReadingToAlerts(input: {
  prisma: PrismaClient;
  orderId: string | null;
  vehicleId: string | null;
  evaluation: TemperatureEvaluation;
  celsius: number;
  readingAt: Date;
  now?: Date;
}): Promise<AlertOutcome> {
  const { prisma, orderId, vehicleId, evaluation, celsius, readingAt } = input;
  const now = input.now ?? new Date();

  if (evaluation.state === "OUT_OF_RANGE") {
    return raiseColdChainAlert({
      prisma,
      orderId,
      vehicleId,
      kind: "OUT_OF_RANGE",
      severity: evaluation.severity === "CRITICAL" ? "CRITICAL" : "WARNING",
      celsius,
      bounds: evaluation.bounds,
      readingAt,
      now,
    });
  }

  if (evaluation.state === "IN_RANGE" && orderId) {
    const resolved = await resolveColdChainAlerts(prisma, orderId, ["OUT_OF_RANGE", "STALE_READING", "NO_TELEMETRY"], now);
    return resolved > 0 ? { action: "RESOLVED", alertId: orderId } : { action: "NONE" };
  }

  return { action: "NONE" };
}

export type SilenceSweepResult = {
  checked: number;
  opened: number;
  updated: number;
};

/**
 * كشف الصمت. لا مزود يُبلغ عن سكوته، فالانقطاع يُستنتج من غياب القراءات:
 * طلب خرج للتوصيل وآخر قراءة له أقدم من المهلة — أو لا قراءة له إطلاقاً.
 * يُنفَّذ من مهمة مجدولة، لا من عملية خلفية داخل دالة لا تعيش بعد الاستجابة.
 */
export async function sweepTelemetrySilence(
  prisma: PrismaClient,
  options: { now?: Date; staleAfter?: number | null } = {},
): Promise<SilenceSweepResult> {
  const now = options.now ?? new Date();
  const cutoff = new Date(now.getTime() - staleAfterMinutes(options.staleAfter) * 60_000);

  const orders = await prisma.deliveryOrder.findMany({
    where: { status: { in: ["OUT_FOR_DELIVERY", "ARRIVED"] } },
    select: {
      id: true,
      vehicleId: true,
      temperatureReadings: { orderBy: { recordedAt: "desc" }, take: 1, select: { recordedAt: true } },
    },
  });

  let opened = 0;
  let updated = 0;

  for (const order of orders) {
    const latest = order.temperatureReadings[0];
    if (latest && latest.recordedAt > cutoff) continue;

    const outcome = await raiseColdChainAlert({
      prisma,
      orderId: order.id,
      vehicleId: order.vehicleId,
      kind: latest ? "STALE_READING" : "NO_TELEMETRY",
      severity: "WARNING",
      readingAt: latest?.recordedAt ?? null,
      note: latest ? "آخر قراءة أقدم من المهلة" : "لا توجد قراءة حرارة لهذا الطلب",
      now,
    });

    if (outcome.action === "OPENED") opened += 1;
    if (outcome.action === "UPDATED") updated += 1;
  }

  return { checked: orders.length, opened, updated };
}

export type SensorSilence = {
  sensorId: string;
  provider: string;
  vehicleId: string | null;
  lastSeenAt: Date | null;
  minutesSilent: number | null;
};

/**
 * صمت الأجهزة المسجّلة. هذا ما لا يستطيع كشف الصمت على مستوى الطلب رؤيته:
 * جهاز توقف بينما بقية الأجهزة ترسل يبدو على الشاشة كأن لا شيء حدث، لأن
 * الطلبات الأخرى تُغطّي عليه. الجهاز المسجّل يُنتظر منه إرسال، وغيابه حدث.
 */
export async function findSilentSensors(
  prisma: PrismaClient,
  options: { now?: Date; staleAfter?: number | null } = {},
): Promise<SensorSilence[]> {
  const now = options.now ?? new Date();
  const cutoff = new Date(now.getTime() - staleAfterMinutes(options.staleAfter) * 60_000);

  const sensors = await prisma.coldChainSensor.findMany({
    where: { active: true, OR: [{ lastSeenAt: null }, { lastSeenAt: { lt: cutoff } }] },
    select: { sensorId: true, provider: true, vehicleId: true, lastSeenAt: true },
    orderBy: { lastSeenAt: "asc" },
  });

  return sensors.map((sensor) => ({
    sensorId: sensor.sensorId,
    provider: sensor.provider,
    vehicleId: sensor.vehicleId,
    lastSeenAt: sensor.lastSeenAt,
    minutesSilent: sensor.lastSeenAt
      ? Math.floor((now.getTime() - sensor.lastSeenAt.getTime()) / 60_000)
      : null,
  }));
}

/** حالة الربط الحية كما تقرأها شاشة التكاملات — من البيانات لا من الإعداد. */
export async function readColdChainLiveState(prisma: PrismaClient): Promise<{
  registeredSensors: number;
  activeSensors: number;
  lastReadingAt: Date | null;
}> {
  const [registeredSensors, activeSensors, lastReading] = await Promise.all([
    prisma.coldChainSensor.count(),
    prisma.coldChainSensor.count({ where: { active: true } }),
    prisma.temperatureReading.findFirst({
      where: { sensorId: { not: null } },
      orderBy: { receivedAt: "desc" },
      select: { receivedAt: true },
    }),
  ]);

  return { registeredSensors, activeSensors, lastReadingAt: lastReading?.receivedAt ?? null };
}
