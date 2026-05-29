import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { company } from "../lib/company";
import { clientAccounts, couriers, customers, deliveryOrders, vehicles } from "../lib/mock-data";
import { createTrackingToken, generateOtpCode, hashOtp, hashToken } from "../lib/security";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/qdl?schema=public",
  }),
});

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
  await prisma.courier.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.clientAccount.deleteMany();
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

  for (const vehicle of vehicles) {
    await prisma.vehicle.create({
      data: {
        id: vehicle.id,
        plateNumber: vehicle.plateNumber,
        label: vehicle.label,
        make: "Toyota",
        model: "Hiace Refrigerated",
        year: 2024,
        coldRangeMin: vehicle.supportsFrozen ? "-18" : "0",
        coldRangeMax: "5",
        supportsFrozen: vehicle.supportsFrozen,
      },
    });
  }

  for (const courier of couriers) {
    const user = await prisma.user.create({
      data: {
        name: courier.displayName,
        email: `${courier.employeeCode.toLowerCase()}@qdl.sa`,
        phone: courier.phoneMasked.replace(/\*/g, "0"),
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
        phone: courier.phoneMasked.replace(/\*/g, "0"),
        status: courier.status,
        vehicleId: courier.vehicleId,
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

  for (const customer of customers) {
    await prisma.customer.create({
      data: {
        id: customer.id,
        name: customer.name,
        phone: customer.phoneMasked.replace(/\*/g, "0"),
        address: customer.address,
        latitude: customer.latitude,
        longitude: customer.longitude,
        sector: customer.sector,
      },
    });
  }

  for (const order of deliveryOrders) {
    await prisma.deliveryOrder.create({
      data: {
        id: order.id,
        publicCode: order.publicCode,
        reference: order.reference,
        clientAccountId: order.clientAccountId,
        customerId: order.customerId,
        courierId: order.courierId,
        vehicleId: order.vehicleId,
        status: order.status,
        pickupAddress: order.pickupAddress,
        dropoffAddress: order.dropoffAddress,
        dropoffLatitude: order.dropoffLatitude,
        dropoffLongitude: order.dropoffLongitude,
        serviceType: order.serviceType,
        temperatureTarget: order.temperatureTarget,
        etaMinutes: order.etaMinutes,
        scheduledAt: new Date(order.scheduledAt),
        assignedAt: order.timeline.find((item) => item.status === "ASSIGNED")?.at ? new Date(order.timeline.find((item) => item.status === "ASSIGNED")!.at!) : null,
        outForDeliveryAt: order.timeline.find((item) => item.status === "OUT_FOR_DELIVERY")?.at ? new Date(order.timeline.find((item) => item.status === "OUT_FOR_DELIVERY")!.at!) : null,
        arrivedAt: order.timeline.find((item) => item.status === "ARRIVED")?.at ? new Date(order.timeline.find((item) => item.status === "ARRIVED")!.at!) : null,
        deliveredAt: order.status === "DELIVERED" ? new Date() : null,
        failedAt: order.status === "FAILED" ? new Date() : null,
        failureReason: order.status === "FAILED" ? "تعذر تواصل العميل" : null,
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
              plannedAt: new Date(order.scheduledAt),
            },
            {
              sequence: 2,
              label: "Dropoff",
              address: order.dropoffAddress,
              latitude: order.dropoffLatitude,
              longitude: order.dropoffLongitude,
              plannedAt: new Date(new Date(order.scheduledAt).getTime() + order.etaMinutes * 60_000),
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

    const otp = order.status === "OUT_FOR_DELIVERY" || order.status === "ARRIVED" ? "123456" : generateOtpCode();
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
