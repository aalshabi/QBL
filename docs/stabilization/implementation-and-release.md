# QBL operations stabilization - implementation and release checkpoint

Date: 2026-09-13, Asia/Riyadh. Repository: https://github.com/aalshabi/QBL.
Baseline master: c1c632d6a8e56eb84d885342e08c410eae88a896. Branch: codex/operations-stabilization-20260912.
The similarly named website repository is separate. Its existing optimizer/fleet services are not copied or modified here.

## Readiness

NOT READY for additional client onboarding or an unverified production rollout. Implemented code and isolated tests are not proof of live ingestion completeness, provider certification, production migrations, or team adoption.

## Domain ownership

| Domain | Authoritative source | QBL boundary |
| --- | --- | --- |
| Shipment lifecycle and assignments | LogesTechs | Read-only synchronization; normalized durable inbox; no fabricated shipments or lifecycle writes |
| Geolocation | Approved Google Maps responses / recorded validated coordinates | Conservative address matching and Riyadh export gate |
| Route planning | Existing website optimizer / verified operational service | Reuse the existing export contract; no new optimizer |
| Operational cases and commitments | QBL | Owner, backup, deadlines, evidence, internal escalation and audit |
| Temperature | Current provider, not yet verified | No normal-temperature assumption or invented universal limit |
| Invoices and accounting | Daftra | Recorded operational fees are not revenue or contribution margin |

## Implemented

1. Durable normalized LogesTechsEvent inbox committed before processing; deterministic IDs; atomic idempotency; bounded retries; explicit pending and review states; event source time separate from receipt time. Missing, future, equal-time conflicts and ambiguous status corrections remain reviewable. Invoice-only matching is disabled. A later recorded return can follow a delivered event.
2. Strict authenticated five-minute reconciliation job with persistent heartbeat. Missing orders exhaust into durable review rather than deletion. Inbox processing failures do not erase accepted records. Failed inbox insertion is not acknowledged as durable acceptance.
3. Production/hosted previews cannot use the affected mock admin, driver, tracking, OTP or notification implementations. Unimplemented operational routes return 503 with no-store. Demo cold-chain screens are blocked on deployed environments. This does not certify all marketing claims in the repository.
4. OperationalCase with five statuses, active operations users, distinct backup, tenant/order consistency, optimistic version, closed-case immutability through the API, and evidence/customer-confirmation closure constraints. Database constraints backstop tenant and closure rules. A source-record reference alone is not closure evidence in the application.
5. One Arabic case worklist, shipment linkage, controlled source-ID reconciliation, structured delivery commitments, and configurable owners/deadlines. Operations/dispatcher login opens the worklist. No actual staff identities or thresholds are guessed.
6. Case automation for stalled/no-update/due/failed shipments, locally unavailable POD, invalid coordinates/address, review events, incomplete reconciliation, commitments at risk, integration heartbeat, and configured driver count threshold. Rules create internal cases and escalation records, not external messages. Repeated signals deduplicate; a new signal may link to a previously closed case. Warehouse-delay and return-progress detectors need authoritative timestamp mappings and remain incomplete. Driver count is only a warning threshold, not route feasibility or an assignment algorithm.
7. Google safeguards reject address-anchor mismatches, non-finite coordinates and out-of-Riyadh exports; preserve source address; remove common formatted/Arabic-digit phone identifiers; retain economical existing field masks. No new Maps SKU or API was enabled.
8. Management report: 15 indicators, Riyadh delivery-date filter, case counts and client recorded fees. Unknown cost, distance, margin, temperature and attempt/SLA metrics stay unavailable. Existing detailed report tabs are explicitly all-period views.

## Database changes

Four new, ordered migrations:
- 20260912210000_durable_logestechs_inbox
- 20260912220000_operational_cases
- 20260912230000_shipment_reconciliation
- 20260913010000_case_automation

Custom PostgreSQL CHECK constraints, tenant trigger and partial unique indexes intentionally supplement Prisma schema. Preserve them when generating future migrations. Do not reset a database or rewrite previously applied migrations.

