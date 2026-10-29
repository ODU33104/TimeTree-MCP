# Remote MCP deployment — security-first design

This is an **unofficial TimeTree fork**, not affiliated with TimeTree, Inc. Retain upstream MIT attribution.

## Current state

The repository's existing entry point is **stdio-only**. The remote security policy module is a foundation, **not a working HTTP MCP server**. Do not advertise iPhone ChatGPT connectivity or deploy a public endpoint yet.

## Mandatory security boundary

- Never request TimeTree credentials through an AI chat or an MCP tool. Credential onboarding must use a separate trusted channel owned by the AUTH workstream.
- Remote access is **default-deny**: `TIMETREE_REMOTE_BEARER_TOKEN` must be set to an independently generated secret of at least 32 UTF-8 bytes. Never put this token in source control, query strings, prompts or logs.
- Configure `TIMETREE_REMOTE_ALLOWED_ORIGINS` with explicit comma-separated HTTPS origins. Browser Origin headers, when present, must match. Origin checks are **not authentication**.
- Remote mutation is disabled by default; `TIMETREE_REMOTE_ALLOW_WRITES=true` is an explicit opt-in. Tool annotations alone do not enforce write restrictions.
- `TIMETREE_REMOTE_MAX_BODY_BYTES` defaults to 1048576 and is bounded to 10 MiB. Enforce the limit in the HTTP adapter before reading the complete request.
- TLS termination, rate limiting, request timeouts, authorization before session creation, and strict no-store responses are required in the eventual adapter.
- A single global bearer token is **not multi-user isolation**. Do not share one process between users: use per-user isolated credentials, sessions, and server instances until a reviewed identity-to-credential binding exists.
- Keep the server bound to loopback or a private network until the HTTP transport and independent security review are complete.

## Verification gate

Test unauthenticated requests, invalid bearer tokens, untrusted origins, oversized bodies, read-only mutation attempts, cross-user isolation, disconnect cleanup, and MCP initialize/tool round trips. Then perform read-only live TimeTree tests. Isolated-calendar write/delete and actual iPhone ChatGPT connectivity require separate end-to-end verification.
