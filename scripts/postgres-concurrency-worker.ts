import { requirePostgresTestTarget } from "./postgres-test-guard.mjs";
import { getPrisma } from "../lib/prisma";
import { processLogesTechsWebhook } from "../lib/logestechs/webhook-store";
import { normalizeLogesTechsWebhookPayload } from "../lib/logestechs/webhook";
import { runCaseAutomation } from "../lib/operations/automation";
import { createCommitment } from "../lib/operations/commitments";
import { updateOperationalCase } from "../lib/operations/cases";
import type { Session } from "../lib/auth";

requirePostgresTestTarget();
const prisma = getPrisma();
type Job = { kind: string; input?: unknown; actor?: Session };
const timeout = setTimeout(() => { void prisma.$disconnect().finally(() => process.exit(1)); }, 60_000);
// If the parent dies, never leave a connection or orphan test worker running.
process.once("disconnect", () => { void prisma.$disconnect().finally(() => process.exit(1)); });
async function main() {
  const [connection] = await prisma.$queryRaw<{ pid: number }[]>`SELECT pg_backend_pid() AS pid`;
  process.send?.({ ready: true, pid: connection.pid });
  process.once("message", async (job: Job) => {
    try {
      let result: unknown;
      if (job.kind === "webhook") result = await processLogesTechsWebhook(normalizeLogesTechsWebhookPayload(job.input));
      else if (job.kind === "automation") result = await runCaseAutomation();
      else if (job.kind === "case") result = await updateOperationalCase(job.input, job.actor ?? null);
      else if (job.kind === "commitment") result = await createCommitment(job.input, job.actor ?? null);
      else throw new Error("UNKNOWN_TEST_JOB");
      process.send?.({ ok: true, result });
    } catch (error) {
      const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
      const message = error instanceof Error && /^[A-Z_]+$/.test(error.message) ? error.message : "DATABASE_OPERATION_REJECTED";
      process.send?.({ ok: false, code, message });
    } finally {
      clearTimeout(timeout);
      await prisma.$disconnect();
      process.exit(0);
    }
  });
}
void main().catch(() => { clearTimeout(timeout); process.exit(1); });
