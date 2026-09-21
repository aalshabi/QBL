import "server-only";
import type { PrismaClient } from "@/lib/generated/prisma/client";
import type { OrderStatus as DbOrderStatus } from "@/lib/generated/prisma/enums";
import type { Role } from "@/lib/auth";
import { canTransition, type OrderStatus } from "@/lib/domain";
import { isOrderOtpVerified } from "@/lib/orders/otp";
import { issueAndQueueOrderOtp } from "@/lib/orders/otp-dispatch";
import { canDepart, readCustodyTemperature, toEvidence, type CustodyTemperature } from "@/lib/cold-chain/custody";

/**
 * انتقالات حالة الطلب — الكتابة الفعلية على قاعدة البيانات.
 *
 * المسار السابق كان يقرأ مصفوفة mock في الذاكرة ويعيد ok:true دون أن يكتب شيئاً،
 * وبلا فحص دور ولا ملكية: أي طلب HTTP بلا جلسة كان يحصل على "نجاح" بينما الطلب
 * لا يتحرك. هنا كل انتقال يمر بأربع بوابات — هوية، ملكية، آلة حالات، ثم إثبات —
 * وكلها على الخادم؛ ولا شيء منها يُقرأ من جسم الطلب.
 */

const OVERRIDE_ROLES: Role[] = ["ADMIN", "OPS_MANAGER"];

/** الحالات التي يملك المندوب تحريكها. ما عداها قرار تشغيل لا قرار ميداني. */
const COURIER_TARGETS: OrderStatus[] = ["OUT_FOR_DELIVERY", "ARRIVED", "DELIVERED", "FAILED"];

const TIMESTAMP_FIELD: Partial<Record<OrderStatus, "outForDeliveryAt" | "arrivedAt" | "deliveredAt" | "failedAt">> = {
  OUT_FOR_DELIVERY: "outForDeliveryAt",
  ARRIVED: "arrivedAt",
  DELIVERED: "deliveredAt",
  FAILED: "failedAt",
};

/**
 * مخطط حالات القاعدة إلى حالات المجال. القاعدة تحمل حالات تشغيلية أوسع
 * (تأجيل، إرجاع، إلغاء) لا تعني شيئاً لآلة حالات المندوب.
 */
export function toDomainStatus(status: DbOrderStatus | string): OrderStatus {
  switch (status) {
    case "PENDING_APPROVAL":
      return "CREATED";
    case "POSTPONED":
      return "ASSIGNED";
    case "RETURNED":
    case "CANCELLED":
      return "FAILED";
    default:
      return status as OrderStatus;
  }
}

export type TransitionActor = { userId: string; role: Role };

export type TransitionInput = {
  prisma: PrismaClient;
  orderId: string;
  to: OrderStatus;
  actor: TransitionActor;
  reason?: string;
  manualOverride?: boolean;
};

export type TransitionResult =
  | { ok: true; status: OrderStatus; idempotent: boolean; overridden: boolean }
  | { ok: false; status: number; error: string; detail?: string };

function failure(status: number, error: string, detail?: string): TransitionResult {
  return { ok: false, status, error, detail };
}

