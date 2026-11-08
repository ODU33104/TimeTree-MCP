# Cross-client UI and transport strategy

TimeTree-MCP must remain useful from Claude, Gemini, ChatGPT, Codex, Cursor, and other MCP clients. Client support for a transport or an embedded UI must be **verified**, never inferred from model branding.

## Architecture

1. **Core**: TimeTree client and provider-neutral Calendar Bridge modules. They do not import MCP SDK, UI frameworks, or Google-specific modules.
2. **MCP tools**: portable JSON input/output contracts for calendars, previews, sync actions and CRUD. Every write requires explicit, scoped user approval; preview and validation must remain read-only.
3. **Optional MCP Apps UI**: expose an interactive resource only when the actual host advertises compatible capabilities. UI actions invoke the same tools as text clients. No privileged UI-only write path.
4. **Text fallback**: every preview includes machine-readable counts, proposed actions, conflicts and clear warnings. A client without MCP Apps can still inspect and confirm operations.
5. **Transports**: preserve local stdio. Do not expose the existing write-capable tool set directly on a public HTTP endpoint. A future remote transport requires separate authentication, origin validation, scoped permissions and secure credential handling.

## Client compatibility matrix

| Client family | Baseline | Optional rich UI |
| --- | --- | --- |
| Claude desktop/code | MCP tools where client supports them | Detect and verify MCP Apps support in the actual client/version |
| Gemini ecosystem | MCP tools only where the selected Gemini client supports MCP | Do not assume MCP Apps support |
| ChatGPT | Supported connector/app transport required; local stdio alone is not a ChatGPT connection | Verify supported app/connector and UI capabilities |
| Codex/Cursor/other clients | Standard MCP tool contracts | Capability-gated, with text fallback |

## User experience

- Select TimeTree source calendars and Google destination calendars.
- Preview creates, updates, unchanged entries and conflicts before any write.
- Show recurrence exceptions, all-day/time-zone conversions and omitted fields.
- Allow batch-by-batch confirmation with resumable journal state.
- Never silently resolve two-sided edits or delete events from either service.
- Permit export/backup without connecting a Google account.

## Engineering constraints

- No GitHub Actions runs or new workflow files. Run `npm run typecheck`, `npm test` and `npm run build` in a local development environment.
- Do not create pull requests. Use directly committed, independently reviewable changes.
- Tests use synthetic calendars and mocked providers, not real credentials.
- UI should not be announced as working until tested in a compatible host.
