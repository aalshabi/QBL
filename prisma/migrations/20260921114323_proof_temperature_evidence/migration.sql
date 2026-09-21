-- CreateEnum
CREATE TYPE "TemperatureEvidence" AS ENUM ('IN_RANGE', 'OUT_OF_RANGE', 'STALE', 'MISSING');

-- AlterTable
ALTER TABLE "ProofOfDelivery" ADD COLUMN     "temperatureAt" TIMESTAMP(3),
ADD COLUMN     "temperatureCelsius" DECIMAL(5,2),
ADD COLUMN     "temperatureEvidence" "TemperatureEvidence" NOT NULL DEFAULT 'MISSING';
