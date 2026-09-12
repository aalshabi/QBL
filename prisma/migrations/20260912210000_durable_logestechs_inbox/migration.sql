ALTER TABLE "DeliveryOrder" ADD COLUMN "logestechsOccurredAt" TIMESTAMP(3);
CREATE TABLE "LogesTechsEvent" (
 "id" TEXT PRIMARY KEY, "kind" TEXT NOT NULL, "barcode" TEXT NOT NULL,
 "externalStatus" TEXT NOT NULL, "packageId" TEXT, "invoiceNumber" TEXT,
 "eventOccurredAt" TIMESTAMP(3), "eventReceivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "state" TEXT NOT NULL DEFAULT 'PENDING', "outcome" TEXT, "orderId" TEXT,
 "attempts" INTEGER NOT NULL DEFAULT 0, "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "lastAttemptAt" TIMESTAMP(3), "processedAt" TIMESTAMP(3), "lastError" TEXT,
 CONSTRAINT "LogesTechsEvent_state_check" CHECK ("state" IN ('PENDING','PROCESSED','REVIEW_REQUIRED')),
 CONSTRAINT "LogesTechsEvent_attempts_check" CHECK ("attempts" >= 0)
);
CREATE INDEX "LogesTechsEvent_state_nextAttemptAt_idx" ON "LogesTechsEvent"("state","nextAttemptAt");
CREATE INDEX "LogesTechsEvent_barcode_eventOccurredAt_idx" ON "LogesTechsEvent"("barcode","eventOccurredAt");
CREATE TABLE "IntegrationJobRun" (
 "name" TEXT PRIMARY KEY, "lastStartedAt" TIMESTAMP(3) NOT NULL,
 "lastSucceededAt" TIMESTAMP(3), "lastError" TEXT, "processedCount" INTEGER NOT NULL DEFAULT 0
);
