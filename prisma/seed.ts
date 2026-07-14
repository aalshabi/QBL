import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { clientAccounts, couriers, customers, deliveryOrders, vehicles } from "../lib/mock-data";
import { adminOrders } from "../lib/admin/mock";
import { createTrackingToken, generateOtpCode, hashOtp, hashToken } from "../lib/security";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/qdl?schema=public",
  }),
});

/** أرقام جوال سعودية واقعية — آخر 4 أرقام هي ما يُدخله العميل للتحقق عند التتبع بالرقم. */
function customerPhone(index: number) {
  return `05${String(50_000_000 + index * 137_113).slice(0, 8)}`;
}

function courierPhone(index: number) {
  return `05${String(53_000_000 + index * 111_317).slice(0, 8)}`;
}

const HUBS = [
  { name: "فرع الرياض الرئيسي", city: "الرياض", address: "طريق أبو عبيدة عامر بن الجراح", managerName: "سلطان المطيري" },
  { name: "فرع الشمال", city: "الرياض", address: "حي النرجس، طريق الملك سلمان", managerName: "هيا العنزي" },
  { name: "فرع الغرب", city: "الرياض", address: "حي حطين، طريق الملك خالد", managerName: "مشعل الغامدي" },
];

// بيانات الشركة الرسمية لتهيئة قاعدة البيانات (البريد المعتمد: info@qbl.sa).
const company = {
  officialName: "شركة قدام بابك للخدمات اللوجستية",
  tradeName: "QADDAM BABAK Logistics",
  abbreviation: "QBL",
  sector: "نقل مبرد لمستحضرات التجميل — Beauty Shield Last-Mile",
  headquarters: "الرياض، السعودية",
  foundedYear: 2024,
  website: "qbl.sa",
  emails: {
    general: "info@qbl.sa",
    sales: "info@qbl.sa",
    ops: "info@qbl.sa",
    billing: "info@qbl.sa",
    manager: "info@qbl.sa",
  },
  generalManager: "عبدالله إسماعيل الشعبي",
  address: "الرياض — طريق أبو عبيدة عامر بن الجراح",
  crNumber: "1010985560",
  unifiedNumber: "7038401902",
};

