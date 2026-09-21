import assert from "node:assert/strict";
import { test } from "node:test";
import type { PrismaClient } from "../lib/generated/prisma/client";
import { applyOrderTransition, toDomainStatus } from "../lib/orders/transitions";
import { verifyOrderOtp } from "../lib/orders/otp";
import { navigationUrl, nextStepFor, telHref } from "../lib/orders/courier-view";
import { generateOtpCode, hashOtp } from "../lib/security";

/**
 * مسار المندوب من الإسناد إلى الإغلاق.
 * الخطر هنا ليس الحالة السعيدة بل البوابات: طلب ليس لك، قفزة حالة غير مشروعة،
 * وإغلاق تسليم بلا رمز مُتحقَّق. النسخة السابقة كانت تعيد ok:true في كل ذلك.
 */

const COURIER = { userId: "user-courier-1", role: "COURIER" as const };
const ADMIN = { userId: "user-admin-1", role: "ADMIN" as const };

type StubOptions = {
  orderStatus?: string;
  orderCourierId?: string | null;
  courierId?: string | null;
  otpVerified?: boolean;
  updateCount?: number;
};

type Recorded = {
  updates: unknown[];
  proofs: unknown[];
  audits: unknown[];
  otpCreates: { data: Record<string, unknown> }[];
  notifications: { data: Record<string, unknown> }[];
};

function stubPrisma(options: StubOptions = {}): { prisma: PrismaClient; recorded: Recorded } {
  const {
    orderStatus = "ASSIGNED",
    orderCourierId = "courier-1",
    courierId = "courier-1",
    otpVerified = false,
    updateCount = 1,
  } = options;

  const recorded: Recorded = { updates: [], proofs: [], audits: [], otpCreates: [], notifications: [] };

  const tx = {
    deliveryOrder: {
      updateMany: async (args: unknown) => {
        recorded.updates.push(args);
        return { count: updateCount };
      },
    },
    proofOfDelivery: {
      upsert: async (args: unknown) => {
        recorded.proofs.push(args);
        return {};
      },
    },
    auditLog: {
      create: async (args: unknown) => {
        recorded.audits.push(args);
        return {};
      },
    },
  };

  const prisma = {
    deliveryOrder: {
      findUnique: async () =>
        orderStatus === "__missing__"
          ? null
          : {
              id: "order-1",
              status: orderStatus,
              courierId: orderCourierId,
              customer: { phone: "0550000000" },
            },
    },
    courier: {
      findUnique: async () => (courierId ? { id: courierId } : null),
    },
    otpCode: {
      // isOrderOtpVerified يسأل عن رمز مُتحقَّق؛ verifyOrderOtp يسأل عن رمز نشط.
      findFirst: async (args: { where: { verifiedAt?: unknown } }) =>
        args.where.verifiedAt === null ? null : otpVerified ? { id: "otp-1" } : null,
      updateMany: async () => ({ count: 0 }),
      create: async (args: { data: Record<string, unknown> }) => {
        recorded.otpCreates.push(args);
        return {};
      },
    },
    notificationLog: {
      create: async (args: { data: Record<string, unknown> }) => {
        recorded.notifications.push(args);
        return {};
      },
    },
    // الانتقال يستخدم صيغة الدالة، وإصدار الرمز يستخدم صيغة المصفوفة.
    $transaction: async (arg: unknown) =>
      typeof arg === "function"
        ? (arg as (client: typeof tx) => Promise<unknown>)(tx)
        : Promise.all(arg as Promise<unknown>[]),
  } as unknown as PrismaClient;

  return { prisma, recorded };
}

test("المندوب لا يحرّك طلباً غير مسند له", async () => {
  const { prisma, recorded } = stubPrisma({ orderCourierId: "courier-other" });
  const result = await applyOrderTransition({ prisma, orderId: "order-1", to: "OUT_FOR_DELIVERY", actor: COURIER });

  assert.equal(result.ok, false);
  assert.equal(result.ok === false && result.status, 403);
  assert.equal(result.ok === false && result.error, "ORDER_NOT_ASSIGNED_TO_COURIER");
  assert.deepEqual(recorded.updates, [], "لا كتابة عند رفض الملكية");
});

