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

## Status on development main (November 2026)

- `preview_calendar_bridge` and `export_calendar_bridge_ics` are registered in the existing stdio MCP server and each returns portable structured JSON.
- The server advertises a read-only preview resource at `ui://timetree-mcp/calendar-bridge.html` with MIME type `text/html;profile=mcp-app`.
- A client receives `_meta.ui.resourceUri` only when its initialization capabilities declare `io.modelcontextprotocol/ui` with that MIME type.
- The HTML UI is self-contained, uses the MCP Apps JSON-RPC handshake, renders proposed actions, blockers, and warnings with `textContent` rather than unsafe HTML insertion, and never calls a write tool.
- Other clients receive the identical model-visible result without UI. No OpenAI-only JavaScript API is used.
- Official Google Calendar REST adapter exists but OAuth onboarding and real sync are **not complete**. The UI is a preview, not a Google account manager or CRUD editor.
- Host behavior and widget rendering are not verified in Claude, Gemini, or ChatGPT. Gemini clients in particular differ in MCP support; do not promise universal embedded UI.
- Tests and local build have not been run in the authoring environment, so this code is not described as production-ready.

## Local testing checklist (no CI charges)

1. Run `npm ci && npm run typecheck && npm test && npm run build` locally.
2. Exercise `tools/list` with and without `extensions.io.modelcontextprotocol/ui.mimeTypes` and confirm the UI metadata is capability-gated.
3. Read `resources/list` and `resources/read` and verify the HTML MIME type and resource URI.
4. Test `ui/initialize`, `ui/notifications/initialized` and `ui/notifications/tool-result` against a compatible MCP Apps host or inspector.
5. Test equivalent preview and export tools in a text-only MCP client; the result must not depend on a UI.
6. Check large calendars, recurring series that start before the window, all-day events, deleted events and privacy mode with fake data.
7. Do not use a live Google or TimeTree account until the whole offline matrix passes.