## Verification commands

Run sequentially from the repository root:

    npm ci
    npm run prisma:generate
    npm test
    npm run lint
    npm run typecheck
    npm run build

Do not run build concurrently with typecheck: Next rewrites generated .next/types files.

Database lifecycle tests use disposable PGlite with its PostgreSQL wire-protocol adapter and the actual Prisma client. All SQL migrations are applied. This verifies SQL constraints and transactional application behavior but is not a substitute for concurrent PostgreSQL/Neon, networking, backup or production deployment tests. See https://pglite.dev/docs/pglite-socket .

To reproduce local UI verification after a build:

    node --conditions=react-server --import tsx scripts/verify-stabilization.ts

This script always creates a fresh in-memory database, synthetic users and records, disables provider keys and binds to localhost:3407. Credentials in that script are disposable fixtures only. Stop it after testing. It never loads or targets a production database.

## Release sequence

1. Confirm the correct Vercel qbl project, source branch and target database host/database. The public operations alias inspected was qbl-logistics.vercel.app. The website alias qbl.sa belongs to a different codebase; do not relink it.
2. Obtain approved staging database access and verified isolation. Production environment values marked sensitive could not be retrieved through the available local CLI; blank downloaded values are not proof of missing production configuration. Never print or commit environment values.
3. Review and back up the intended database under the established operator procedure. Apply the four migrations to the approved staging target with Prisma migrate deploy. Check existing migration history first. Do not run the development migration/reset command on production.
4. Run real PostgreSQL concurrency tests: simultaneous duplicate events, simultaneous status events, simultaneous case automation, stale case edit, and two delivery commitments for the same order. Verify partial unique indexes and tenant/closure constraints. Exercise staging login and APIs with isolated accounts.
5. Configure CRON_SECRET using at least 32 random bytes in the existing secret store. Preserve the existing webhook key. Confirm the Vercel plan supports these five-minute schedules before deployment; do not purchase a plan upgrade automatically.
6. Deploy staging and verify authenticated webhook-before-order/replay, duplicate/no rollback, cron 401/authorized execution/heartbeat, role denial, closure evidence, and Arabic desktop/mobile screens. Configure actual owners and thresholds through the case worklist.
7. With target identity and migration checks verified, migrate the intended production target, deploy the reviewed code, and replay a controlled existing-client sample. Reconcile source IDs and counts over a defined window before declaring success.

## Rollback

Keep the additive tables, normalized inbox and audit history. Do not drop them to roll back a web deployment. A previous deployment may discard webhook-before-order events; rolling back the ingestion route blindly reintroduces that risk. Prefer a forward fix, or an explicitly approved provider retry/maintenance procedure that does not acknowledge an unpersisted event. Preserve all pending/review rows until recovery and source reconciliation are verified.

## Remaining dependencies and scope

- End-to-end ingestion/import: available provider documentation supports create/cancel/status/cities/AWB; it does not document an all-shipments list/detail export API or the required assignment/POD/temperature/custody read contracts. Obtain a controlled real export with canonical identifiers and schema, or an approved provider read contract. The current reconciliation importer compares IDs; it does not invent missing shipment attributes or create records.
- Production database access, staging isolation, cron secret/plan support, migration and deployment are unverified.
- Current Maps Cloud account restrictions, quotas, budget alerts, usage and actual enabled APIs require the authorized QBL account. Commercial documents are private and intentionally not copied into this repository.
- Current critical customer cases require their latest case-to-shipment mapping and evidence. Historical conversation samples are not company-wide failure rates.
- No verified messaging provider, delivery receipt callbacks, sensor provider mapping, LogesTechs driver/POD/warehouse lifecycle contract or Daftra export/accounting approval is available. The code does not manufacture these integrations.
- Commitments are internal records. Manual feasibility confirmation is an operator attestation with a plan reference, not traffic/capacity certification. No message is sent to a customer.
- Active order scanning is capped at 5,000 per configured client and review-event scanning at 500; exceeding the limit fails visibly. Worklists show at most 100 cases and 500 recent shipments. Add cursor pagination before exceeding these reviewed limits.