test("لا قفزة حالة غير مشروعة — ASSIGNED لا تصل DELIVERED مباشرة", async () => {
  const { prisma, recorded } = stubPrisma({ orderStatus: "ASSIGNED", otpVerified: true });
  const result = await applyOrderTransition({ prisma, orderId: "order-1", to: "DELIVERED", actor: COURIER });

  assert.equal(result.ok === false && result.status, 409);
  assert.equal(result.ok === false && result.error, "ILLEGAL_TRANSITION");
  assert.deepEqual(recorded.updates, []);
});

test("التسليم محجوب حتى يتحقق الرمز على الخادم", async () => {
  const { prisma, recorded } = stubPrisma({ orderStatus: "ARRIVED", otpVerified: false });
  const result = await applyOrderTransition({ prisma, orderId: "order-1", to: "DELIVERED", actor: COURIER });

  assert.equal(result.ok === false && result.error, "OTP_NOT_VERIFIED");
  assert.deepEqual(recorded.proofs, [], "لا إثبات تسليم بلا تحقق");
});

test("التسليم ينجح بعد التحقق ويكتب إثباتاً وسجل تدقيق", async () => {
  const { prisma, recorded } = stubPrisma({ orderStatus: "ARRIVED", otpVerified: true });
  const result = await applyOrderTransition({ prisma, orderId: "order-1", to: "DELIVERED", actor: COURIER });

  assert.equal(result.ok, true);
  assert.equal(result.ok && result.overridden, false);
  assert.equal(recorded.proofs.length, 1);
  assert.equal(recorded.audits.length, 1);
});

test("التجاوز اليدوي يحتاج دوراً إدارياً وسبباً مكتوباً", async () => {
  const withoutReason = stubPrisma({ orderStatus: "ARRIVED" });
  const missingReason = await applyOrderTransition({
    prisma: withoutReason.prisma,
    orderId: "order-1",
    to: "DELIVERED",
    actor: ADMIN,
    manualOverride: true,
  });
  assert.equal(missingReason.ok === false && missingReason.error, "OVERRIDE_REASON_REQUIRED");

  const courierTry = stubPrisma({ orderStatus: "ARRIVED" });
  const byCourier = await applyOrderTransition({
    prisma: courierTry.prisma,
    orderId: "order-1",
    to: "DELIVERED",
    actor: COURIER,
    manualOverride: true,
    reason: "العميل فقد الرمز وتم التأكد منه هاتفياً",
  });
  assert.equal(byCourier.ok === false && byCourier.error, "OVERRIDE_REQUIRES_ADMIN");

  const ok = stubPrisma({ orderStatus: "ARRIVED" });
  const granted = await applyOrderTransition({
    prisma: ok.prisma,
    orderId: "order-1",
    to: "DELIVERED",
    actor: ADMIN,
    manualOverride: true,
    reason: "العميل فقد الرمز وتم التأكد منه هاتفياً",
  });
  assert.equal(granted.ok, true);
  assert.equal(granted.ok && granted.overridden, true);
});

test("تعذر التسليم يتطلب سبباً", async () => {
  const { prisma } = stubPrisma({ orderStatus: "OUT_FOR_DELIVERY" });
  const result = await applyOrderTransition({ prisma, orderId: "order-1", to: "FAILED", actor: COURIER });
  assert.equal(result.ok === false && result.error, "FAILURE_REASON_REQUIRED");
});

test("الضغط المتكرر لا يُنتج كتابة ثانية", async () => {
  const { prisma, recorded } = stubPrisma({ orderStatus: "ARRIVED" });
  const result = await applyOrderTransition({ prisma, orderId: "order-1", to: "ARRIVED", actor: COURIER });

  assert.equal(result.ok, true);
  assert.equal(result.ok && result.idempotent, true);
  assert.deepEqual(recorded.updates, []);
  assert.deepEqual(recorded.audits, []);
});

