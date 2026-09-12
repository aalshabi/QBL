CREATE TABLE "ShipmentReconciliation" (
 "id" TEXT PRIMARY KEY,"clientAccountId" TEXT NOT NULL,"source" TEXT NOT NULL,
 "windowStart" TIMESTAMP(3) NOT NULL,"windowEnd" TIMESTAMP(3) NOT NULL,
 "sourceCapturedAt" TIMESTAMP(3) NOT NULL,"expectedCount" INTEGER NOT NULL CHECK("expectedCount">=0),
 "receivedCount" INTEGER NOT NULL CHECK("receivedCount">=0),"matchedCount" INTEGER NOT NULL CHECK("matchedCount">=0),
 "missingIds" JSONB NOT NULL,"duplicateIds" JSONB NOT NULL,"unexpectedIds" JSONB NOT NULL,
 "complete" BOOLEAN NOT NULL,"sourceHash" TEXT NOT NULL,"createdBy" TEXT NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "ShipmentReconciliation_window_check" CHECK("windowStart" < "windowEnd" AND "windowEnd" <= "sourceCapturedAt"),
 CONSTRAINT "ShipmentReconciliation_client_fkey" FOREIGN KEY("clientAccountId") REFERENCES "ClientAccount"("id"),
 CONSTRAINT "ShipmentReconciliation_actor_fkey" FOREIGN KEY("createdBy") REFERENCES "User"("id")
);
CREATE INDEX "ShipmentReconciliation_clientAccountId_createdAt_idx" ON "ShipmentReconciliation"("clientAccountId","createdAt");
