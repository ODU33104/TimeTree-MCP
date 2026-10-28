# LOCAL-PR24-27-VERIFY-20261028 — environment preflight and reproducible verification handoff

Date: 2026-10-28
Task branch: `verify/local-pr24-27-20261028`
Claim: `docs/coordination/claims/LOCAL-PR24-27-VERIFY-20261028.md`
Scope: environment investigation and test execution method ONLY; existing PR #24/#25/#26/#27 code and claims untouched.

## Real environment evidence
Executed on current isolated container:
```sh
for x in git node npm; do command -v "$x" && "$x" --version; done
getent hosts github.com | head -2
git ls-remote https://github.com/ODU33104/TimeTree-MCP.git HEAD 2>&1 | head -4
```
Observed:
```
/usr/bin/git
git version 2.47.3
/opt/nvm/versions/node/v22.16.0/bin/node
v22.16.0
/opt/nvm/versions/node/v22.16.0/bin/npm
10.9.2
fatal: unable to access 'https://github.com/ODU33104/TimeTree-MCP.git/': Could not resolve host: github.com
```
`getent hosts github.com` returned no address. Git checkout via HTTPS is unavailable in this runtime. No repeated network attempts. No repository checkout or installed dependencies in /mnt/data. GitHub connector REST reads succeed but do not make a working checkout or npm registry accessible.

## Exact PR heads at preflight (not executed)
- #24 `work/duplicate-guard-20261027`: `5ffa4b200e52882ea7b99ee4b564876373e0d9d4`; base integration/release-candidate.
- #25 `qa/duplicate-guard-20261027`: `db91e0c0aa2832ff10ffa3df10103c1f9dc26d83`; base **#24 head**, not integration directly.
- #26 `task/TIME-PARITY-ATTENDANCE-20261027`: `fcfa7f3bf3fd969482611b4a5868ab0f167576cf`; base integration/release-candidate.
- #27 `work/time-parity-checklist-20261027`: `53ca3c7972515db7d2db1252c463e412b20d9c5e`; base integration/release-candidate.

## Safe offline/local alternative in a network-enabled machine
Use a separate clone, with no push and no GitHub Actions. Pin each SHA explicitly. Use isolated worktrees to avoid mixing #26/#27 or accidentally testing #25 without #24:
```sh
git clone --no-checkout https://github.com/ODU33104/TimeTree-MCP.git timetree-local-verify
cd timetree-local-verify
git fetch origin 5ffa4b200e52882ea7b99ee4b564876373e0d9d4 db91e0c0aa2832ff10ffa3df10103c1f9dc26d83 fcfa7f3bf3fd969482611b4a5868ab0f167576cf 53ca3c7972515db7d2db1252c463e412b20d9c5e
git worktree add --detach ../verify-pr25 db91e0c0aa2832ff10ffa3df10103c1f9dc26d83
git worktree add --detach ../verify-pr26 fcfa7f3bf3fd969482611b4a5868ab0f167576cf
git worktree add --detach ../verify-pr27 53ca3c7972515db7d2db1252c463e412b20d9c5e
```
For each worktree, record `git rev-parse HEAD` and `node --version`, then:
```sh
npm ci --ignore-scripts
npm run typecheck
npm run test:build
node --test tests/duplicate-guard-qa.test.mjs   # PR #25 worktree only
node --test tests/native-attendance.test.mjs    # PR #26 worktree only
node --test tests/native-checklist-summary.test.mjs # PR #27 worktree only
```
IMPORTANT: `npm ci --ignore-scripts` may prevent build-tool install scripts, so if test build fails for that reason, inspect package lifecycle scripts and use a trusted clean environment with `npm ci` instead; do not bypass security checks. Test import paths and `.test-dist` outputs must be inspected before asserting any command passes. Optionally execute `npm audit --audit-level=high` with registry access and preserve the findings. Use only synthetic fixture data. No TimeTree credentials.

PR #24 itself contains source but no targeted test file; PR #25 contains `tests/duplicate-guard-qa.test.mjs` and inherits #24 as its base. Do not count a PR #25 pass as independent #24 acceptance without confirming the exact #24 ancestor.

## Result matrix
| Check | Status | Evidence |
|---|---|---|
| Git binary | PASS | 2.47.3 |
| Node.js/npm binaries | PASS | 22.16.0 / 10.9.2 |
| GitHub DNS / direct checkout | FAIL | Could not resolve host github.com |
| GitHub connector PR SHA and changed-file inspection | PASS | PR REST metadata and file lists |
| PR #24/#25/#26/#27 pinned checkout | NOT RUN | DNS failure |
| npm ci / typecheck / test build | NOT RUN | No checkout |
| Targeted synthetic tests | NOT RUN | No checkout |
| npm audit | NOT RUN | No checkout/registry verification |
| GitHub Actions | NOT RUN | Explicitly forbidden |
| main/integration pushes, merge, deployment | NOT RUN | Forbidden |

## Ownership and review considerations
Existing PR owners and claims remain unchanged. Review concerns from limited-actions report: #25 invalid calendar date/DST gap and fold; #26 null/oversized roster, authorization and anonymization; #27 missing/incomplete snapshots, pagination and title leakage. No green QA conclusion until executed with exact pinned source and recorded stdout/exit codes.

## NEEDS_COORDINATOR_DECISION
Supply a network-enabled local checkout environment (or a vetted source archive and dependency cache) and run the isolated commands above; preserve actual stdout, exit status and exact SHA in a follow-up report. Do not spend the previously allowed one GitHub Actions run as a workaround. Do not integrate #24–#27 on the strength of unexecuted tests.
