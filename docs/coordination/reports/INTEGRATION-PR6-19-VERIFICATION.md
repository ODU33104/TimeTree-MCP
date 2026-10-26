# PR #6–#19 integration verification — 2026-10-26

## Repository and branches

- Repository: https://github.com/ODU33104/TimeTree-MCP
- Integration branch (already established; used for the work, **not newly created by this verification**): `integration/release-candidate`
- Coordinator/reporting branch: `coordination/parallel-workstreams`
- `main` was **not merged or updated** as part of this integration. Its head was `3f77995f4d074364c6ffe14bb95a9d0c43a7c1d8` at verification time.
- PR #6: integration-to-main **open draft**; no merge performed. PRs #7–#19: open drafts, feature changes were staged directly into the integration branch; PRs themselves were not merged.
- No README/translation/logo/icon changes were made in this integration work.

## Commits and source of truth

| Role | Commit SHA | Link |
| --- | --- | --- |
| 41 files staged from PRs #7–#19 | `8073a361739fc2000fef53c70b4a2c99d2006b09` | [Commit](https://github.com/ODU33104/TimeTree-MCP/commit/8073a361739fc2000fef53c70b4a2c99d2006b09) |
| Initial read-only MCP feature adapter | `b98725e7c0b2ef4fe32525ba0dfcdc7a3d8a11c5` | [Commit](https://github.com/ODU33104/TimeTree-MCP/commit/b98725e7c0b2ef4fe32525ba0dfcdc7a3d8a11c5) |
| MCP adapter regression tests | `00ffa1e448875ca8cdeb8bae3ba3a9aa4fb3ba55` | [Commit](https://github.com/ODU33104/TimeTree-MCP/commit/00ffa1e448875ca8cdeb8bae3ba3a9aa4fb3ba55) |
| MCP manifest registration sync | `d9ab67dcbcaf1d4d5a962117d62de86f24001933` | [Commit](https://github.com/ODU33104/TimeTree-MCP/commit/d9ab67dcbcaf1d4d5a962117d62de86f24001933) |
| Final integration + QA report (current integration HEAD) | `fd676e74b5c86846704fdb175e5966a83acb94db` | [Commit](https://github.com/ODU33104/TimeTree-MCP/commit/fd676e74b5c86846704fdb175e5966a83acb94db) |

- Original detailed work report: [`docs/coordination/reports/INTEGRATION-PR6-19.md` on `integration/release-candidate`](https://github.com/ODU33104/TimeTree-MCP/blob/integration/release-candidate/docs/coordination/reports/INTEGRATION-PR6-19.md).
- This file is the **separate coordinator-branch verification record**. No additional feature work, branch merge or main mutation is performed by creating it.

## Actual checks and results (existing historical runs; no new GitHub Actions initiated for this report)

Verified final integration commit `fd676e74b5c86846704fdb175e5966a83acb94db` using previously completed GitHub Actions logs:

| Environment | Command / check | Observed result |
| --- | --- | --- |
| Node.js 22, CI | `npm ci` | PASS |
| Node.js 24, CI | `npm ci` | PASS |
| Node.js 22 and 24, CI | `npm run typecheck` | PASS on both |
| Node.js 22 and 24, CI | `npm test` (includes `npm run build`, `npm run test:build`, `node --test tests/*.test.mjs`) | PASS on both: **172 passed / 0 failed** |
| Node.js 22 and 24, CI | `npm audit --audit-level=high` | **FAIL** on both: 5 vulnerabilities (1 low, 2 moderate, **2 high**) |
| Release QA, Node.js 22 | `node scripts/verify-release.mjs` | **FAIL overall**, after passing typecheck and tests, on vulnerability audit |
| Overall CI / Release QA | Workflow status | **FAIL**, not safe to report full release gate success |

- [Final CI run 40298167757](https://github.com/ODU33104/TimeTree-MCP/actions/runs/40298167757): Node.js 22 and 24, successful build/typecheck/172 unit tests each, high-severity dependency audit failed.
- [Final Release QA run 40298167773](https://github.com/ODU33104/TimeTree-MCP/actions/runs/40298167773): full gate failed. Both runs **predate this verification request**; this document did not trigger them.
- Specifically, audit reported high findings for `body-parser` and `zod` and lower-severity findings for `esbuild`, `fast-uri` and `ip-address`. Dependency and lockfile remediation requires separate compatibility/security review.

## Local execution attempt (this verification request)

- Local environment: `node --version` = `v22.16.0`; `npm --version` = `10.9.2`; `git --version` = `2.47.3`.
- Attempted `git ls-remote --heads https://github.com/ODU33104/TimeTree-MCP.git integration/release-candidate`.
- Result: **FAILED before fetching**, `Could not resolve host: github.com`.
- The local working environment contained no checkout and no usable npm cache. Consequently **no local `npm ci`, build, typecheck, test, or audit was executed**. Do not count historical CI tests as locally executed.
- No `workflow_dispatch`, API rerun or manually started GitHub Actions was issued for this verification request. The verification report is committed only to `coordination/parallel-workstreams`, which is not targeted by the existing `push` CI workflows (they target `main`, version tags or `integration/release-candidate`).

## Review and release blockers

- **BLOCKED**: high-severity dependency advisories; avoid `npm audit fix --force` without testing breaking Zod major-version changes.
- MCP registration scope: 29 original + 3 read-only planning tools = **32 tools**. New adapters cover cross-calendar search, availability and conflict detection; remaining independent feature modules were staged but not registered as MCP tools.
- Live TimeTree account tests, protected remote MCP transport deployment, mobile-client integration, and write/delete/rollback tests remain **unverified**.
- NEXT COORDINATOR ACTION: resolve dependency audit with verified compatible versions and re-run final gate selectively (prefer local tests; GitHub Actions only for final release checks); review PR #6 before any merge to `main`.
