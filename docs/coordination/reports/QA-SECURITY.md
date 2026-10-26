# QA-SECURITY report

Branch: `work/QA-SECURITY`
Claim: `docs/coordination/claims/QA-SECURITY.md`

Added regression suites:
- `tests/security-remote.test.mjs`
- `tests/http-security.test.mjs`
- `tests/tool-access-security.test.mjs`
- `docs/qa-security.md`

Test execution: **not run**. Source changes outside owned paths: none.

NEEDS_COORDINATOR_DECISION: integrated HTTP client parses numeric TimeTree error codes but discards them when throwing HttpError. Restore safe numeric-only compatibility without retaining response secrets.
