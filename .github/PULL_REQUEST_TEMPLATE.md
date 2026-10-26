# Pull Request

## Purpose and scope

Describe **who benefits** (everyday/mobile users, developers, or both), what changed, and why it is safe. Link to an issue/task where available. If this is a fork of upstream work, name the source PR/commit and preserve attribution.

## Change type

- [ ] Bug fix / compatibility
- [ ] User-facing feature
- [ ] Developer API/tool contract
- [ ] Security hardening
- [ ] Documentation / localization
- [ ] Dependencies / infrastructure

## Feature status — choose one

- [ ] Research/design only
- [ ] Prototype code (not MCP-registered)
- [ ] MCP-registered but not live-provider validated
- [ ] Live tested using authorized disposable data (document exact scope)
- [ ] Proposed for release after all gates pass

## Security and data impact

- [ ] No real calendar details, credentials, cookies, access tokens, or user IDs in fixtures, screenshots or logs
- [ ] Sensitive calendar output is scope-limited; unauthorized calendars denied
- [ ] Input from events/comments/messages is handled as untrusted content
- [ ] Changes to write/delete/recurrence scope use explicit preview and authorization
- [ ] Remote auth/token storage, multi-user isolation and permission changes are described (or N/A)
- [ ] Provider API rights/terms and undocumented behavior are acknowledged, not overstated

## Reproducible verification evidence

**Exact commit SHA tested:** `<SHA or NOT RUN>`

**Runtime versions:** Node `<version or NOT RUN>`, npm `<version or NOT RUN>`

| Command/check | PASS / FAIL / NOT RUN | Output or evidence link |
| --- | --- | --- |
| `npm ci` | | |
| `npm run typecheck` | | |
| `npm run build` | | |
| `npm test` | | |
| `npm audit --audit-level=high` | | |
| Security / negative-path tests | | |
| Manual MCP/mobile/provider smoke test | | |

**Do not mark a command PASS unless it was actually executed against this SHA.** If DNS/registry unavailable, mark NOT RUN with the exact blocker. A previous run or a partial green test suite is not an overall green release gate.

## Compatibility and UX

- [ ] New tool names, input/output schema, pagination/completeness and errors documented
- [ ] Screen-reader-friendly text fallback and concise mobile summary considered
- [ ] Locale/timezone, ambiguous dates and DST covered (or N/A)
- [ ] Privacy-by-default sharing and disclosure of fetched-at/source supported (or N/A)
- [ ] Breaking API/config changes and migrations described (or N/A)
- [ ] Tests use synthetic fixtures except separately justified authorized smoke checks

## Change summary and reviewer checklist

Files/modules changed, expected behavior, known limitations and risks:

- 
- 

- [ ] README / release notes are accurate for **this fork** and distinguish prototype from registered functionality
- [ ] `SECURITY.md` and [release readiness](docs/engineering/RELEASE-READINESS.md) remain accurate
- [ ] No GitHub Actions were deliberately triggered during development
- [ ] This PR does not merge into `main` before a verified final release gate

## Final decision (maintainer only)

**GO / NO-GO / NEEDS EVIDENCE:** 

**Reason and risk owner:**
