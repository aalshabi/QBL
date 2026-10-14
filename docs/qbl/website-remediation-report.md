# QBL website remediation report

Date: 2026-10-14
Repository: `C:\apps\QBL`
Branch: `codex/brand-identity-production`
Baseline commit inspected: `32a65f2b298c4a04533988812efa2f08cbd43922`

## Production state and authorization

- Public verification still returns `200` from both `https://qbl.sa/` and `https://www.qbl.sa/`; they have different content lengths, ETags, cache ages, and security header sets. Production remains split because no deployment/domain mutation was authorized.
- Previously observed deployment IDs: apex `dpl_BY9DXnKjCjxmMMCySfXyEiSBmTvV`; www `dpl_EkwM3nefjHBw1NSKTp48FT8CcHsY`.
- The repository is linked to Vercel project `qbl` (`prj_7ZFGfrwpgIn5i2qh3pg9kuZFK6Yg`, team `team_t1pCYnYIM1pcZu8dPms81cfL`).
- Vercel CLI `62.2.0` is installed, but this session has no CLI credentials. Read-only CLI inspection requested device login and timed out. Vercel MCP returned project `404` and deployment `403` for the linked identity.
- No deployment, domain attachment/detachment, form submission, customer message, merge, or production write was performed.

## Implemented locally

- Canonical-host routing: one-hop 308 redirects from every www path to apex, plus explicit legacy mappings for `/beauty-shield`, `/trial`, `/faq`, `/how-it-works`, `/protection-levels`, and `/dashboard`.
- Redirect and route hardening: CSP, HSTS, COOP, CORP, referrer policy, permissions policy, content-type protection, frame denial, noindex rules, and explicit redirect cache policy.
- Public positioning: Beauty Shield and temperature-protected cosmetics/personal-care delivery in Riyadh. Unsupported fleet counts, pharma, frozen, telemetry freshness, universal OTP/POD, integration, and SLA claims were removed or qualified.
- Quote flow: structured operational fields, shared Zod validation, PostgreSQL persistence, reference IDs, 24-hour deduplication, database-backed 15-minute rate limiting, source attribution, sales ownership, explicit privacy consent, honest success/failure states, and a direct-contact fallback. Production fails closed without `DATABASE_URL`.
- Privacy and terms: Arabic pages, footer/form links, and a separate owner/legal approval gate.
- SEO/localization: request-path-driven root `lang`/`dir`, reciprocal `ar-SA`/`en`/`x-default` hreflang, absolute unique titles, canonical fixes, noindex controls, and discovery-only sitemap entries.
- Tracking: production synthetic fixture access is disabled; local/test fixtures require signed expiring tokens, return masked address/contact data, suppress enumeration differences, and apply lookup limits. Public sample links were removed.
- Analytics: explicit browser consent, allowlisted non-sensitive events, source and deduplication fields, and no contact/shipment values. `qualified_lead` is reserved and must only be emitted from a real transition to `LeadStatus.QUALIFIED`.
- Acceptance documentation: public claim register and QBL→Salla→LogesTechs integration gate.

## Verification results

| Check | Result |
|---|---|
| ESLint | Pass |
| TypeScript `--noEmit` | Pass |
| Prisma schema validation | Pass |
| Automated tests | 39/39 pass |
| Runtime www legacy redirect | 308, one hop to `https://qbl.sa/services/beauty-shield` |
| Runtime www catch-all | 308, path/query preserved on apex |
| Redirect security headers | Present in local runtime response |
| Mobile 390px | No horizontal overflow; Arabic metadata and primary content render |
| Desktop 1440px | No horizontal overflow; unique title and primary content render |
| English route | `lang=en`, `dir=ltr`, canonical `/en`, reciprocal hreflang present |
| Keyboard | Focus order reaches navigation, name, company, email, phone, volume, platform, pickup, and delivery controls logically |
| Real form submissions | None performed |

## Environmental blocker

`next build --webpack` initially failed inside the Windows sandbox because `EPERM` blocked creation of a nested route output directory. A later retry outside the sandbox on the isolated PR #28 consolidation worktree compiled successfully, completed TypeScript and page-data collection, generated 51 static pages, and finalized build traces. This clears the compiler/buildability uncertainty for that committed baseline, but it does not validate the separate uncommitted remediation checkout. Playwright CLI browser launch also failed at the Windows sandbox Crashpad/pipe boundary; rendered checks were completed with the Codex in-app browser instead. Next dev with webpack successfully rendered the inspected routes.

## Consolidation refresh verification

- Isolated branch: `codex/qbl-consolidation-refresh`, based on PR #28 source commit `613444b5fa934f2683a686b38112294bb612200a`.
- Full test suite after `prisma generate`: 228 total, 218 passed, 0 failed, 10 skipped because optional database test URLs were not configured.
- ESLint, TypeScript `--noEmit`, Prisma validation, active-document link validation, JSON parsing, and `git diff --check` passed.
- Production build passed outside the sandbox. No deployment, merge, push, database migration, domain change, or production write was performed.
- These checks validate the committed PR baseline plus documentation-only consolidation updates. The uncommitted remediation checkout remains separately protected and must be committed or applied before it can receive the same full-suite/build verification.

## Remaining production gates

1. Owner/legal approval of privacy/terms and retention/processor details.
2. Apply migration `20261014090000_qualify_leads` to the intended database and verify rollback/backup policy.
3. Authenticate against the correct Vercel team and inspect domain aliases before any mutation.
4. Obtain explicit deployment authorization, deploy the reviewed commit/worktree, attach `www.qbl.sa` to the canonical project, verify the 308 map, then detach the old www deployment only after legacy-route checks pass.
5. Run the production smoke matrix: apex/www redirects, policies, quote persistence/reference, robots/sitemap, English metadata, tracking fail-closed behavior, and security headers.
6. Keep Salla/LogesTechs marked non-live until every gate in `integration-acceptance.md` is proven with authorized synthetic data and one authorized production trace.