test("سباق كتابتين: الخاسرة ترفع خطأ ولا تُغلق الطلب مرتين", async () => {
  const { prisma } = stubPrisma({ orderStatus: "OUT_FOR_DELIVERY", updateCount: 0 });
  await assert.rejects(
    () => applyOrderTransition({ prisma, orderId: "order-1", to: "ARRIVED", actor: COURIER }),
    /ORDER_CHANGED_CONCURRENTLY/,
  );
});

test("حالات القاعدة الموسعة تُسقَط على آلة حالات المندوب", () => {
  assert.equal(toDomainStatus("POSTPONED"), "ASSIGNED");
  assert.equal(toDomainStatus("PENDING_APPROVAL"), "CREATED");
  assert.equal(toDomainStatus("CANCELLED"), "FAILED");
  assert.equal(toDomainStatus("ARRIVED"), "ARRIVED");
});

test("الرمز الخاطئ يستهلك محاولة ويعيد المتبقي", async () => {
  const hash = await hashOtp("123456");
  const updates: unknown[] = [];
  const prisma = {
    otpCode: {
      findFirst: async () => ({
        id: "otp-1",
        codeHash: hash,
        attempts: 1,
        maxAttempts: 5,
        expiresAt: new Date(Date.now() + 60_000),
      }),
      update: async (args: { data: unknown }) => {
        updates.push(args.data);
        return { attempts: 2, maxAttempts: 5 };
      },
    },
  } as unknown as PrismaClient;

  const result = await verifyOrderOtp(prisma, "order-1", "999999");
  assert.equal(result.ok, false);
  assert.equal(result.ok === false && result.reason, "MISMATCH");
  assert.equal(result.ok === false && result.remainingAttempts, 3);
  assert.equal(updates.length, 1, "المحاولة تُحتسب قبل المقارنة");
});

test("الرمز الصحيح يُقبل ويُسجَّل تحققه", async () => {
  const hash = await hashOtp("654321");
  const updates: { data: Record<string, unknown> }[] = [];
  const prisma = {
    otpCode: {
      findFirst: async () => ({
        id: "otp-1",
        codeHash: hash,
        attempts: 0,
        maxAttempts: 5,
        expiresAt: new Date(Date.now() + 60_000),
      }),
      update: async (args: { data: Record<string, unknown> }) => {
        updates.push(args);
        return { attempts: 1, maxAttempts: 5 };
      },
    },
  } as unknown as PrismaClient;

  const result = await verifyOrderOtp(prisma, "order-1", "654321");
  assert.equal(result.ok, true);
  assert.ok(updates.some((entry) => "verifiedAt" in entry.data), "يجب تسجيل وقت التحقق");
});

test("الرمز المنتهي أو المستهلك يُرفض قبل أي مقارنة", async () => {
  const expired = {
    otpCode: {
      findFirst: async () => ({
        id: "otp-1",
        codeHash: "x",
        attempts: 0,
        maxAttempts: 5,
        expiresAt: new Date(Date.now() - 1_000),
      }),
      update: async () => assert.fail("لا تحديث على رمز منتهٍ"),
    },
  } as unknown as PrismaClient;
  const expiredResult = await verifyOrderOtp(expired, "order-1", "123456");
  assert.equal(expiredResult.ok === false && expiredResult.reason, "EXPIRED");

  const burned = {
    otpCode: {
      findFirst: async () => ({
        id: "otp-1",
        codeHash: "x",
        attempts: 5,
        maxAttempts: 5,
        expiresAt: new Date(Date.now() + 60_000),
      }),
      update: async () => assert.fail("لا تحديث بعد استهلاك المحاولات"),
    },
  } as unknown as PrismaClient;
  const burnedResult = await verifyOrderOtp(burned, "order-1", "123456");
  assert.equal(burnedResult.ok === false && burnedResult.reason, "TOO_MANY_ATTEMPTS");

  const none = {
    otpCode: { findFirst: async () => null },
  } as unknown as PrismaClient;
  const noneResult = await verifyOrderOtp(none, "order-1", "123456");
  assert.equal(noneResult.ok === false && noneResult.reason, "NO_ACTIVE_CODE");
});

