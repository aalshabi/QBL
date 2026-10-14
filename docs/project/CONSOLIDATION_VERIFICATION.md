# QBL consolidation verification log

Date: 2026-10-14 (Asia/Riyadh)
Review branch: `codex/qbl-consolidation-refresh`
Source: PR #28 commit `613444b5fa934f2683a686b38112294bb612200a`

This log records the consolidation commands and outcomes. It is verification evidence, not a second task tracker; the canonical task remains [`MASTER_TASK.md`](MASTER_TASK.md) and GitHub issue #27.

## Preservation and isolation

| Command or action | Result |
|---|---|
| `git status --short --branch` | Protected checkout remained on `codex/brand-identity-production`; 44 tracked files were modified and 61 entries were untracked. |
| `git worktree list --porcelain` | Five nested worktree directories were identified and preserved; no worktree was removed. |
| `git -C <nested-worktree> status --short --branch` | Three QBL worktrees were clean. The nested QDL worktree `codex/public-site-quality` had its own `.avadbot/` and `.playwright-cli/` entries and was left untouched. |
| PowerShell safety snapshot procedure | Wrote a binary tracked patch, empty staged patch, inventory, hashes, and an archive containing 56 ordinary untracked files outside the repository. Archive verification reported 56 expected, 56 entries, 0 missing. |
| `git fetch origin codex/qbl-master-task-20261014:refs/remotes/origin/codex/qbl-master-task-20261014` | Fetched only the PR #28 source branch. |
| Codex managed worktree creation | Created an external detached worktree, but the shell sandbox could not operate inside that path; it was left intact. |
| `git worktree add --detach C:\apps\QBL\.codex-qbl-consolidation-review origin/codex/qbl-master-task-20261014` | Created the usable isolated worktree at the exact PR source commit. |
| `git switch -c codex/qbl-consolidation-refresh` | Created a local documentation refresh branch; nothing was pushed or merged. |

## PR and document review

| Command or action | Result |
|---|---|
| `git show --format= --name-status HEAD^..HEAD` | Confirmed the PR commit changes exactly nine files: four active pointers/README, three archives, `MASTER_TASK.md`, and `verification.json`. |
| `git diff --check HEAD^..HEAD` | Initially found one extra blank line at EOF in `MASTER_TASK.md`; corrected in the refresh. |
| `git rev-parse HEAD^:<source>` and `git rev-parse HEAD:<archive>` | All three historical source/archive pairs resolve to identical Git blob IDs and sizes. Working-tree SHA values differ on Windows because the index is LF while checkout is CRLF. |
| Active Markdown link-validation script | Scanned 10 active documents and checked 14 local links; 0 missing. Historical archives were intentionally preserved byte-for-byte and were not rewritten. |
| `Get-Content -Raw docs/project/verification.json | ConvertFrom-Json` | JSON parsed successfully. |

## Application verification

| Command | Result |
|---|---|
| `npm test` (first run) | 201 passed, 5 suite loaders failed, 10 skipped because the isolated worktree lacked the generated Prisma client. No code assertion failed. |
| `npx prisma generate` | Generated Prisma Client 7.8.0 successfully. |
| `npx prisma validate` | Schema valid. |
| `npm test` (rerun) | 228 total; 218 passed, 0 failed, 10 skipped because optional database test URLs were not configured. |
| `npx tsc --noEmit` (first run) | Failed on missing `google` types because the shared parent install lacked lockfile-declared `@types/google.maps`. |
| `npm ci` | Installed the exact lockfile dependency tree and regenerated Prisma. npm reported 35 dependency advisories (3 low, 7 moderate, 23 high, 2 critical); no automatic fix was applied. |
| `npx tsc --noEmit` (rerun) | Passed. |
| `npm run lint` | Passed. |
| `npm run build` inside sandbox | Failed with Windows `EPERM` while creating `.next/server/app/(marketing)/case-studies`. |
| `npm run build` outside sandbox | Passed: compilation, TypeScript, page-data collection, 51 static pages, optimization, and build traces completed. |
| `git diff --binary --full-index --output=<final-patch>` on the protected checkout | Final tracked patch SHA-256 exactly matched the initial snapshot: `255b0a7bff0fa2c02d8bca7c775541c56466192789f328f48a797ccdde879168`. |
| Safety archive versus current untracked files | Compared all 56 archived entries by SHA-256; 0 missing or changed. |
| Final `git diff --check` | Passed. |
| Final active Markdown link validation | Scanned 11 documents and checked 16 local links; 0 missing. |
| Final refresh scope inspection | Eight changed/untracked paths, all under `docs/`; 0 runtime paths. |

## Scope confirmation

- No runtime, application, schema, migration, environment, or deployment configuration file was edited by this refresh.
- Added the five current `docs/qbl/` evidence files and updated only documentation/verification records.
- No merge, push, deployment, domain mutation, database migration, form submission, branch deletion, worktree deletion, or archive deletion was performed.
- The npm dependency advisories are a separate remediation item. Changing versions was outside this documentation-consolidation scope.
