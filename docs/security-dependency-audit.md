# Dependency security audit — 2026-10-26 takeover

## Scope
Release candidate dependency snapshot, no main changes. Coordinator-authorized reassignment from blocked claim.

| Dependency | Locked version | Status |
| --- | --- | --- |
| body-parser | 2.3.0 | Advisory remediation not verified |
| zod | 3.25.76 | Advisory remediation not verified; preserve Zod 3 API |
| fast-uri | 3.1.8 | Advisory remediation not verified |
| ip-address | 10.7.2 | Advisory remediation not verified |
| esbuild | 0.27.3 | Advisory remediation not verified |

## Environment and commands
Local runtime: Node v22.16.0, npm 10.9.2.
- `git ls-remote https://github.com/ODU33104/TimeTree-MCP.git HEAD`: failed, `Could not resolve host: github.com`.
- `npm view zod version --fetch-retries=0 --fetch-timeout=4000`: failed, `EAI_AGAIN registry.npmjs.org`.
- `npm ci`: not run: repository cannot be cloned and registry is unavailable.
- `npm run typecheck`, `npm run build`, `npm test`: not run: no checkout or installed dependencies.
- `npm audit`: not run: npm registry inaccessible, no authoritative advisory output.
- GitHub Actions: not triggered.

## Safe remediation instructions for a network-enabled local environment
1. Checkout `work/dep-audit-remediate-takeover` (or a fresh branch based on latest release candidate).
2. Run `npm ci` and `npm audit --json > dependency-audit-before.json` (keep audit JSON local).
3. Inspect advisory ranges and transitive dependency ancestry with `npm ls body-parser zod fast-uri ip-address esbuild`.
4. Apply compatible patched dependency upgrades with npm (regenerate package-lock.json using npm; never hand-edit integrity hashes). Avoid Zod 4 migration unless independently reviewed.
5. Run `npm ci && npm run typecheck && npm run build && npm test && npm audit --audit-level=high`; capture exact outcomes and compare baseline test count (172+ expected).
6. Commit validated package.json/package-lock.json and compatibility tests, then request coordinator review. Do not merge to main or trigger Actions during iteration.

## Risk decision
No claim that advisories are fixed or tests pass. Dependency remediation remains release-blocking until verified with registry access.
NEEDS_COORDINATOR_DECISION: provide network-enabled local execution or a trusted package-lock refresh with full test and audit logs.
