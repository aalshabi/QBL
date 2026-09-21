-- CreateTable
CREATE TABLE "ColdChainSensor" (
    "id" TEXT NOT NULL,
    "sensorId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "vehicleId" TEXT,
    "label" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3),

    CONSTRAINT "ColdChainSensor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ColdChainSensor_sensorId_key" ON "ColdChainSensor"("sensorId");

-- CreateIndex
CREATE INDEX "ColdChainSensor_active_lastSeenAt_idx" ON "ColdChainSensor"("active", "lastSeenAt");

-- AddForeignKey
ALTER TABLE "ColdChainSensor" ADD CONSTRAINT "ColdChainSensor_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