async function main() {
  await prisma.proofOfDelivery.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.notificationLog.deleteMany();
  await prisma.temperatureReading.deleteMany();
  await prisma.locationPing.deleteMany();
  await prisma.otpCode.deleteMany();
  await prisma.trackingSession.deleteMany();
  await prisma.deliveryStop.deleteMany();
  await prisma.deliveryOrder.deleteMany();
  await prisma.codSettlement.deleteMany();
  await prisma.codCollection.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.cityPrice.deleteMany();
  await prisma.priceList.deleteMany();
  await prisma.courier.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.clientAccount.deleteMany();
  await prisma.hub.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.role.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  await prisma.company.create({
    data: {
      officialName: company.officialName,
      tradeName: company.tradeName,
      abbreviation: company.abbreviation,
      sector: company.sector,
      headquarters: company.headquarters,
      foundedYear: company.foundedYear,
      website: company.website,
      generalEmail: company.emails.general,
      salesEmail: company.emails.sales,
      opsEmail: company.emails.ops,
      billingEmail: company.emails.billing,
      generalManager: company.generalManager,
      managerEmail: company.emails.manager,
      address: company.address,
      crNumber: company.crNumber,
      unifiedNumber: company.unifiedNumber,
    },
  });

  const roleNames = ["ADMIN", "OPS_MANAGER", "DISPATCHER", "COURIER", "CLIENT"] as const;
  const roles = await Promise.all(roleNames.map((name) => prisma.role.create({ data: { name } })));

  const opsUser = await prisma.user.create({
    data: {
      name: "مدير عمليات QBL",
      email: "ops.manager@qdl.sa",
      phone: "0500000000",
      passwordHash: await hashOtp("Admin123456"),
      roles: { create: [{ roleId: roles.find((role) => role.name === "OPS_MANAGER")!.id }] },
    },
  });

  const hubs = await Promise.all(HUBS.map((hub) => prisma.hub.create({ data: hub })));
  const hubByName = new Map(hubs.map((hub) => [hub.name, hub.id]));

  const vehicleStatuses = ["ACTIVE", "ACTIVE", "ACTIVE", "MAINTENANCE", "ACTIVE", "OFFLINE"] as const;

  for (const [index, vehicle] of vehicles.entries()) {
    await prisma.vehicle.create({
      data: {
        id: vehicle.id,
        plateNumber: vehicle.plateNumber,
        label: vehicle.label,
        make: "Hyundai",
        model: `H350 مبرد ${2022 + (index % 4)}`,
        year: 2022 + (index % 4),
        coldRangeMin: vehicle.supportsFrozen ? "-18" : "0",
        coldRangeMax: "5",
        supportsFrozen: vehicle.supportsFrozen,
        status: vehicleStatuses[index % vehicleStatuses.length],
        insuranceExpiry: new Date(Date.UTC(2026, 6 + (index % 6), 20)),
        licenseExpiry: new Date(Date.UTC(2026, 8 + (index % 5), 10)),
      },
    });
  }

  for (const [index, courier] of couriers.entries()) {
    const phone = courierPhone(index);
    const user = await prisma.user.create({
      data: {
        name: courier.displayName,
        email: `${courier.employeeCode.toLowerCase()}@qdl.sa`,
        phone,
        passwordHash: await hashOtp("Courier123456"),
        roles: { create: [{ roleId: roles.find((role) => role.name === "COURIER")!.id }] },
      },
    });

    await prisma.courier.create({
      data: {
        id: courier.id,
        userId: user.id,
        employeeCode: courier.employeeCode,
        displayName: courier.displayName,
        phone,
        status: courier.status,
        vehicleId: courier.vehicleId,
        hubId: hubs[index % hubs.length].id,
      },
    });
  }

  for (const client of clientAccounts) {
    await prisma.clientAccount.create({
      data: {
        id: client.id,
        companyName: client.companyName,
        contactName: client.contactName,
        contactEmail: `${client.id}@example.com`,
        contactPhone: "0500000000",
        sector: client.sector,
        billingEmail: `billing-${client.id}@example.com`,
      },
    });
  }

  for (const [index, customer] of customers.entries()) {
    await prisma.customer.create({
      data: {
        id: customer.id,
        name: customer.name,
        phone: customerPhone(index),
        address: customer.address,
        latitude: customer.latitude,
        longitude: customer.longitude,
        sector: customer.sector,
      },
    });
  }

  // الطلبات: الحقول التشغيلية من mock-data، وحقول الإدارة (COD/الفوترة/الفرع) من admin/mock.
  const adminById = new Map(adminOrders.map((order) => [order.id, order]));

  for (const order of deliveryOrders) {
    const admin = adminById.get(order.id)!;
    const scheduledAt = new Date(order.scheduledAt);
    const reached = (status: string) => order.timeline.find((item) => item.status === status)?.at ?? null;

    await prisma.deliveryOrder.create({
      data: {
        id: order.id,
        publicCode: order.publicCode,
        reference: order.reference,
        barcode: admin.barcode,
        clientAccountId: order.clientAccountId,
        customerId: order.customerId,
        courierId: order.courierId,
        vehicleId: order.vehicleId,
        hubId: hubByName.get(admin.hubName) ?? hubs[0].id,
        status: admin.status,
        codAmount: admin.codAmount,
        deliveryFee: admin.deliveryFee,
        paymentMethod: admin.paymentMethod,
        codStatus: admin.codStatus,
        notes: admin.notes,
        isFollowUp: admin.isFollowUp,
        postponedAt: admin.postponedAt ? new Date(admin.postponedAt) : null,
        pickupAddress: order.pickupAddress,
        dropoffAddress: order.dropoffAddress,
        dropoffLatitude: order.dropoffLatitude,
        dropoffLongitude: order.dropoffLongitude,
        serviceType: order.serviceType,
        temperatureTarget: order.temperatureTarget,
        etaMinutes: order.etaMinutes,
        scheduledAt,
        assignedAt: reached("ASSIGNED") ? new Date(reached("ASSIGNED")!) : null,
        outForDeliveryAt: reached("OUT_FOR_DELIVERY") ? new Date(reached("OUT_FOR_DELIVERY")!) : null,
        arrivedAt: reached("ARRIVED") ? new Date(reached("ARRIVED")!) : null,
        deliveredAt: admin.deliveredAt ? new Date(admin.deliveredAt) : null,
        failedAt: admin.status === "FAILED" ? new Date(scheduledAt.getTime() + 70 * 60_000) : null,
        failureReason: admin.status === "FAILED" ? "تعذر تواصل العميل" : null,
        isDelayed: order.isDelayed,
        requiresIntervention: order.requiresIntervention,
        stops: {
          create: [
            {
              sequence: 1,
              label: "Pickup",
              address: order.pickupAddress,
              latitude: 24.7152,
              longitude: 46.8212,
              plannedAt: scheduledAt,
            },
            {
              sequence: 2,
              label: "Dropoff",
              address: order.dropoffAddress,
              latitude: order.dropoffLatitude,
              longitude: order.dropoffLongitude,
              plannedAt: new Date(scheduledAt.getTime() + order.etaMinutes * 60_000),
            },
          ],
        },
      },
    });

    const token = await createTrackingToken(order.id, "8h");
    await prisma.trackingSession.create({
      data: {
        orderId: order.id,
        tokenHash: await hashToken(token),
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
      },
    });

    const otp = admin.status === "OUT_FOR_DELIVERY" || admin.status === "ARRIVED" ? "123456" : generateOtpCode();
    await prisma.otpCode.create({
      data: {
        orderId: order.id,
        codeHash: await hashOtp(otp),
        expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
        lastSentAt: new Date(),
      },
    });

    await prisma.locationPing.create({
      data: {
        courierId: order.courierId,
        orderId: order.id,
        latitude: order.dropoffLatitude - 0.006,
        longitude: order.dropoffLongitude + 0.005,
        speedKph: 42,
        heading: 120,
        battery: 78,
      },
    });

    await prisma.temperatureReading.create({
      data: {
        vehicleId: order.vehicleId,
        orderId: order.id,
        celsius: order.currentTemperature ?? 3,
        status: order.temperatureStatus,
        sensorId: `TMP-${order.vehicleId}`,
      },
    });

    await prisma.auditLog.create({
      data: {
        orderId: order.id,
        actorId: opsUser.id,
        action: "ORDER_CREATED",
        metadata: { publicCode: order.publicCode },
      },
    });
  }

  // كشوفات التحصيل لكل عميل: مفرز -> مصدَّر -> مسلَّم
  const VAT_RATE = 0.15;
  const settlementStatuses = ["SORTED", "EXPORTED", "DELIVERED"] as const;
  const base = new Date("2026-07-10T09:00:00+03:00").getTime();

  for (const [index, client] of clientAccounts.entries()) {
    const rows = adminOrders.filter(
      (order) =>
        order.clientAccountId === client.id &&
        order.codStatus !== null &&
        ["SORTED", "EXPORTED", "SETTLED"].includes(order.codStatus),
    );
    if (!rows.length) continue;

    const totalCod = rows.reduce((sum, order) => sum + order.codAmount, 0);
    const totalFees = rows.reduce((sum, order) => sum + order.deliveryFee, 0);
    const vatAmount = Math.round(totalFees * VAT_RATE * 100) / 100;
    const status = settlementStatuses[index % settlementStatuses.length];

    const settlement = await prisma.codSettlement.create({
      data: {
        clientAccountId: client.id,
        status,
        totalCod,
        totalFees,
        vatAmount,
        netToClient: Math.round((totalCod - totalFees - vatAmount) * 100) / 100,
        sortedAt: new Date(base + index * 3_600_000),
        exportedAt: status !== "SORTED" ? new Date(base + (index + 6) * 3_600_000) : null,
        deliveredAt: status === "DELIVERED" ? new Date(base + (index + 30) * 3_600_000) : null,
      },
    });

    await prisma.deliveryOrder.updateMany({
      where: { id: { in: rows.map((order) => order.id) } },
      data: { codSettlementId: settlement.id },
    });
  }

  // عهدة التحصيل مع المناديب (طلبات مسلّمة والنقد ما زال مع المندوب)
  for (const courier of couriers) {
    const rows = adminOrders.filter((order) => order.courierId === courier.id && order.codStatus === "WITH_COURIER");
    if (!rows.length) continue;

    const collection = await prisma.codCollection.create({
      data: {
        courierId: courier.id,
        totalCod: rows.reduce((sum, order) => sum + order.codAmount, 0),
        totalFees: rows.reduce((sum, order) => sum + order.deliveryFee, 0),
        ordersCount: rows.length,
      },
    });

    await prisma.deliveryOrder.updateMany({
      where: { id: { in: rows.map((order) => order.id) } },
      data: { codCollectionId: collection.id },
    });
  }

  // مصروفات تشغيلية
  await prisma.expense.createMany({
    data: [
      { type: "DRIVER", amount: 350, note: "وقود مركبات — أسبوع 28", spentAt: new Date("2026-07-12T10:00:00+03:00") },
      { type: "HUB", amount: 1200, note: "صيانة تبريد مستودع الفرع الرئيسي", hubId: hubs[0].id, spentAt: new Date("2026-07-11T14:30:00+03:00") },
      { type: "DRIVER", amount: 180, note: "بدل اتصالات المناديب", spentAt: new Date("2026-07-10T09:15:00+03:00") },
      { type: "OTHER", amount: 95, note: "مستلزمات تغليف مبرد", spentAt: new Date("2026-07-09T16:45:00+03:00") },
      { type: "PARTNER", amount: 420, note: "رسوم شريك توصيل خارج الرياض", spentAt: new Date("2026-07-08T11:20:00+03:00") },
    ],
  });

  // قائمة أسعار افتراضية للشركة
  await prisma.priceList.create({
    data: {
      name: "التسعير الافتراضي — الرياض",
      isDefault: true,
      prices: {
        create: [
          { serviceType: "أغذية طازجة B2B2C", originCity: "الرياض", destinationCity: "الرياض", price: 25, returnPrice: 12 },
          { serviceType: "دوائي مبرد", originCity: "الرياض", destinationCity: "الرياض", price: 35, returnPrice: 17 },
          { serviceType: "مجمدات", originCity: "الرياض", destinationCity: "الرياض", price: 39, returnPrice: 19 },
        ],
      },
    },
  });

  console.log(`seeded: ${deliveryOrders.length} orders, ${couriers.length} couriers, ${hubs.length} hubs`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("QBL seed completed");
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
