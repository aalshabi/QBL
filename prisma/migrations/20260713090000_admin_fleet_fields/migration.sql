-- AlterTable: فرع المندوب (hub) — من مواصفة الترحيل §2.5
ALTER TABLE "Courier" ADD COLUMN "hubId" TEXT;

-- AlterTable: انتهاء التأمين والرخصة للمركبة
ALTER TABLE "Vehicle" ADD COLUMN "insuranceExpiry" TIMESTAMP(3);
ALTER TABLE "Vehicle" ADD COLUMN "licenseExpiry" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "Courier" ADD CONSTRAINT "Courier_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "Hub"("id") ON DELETE SET NULL ON UPDATE CASCADE;
