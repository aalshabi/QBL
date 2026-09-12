CREATE TABLE "OperationalCase" (
 "id" TEXT PRIMARY KEY, "orderId" TEXT REFERENCES "DeliveryOrder"("id"),
 "clientAccountId" TEXT NOT NULL REFERENCES "ClientAccount"("id"),
 "caseType" TEXT NOT NULL, "priority" TEXT NOT NULL CHECK ("priority" IN ('P0','P1','P2')),
 "ownerId" TEXT NOT NULL REFERENCES "User"("id"), "backupOwnerId" TEXT NOT NULL REFERENCES "User"("id"),
 "status" TEXT NOT NULL DEFAULT 'NEW' CHECK ("status" IN ('NEW','IN_PROGRESS','WAITING_EXTERNAL','WAITING_CUSTOMER_CONFIRMATION','CLOSED')),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "ackDueAt" TIMESTAMP(3) NOT NULL, "resolutionDueAt" TIMESTAMP(3) NOT NULL,
 "lastActionAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "resolution" TEXT, "evidence" JSONB NOT NULL DEFAULT '[]',
 "requiresCustomerConfirmation" BOOLEAN NOT NULL DEFAULT false,
 "customerConfirmedAt" TIMESTAMP(3), "closedAt" TIMESTAMP(3),
 "reopenedFromCaseId" TEXT REFERENCES "OperationalCase"("id"), "version" INTEGER NOT NULL DEFAULT 0,
 CHECK ("ownerId" <> "backupOwnerId"),
 CHECK ("ackDueAt" >= "createdAt" AND "resolutionDueAt" >= "ackDueAt"),
 CHECK (jsonb_typeof("evidence") = 'array'),
 CHECK ("status" <> 'CLOSED' OR ("resolution" IS NOT NULL AND length(trim("resolution")) >= 10 AND jsonb_array_length("evidence") > 0 AND "closedAt" IS NOT NULL AND (NOT "requiresCustomerConfirmation" OR "customerConfirmedAt" IS NOT NULL)))
);
CREATE INDEX "OperationalCase_status_resolutionDueAt_idx" ON "OperationalCase"("status","resolutionDueAt");
CREATE INDEX "OperationalCase_clientAccountId_status_idx" ON "OperationalCase"("clientAccountId","status");
CREATE FUNCTION qbl_check_case_tenant() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW."orderId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "DeliveryOrder" WHERE id=NEW."orderId" AND "clientAccountId"=NEW."clientAccountId") THEN
  RAISE EXCEPTION 'CASE_TENANT_MISMATCH' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER "OperationalCase_tenant_guard" BEFORE INSERT OR UPDATE ON "OperationalCase" FOR EACH ROW EXECUTE FUNCTION qbl_check_case_tenant();
