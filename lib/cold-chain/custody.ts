import "server-only";
import type { PrismaClient } from "@/lib/generated/prisma/client";
import { evaluateTemperature, resolveBounds, type TemperatureEvaluation } from "@/lib/cold-chain/thresholds";

/**
 * ربط سلسلة التبريد بعُهدة الشحنة.
 *
 * مصدر الحرارة في QBL ليس مزوداً خارجياً — الشركة هي الناقل المبرّد، والمصدر
 * المتاح اليوم هو أسطولها عبر جهاز المندوب. والمشكلة أن هذا المصدر لم يكن
 * يلزمه شيء: طلب يُفتح ويُغلق دون قراءة حرارة واحدة، وإثبات تسليم لا يذكر
 * الحرارة إطلاقاً. سلسلة تبريد لا تلزم أحداً بشيء ليست سلسلة.
 *
 * نقطتان تربطان القياس بالعملية:
 *  - المغادرة: لا تبدأ رحلة مبرّدة بلا قراءة أساس. المندوب عند المركبة، وهي
 *    اللحظة الطبيعية الوحيدة التي يملك فيها أخذ القراءة قبل التحرك.
 *  - التسليم: لا يُحجب — حجب تسليم عند باب العميل بسبب قراءة ناقصة أسوأ من
 *    الفجوة نفسها — لكن ما عرفناه لحظة الإغلاق يُختم على الإثبات، بما في ذلك
 *    أننا لم نكن نعرف شيئاً.
 */

export type TemperatureEvidence = "IN_RANGE" | "OUT_OF_RANGE" | "STALE" | "MISSING";

export type CustodyTemperature = {
  evaluation: TemperatureEvaluation;
  celsius: number | null;
  recordedAt: Date | null;
};

/** أحدث قراءة تخص الشحنة، أو قراءة مركبتها حين لا تكون القراءة مربوطة بطلب. */
export async function readCustodyTemperature(
  prisma: PrismaClient,
  orderId: string,
  now = new Date(),
): Promise<CustodyTemperature> {
  const order = await prisma.deliveryOrder.findUnique({
    where: { id: orderId },
    select: {
      temperatureTarget: true,
      vehicleId: true,
      vehicle: { select: { coldRangeMin: true, coldRangeMax: true } },
    },
  });

  const [orderReading, vehicleReading] = await Promise.all([
    prisma.temperatureReading.findFirst({
      where: { orderId },
      orderBy: { recordedAt: "desc" },
      select: { celsius: true, recordedAt: true },
    }),
    order?.vehicleId
      ? prisma.temperatureReading.findFirst({
          where: { vehicleId: order.vehicleId, orderId: null },
          orderBy: { recordedAt: "desc" },
          select: { celsius: true, recordedAt: true },
        })
      : Promise.resolve(null),
  ]);

  const reading = orderReading ?? vehicleReading;
  const evaluation = evaluateTemperature({
    celsius: reading ? Number(reading.celsius) : null,
    recordedAt: reading?.recordedAt ?? null,
    bounds: resolveBounds({
      orderTarget: order?.temperatureTarget,
      vehicleMin: order?.vehicle ? Number(order.vehicle.coldRangeMin) : null,
      vehicleMax: order?.vehicle ? Number(order.vehicle.coldRangeMax) : null,
    }),
    now,
  });

  return {
    evaluation,
    celsius: reading ? Number(reading.celsius) : null,
    recordedAt: reading?.recordedAt ?? null,
  };
}

/** حالة القياس تُترجم إلى ما يُختم على إثبات التسليم. */
export function toEvidence(state: TemperatureEvaluation["state"]): TemperatureEvidence {
  switch (state) {
    case "IN_RANGE":
      return "IN_RANGE";
    case "OUT_OF_RANGE":
      return "OUT_OF_RANGE";
    case "STALE":
      return "STALE";
    default:
      return "MISSING";
  }
}

/**
 * هل تكفي الحالة الحالية لبدء رحلة؟ القراءة القديمة لا تكفي: الأساس يجب أن
 * يكون قياساً الآن، لا قياس الرحلة السابقة.
 */
export function canDepart(temperature: CustodyTemperature): boolean {
  return temperature.evaluation.state === "IN_RANGE" || temperature.evaluation.state === "OUT_OF_RANGE";
}
