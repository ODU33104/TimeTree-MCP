# AUTH workstream report

## 2026-10-26 — Initial security hardening

Branch: `work/auth-credential-onboarding` (created from main).

### Changes
- `src/client/auth.ts`: removed email address from authentication log; removed raw CSRF exception logging; replaced potentially sensitive authentication error interpolation with generic message.
- `src/utils/http-client.ts`: reject HTTP redirects to avoid forwarding credentials; removed response body from error logs and error objects; removed raw URL and network exception from logs and public network errors.

### Commits
- https://github.com/ODU33104/TimeTree-MCP/commit/52860c4f9cf6d4fbf2a91935c3455206b2ee3aff
- https://github.com/ODU33104/TimeTree-MCP/commit/c16627eacdd9b4f0d9fdefaaa187ea645da40089

### Verification
- No build, typecheck, unit test, or integration test executed yet. No claim of compatibility.
- Redirect rejection may affect legitimate TimeTree endpoints; validate against isolated test fixtures before integration.
- Credential onboarding that keeps secrets out of AI prompts remains unimplemented.

### Dependencies / coordinator decisions
- Review existing PR #4 (HTTP credential boundary) and reconcile rather than overwrite.
- Coordinate with REMOTE on per-user credential storage, authentication boundaries, and secure onboarding before deployment.
- Never collect real TimeTree credentials in AI prompts, logs or Git.

### Next milestone
- Add regression tests for cross-origin redirects, sensitive error responses and logging.
- Design a local secure credential-entry flow and document its security assumptions; no unauthenticated public bridge.