test("رمز الاستلام ستة أرقام ضمن المدى كاملاً", () => {
  for (let i = 0; i < 200; i += 1) {
    const code = generateOtpCode();
    assert.match(code, /^\d{6}$/);
    const value = Number(code);
    assert.ok(value >= 100_000 && value <= 999_999);
  }
});

test("الخطوة التالية واحدة لكل حالة", () => {
  assert.equal(nextStepFor("ASSIGNED").target, "OUT_FOR_DELIVERY");
  assert.equal(nextStepFor("OUT_FOR_DELIVERY").target, "ARRIVED");
  assert.equal(nextStepFor("ARRIVED").target, "DELIVERED");
  assert.equal(nextStepFor("DELIVERED").target, null);
  assert.equal(nextStepFor("FAILED").target, null);
});

test("الملاحة عبر Maps URLs بلا مفتاح ولا استدعاء Routes", () => {
  const url = navigationUrl(24.7136, 46.6753);
  assert.ok(url.startsWith("https://www.google.com/maps/dir/?api=1"));
  assert.match(url, /destination=24\.713600%2C46\.675300/);
  assert.match(url, /travelmode=driving/);
  assert.ok(!/key=/i.test(url), "رابط الملاحة يجب ألا يحمل مفتاحاً");
  assert.ok(!/routes\.googleapis/.test(url));
});

test("رابط الاتصال ينظّف الرقم ولا يمرر محتوى آخر", () => {
  assert.equal(telHref("+966 55 632 0555"), "tel:+966556320555");
  assert.equal(telHref("055-000 0000"), "tel:0550000000");
});

test("الخروج للتوصيل يُصدر رمزاً ولا يعيده للمندوب", async () => {
  const { prisma, recorded } = stubPrisma({ orderStatus: "ASSIGNED" });
  const result = await applyOrderTransition({
    prisma,
    orderId: "order-1",
    to: "OUT_FOR_DELIVERY",
    actor: COURIER,
  });

  assert.equal(result.ok, true);
  assert.equal(recorded.otpCreates.length, 1, "يجب إصدار رمز عند الخروج للتوصيل");

  const issued = recorded.otpCreates[0].data;
  assert.ok(typeof issued.codeHash === "string" && issued.codeHash.length > 20, "يُخزَّن مجزّأ لا نصاً");
  assert.ok(!("code" in issued), "لا يُخزَّن الرمز الصريح");

  // من يسلّم الطلب لا يملك الرمز الذي يُفترض أن يقرأه من العميل.
  assert.ok(!JSON.stringify(result).match(/\d{6}/), "نتيجة الانتقال يجب ألا تحمل الرمز");
});

test("محاولة إيصال الرمز تُسجَّل بصدق عند غياب مزود رسائل", async () => {
  const previous = { sms: process.env.SMS_PROVIDER, wa: process.env.WHATSAPP_PROVIDER };
  delete process.env.SMS_PROVIDER;
  delete process.env.WHATSAPP_PROVIDER;
  try {
    const { prisma, recorded } = stubPrisma({ orderStatus: "ASSIGNED" });
    await applyOrderTransition({ prisma, orderId: "order-1", to: "OUT_FOR_DELIVERY", actor: COURIER });

    assert.equal(recorded.notifications.length, 1);
    const log = recorded.notifications[0].data;
    assert.notEqual(log.status, "SENT", "لا يُسجَّل إرسال لم يحدث");
    assert.equal(log.status, "QUEUED");
    assert.equal(log.error, "NO_MESSAGING_PROVIDER_CONFIGURED");
    assert.ok(!JSON.stringify(log.payload).match(/\d{6}/), "سجل الإشعارات لا يحمل الرمز");
  } finally {
    if (previous.sms) process.env.SMS_PROVIDER = previous.sms;
    if (previous.wa) process.env.WHATSAPP_PROVIDER = previous.wa;
  }
});
