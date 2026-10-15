CREATE TYPE "WhatsAppCommunicationStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'FAILED');
CREATE TYPE "WhatsAppOpsAlertKind" AS ENUM ('DELIVERY_UNKNOWN', 'EARLY_WARNING', 'NO_RESPONSE', 'SEND_FAILED', 'NEEDS_REVIEW');
CREATE TYPE "WhatsAppOpsAlertStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED');

ALTER TYPE "AuditAction" ADD VALUE 'WHATSAPP_OPS_ALERT_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'WHATSAPP_OPS_REVIEWED';

ALTER TABLE "WhatsAppConfirmation"
  ADD COLUMN "communicationStatus" "WhatsAppCommunicationStatus" NOT NULL DEFAULT 'QUEUED',
  ADD COLUMN "sentAt" TIMESTAMP(3),
  ADD COLUMN "deliveredAt" TIMESTAMP(3),
  ADD COLUMN "earlyWarningAt" TIMESTAMP(3),
  ADD COLUMN "responseDeadlineAt" TIMESTAMP(3),
  ADD COLUMN "opsReviewedAt" TIMESTAMP(3),
  ADD COLUMN "opsDecision" TEXT,
  ADD COLUMN "opsReason" TEXT,
  ADD COLUMN "courierIdSnapshot" TEXT;

CREATE TABLE "WhatsAppOpsAlert" (
  "id" TEXT NOT NULL,
  "confirmationId" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "kind" "WhatsAppOpsAlertKind" NOT NULL,
  "status" "WhatsAppOpsAlertStatus" NOT NULL DEFAULT 'OPEN',
  "dueAt" TIMESTAMP(3),
  "courierIdSnapshot" TEXT,
  "detailsHash" TEXT NOT NULL,
  "acknowledgedAt" TIMESTAMP(3),
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WhatsAppOpsAlert_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WhatsAppOpsAlert_confirmationId_kind_key" ON "WhatsAppOpsAlert"("confirmationId", "kind");
CREATE INDEX "WhatsAppOpsAlert_status_createdAt_idx" ON "WhatsAppOpsAlert"("status", "createdAt");
CREATE INDEX "WhatsAppOpsAlert_orderId_createdAt_idx" ON "WhatsAppOpsAlert"("orderId", "createdAt");
ALTER TABLE "WhatsAppOpsAlert" ADD CONSTRAINT "WhatsAppOpsAlert_confirmationId_fkey" FOREIGN KEY ("confirmationId") REFERENCES "WhatsAppConfirmation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WhatsAppOpsAlert" ADD CONSTRAINT "WhatsAppOpsAlert_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "DeliveryOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
