# QA-PR31-INDEPENDENT-20261029 — independent offline verification

Claim: docs/coordination/claims/QA-PR31-INDEPENDENT-20261029.md (atomic commit 5ba57e1e11d7fa37de2ad29cc549db4d12d62517)
Branch: qa/pr31-independent-20261029
Target: PR #31, scripts/offline-verify.mjs blob c8704431d4d5deaf0777c39c9435e0f3b242be0e, tests/offline-verify-harness.test.mjs blob a1014031ae1a55dc4de8b219fa1e69f4192e16af.

## Environment and acquisition
- Node v22.16.0, npm 10.9.2, git 2.47.3: PASS.
- `git ls-remote https://github.com/ODU33104/TimeTree-MCP.git HEAD`: FAIL: Could not resolve host: github.com. No repeated network attempts.
- GitHub connector fetch of PR #31 source files: PASS. No full checkout, package-lock, or installed dependencies available.
- Reconstructed the two exact fetched JavaScript source texts into an isolated /tmp/timetree-qa directory. This is NOT an actual repository checkout; source-level focused results only.

## Commands and actual outputs
- `node --test tests/offline-verify-harness.test.mjs`: PASS, 1 test / 1 pass / 0 fail, Node test runner duration 65.046975 ms.
- `node scripts/offline-verify.mjs` without package.json: expected exit 2, `Run from repository root`: PASS negative smoke behavior.
- `printf '{"name":"isolated-fixture"}\\n' > package.json; node scripts/offline-verify.mjs artifacts/evidence.json`: PASS isolated fixture execution; gitSha UNKNOWN; lockSha256 MISSING; dependenciesPresent false; typecheck/build/test/npm audit all NOT RUN. JSON evidence written in isolated environment.
- Actual PR #31 repository checkout harness run: NOT RUN (DNS blocked).
- Actual PR #24–#27 tests, npm ci, typecheck, build, audit: NOT RUN (no checkout/dependencies). Never infer their tests pass.

## Independent review findings
1. Static harness test only checks string patterns, so it does not establish no network or no Actions for arbitrary modifications. The current runner invokes npm scripts from package.json without auditing their contents; a malicious/misconfigured package script could run network commands or Actions. **Offline-only is not a proven security boundary**; use trusted scripts or sandbox network isolation.
2. `dependenciesPresent` checks only two binary paths; presence is not integrity/completeness. Missing lockfile is recorded but not a fail. npm audit intentionally NOT RUN.
3. The output guard creates `artifacts/` before validating user-supplied output path, and permits nested paths without ensuring parent directory exists. A nested `artifacts/subdir/result.json` can throw ENOENT. This is not a release blocker by itself, but deserves a negative test.
4. The test invocation uses `npm test` rather than the declared unused `['test','--','--runInBand']` args. No behavior guarantee for arbitrary repository npm scripts.
5. Existing PR #24–#27 review blockers remain: DST/IANA mismatch and completeness claim (#24), date normalization (#25), unbounded malformed roster and privacy default (#26), missing snapshot vs empty (#27). All unverified at runtime here.

## Status
Focused isolated harness test: PASS. Real checkout and release gate: NOT RUN. No edits to PR #31 or #24–#27. No GitHub Actions, deployments, paid services, secrets, or main/integration push.
