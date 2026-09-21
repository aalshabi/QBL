-- CreateEnum
CREATE TYPE "ColdChainAlertKind" AS ENUM ('OUT_OF_RANGE', 'STALE_READING', 'NO_TELEMETRY');

-- CreateTable
CREATE TABLE "ColdChainAlert" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "vehicleId" TEXT,
    "kind" "ColdChainAlertKind" NOT NULL,
    "severity" "TemperatureStatus" NOT NULL DEFAULT 'WARNING',
    "celsius" DECIMAL(5,2),
    "boundsMin" DECIMAL(5,2),
    "boundsMax" DECIMAL(5,2),
    "occurrences" INTEGER NOT NULL DEFAULT 1,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readingAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ColdChainAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ColdChainAlert_orderId_kind_resolvedAt_idx" ON "ColdChainAlert"("orderId", "kind", "resolvedAt");

-- CreateIndex
CREATE INDEX "ColdChainAlert_resolvedAt_detectedAt_idx" ON "ColdChainAlert"("resolvedAt", "detectedAt");

-- AddForeignKey
ALTER TABLE "ColdChainAlert" ADD CONSTRAINT "ColdChainAlert_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "DeliveryOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColdChainAlert" ADD CONSTRAINT "ColdChainAlert_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
