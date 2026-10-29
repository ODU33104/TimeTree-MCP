# Release readiness — evidence and acceptance gates

**As-of:** 2026-10-26. This is an honest status statement, **not a release certification**. Update after every completed release review. The authoritative status must be based on successful checks of the actual release commit, not old test counts or implementation reports.

## What is currently verified

| Area | Evidence | Status |
| --- | --- | --- |
| Original tool registry | `main` contains 29 MCP tool registrations | Existing baseline; no new production claim |
| Candidate tool registry | `integration/release-candidate` adds three read-only tools: cross-calendar search, available slots, event conflicts (32 total) | Candidate only; unmerged to `main` |
| Prior typecheck, build, unit tests | [CI run 40297874210](https://github.com/ODU33104/TimeTree-MCP/actions/runs/40297874210) reported 172 passing tests on Node.js 22 and 24 | **Tests passed in that run**, not a green overall release |
| Release QA / dependency audit | [Release QA run 40297874196](https://github.com/ODU33104/TimeTree-MCP/actions/runs/40297874196) blocked at dependency audit | **FAIL — release blocker** |
| Dependency remediation | High-severity findings included `body-parser` and `zod`; documented without successful lockfile remediation | **BLOCKED** |
| Remote HTTPS / OAuth / multi-user isolation | Loopback-only authenticated prototype exists on separate work branch; not deployed or verified | **NOT READY** |
| Live TimeTree compatibility and mobile ChatGPT | No authorized live end-to-end iOS/Android or public plugin verification | **UNVERIFIED** |
| Provider integration rights | TimeTree Connect App API discontinued in 2023; no publicly verified replacement permission | **NO-GO for public TimeTree service without provider authorization** |

Sources: [integration handoff](https://github.com/ODU33104/TimeTree-MCP/blob/integration/release-candidate/docs/coordination/reports/INTEGRATION-PR6-19.md), [mobile feasibility report](../coordination/reports/MOBILE-DISTRIBUTION-FEASIBILITY.md).

## Release gate checklist (all required before a production/public claim)

### Reproducible local quality
- [ ] `npm ci` succeeds on a clean checkout using the committed `package-lock.json`.
- [ ] `npm run typecheck`, `npm run build`, and `npm test` succeed; record runtime versions and exact test totals.
- [ ] `npm audit --audit-level=high` passes or a maintainer explicitly documents each exception and approves the residual risk. A bypassed audit **is not equivalent** to a clean audit.
- [ ] Security regression tests cover redaction, origin/transport, read-only allowlist, event scope, recurrence and destructive parameter validation.
- [ ] Changelog, dependencies and compatibility matrix match the exact release commit.

### Authentication, data safety and provider compliance
- [ ] Officially permissible TimeTree integration and account authorization for intended users have been established and reviewed.
- [ ] Remote deployment, if any, uses HTTPS, validated OAuth permissions, per-user identity/credential isolation, safe token revocation and no shared global account.
- [ ] Create/update/delete has server-side authorization, exact scope confirmation, idempotency/reconciliation of uncertain outcomes and bounded bulk actions.
- [ ] No private user calendar data or credentials are logged, embedded in test fixtures, or shared across accounts.
- [ ] Live read-only smoke checks use authorized disposable calendars; clearly identify tests requiring an external provider.

### Product and transparency
- [ ] README badges and links point to **this fork**; separate upstream release information is credited but never presented as this fork's status.
- [ ] Installation steps, required ChatGPT plan/client, supported transport, and mobile functionality are verified with devices/accounts rather than inferred.
- [ ] Documentation clearly distinguishes available MCP tools from standalone, unregistered modules.
- [ ] Security policy, private reporting route, contribution instructions, license attribution, privacy and non-affiliation notices have been reviewed.
- [ ] Accessibility, Japanese/English behavior, timezone/DST and mobile text fallback have deterministic tests and user validation evidence.

## CI budget policy

**During development:** do not deliberately run GitHub Actions (including workflow dispatch or unnecessary pushes to watched branches). Run checks locally in a network-enabled environment and attach command logs to the PR. On a DNS-blocked environment, report **not run**, not pass. Do not merge to `main` pending acceptance.

**At final release candidate:** maintainers may deliberately run a single release-gate verification after dependency and security prerequisites are satisfied. Do not disable mandatory safety checks merely to turn a red badge green.

## Verification report template

Record: commit SHA, branch, Node/npm versions, commands run, exact pass/fail output, source of fixtures, known exclusions, time, risk owner and decision (GO/NO-GO). Never report a successful deployment or tested mobile connection based solely on static code inspection.
