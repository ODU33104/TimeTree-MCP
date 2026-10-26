# GitHub credibility roadmap — community trust before public launch

Date: 2026-10-26. Paired product tracks: **everyday mobile usability** and **technical trust/maintainability**. Public TimeTree integration is blocked until provider authorization, secure per-user OAuth, reliable QA and an approved distribution model are established.

## Why this matters

A convincing README alone does not earn trust. Open technical limitations, reproducible tests, clean ownership, timely disclosure and traceable changes matter more than feature counts. Current evidence is a 29-tool baseline, a 32-tool integration candidate, 172 prior passing tests, a **failed full release gate**, and multiple unregistered prototypes.

## Priority and work packages

| Priority | Work package | Concrete acceptance evidence | Ownership |
| --- | --- | --- | --- |
| P0 | Security truthfulness | `SECURITY.md` explains private reporting limitations, audit blockers and unsafe deployment paths; enable private reporting in GitHub Settings if available | Coordinator / repository admin |
| P0 | Dependency remediation | Commit valid generated lockfile after `npm audit fix` and complete local tests; no manual integrity edits, no `--force` unreviewed Zod major | Security worker in network-enabled environment |
| P0 | Accurate README/badges and upstream provenance | Remove or explicitly label upstream CI/release badges; link this fork's workflows, issues and releases; credit original repo, license, fork status and unofficial provider relationship | Dedicated docs/branding worker only |
| P0 | Release transparency | Publish exact tested SHA/commands and blocked gates; keep integration/dev separate from main and public release | Coordinator |
| P1 | Reviewer-friendly PRs | Security checklist, test evidence, reproduction with synthetic fixtures, release behavior and migration risk for every PR | Contributors |
| P1 | Deterministic developer demo | Text-first CLI/MCP Inspector sample using **synthetic events only**, quickstart with zero secrets, negative tests and documented expected output | Engineering worker |
| P1 | Public API and error contract | Schema stability and JSON examples, least privilege read-only, bounded operations, deterministic error codes, compatibility changelog | Engineering worker |
| P1 | Security design notes | Threat model for credential vault, ChatGPT remote OAuth, multi-user isolation, prompt injection and destructive confirmation; identify unresolved controls | Security worker |
| P2 | Issue/discussion response standards | Reproducible bug template, environment, no secrets; public roadmap with `planned/prototype/registered/tested` distinctions | Coordinator |
| P2 | Worldwide usage validation | Persona interviews, accessible smartphone text fallback, locale/DST and privacy tests; no unsupported market-size assertions | UX research worker |

## Immediate repository observations to fix

- The coordination-branch `README.md` CI and release badges link to `ehs208/TimeTree-MCP`, **not this fork**. This can falsely suggest an upstream green build applies here.
- `CONTRIBUTING.md` bug-report and clone/PR instructions also point to `ehs208/TimeTree-MCP`. Correct the fork links, but retain clear attribution to upstream.
- A root `SECURITY.md` was missing as of inspection; this work package creates one on a dedicated branch pending review.
- Existing `.github/PULL_REQUEST_TEMPLATE.md` checks `npm run verify` but does not demand actual command output or differentiate untested work from green checks; update on trust branch.
- Integration-release CI did run earlier and **failed overall** because of dependency audit. Never badge the release as passing.
- The loopback prototype is not a public multi-user SaaS, and arbitrary private MCP connection on ChatGPT mobile is not established.

## Measurable GitHub trust criteria

1. Zero credentials, tokens or sensitive calendar details in repo/issues/test fixtures.
2. Every release tag links to reproducible test + audit evidence from the same SHA.
3. All documented supported features map to a registered MCP tool and verified source behavior; experimental modules labeled separately.
4. All critical/high security findings have tracked, approved disposition; no hidden failing checks.
5. Default branch and badges cannot be mistaken for upstream success or an unmerged candidate.
6. Contribution path is clear from this fork, with PR templates and safe disclosure instructions.
7. No user account or provider permission is implied without documentation.

## Next sequence

First merge/review this trust-docs branch **only into the coordination branch** (not main; avoid watched workflows). Ask the dedicated docs worker to correct upstream badges/links separately. Run dependency fixes and a synthetic-data developer demo in parallel **only in an environment where local tests can actually run**. Public deployment remains NO-GO until the independent platform/provider/security gates are met.
