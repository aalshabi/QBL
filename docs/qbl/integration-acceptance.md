# QBL → Salla → LogesTechs integration acceptance

Review date: 2026-10-14
Decision: **Not production-ready; no live integration claim is authorized.**

## Evidence found

- The repository contains a server-side, read-only LogesTechs client, configuration validation, request-security checks, and status-mapping tests.
- `lib/integrations/overview.ts` explicitly blocks creation, cancellation, assignment, and webhooks until a sandbox and signing method are approved.
- The documented system boundary proposes LogesTechs as shipment lifecycle source of truth and requires stable external IDs, idempotency keys, correlation IDs, event timestamps, and versions.
- No Salla app registration, approved OAuth scopes, sandbox credentials, authenticated webhook contract, or authorized production trace is present in this repository or accessible Vercel project identity.

## Required acceptance matrix

| Gate | Required evidence | Current result |
|---|---|---|
| Salla app registration | App ID, owner, environment, redirect URLs | Blocked — not supplied |
| Minimum scopes | Approved read/write scope list and purpose | Blocked — not supplied |
| Sandbox order flow | Synthetic order ID and timestamps from Salla to QBL | Blocked — no sandbox access |
| Reference mapping | Salla order, QBL correlation, LogesTechs shipment/barcode | Planned — schema/contract not proven end-to-end |
| Webhook authentication | Provider signature verification, timestamp tolerance, replay rejection | Blocked — signing contract not documented |
| Idempotency | Duplicate create/event test with one resulting shipment/state transition | Blocked — write flow prohibited |
| Retry/dead-letter | Bounded retry policy, failure record, manual replay ownership | Blocked — not implemented/proven |
| Status mapping | Contract test across created, dispatched, delivered, returned, failed | Partial — local mapping tests only |
| Delivered/returned/COD reconciliation | Synthetic financial ledger and exception owner | Blocked — no authorized sandbox trace |
| Production smoke trace | One authorized, non-customer or approved order with evidence | Blocked — explicit deployment/production authorization required |

## Safe next execution

Use an existing supported Salla connector/app and the existing LogesTechs server-to-server client if the provider contracts satisfy the matrix. Do not add middleware or enable writes until the app owner provides sandbox access and webhook signing documentation. Never use real customer data for acceptance testing.