export async function applyOrderTransition(input: TransitionInput): Promise<TransitionResult> {
  const { prisma, orderId, to, actor } = input;

  const order = await prisma.deliveryOrder.findUnique({
    where: { id: orderId },
    select: { id: true, status: true, courierId: true },
  });
  if (!order) return failure(404, "ORDER_NOT_FOUND");

  // الملكية: المندوب لا يلمس طلباً غير مسند له، ولو عرف معرّفه.
  if (actor.role === "COURIER") {
    const courier = await prisma.courier.findUnique({
      where: { userId: actor.userId },
      select: { id: true },
    });
    if (!courier) return failure(404, "COURIER_PROFILE_NOT_FOUND");
    if (order.courierId !== courier.id) return failure(403, "ORDER_NOT_ASSIGNED_TO_COURIER");
    if (!COURIER_TARGETS.includes(to)) return failure(403, "TRANSITION_NOT_ALLOWED_FOR_COURIER");
  } else if (!OVERRIDE_ROLES.includes(actor.role) && actor.role !== "DISPATCHER") {
    return failure(403, "ROLE_NOT_ALLOWED");
  }

  const from = toDomainStatus(order.status);

  // خمول مقصود: الضغط المتكرر على زر واحد لا ينتج سجلّين ولا يفشل في وجه المندوب.
  if (from === to) {
    return { ok: true, status: to, idempotent: true, overridden: false };
  }

  if (!canTransition(from, to)) {
    return failure(409, "ILLEGAL_TRANSITION", `${from} → ${to}`);
  }

  // التسليم لا يُغلق إلا بتحقق خادمي للرمز، أو تجاوز يدوي موثّق بدور إداري.
  let overridden = false;
  if (to === "DELIVERED" && !(await isOrderOtpVerified(prisma, orderId))) {
    if (!input.manualOverride) return failure(409, "OTP_NOT_VERIFIED");
    if (!OVERRIDE_ROLES.includes(actor.role)) return failure(403, "OVERRIDE_REQUIRES_ADMIN");
    if (!input.reason || input.reason.trim().length < 10) {
      return failure(422, "OVERRIDE_REASON_REQUIRED");
    }
    overridden = true;
  }

  if (to === "FAILED" && (!input.reason || input.reason.trim().length < 3)) {
    return failure(422, "FAILURE_REASON_REQUIRED");
  }

  // رحلة مبرّدة بلا قراءة أساس ليس لها ما تُقارَن به لاحقاً. المندوب عند
  // المركبة في هذه اللحظة، وهي الوحيدة التي يملك فيها أخذها قبل التحرك.
  let custody: CustodyTemperature | null = null;
  if (to === "OUT_FOR_DELIVERY") {
    custody = await readCustodyTemperature(prisma, orderId);
    if (!canDepart(custody)) {
      return failure(
        409,
        "DEPARTURE_TEMPERATURE_REQUIRED",
        custody.evaluation.state === "STALE" ? "آخر قراءة قديمة" : "لا توجد قراءة حرارة",
      );
    }
  }

  // التسليم لا يُحجب لقراءة ناقصة — حجبه عند باب العميل أسوأ من الفجوة — لكن
  // ما عُرف لحظة الإغلاق يُختم على الإثبات، بما فيه أننا لم نكن نعرف.
  if (to === "DELIVERED") {
    custody = await readCustodyTemperature(prisma, orderId);
  }

  const now = new Date();
  const timestampField = TIMESTAMP_FIELD[to];
  const data: Record<string, unknown> = { status: to };
  if (timestampField) data[timestampField] = now;
  if (to === "FAILED") data.failureReason = input.reason?.trim();

  await prisma.$transaction(async (tx) => {
    // الشرط على الحالة الحالية يجعل الكتابة ذرّية: طلبان متزامنان لا ينجحان معاً.
    const updated = await tx.deliveryOrder.updateMany({
      where: { id: orderId, status: order.status },
      data: data as never,
    });
    if (updated.count === 0) throw new ConcurrentTransitionError();

    if (to === "DELIVERED") {
      await tx.proofOfDelivery.upsert({
        where: { orderId },
        create: {
          orderId,
          proofType: overridden ? "MANUAL_OVERRIDE" : "OTP",
          otpVerified: !overridden,
          notes: overridden ? input.reason?.trim() : undefined,
          temperatureEvidence: toEvidence(custody!.evaluation.state),
          temperatureCelsius: custody!.celsius,
          temperatureAt: custody!.recordedAt,
        },
        update: {
          proofType: overridden ? "MANUAL_OVERRIDE" : "OTP",
          otpVerified: !overridden,
          notes: overridden ? input.reason?.trim() : undefined,
          temperatureEvidence: toEvidence(custody!.evaluation.state),
          temperatureCelsius: custody!.celsius,
          temperatureAt: custody!.recordedAt,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        orderId,
        actorId: actor.userId,
        action: overridden ? "OTP_MANUAL_OVERRIDE" : "STATUS_CHANGED",
        reason: input.reason?.trim(),
        metadata: {
          from,
          to,
          role: actor.role,
          ...(custody ? { temperature: custody.evaluation.state, celsius: custody.celsius } : {}),
        },
      },
    });
  });

  // الرمز يُصدر عند الخروج للتوصيل لا قبله، ولا يُعاد إلى المندوب إطلاقاً.
  if (to === "OUT_FOR_DELIVERY") {
    await issueAndQueueOrderOtp(prisma, orderId);
  }

  return { ok: true, status: to, idempotent: false, overridden };
}

export class ConcurrentTransitionError extends Error {
  constructor() {
    super("ORDER_CHANGED_CONCURRENTLY");
    this.name = "ConcurrentTransitionError";
  }
}
