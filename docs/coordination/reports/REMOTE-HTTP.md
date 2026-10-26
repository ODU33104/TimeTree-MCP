# REMOTE-HTTP report

Task branch: `work/REMOTE-HTTP`
Claim: `docs/coordination/claims/REMOTE-HTTP.md`

## Changes
- `src/remote-server.ts`: stateless MCP Streamable HTTP POST endpoint with bearer/Origin checks, loopback-only listener, bounded body, default read-only tool allowlist, sanitized errors, and lifecycle cleanup.
- `docs/remote-http.md`: local experimental deployment and security limitations.

## Verification and risks
- Tests, build and typecheck **not executed**. SDK API and tool typings need verification.
- Bundler entry must be configured by coordinator; no changes to coordinator-owned config were made.
- This is **single-tenant** and **not ready for public deployment**. No iPhone ChatGPT test was performed.
- NEEDS_COORDINATOR_DECISION: review identity-bound credential isolation, transport compatibility and packaging before exposure.
