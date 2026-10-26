# Initial audit and work plan

Status: preliminary source review, not a completed security audit. No live TimeTree credentials or API calls were used.

## Confirmed baseline
- 29 MCP tools registered in `src/tools/index.ts`.
- Node.js >=22, TypeScript strict, MCP SDK and Zod; `npm run verify` covers typecheck, tests, and dependency audit.
- Recurring-event tools implement single occurrence / this-and-following behavior and partial-failure recovery. Do not simplify without regression coverage.
- `README.md`, `README.ja.md`, `README.ko.md` still refer to upstream release artifacts; do not redirect to nonexistent fork releases.

## Priority work
1. **P0 — fork update and distribution correctness.** Inspect `src/config/config.ts`, `src/utils/update-check.ts`, installer and release workflow. Ensure updates from this fork are not confused with upstream. Add mock-based tests.
2. **P0 — security and terms.** Review login/CSRF/session lifecycle, logging/redaction, network retry policy, third-party dependencies, LICENSE and DISCLAIMER. No real-account tests without approval.
3. **P1 — tool inventory and safety.** Record every tool's input/output, API calls, idempotency, error response, destructive effects and existing tests. Focus on recurrence and date/time semantics.
4. **P1 — client usability.** Measure common natural-language scenarios, tool choice ambiguity, redundant list calls and response size before redesign.
5. **P2 — docs.** Update installation instructions, CONTRIBUTING, multilingual README and release references only after verifying implementation.

## Acceptance criteria
- No change to `main` without reviewed PR.
- Behavior changes include automated regression tests and updated docs.
- Preserve upstream copyright/license and disclaimer.
- Avoid claims of compatibility or release availability without verification.
- Prefer backward-compatible changes; document any breaking tool schema changes.

## Repository setup blocker
GitHub Issues are currently disabled for this fork (GitHub API returned HTTP 410). Enable Issues in repository Settings to track tasks; until then this file is the audit backlog.
