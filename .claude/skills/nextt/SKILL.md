---
name: nextt
description: "Next Best Action assessment for QBL's real cargo-area thermal evidence work. Use when the user asks for a 'next best action', 'NBA', 'next step', 'ايش الخطوة الجاية', or 'ما التالي' on the QBL thermal/provider-association effort, or invokes /nextt. Produces exactly one recommended action (never multiple options), with evidence-based justification, confidence level, an observable completion condition, and an English programmer handoff — without contacting providers, touching secrets/hosted databases, or implementing live ingestion."
metadata:
  version: 1.0.0
---

# QBL Next Best Action (thermal evidence / provider association)

You are assessing the single strongest next action for QBL's real cargo-area
thermal evidence and shipment–vehicle–route association work. This is a
recommendation-only exercise: it never authorizes execution, provider
contact, secret access, hosted-database access, deploys, pushes, merges, or
implementing live ingestion.

## Step 1 — Verify repository identity and state (always re-run, never assume)

Run fresh, do not reuse a prior session's memory of these values:

```bash
git remote -v
git rev-parse --abbrev-ref HEAD
git log -1 --format='%H %ci %s'
git status --short
git diff --check
```

Confirm: remote points at `aalshabi/QBL`, note the actual current branch and
HEAD, and record the working-tree status (modified/untracked counts). Do not
discard, stash, or modify any existing uncommitted work — preserve it exactly
as found.

## Step 2 — Read the current evidence set

Read, in full, whatever currently exists of:

- `docs/stabilization/thermal-evidence-verification.md`
- `docs/stabilization/temperature-complaint-verification.md`
- `docs/logestechs/integration-map.md`
- `docs/stabilization/thermal-provider-association-decision.md`
- `docs/logestechs/gap-analysis.md`
- `docs/logestechs/api-documentation-review.md`

If any file no longer exists or has moved, say so rather than assuming its
last-known content still applies.

## Step 3 — Inspect current code and schema (read-only)

Check, using Grep/Glob/Read only (no edits at this stage):

- Prisma schema for the thermal models (`ThermalSource`, `ThermalPolicy`,
  `ShipmentThermalLeg`, `ThermalReadingEvidence`) — are they still empty of
  live rows? Any new fields since last check?
- Whether any ingestion/write route now exists under `app/api/**` for thermal
  readings (there should be none until an owner-approved contract exists).
- Whether `lib/temperature/**` still contains read/classification logic only.
- Whether LogesTechs docs still show no Assignment API, no webhook
  signature/HMAC, and no shipment-list/driver/vehicle APIs.
- The "Owner decision gate" table in the decision doc — which rows, if any,
  are no longer `PENDING`, and whether each resolved row cites a named
  approver, date, and non-secret evidence reference (not just a schema field,
  demo row, webhook, or email, which never count as approval on their own).

## Step 4 — Determine the action

- If one or more owner-decision rows are still unresolved: the next best
  action is almost always to route the specific unresolved rows to the
  project owner for an explicit, dated, per-field decision — not to write
  code, not to contact a provider, and not to "wait" passively. Frame it as
  a concrete action (e.g., "route rows X/Y to the owner for sign-off"), not
  as inaction.
- If a genuine safe verification step is still available and unperformed
  (e.g., a doc or code path not yet checked, a claim in the decision doc not
  yet cross-checked against current schema/code), prefer recommending that
  verification over recommending owner outreach — do not recommend waiting
  when a safe, concrete verification step is possible.
- If all owner-decision rows are resolved with named, evidenced approvals:
  the next best action shifts to scoping the first authenticated-ingestion
  design step under separate authorization — state this explicitly and do
  not implement it yourself.
- Never propose more than one action. Never propose contacting a provider,
  touching secrets, hosted databases, Production, or implementing ingestion
  as "the action," even indirectly.

## Required output format

Return exactly this structure, in this order, nothing extra before it:

```
Best next action:
One concrete action only.

Why now:
Cite the current evidence and the blocker or risk.

Confidence:
HIGH, MEDIUM, or LOW, with one sentence explaining why.

Completion condition:
One observable result proving the action is complete.
```

Then provide a self-contained programmer handoff in English covering:

- **Verified project state** — remote, branch, HEAD, working-tree summary,
  and current status of the owner-decision rows.
- **First action** — the same single action as above, stated as an
  instruction.
- **Remaining approved scope** — what may be touched in this pass (normally:
  read-only inspection, and edits confined to the decision doc itself).
- **Safety limits** — explicitly repeat: no provider contact, no hosted/
  Preview/Production database access, no secrets read or printed, no deploy/
  push/merge, no ingestion/authentication/association code until every
  relevant decision row is resolved and re-verified.
- **Exact verification commands** — the Step 1 command block, plus a
  `git status --short` re-check after any doc edit.
- **Blocked conditions** — when to stop and escalate instead of proceeding
  (any row still PENDING, an owner answer with no verifiable non-secret
  reference, any inferred approval from schema/demo/webhook/email, any
  request touching secrets/hosted DBs/provider contact).
- **Required Arabic final report** — remind that any follow-up report to the
  user on this thread must be in Arabic, must state which decision rows
  changed and cite their evidence reference, and must explicitly say that
  local PostgreSQL/Preview results are not live-sensor certification and not
  a Production approval.

## Constraints (always apply)

- Treat synthetic data, schema fields, demo readings, status webhooks, and
  emails as evidence only — never as owner approval.
- Do not contact providers, inspect secrets, access hosted databases, modify
  Production, deploy, push, merge, or implement live ingestion.
- Preserve all existing uncommitted work in the checkout; touch only the
  decision document if any edit is warranted, and only to record newly
  surfaced evidence — never to fabricate an approval.
