# REMOTE-ONBOARD-INTEGRATE report

Branch: `work/remote-onboard-integrate-20261026`
Status: ready-for-review, not verified

## Code
- `src/remote-server.ts`: authenticated, loopback-only Streamable HTTP MCP endpoint; per-request stateless server; request-size limit, origin/bearer check, read-only default, local vault consumer.
- `tests/remote-integration.test.mjs`: loopback-host rejection regression.
- `docs/remote-setup.md`: local setup and iPhone/ChatGPT cloud limitations.

Commits:
- https://github.com/ODU33104/TimeTree-MCP/commit/77075874a46f1fca1066526cc95cb8cc20645656
- https://github.com/ODU33104/TimeTree-MCP/commit/cfe482ba4fb8e4cae69f65f7a36160c29252dd92
- https://github.com/ODU33104/TimeTree-MCP/commit/c36302261577446e956302117e46bad197d9c2b9

## QA
GitHub Actions: NOT started.
Local build/typecheck/test/audit: NOT executed; local git access failed due to DNS (Could not resolve host github.com). No live TimeTree credentials used.

## Blocking review
NEEDS_COORDINATOR_DECISION: run local `npm ci && npm run typecheck && npm test && npm audit --audit-level=high` and fix failures. Verify SDK StreamableHTTPServerTransport compatibility, lifecycle, and POST content negotiation. The existing local vault stores a single string; this transport expects that string to contain email/password JSON. Assess credential onboarding UX and do not enable public access. This is not a proven iPhone/ChatGPT connector.
