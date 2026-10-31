# QBL — agent instructions

## Standing delegation

Own a technical task to a verified result rather than returning a plan: implement, test, get an
independent review, fix the findings, and complete the actions the task authorised.

The full contract is in `.agents/skills/delegated-technical-owner/SKILL.md`. Use the bundled
`$review-agent` skill for the independent review.

Three rules that hold even if that skill is not loaded:

- Authority is per task. "Fix the test" does not authorise a deploy. Never bypass a protection,
  required check, or approval gate, and never rewrite shared history to get around one.
- Evidence is tool output, not self-description. Never imply a check ran when it did not.
- You are an AI agent. Never present as human; never log an automated review as a human one.

## Checks — run all four before calling a change done

```
npm test            # node:test via tsx
npx tsc --noEmit
npm run lint
npm run build
```

## This repo deploys on push to master

Vercel builds every commit on `master` to **production**. A push to `master` is a release.
Never push to `master` unless the task explicitly authorised a production deploy.
Work on a branch; branches do not trigger production.

## Database migrations

`scripts/vercel-build.mjs` runs `prisma migrate deploy` **before** `next build`, and **only when
`VERCEL_ENV === "production"`**. Two consequences:

- On production the column exists before the code that reads it. Correct by design.
- Preview deployments skip migrations, so a Preview running new code against an unmigrated
  database fails with `P2022`. A failed form submit on a Preview after a schema change is this,
  not a defect in the change.

Add a migration under `prisma/migrations/<timestamp>_<name>/migration.sql` by hand to match the
schema; new columns are `NOT NULL DEFAULT ''` so existing rows need no backfill.

## Published-claims gate

Customer-facing copy is guarded by `tests/claims-gate.test.ts`. These are forbidden in any
customer-visible file and the test will fail: a guaranteed temperature range, fleet or driver
counts, client names or counts, success rates, certifications or licences, partnerships,
superlatives, and the retired sectors (food, frozen, pharmacy, restaurants).

The served scope is beauty, skincare, haircare, perfume, and fulfilment centres.
Prices: never publish an unapproved tariff.

## Conventions

- Arabic RTL first. Latin words inside an Arabic sentence need a space around them.
- Code comments and commit bodies explain **why**, in the voice of the surrounding file.
- `lib/` holds the single source of truth for a value; do not duplicate a type — derive it.
- A client component must not import a module that builds a zod schema at module top level; it
  pulls the zod runtime into that page's browser bundle.
