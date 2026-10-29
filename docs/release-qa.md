# Release QA gate

This is an unofficial TimeTree MCP fork; it is not affiliated with TimeTree, Inc. Preserve upstream MIT attribution.

## Automated checks

Run `npm ci && node scripts/verify-release.mjs` using Node.js 22 or later. The script stops at the first failure and runs typecheck, build and Node tests via `npm test`, then a high-severity npm audit. CI runs on release-candidate pushes and PRs targeting main. No TimeTree credentials are required for deterministic tests.

## Mandatory manual checks before merge or deployment

- Review all workstream diffs and conflicting security patches.
- Confirm credential/session redaction, redirect rejection, strict Origin and bearer validation, bounded HTTP bodies and explicit read-only allowlist.
- Verify the remote MCP lifecycle and user isolation; do not expose publicly without security review.
- Run isolated read-only live validation first; then controlled write/delete tests on a disposable calendar with explicit approval.
- Confirm iPhone ChatGPT compatibility only after an actual supported connection succeeds.
- Confirm README and installation links refer to published artifacts, not hypothetical releases.

CI success does **not** prove remote deployment safety, user isolation, or iPhone support.