## Required operational acceptance matrix

| Scenario | Current evidence |
| --- | --- |
| Webhook before shipment / duplicate / older event | Isolated SQL + Prisma lifecycle tests |
| Provider outage / processing outage | HTTP client failure tests + durable-inbox dependency outage simulation |
| Missed job | Unhealthy worklist indicator and internal integration case; production scheduler not verified |
| Closure without evidence / without dispute confirmation | Application rejection + database closure constraints |
| Messaging provider failure | Mock success blocked; real provider test blocked by missing provider contract |
| Cross-client access | Operations-role rejection, tenant/order constraints; anonymous and client HTTP denial verified locally; production checks still required |
| Sensor stale | Live provider unavailable; no temperature-health claim; stale adapter test pending provider contract |
| Source shipment missing | Controlled ID reconciliation test, equal-count/mismatched-ID case |
| Wrong address / impossible coordinates | Google matching and export gate tests |
| Practical driver route capacity | Configured count warning only; route-time/traffic/capacity acceptance remains blocked |
| Status conflict / corrected event | Explicit review outcome; chronological return handling tested |
| Delivered override | Mock write route blocked; case closure cannot override shipment source status |
| Financial correctness | Unknown fees/cost/margin stay unavailable; Daftra reconciliation pending |

## Readiness gate

No new-client readiness claim until a controlled source cohort reconciles with zero unexplained missing or duplicate shipments; all pending/review events have owners; jobs have observed successful runs; existing-client cases meet evidence/confirmation rules; and route, driver, POD, temperature (where required), messaging and invoice flows pass their applicable real-source tests. Time passing alone is not a gate.

## Final local verification checkpoint — 2026-09-13 Riyadh

- 64 automated tests passed; npm run lint, npm run typecheck and npm run build passed.
- scripts/verify-stabilization-http.mjs passed 28 real localhost HTTP checks against the production build and a disposable synthetic database. Anonymous/client denial, origin/CSRF checks, persisted cases, evidence/customer confirmation, closed-case immutability, cron authorization, production demo blocking, rendered management report and source-only shipment detection passed.
- Arabic case workflow inspected at desktop and 390px mobile width; a case update persisted after refresh. Management report inspected at 390px mobile and 1280px desktop. These are local acceptance results, not production/provider results.
- Existing unsupported return-fee, VAT and net-profit calculations now remain null/unavailable for database-backed data until an authoritative financial reconciliation exists. Report/fleet/COD reads use coherent transactional snapshots.
- No production migrations, provider enablement, paid Maps requests, external messages, merge or production release were performed.

## Changed surfaces and configuration

Primary new APIs:
- GET/POST/PATCH /api/operations/cases
- POST /api/operations/reconciliation
- POST /api/operations/controls
- GET /api/cron/logestechs-reconcile
- GET /api/cron/operations-cases

Existing webhook: /api/webhooks/logestechs/status.
Primary UI: /ops/cases, /admin/reports, /admin/cod.
Core files: lib/logestechs/webhook-store.ts, lib/logestechs/event-policy.ts, lib/operations/*, lib/runtime-mode.ts, proxy.ts, lib/google-maps/{client,address-match,coverage,route-export}.ts, lib/admin/{prisma-source,types,format}.ts, prisma/schema.prisma, vercel.json. The branch diff is the full file manifest.

Required secure configuration: intended DATABASE_URL and migration connection configuration, SESSION_SECRET, OTP_PEPPER, TRACKING_TOKEN_SECRET, LOGESTECHS_WEBHOOK_API_KEY, existing approved LogesTechs settings, server GOOGLE_MAPS_API_KEY, and a new CRON_SECRET. Never expose values in reports. Confirm exact existing provider configuration and billing approval before use.
Production values labeled sensitive are protected, not absent. Automatic approval review rejected an attempted download of all development environment values; that attempted file was not created. Do not bypass this rejection. Obtain a secure, explicitly scoped staging connection workflow that verifies target identity without dumping the environment.
