# Authentication and ChatGPT connection security

## Current state

The server uses TimeTree email/password credentials provided as `TIMETREE_EMAIL` and
`TIMETREE_PASSWORD` to the **server process**. The MCP tools do not accept these
credentials as arguments. Never type a TimeTree password into an AI conversation or
place it in a prompt, repository, screenshot or issue.

This is not OAuth and there is no in-app credential registration screen. The
environment supplying these variables can access the secret, so protect the MCP
client configuration and the host account. Avoid shared computers and plaintext
cloud configuration where possible.

## HTTP protections

- Authenticated HTTP requests are restricted to `https://timetreeapp.com`
  (standard HTTPS port only); redirects are rejected.
- Session cookies and CSRF tokens remain in the server process; they must never
  be exposed as MCP tool outputs or arguments.
- HTTP error bodies are not logged. They remain available inside the HTTP error
  object for interpreting TimeTree API error codes; do not forward that body
  into an MCP response or add raw error logging.
- Login attempts clear stale session and CSRF state before starting and after
  failure.
- This code uses an unofficial, reverse-engineered TimeTree web API. Authentication
  behavior may change without notice.

## Remote ChatGPT / iPhone: not implemented

The existing MCP server runs locally over stdio. **Do not expose this stdio
process or a generic HTTP bridge directly to the public Internet.**

A remote deployment needs, at minimum:

1. A dedicated HTTPS endpoint with a supported remote MCP transport.
2. Independent client authentication and authorization, ideally OAuth-based,
   with strict per-user isolation. Never equate a public URL with authorization.
3. Secure secret provisioning and storage (encrypted at rest, limited access),
   rotation/revocation, and no credentials in prompts or tool responses.
4. CSRF/session protections, rate limits, audit events without private content,
   and defenses against cross-user calendar access.
5. Read-only integration tests before write/delete capabilities are enabled.

This document describes requirements, not a claim that remote ChatGPT or iPhone
connectivity already works.
