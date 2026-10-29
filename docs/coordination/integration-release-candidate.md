# Release candidate integration — 2026-10-26

Coordinator integrated substantive code from three worker branches into `integration/release-candidate`:

- AUTH: auth error/log redaction, HTTP redirect rejection, strict TimeTree HTTPS origin check, numeric-only upstream error code preservation for session refresh.
- REMOTE: request security policy, explicit bearer token/Origin checks, default-deny remote tool filtering. **No HTTP MCP listener yet**.
- TOOLS: calendar ID and recurring occurrence input validation.
- Coordinator: safe MCP error result and local read-only tool filtering from `security/mcp-tool-boundary`.

DOCS-BRAND remains owned by its dedicated worker; do not overwrite its multi-language README or icon changes. Its branch must be integrated after review.

## Blocking QA
No build, typecheck or integration tests have been executed on this combined branch. The previous `fix/http-credential-boundary` branch contains literal escaped newline sequences in TypeScript; **do not merge that file directly**. This candidate uses the AUTH worker file and adds a clean origin check. Need verify TimeTree numeric error-code handling and remote origin behavior.

## Next implementation
- Complete a real authenticated remote MCP transport (no public exposure before security review).
- Complete private credential onboarding and encrypted storage; do not ask the AI for passwords.
- Integrate docs-brand branch and verify all three languages and original icon.
- Run a single full QA gate after implementation milestones.
