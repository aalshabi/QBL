CREATE TYPE "WhatsAppConfirmationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'RESCHEDULE_REQUESTED', 'DECLINED', 'NO_REPLY', 'MANUAL_REVIEW', 'OPTED_OUT');
CREATE TYPE "WhatsAppMessageDirection" AS ENUM ('INBOUND', 'OUTBOUND');
CREATE TYPE "WhatsAppMessageStatus" AS ENUM ('RECEIVED', 'QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'DEAD_LETTER');
CREATE TYPE "WhatsAppOutboxStatus" AS ENUM ('QUEUED', 'LEASED', 'SENT', 'RETRY', 'DEAD_LETTER', 'CANCELLED');

CREATE TABLE "WhatsAppConsent" (
  "id" TEXT NOT NULL, "customerId" TEXT NOT NULL, "phoneE164" TEXT NOT NULL,
  "purpose" TEXT NOT NULL, "source" TEXT NOT NULL, "grantedAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3), "evidenceRef" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "WhatsAppConsent_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "WhatsAppConfirmation" (
  "id" TEXT NOT NULL, "orderId" TEXT NOT NULL, "version" INTEGER NOT NULL DEFAULT 1,
  "phoneE164" TEXT NOT NULL, "status" "WhatsAppConfirmationStatus" NOT NULL DEFAULT 'PENDING',
  "requestedAt" TIMESTAMP(3), "respondedAt" TIMESTAMP(3), "requestedTimeText" TEXT,
  "lastInboundAt" TIMESTAMP(3), "manualReviewAt" TIMESTAMP(3), "optedOutAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WhatsAppConfirmation_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "WhatsAppMessage" (
  "id" TEXT NOT NULL, "providerMessageId" TEXT, "orderId" TEXT, "confirmationId" TEXT,
  "direction" "WhatsAppMessageDirection" NOT NULL, "status" "WhatsAppMessageStatus" NOT NULL,
  "phoneE164" TEXT NOT NULL, "messageType" TEXT NOT NULL, "bodyRedacted" TEXT,
  "payloadHash" TEXT NOT NULL, "providerTimestamp" TIMESTAMP(3), "errorCode" TEXT,
  "errorSummary" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "WhatsAppMessage_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "WhatsAppWebhookEvent" (
  "id" TEXT NOT NULL, "payloadHash" TEXT NOT NULL, "eventType" TEXT NOT NULL,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "processedAt" TIMESTAMP(3),
  "outcome" TEXT, "attempts" INTEGER NOT NULL DEFAULT 0, "lastError" TEXT,
  CONSTRAINT "WhatsAppWebhookEvent_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "WhatsAppOutbox" (
  "id" TEXT NOT NULL, "idempotencyKey" TEXT NOT NULL, "orderId" TEXT NOT NULL,
  "confirmationId" TEXT NOT NULL, "phoneE164" TEXT NOT NULL, "templateName" TEXT NOT NULL,
  "templateLanguage" TEXT NOT NULL DEFAULT 'ar', "parameters" JSONB NOT NULL,
  "status" "WhatsAppOutboxStatus" NOT NULL DEFAULT 'QUEUED', "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "leaseOwner" TEXT,
  "leaseExpiresAt" TIMESTAMP(3), "providerMessageId" TEXT, "lastError" TEXT, "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  "expiresAt" TIMESTAMP(3),
  CONSTRAINT "WhatsAppOutbox_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WhatsAppConfirmation_orderId_version_key" ON "WhatsAppConfirmation"("orderId", "version");
CREATE UNIQUE INDEX "WhatsAppMessage_providerMessageId_key" ON "WhatsAppMessage"("providerMessageId");
CREATE UNIQUE INDEX "WhatsAppOutbox_idempotencyKey_key" ON "WhatsAppOutbox"("idempotencyKey");
CREATE INDEX "WhatsAppConsent_phoneE164_revokedAt_idx" ON "WhatsAppConsent"("phoneE164", "revokedAt");
CREATE INDEX "WhatsAppConsent_customerId_grantedAt_idx" ON "WhatsAppConsent"("customerId", "grantedAt");
CREATE INDEX "WhatsAppConfirmation_phoneE164_status_createdAt_idx" ON "WhatsAppConfirmation"("phoneE164", "status", "createdAt");
CREATE INDEX "WhatsAppConfirmation_status_updatedAt_idx" ON "WhatsAppConfirmation"("status", "updatedAt");
CREATE INDEX "WhatsAppMessage_phoneE164_createdAt_idx" ON "WhatsAppMessage"("phoneE164", "createdAt");
CREATE INDEX "WhatsAppMessage_orderId_createdAt_idx" ON "WhatsAppMessage"("orderId", "createdAt");
CREATE INDEX "WhatsAppWebhookEvent_processedAt_receivedAt_idx" ON "WhatsAppWebhookEvent"("processedAt", "receivedAt");
CREATE INDEX "WhatsAppOutbox_status_nextAttemptAt_idx" ON "WhatsAppOutbox"("status", "nextAttemptAt");
CREATE INDEX "WhatsAppOutbox_leaseExpiresAt_idx" ON "WhatsAppOutbox"("leaseExpiresAt");

ALTER TABLE "WhatsAppConsent" ADD CONSTRAINT "WhatsAppConsent_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WhatsAppConfirmation" ADD CONSTRAINT "WhatsAppConfirmation_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "DeliveryOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WhatsAppMessage" ADD CONSTRAINT "WhatsAppMessage_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "DeliveryOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WhatsAppMessage" ADD CONSTRAINT "WhatsAppMessage_confirmationId_fkey" FOREIGN KEY ("confirmationId") REFERENCES "WhatsAppConfirmation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WhatsAppOutbox" ADD CONSTRAINT "WhatsAppOutbox_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "DeliveryOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WhatsAppOutbox" ADD CONSTRAINT "WhatsAppOutbox_confirmationId_fkey" FOREIGN KEY ("confirmationId") REFERENCES "WhatsAppConfirmation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TYPE "AuditAction" ADD VALUE 'WHATSAPP_MANUAL_REPLY_QUEUED';
