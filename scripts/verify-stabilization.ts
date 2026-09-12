// Local-only verification harness. Never reads a production database or provider key.
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { readFileSync, readdirSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { hashOtp } from "../lib/security";
import { getPrisma } from "../lib/prisma";
async function main() {
  const db = await PGlite.create();
  for (const folder of readdirSync("prisma/migrations", { withFileTypes: true })
    .filter((x) => x.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name)))
    await db.exec(
      readFileSync(
        "prisma/migrations/" + folder.name + "/migration.sql",
        "utf8",
      ),
    );
  const socket = new PGLiteSocketServer({ db, host: "127.0.0.1", port: 0 });
  await socket.start();
  const conn = socket.getServerConn();
  process.env.DATABASE_URL = conn.startsWith("postgres")
    ? conn
    : "postgresql://postgres:postgres@" + conn + "/postgres";
  process.env.OTP_PEPPER = randomBytes(32).toString("hex");
  const prisma = getPrisma(),
    role = await prisma.role.create({ data: { name: "OPS_MANAGER" } });
  const passwordHash = await hashOtp("Qbl-Local-Verification-Only-2026!");
  const owner = await prisma.user.create({
    data: {
      name: "مسؤول اختبار معزول",
      email: "operator@example.invalid",
      passwordHash,
      roles: { create: { roleId: role.id } },
    },
  });
  const backup = await prisma.user.create({
    data: {
      name: "بديل اختبار معزول",
      email: "backup@example.invalid",
      passwordHash,
      roles: { create: { roleId: role.id } },
    },
  });
  const clientRole = await prisma.role.create({ data: { name: "CLIENT" } });
  const clientUser = await prisma.user.create({
    data: {
      name: "Synthetic client",
      email: "client-user@example.invalid",
      passwordHash,
      roles: { create: { roleId: clientRole.id } },
    },
  });
  const client = await prisma.clientAccount.create({
    data: {
      userId: clientUser.id,
      companyName: "عميل اختبار معزول",
      contactName: "Synthetic",
      contactEmail: "client@example.invalid",
      contactPhone: "000",
      sector: "ECOMMERCE",
    },
  });
  const customer = await prisma.customer.create({
    data: {
      name: "Synthetic",
      phone: "000",
      address: "Synthetic Riyadh",
      latitude: 24.7,
      longitude: 46.7,
      sector: "ECOMMERCE",
    },
  });
  const order = await prisma.deliveryOrder.create({
    data: {
      publicCode: "LOCAL-TEST-001",
      reference: "LOCAL-REF-001",
      barcode: "LOCAL-TEST-001",
      clientAccountId: client.id,
      customerId: customer.id,
      pickupAddress: "Synthetic",
      dropoffAddress: "Synthetic Riyadh",
      dropoffLatitude: 24.7,
      dropoffLongitude: 46.7,
      serviceType: "SYNTHETIC",
      temperatureTarget: "UNSPECIFIED",
      etaMinutes: 0,
      scheduledAt: new Date(),
      status: "OUT_FOR_DELIVERY",
      outForDeliveryAt: new Date(Date.now() - 86400000),
      logestechsOccurredAt: new Date(Date.now() - 86400000),
    },
  });
  await prisma.operationalCase.create({
    data: {
      orderId: order.id,
      clientAccountId: client.id,
      caseType: "DELIVERY_DISPUTE",
      priority: "P0",
      ownerId: owner.id,
      backupOwnerId: backup.id,
      ackDueAt: new Date(Date.now() + 3600000),
      resolutionDueAt: new Date(Date.now() + 7200000),
      requiresCustomerConfirmation: true,
    },
  });
  const sessionSecret = randomBytes(32).toString("hex"),
    cronSecret = randomBytes(32).toString("hex");
  const child = spawn(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      "start",
      "-H",
      "127.0.0.1",
      "-p",
      "3407",
    ],
    {
      stdio: "inherit",
      env: {
        ...process.env,
        NODE_ENV: "production",
        SESSION_SECRET: sessionSecret,
        CRON_SECRET: cronSecret,
        TRACKING_TOKEN_SECRET: randomBytes(32).toString("hex"),
        GOOGLE_MAPS_API_KEY: "",
        LOGESTECHS_EMAIL: "",
        LOGESTECHS_PASSWORD: "",
        LOGESTECHS_WEBHOOK_API_KEY: randomBytes(32).toString("hex"),
        VERCEL: "",
        VERCEL_ENV: "",
      },
    },
  );
  let cleaned = false;
  async function cleanup() {
    if (cleaned) return;
    cleaned = true;
    child.kill();
    await prisma.$disconnect();
    await socket.stop();
    await db.close();
  }
  process.on("SIGINT", () => void cleanup().finally(() => process.exit(0)));
  process.on("SIGTERM", () => void cleanup().finally(() => process.exit(0)));
  child.once("exit", () => void cleanup());
  console.log(
    "LOCAL VERIFICATION ONLY: http://localhost:3407/login ; synthetic operator@example.invalid",
  );
}
void main().catch(() => {
  console.error("LOCAL_VERIFICATION_FAILED");
  process.exitCode = 1;
});
