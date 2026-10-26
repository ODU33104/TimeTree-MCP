# Credential onboarding boundary

This is an unofficial TimeTree MCP fork and is not affiliated with TimeTree, Inc.

## Threat model and current limitations

Never paste a TimeTree email, password, session cookie, CSRF token, or remote bearer token into ChatGPT, MCP tool arguments, GitHub, or application logs.

The current stdio server accepts `TIMETREE_EMAIL` and `TIMETREE_PASSWORD` from the local process environment. Environment variables are a legacy compatibility path, **not** a secure remote multi-user onboarding system. Protect the host and process environment; avoid shell history and shared machines.

A local-only terminal onboarding helper has been added, but it deliberately refuses password entry until a reviewed hidden-input provider and protected credential storage are available. Do not advertise it as a completed setup flow. Do not implement a web form or unauthenticated credential-collection endpoint as a shortcut.

For remote deployments, the coordinator and REMOTE workstream must provide identity-bound, per-user isolated storage, access control, revocation, and TLS before any account can be onboarded. Authentication to the MCP endpoint is distinct from authentication to TimeTree.

## Required verification

Use dummy credentials and mocked HTTP only for unit tests. Verify redirect rejection, no secret leakage in error messages/logs, session clearing, failure recovery, and cross-user separation. Live testing requires explicit consent and a disposable calendar; do not use production account credentials in tests.
