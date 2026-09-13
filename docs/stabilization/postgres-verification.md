# Local PostgreSQL concurrency verification

Date: 2026-09-13, Asia/Riyadh. Repository: `aalshabi/QBL` (operations).
Baseline: `47ee0cd9d7d614572e61d88b91f4baae2ef864c4`, branch `codex/operations-stabilization-20260912`.
This is not the separate `aalshabi/qdl-website` checkout.

## Reproduce

From the operations repository, with dependencies and generated Prisma client installed:

```powershell
npm run test:postgres
```

The harness requires the local Windows Docker context `desktop-linux`, pointing to
`npipe:////./pipe/dockerDesktopLinuxEngine`, and an already available `postgres:16-alpine` image.
It resolves the existing image to a digest and uses `--pull=never`. It does not install Docker,
pull an image, download environment variables, or contact a hosting/provider API.

The verified image was:

```text
postgres@sha256:20edbde7749f822887a1a022ad526fde0a47d6b2be9a8364433605cf65099416
PostgreSQL server: 16.13
```

## Isolation and cleanup

- A fresh random run ID identifies a new container, named volume, and empty database.
- Only `127.0.0.1` is published, on a Docker-assigned host port; the mapping is checked again after restart.
- Credentials are generated in memory. Database/user/host/run identity are checked before migrations.
- The runner uses an OS-variable allowlist. Existing database, provider, Vercel and Node-option environment values are not inherited.
- The test-only Prisma config does not load dotenv or the deployment Prisma config. `DIRECT_URL` must equal the generated test URL.
- No existing container or volume is reused, started or modified. No seed containing real records is loaded.
- The complete seven-migration chain is applied with `prisma migrate deploy`; a second deployment is verified as a no-op. Migration names and successful ledger entries are compared.
- Cleanup requires the exact run label, container ID/name and volume name. It removes only this run's synthetic container and volume and checks that they are absent.
- No Docker prune/reset or filesystem cleanup is used. The image and pre-existing Docker resources remain.
- If the process is forcibly terminated before cleanup, inspect only resources with its printed run name and `com.qbl.postgres-test-run` label. Never substitute a global prune.

## Verified scenarios

Eight test groups passed. Concurrency uses separate Node worker processes and Prisma pools,
with **19 distinct PostgreSQL worker backend PIDs** in the successful run. The coordinator
holds a table/row lock and observes every worker waiting in `pg_stat_activity` before release.
This proves database contention rather than merely calling `Promise.all` on one connection.

| Scenario | Observed acceptance |
| --- | --- |
| Four duplicate webhooks before shipment creation | One durable pending inbox row; exactly one first insertion |
| Shipment creation/replay and four terminal duplicates | Processed event; one event and audit record |
| Competing differently timed shipment status events | Both events retained; newest source status wins; no pending row remains after reconciliation |
| Competing case edits and stale version | One update/audit/version increment; stale/conflicting edit rejected |
| Competing delivery commitments | One active commitment and audit; competing insertion rejected by serialization/uniqueness |
| Tenant, role and closure safeguards | Cross-tenant application and direct SQL writes rejected; CLIENT role denied; evidence and recipient confirmation enforced; closed-case application edits rejected |
| Concurrent case creation and escalation | One active detected case per signal/type and one audit; distinct detection key cannot evade partial unique index; one escalation audit |
| Independent reconnection | Committed inbox, closed case and commitment remain visible |

Additionally, restarting only the test PostgreSQL container preserved exact row counts and
fingerprints for `LogesTechsEvent`, `DeliveryOrder`, `OperationalCase`, `DeliveryCommitment`,
`AuditLog`, `IntegrationJobRun` and `_prisma_migrations`.

The first run passed the concurrency groups but its restart probe used a stale ephemeral host port.
That **harness defect** was corrected by re-inspecting and revalidating the loopback mapping;
two subsequent full runs passed, including restart persistence and cleanup. No application runtime
or migration changes were needed for the tested scenarios.

## Final quality gate and changed files

After the final harness changes, the following commands ran sequentially and exited successfully:

| Command | Actual result |
| --- | --- |
| `npm run test:postgres` | Eight groups, 19 independent worker backends, seven migrations, restart persistence, cleanup passed |
| `npm test` | 66 passed, zero failed, zero skipped; existing PGlite tests retained |
| `npm run lint` | Passed |
| `npm run typecheck` | Passed |
| `npm run build` | Passed; optimized Next.js build and route generation completed |

The existing PGlite-backed inbox test emits a non-blocking `pg` deprecation warning about
overlapping `client.query()` calls. Its test passes; that existing test and its dependency versions
were not changed. No remaining test failures were observed in the commands above.

Changed files (uncommitted local work; baseline HEAD remains unchanged):

- `package.json`: adds `test:postgres`, without dependency changes.
- `scripts/verify-postgres.mjs`: isolated container/migration/restart/cleanup runner.
- `scripts/postgres-test-guard.mjs`: fails closed on non-test database targets.
- `scripts/postgres-test-prisma.config.ts`: guarded migration config without dotenv.
- `scripts/postgres-concurrency-suite.ts`: native PostgreSQL acceptance scenarios.
- `scripts/postgres-concurrency-worker.ts`: independent application/Prisma worker processes.
- `tests/postgres-test-guard.test.ts`: two additional safety tests.
- `docs/stabilization/postgres-verification.md`: this reproducible evidence report.
- `docs/stabilization/implementation-and-release.md`: links this new local verification gate.

Application source, existing migrations and `package-lock.json` were unchanged. Final Docker
inventory confirmed the pre-existing stopped `daleel-db` container and pre-existing volume remain;
no container or volume with the test-run label remained. Synthetic test data was deliberately
discarded with its test volumes. No existing data was deleted.

## Boundaries of this evidence

This is native local PostgreSQL verification, not hosted staging, Neon, production, provider,
backup/restore, disaster-recovery, throughput, or complete HTTP/UI certification. Conflict rejection
does not certify the HTTP/UI presentation of serialization errors. The previously documented
28 PGlite-backed HTTP checks were not rerun by this harness. Customer data and external integrations
were not used. Production version, role permissions, connection pooling and isolation remain unverified.

Hosted staging migration/role/concurrency/HTTP checks and the existing release gates in
`implementation-and-release.md` are still required. No push, merge, deployment or production
migration is authorized by running this local test.

## References

- [Prisma migrate deploy](https://docs.prisma.io/docs/cli/migrate/deploy)
- [Prisma v7 transaction isolation and P2034 conflicts](https://docs.prisma.io/docs/orm/v7/prisma-client/queries/transactions)
