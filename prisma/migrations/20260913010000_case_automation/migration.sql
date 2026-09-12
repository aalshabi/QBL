
ALTER TABLE "OperationalCase" ADD COLUMN "detectionKey" TEXT, ADD COLUMN "escalationLevel" INTEGER NOT NULL DEFAULT 0 CHECK("escalationLevel" BETWEEN 0 AND 2), ADD COLUMN "escalatedToUserId" TEXT REFERENCES "User"("id");
CREATE UNIQUE INDEX "OperationalCase_detectionKey_key" ON "OperationalCase"("detectionKey");
CREATE TABLE "OperationsPolicy" (
 "id" TEXT PRIMARY KEY,"clientAccountId" TEXT NOT NULL UNIQUE REFERENCES "ClientAccount"("id"),
 "ownerId" TEXT NOT NULL REFERENCES "User"("id"),"backupOwnerId" TEXT NOT NULL REFERENCES "User"("id"),
 "firstEscalationOwnerId" TEXT NOT NULL REFERENCES "User"("id"),"secondEscalationOwnerId" TEXT NOT NULL REFERENCES "User"("id"),
 "ackMinutes" INTEGER NOT NULL CHECK("ackMinutes">0),"resolutionMinutes" INTEGER NOT NULL CHECK("resolutionMinutes">="ackMinutes"),
 "stalledMinutes" INTEGER NOT NULL CHECK("stalledMinutes">0),"noUpdateMinutes" INTEGER NOT NULL CHECK("noUpdateMinutes">0),
 "riskMinutes" INTEGER NOT NULL CHECK("riskMinutes">0),"driverCapacity" INTEGER CHECK("driverCapacity">0),
 "updatedBy" TEXT NOT NULL REFERENCES "User"("id"),"updatedAt" TIMESTAMP(3) NOT NULL,
 CHECK("ownerId"<>"backupOwnerId"),CHECK("firstEscalationOwnerId"<>"secondEscalationOwnerId")
);
CREATE TABLE "DeliveryCommitment" (
 "id" TEXT PRIMARY KEY,"orderId" TEXT NOT NULL REFERENCES "DeliveryOrder"("id"),"clientAccountId" TEXT NOT NULL REFERENCES "ClientAccount"("id"),
 "ownerId" TEXT NOT NULL REFERENCES "User"("id"),"windowStart" TIMESTAMP(3) NOT NULL,"windowEnd" TIMESTAMP(3) NOT NULL,
 "planReference" TEXT NOT NULL CHECK(length(trim("planReference"))>=5),
 "feasibility" TEXT NOT NULL DEFAULT 'NEEDS_REVIEW' CHECK("feasibility" IN ('NEEDS_REVIEW','MANUALLY_CONFIRMED','BLOCKED')),
 "status" TEXT NOT NULL DEFAULT 'PLANNED' CHECK("status" IN ('PLANNED','AT_RISK','KEPT','MISSED','CANCELLED')),
 "result" TEXT,"createdBy" TEXT NOT NULL REFERENCES "User"("id"),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,
 CHECK("windowStart"<"windowEnd"),CHECK("status" NOT IN ('KEPT','CANCELLED') OR length(trim("result"))>=10 AND "result" IS NOT NULL)
);
CREATE INDEX "DeliveryCommitment_status_windowEnd_idx" ON "DeliveryCommitment"("status","windowEnd");
CREATE UNIQUE INDEX "DeliveryCommitment_active_order_key" ON "DeliveryCommitment"("orderId") WHERE "status" IN ('PLANNED','AT_RISK');
CREATE TRIGGER "DeliveryCommitment_tenant_guard" BEFORE INSERT OR UPDATE ON "DeliveryCommitment" FOR EACH ROW EXECUTE FUNCTION qbl_check_case_tenant();

CREATE UNIQUE INDEX "OperationalCase_active_detection_key" ON "OperationalCase"("clientAccountId",COALESCE("orderId",''),"caseType") WHERE "status" <> 'CLOSED' AND "detectionKey" IS NOT NULL;
