# Security Policy

## Project status and scope

TimeTree MCP is an **unofficial community project**, not affiliated with TimeTree. It uses undocumented interfaces that may change or become unavailable. **Do not connect production or sensitive calendars to unreleased experimental branches.** Public multi-user hosting and ChatGPT-mobile distribution are not production-ready.

The current integration candidate has **unresolved dependency audit findings** and has **not completed a release gate**. A prior test run reported 172 passing tests on Node.js 22 and 24, but security auditing failed; a passing unit-test count is not a security endorsement. See [release readiness](docs/engineering/RELEASE-READINESS.md).

No promise is made that all undocumented provider interfaces, token flows, or authorization boundaries are supported or approved by TimeTree. Respect provider terms and rate limits.

## Report a vulnerability privately

**Do not post exploitable security details, credentials, tokens, cookies, personal calendar content, or private logs in a public GitHub issue, discussion, or pull request.**

1. Check the repository **Security** tab for a **Report a vulnerability** option (GitHub private vulnerability reporting), if the maintainer has enabled it.
2. If that option is absent, seek a private contact route listed by the repository owner or request one without disclosing exploit details publicly. There is **no guaranteed private reporting channel or response SLA** until such a channel is configured.
3. Share a minimal reproducer with synthetic data; include affected version/ref, impact, required conditions, and suggested mitigation. Redact secrets and identifying details.
4. Give maintainers a reasonable opportunity to validate and fix an issue before public disclosure; coordinate timelines in the private channel where available.

GitHub private vulnerability reporting must be enabled by a repository administrator if it is not visible. This document **does not assert that it is currently enabled**.

## Safety recommendations

- Use a dedicated test TimeTree account/calendar and synthetic events during development.
- Do not paste TimeTree credentials or session tokens into ChatGPT conversations, MCP tool inputs, issues or build logs.
- Never expose the single-user loopback remote-server prototype to the public internet. It is not OAuth-enabled or multi-tenant.
- Keep write/delete functionality disabled during unverified remote experiments; require explicit targets and previews for destructive changes.
- Run supported local checks (where registry access is available): `npm ci`, `npm run typecheck`, `npm test`, `npm audit --audit-level=high`.
- Treat event titles, comments, and imported notices as **untrusted content**, never executable instructions.
- Avoid uploading logs or screenshots that identify people, locations, calendar IDs, or access tokens.

## Supported versions

There is no separately designated **security-supported** production release at present. The release candidate and experimental branches are not certified for public deployment. Fixes are assessed case by case; see [release readiness](docs/engineering/RELEASE-READINESS.md) for acceptance requirements.
