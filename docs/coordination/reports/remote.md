# REMOTE workstream report

## 2026-10-26 — initial implementation

Branch: `work/remote-mcp-transport`.

### Delivered
- `src/remote/security.ts`: fail-closed bearer token validation, constant-time token comparison, HTTPS Origin allowlist validation, bounded request-size configuration, and default read-only tool-name gate.
- `docs/remote-deployment.md`: explicit deployment boundaries, credential-handling rules and security verification gate.

### Status and limitations
- **No HTTP MCP transport or iPhone connection is implemented yet.** Do not deploy publicly.
- **No tests were executed.** Security functions are unverified.
- Tool-name filtering is a preliminary guard only; coordinator must integrate policy with tool metadata and a deny-by-default allowlist before exposure.
- Single bearer-token mode is strictly single-tenant. Multi-user isolation requires identity-bound credentials and per-user sessions.
- No real credentials were used.

### NEEDS_COORDINATOR_DECISION
- AUTH: define a secure, out-of-chat credential store and per-user identity contract.
- COORDINATOR: own integration into `src/index.ts` and `src/utils/tool-access.ts`, and verify the chosen MCP HTTP SDK transport.
- COORDINATOR: approve transport exposure only after automated security checks and live read-only validation.
