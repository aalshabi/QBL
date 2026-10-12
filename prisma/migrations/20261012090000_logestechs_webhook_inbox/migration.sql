-- CreateTable
CREATE TABLE "LogesTechsWebhookEvent" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "externalStatus" TEXT NOT NULL,
    "packageId" TEXT,
    "invoiceNumber" TEXT,
    "externalTime" TIMESTAMP(3),
    "notes" TEXT,
    "codAmount" DECIMAL(10,2),
    "outcome" TEXT,
    "orderId" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "LogesTechsWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LogesTechsWebhookEvent_barcode_receivedAt_idx" ON "LogesTechsWebhookEvent"("barcode", "receivedAt");

-- CreateIndex
CREATE INDEX "LogesTechsWebhookEvent_processedAt_idx" ON "LogesTechsWebhookEvent"("processedAt");

