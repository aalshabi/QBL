// إجراءات الكتابة للوحة التحكم — تعيين/حالة/موافقة + دورة حياة تحصيل COD.
// كل إجراء يُنفَّذ في معاملة واحدة ويُسجَّل في AuditLog.

import { getPrisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import type { AdminOrderStatus } from "@/lib/admin/types";
import { VAT_RATE } from "@/lib/admin/types";

const round2 = (value: number) => Math.round(value * 100) / 100;
const money = (value: { toString(): string } | null) => (value == null ? 0 : Number(value.toString()));

/** actorId صالح فقط إن كان مستخدمًا موجودًا — جلسات التطوير ليست مستخدمين حقيقيين. */
async function resolveActorId(): Promise<string | null> {
  const session = await getSession();
  const user = await getPrisma().user.findUnique({ where: { id: session.userId }, select: { id: true } });
  return user?.id ?? null;
}

/** الطوابع الزمنية المشتقة من الحالة الجديدة — تبقى الأعمدة متسقة مع الحالة. */
function timestampsFor(status: AdminOrderStatus, now: Date) {
  return {
    assignedAt: status === "ASSIGNED" ? now : undefined,
    outForDeliveryAt: status === "OUT_FOR_DELIVERY" ? now : undefined,
    arrivedAt: status === "ARRIVED" ? now : undefined,
    deliveredAt: status === "DELIVERED" ? now : undefined,
    postponedAt: status === "POSTPONED" ? now : undefined,
    failedAt: status === "FAILED" ? now : undefined,
  };
}

export async function assignCourier(orderIds: string[], courierId: string) {
  const prisma = getPrisma();
  const actorId = await resolveActorId();
  const now = new Date();

  const existing = await prisma.deliveryOrder.findMany({
    where: { id: { in: orderIds } },
    select: { id: true, courierId: true },
  });

  await prisma.$transaction([
    prisma.deliveryOrder.updateMany({
      where: { id: { in: orderIds } },
      data: { courierId, status: "ASSIGNED", assignedAt: now },
    }),
    prisma.auditLog.createMany({
      data: existing.map((order) => ({
        orderId: order.id,
        actorId,
        action: order.courierId ? ("ORDER_REASSIGNED" as const) : ("ORDER_ASSIGNED" as const),
        reason: "تعيين مندوب من لوحة التحكم",
        metadata: { courierId, previousCourierId: order.courierId },
      })),
    }),
  ]);

  return existing.length;
}

export async function changeStatus(orderIds: string[], status: AdminOrderStatus, reason?: string) {
  const prisma = getPrisma();
  const actorId = await resolveActorId();
  const now = new Date();

  const existing = await prisma.deliveryOrder.findMany({
    where: { id: { in: orderIds } },
    select: { id: true, status: true },
  });

  await prisma.$transaction([
    prisma.deliveryOrder.updateMany({
      where: { id: { in: orderIds } },
      data: { status, ...timestampsFor(status, now) },
    }),
    prisma.auditLog.createMany({
      data: existing.map((order) => ({
        orderId: order.id,
        actorId,
        action: "STATUS_CHANGED" as const,
        reason: reason ?? "تغيير حالة من لوحة التحكم",
        metadata: { from: order.status, to: status },
      })),
    }),
  ]);

  return existing.length;
}

/** موافقة خدمة العملاء: الطلب المعلّق يصبح جاهزًا للإسناد. */
export async function approveOrders(orderIds: string[]) {
  const prisma = getPrisma();
  const pending = await prisma.deliveryOrder.findMany({
    where: { id: { in: orderIds }, status: "PENDING_APPROVAL" },
    select: { id: true },
  });
  if (!pending.length) return 0;

  return changeStatus(
    pending.map((order) => order.id),
    "CREATED",
    "موافقة خدمة العملاء",
  );
}

/** استلام عهدة التحصيل من المندوب: إنشاء CodCollection وربط طلباته ونقلها إلى RECEIVED. */
export async function receiveCustody(courierId: string) {
  const prisma = getPrisma();

  const orders = await prisma.deliveryOrder.findMany({
    where: { courierId, codStatus: "WITH_COURIER" },
    select: { id: true, codAmount: true, deliveryFee: true },
  });
  if (!orders.length) return { affected: 0, collectionId: null };

  const collection = await prisma.codCollection.create({
    data: {
      courierId,
      ordersCount: orders.length,
      totalCod: orders.reduce((sum, order) => sum + money(order.codAmount), 0),
      totalFees: orders.reduce((sum, order) => sum + money(order.deliveryFee), 0),
      receivedAt: new Date(),
      receivedBy: await resolveActorId(),
    },
  });

  await prisma.deliveryOrder.updateMany({
    where: { id: { in: orders.map((order) => order.id) } },
    data: { codStatus: "RECEIVED", codCollectionId: collection.id },
  });

  return { affected: orders.length, collectionId: collection.id };
}

/** فرز تحصيلات عميل في كشف واحد: RECEIVED → SORTED. */
export async function sortSettlement(clientAccountId: string) {
  const prisma = getPrisma();

  const orders = await prisma.deliveryOrder.findMany({
    where: { clientAccountId, codStatus: "RECEIVED" },
    select: { id: true, codAmount: true, deliveryFee: true },
  });
  if (!orders.length) return { affected: 0, settlementId: null };

  const totalCod = orders.reduce((sum, order) => sum + money(order.codAmount), 0);
  const totalFees = orders.reduce((sum, order) => sum + money(order.deliveryFee), 0);
  const vatAmount = round2(totalFees * VAT_RATE);

  const settlement = await prisma.codSettlement.create({
    data: {
      clientAccountId,
      status: "SORTED",
      totalCod,
      totalFees,
      vatAmount,
      netToClient: round2(totalCod - totalFees - vatAmount),
      sortedAt: new Date(),
    },
  });

  await prisma.deliveryOrder.updateMany({
    where: { id: { in: orders.map((order) => order.id) } },
    data: { codStatus: "SORTED", codSettlementId: settlement.id },
  });

  return { affected: orders.length, settlementId: settlement.id };
}

/** ترقية كشف: SORTED → EXPORTED، أو EXPORTED → DELIVERED (تسليم النقد للعميل). */
export async function advanceSettlement(settlementId: string, action: "EXPORT" | "DELIVER") {
  const prisma = getPrisma();

  const settlement = await prisma.codSettlement.findUnique({
    where: { id: settlementId },
    select: { id: true, status: true },
  });
  if (!settlement) return { ok: false as const, message: "الكشف غير موجود" };

  const expected = action === "EXPORT" ? "SORTED" : "EXPORTED";
  if (settlement.status !== expected) {
    return { ok: false as const, message: `لا يمكن تنفيذ الإجراء على كشف بحالة ${settlement.status}` };
  }

  const now = new Date();
  const [, updated] = await prisma.$transaction([
    prisma.codSettlement.update({
      where: { id: settlementId },
      data:
        action === "EXPORT"
          ? { status: "EXPORTED", exportedAt: now }
          : { status: "DELIVERED", deliveredAt: now },
    }),
    prisma.deliveryOrder.updateMany({
      where: { codSettlementId: settlementId },
      data: { codStatus: action === "EXPORT" ? "EXPORTED" : "SETTLED" },
    }),
  ]);

  return { ok: true as const, affected: updated.count };
}
