<p align="center">
  <img src="docs/assets/icon.svg" alt="" width="96" height="96">
</p>

<h1 align="center">TimeTree MCP</h1>

<p align="center">
  Talk to your TimeTree calendar from Claude, Codex, Cursor, and other MCP clients.
</p>

<p align="center">
  <a href="https://github.com/ODU33104/TimeTree-MCP/releases"><img src="https://img.shields.io/github/v/release/ODU33104/TimeTree-MCP?label=release" alt="Latest release"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
</p>

<p align="center">
  <a href="README.md">English</a> · <a href="README.ja.md">日本語</a> · <a href="README.ko.md">한국어</a> · <a href="README.de.md">Deutsch</a> · <a href="README.zh-Hant.md">繁體中文</a> · <a href="README.fr.md">Français</a> · <a href="README.es.md">Español</a> · <a href="README.pt-BR.md">Português (Brasil)</a> · <a href="README.zh-Hans.md">简体中文</a> · <a href="README.it.md">Italiano</a> · <a href="README.th.md">ไทย</a> · <a href="README.id.md">Bahasa Indonesia</a> · <a href="README.ms.md">Bahasa Melayu</a>
</p>

> [!NOTE]
> Unofficial and for personal use. Not affiliated with, endorsed by, or supported by TimeTree, Inc. It uses the TimeTree web app's undocumented endpoints, which can change at any time. See [DISCLAIMER.md](DISCLAIMER.md).
>
> This is an independent fork of [ehs208/TimeTree-MCP](https://github.com/ehs208/TimeTree-MCP) (MIT), maintained here. Never paste your TimeTree password into an AI chat; put it only in your MCP client's environment settings.

Ask your AI assistant things like:

- "Summarize our family calendar this week. Any conflicts?"
- "When was the last dentist appointment?"
- "Add a dinner on Saturday at 7 pm to the Family calendar."
- "Turn this trip plan into events and a packing memo."
- "Who changed the calendar today, and what did they change?"

<p align="center">
  <img src="docs/assets/demo-en.gif" alt="Claude Desktop summarizes a week on a TimeTree calendar, flags a conflict, then moves an event and adds a new one" width="760">
</p>

## What it does

- **Reads your calendars.** Events with date, keyword, and label filters. Recurring events are expanded into their actual dates.
- **Looks across calendars.** Search up to five calendars at once, find free time, and spot overlapping events. These three tools are read-only.
- **Reads comment images.** Pass images attached to event comments to your AI client, including images posted by free accounts.
- **Changes them when you ask.** Create, update, copy, and delete events, memos, and comments, and rename or recolor labels. Change or delete a single occurrence of a recurring event, or it and the ones after it.
- **Manages virtual members.** Add, rename, or remove members without a TimeTree account, such as children or pets.
- **Keeps you up to date.** See what changed since a given time, and who made recent changes.
- **Knows the context.** Calendar members and public holidays by country.
- **Runs on your computer.** Your email and password are sent only to TimeTree. The session stays in memory.

## Scope and limits

- **33 tools in v0.9.0.** See [Tools](#tools). Checklist fields on memos and events can be read and written, but there is no tool that checks off a single item. Attendance fields are not exposed as RSVP actions.
- **Read-only mode.** Over stdio, write tools are available by default. To list and allow only non-calendar-writing tools (16 in v0.9.0; 24 on development main, including Google connection/disconnect controls), tick "Read-only mode" in the Claude Desktop extension's settings, or set `TIMETREE_READ_ONLY=true` in the MCP `env` for a git clone.
- **Local only.** The server runs on your computer over stdio. There is no hosted or remote service, and the remote-access code in this repository is a set of security rules without a server. Connecting from the ChatGPT mobile app has not been tested.
- **Not supported.** Photo and file uploads, albums, RSVP, premium attachments, and two-way calendar sync.
- **Not tested.** Time zone and daylight-saving edge cases outside the automated tests, and every TimeTree app feature. Compatibility depends on TimeTree's undocumented endpoints and on your MCP client.
- **Languages.** English, Japanese, and Korean are full guides. The other ten languages are short quick-start summaries.

The development branch (`main`) has 41 registered tools, including Calendar Bridge previews, ICS export and local Google OAuth/read tools. The v0.9.0 release tag still contains 33 tools. Export currently rejects recurring and all-day events rather than silently changing them. Google OAuth and Google-backed comparison exist on `main`, but automatic writes and synchronization are not yet available. See [Calendar Bridge](docs/CALENDAR-BRIDGE.md) and [Cross-client UI](docs/CROSS-CLIENT-UI.md).

## Install

### Claude Desktop (macOS, Windows): one-click extension

1. Download `timetree-mcp-<version>.mcpb` from the [latest release](https://github.com/ODU33104/TimeTree-MCP/releases).
2. Open the file. Claude Desktop shows an install dialog.
3. Enter your TimeTree email and password, then enable the extension.

No Git, Node.js install, or config file editing is needed. The extension runs on the Node.js that comes with Claude Desktop on macOS and Windows.

### Claude Code, without cloning

Requires Node.js 22 or later and Git. This installs the `v0.9.0` release tag straight from GitHub:

```bash
claude mcp add --scope user timetree -e TIMETREE_EMAIL=your-email@example.com -e TIMETREE_PASSWORD=your-password -e TIMETREE_INSTALL_SOURCE=npx -- npx -y github:ODU33104/TimeTree-MCP#v0.9.0
```

The first start builds the server and can take a few minutes, so raise `MCP_TIMEOUT` (in milliseconds) when you start Claude Code. The password is stored as plain text in Claude's configuration. [docs/MCP_CLIENTS.md](docs/MCP_CLIENTS.md) has a variant that keeps it out of the file, with commands for Windows PowerShell and macOS/Linux: [docs/MCP_CLIENTS.md](docs/MCP_CLIENTS.md)

### Claude Code, Codex, Cursor, and other clients

Requires Node.js 22 or later and Git.

**Ask your coding agent.** Paste this into Claude Code, Codex, or a similar agent:

> Clone `https://github.com/ODU33104/TimeTree-MCP`, enter the cloned directory, run `npm ci && npm run build`, then configure my MCP client with a server named `timetree` that runs `node /absolute/path/to/TimeTree-MCP/dist/index.js` (use the real cloned path). Store `TIMETREE_EMAIL` and `TIMETREE_PASSWORD` only in the MCP client environment configuration, and never hardcode or print secrets.

**Or run the installer.** It clones, builds, and prints a config example for each client:

```bash
curl -fsSL https://raw.githubusercontent.com/ODU33104/TimeTree-MCP/main/TimeTree-MCP-install.sh | bash
```

<details>
<summary>Manual install</summary>

```bash
git clone https://github.com/ODU33104/TimeTree-MCP.git
cd TimeTree-MCP
npm ci
npm run build
```

Then add the server to your MCP client. Example for Claude Desktop on macOS (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "timetree": {
      "command": "node",
      "args": ["/absolute/path/to/TimeTree-MCP/dist/index.js"],
      "env": {
        "TIMETREE_EMAIL": "your-email@example.com",
        "TIMETREE_PASSWORD": "your-password"
      }
    }
  }
}
```

If a GUI client cannot find `node`, use the absolute path from `command -v node` as `command`.

</details>

Setup for each client (Claude Code, Codex, Cursor, Windsurf, VS Code, Antigravity, and more): [docs/MCP_CLIENTS.md](docs/MCP_CLIENTS.md)

This project is not published to npm. Install it from a GitHub release or a clone of this repository. Because the server handles your TimeTree password, read any script before you run it.

## Updating

When a newer version is out, the server adds a one-time notice to a tool response, so your assistant can tell you. Set `TIMETREE_UPDATE_CHECK=false` in the MCP `env` to turn this off.

- **Claude Desktop extension:** download the new `.mcpb` from the [latest release](https://github.com/ODU33104/TimeTree-MCP/releases) and open it.
- **Git clone:** run `git pull origin main && npm ci && npm run build` in the folder, then restart your MCP client.

Details: [docs/UPDATING.md](docs/UPDATING.md). Changes: [CHANGELOG.md](CHANGELOG.md).

## Tools

| Area | Tools |
|---|---|
| Calendars | `list_calendars`, `create_calendar`, `get_current_user` |
| Events | `get_events`, `get_updated_events`, `create_event`, `update_event`, `delete_event`, `copy_event` |
| Cross-calendar reads | `search_events_across_calendars`, `find_available_slots`, `detect_event_conflicts` (read-only) |
| Calendar Bridge (main only, experimental) | `preview_calendar_bridge`, `preview_google_calendar_bridge`, `export_calendar_bridge_ics` (read-only) |\n| Google Calendar (main only, experimental) | `connect_google_calendar`, `google_connection_status`, `list_google_calendars`, `get_google_calendar_events`, `disconnect_google_calendar` (no calendar writes) |
| Recurring events | `update_event_occurrence`, `delete_event_occurrence` |
| Memos | `list_memos`, `create_memo`, `update_memo`, `delete_memo` |
| Comments | `list_event_comments`, `get_event_comment_image`, `add_event_comment`, `update_event_comment`, `delete_event_comment` |
| Labels and members | `get_calendar_labels`, `update_calendar_labels`, `get_calendar_members`, `get_calendar_virtual_members`, `create_virtual_member`, `update_virtual_member`, `delete_virtual_member` |
| Diagnostics | `check_connection` (read-only) |
| Other | `get_holidays`, `get_recent_activity` |

Parameters and examples: [COMMANDS.md](COMMANDS.md)

`create_calendar` requires a name (1–20 characters) and an explicit purpose. It does not invite members. Timeouts and server errors are not retried.
If the creation response cannot be validated, check existing calendars before trying again.

`list_event_comments` includes image metadata. Use `get_event_comment_image` to retrieve one image as standard MCP image content over stdio; the client must support image tool results. JPEG, PNG, GIF, and WebP up to 5 MiB are supported. Images stay in memory and are not saved to disk. Premium files attached directly to an event and image uploads are not supported.

## Experimental Google Calendar connection (development main)

Set `GOOGLE_OAUTH_CLIENT_ID` to your own Google Cloud **Desktop application** OAuth client ID in the local MCP environment. Google Calendar API access and an authorized consent screen are required. The optional `GOOGLE_OAUTH_CLIENT_SECRET` can be supplied if the client configuration requires it. **Do not enter either value or OAuth callback links into AI chat.**

Use `connect_google_calendar` to obtain a Google authorization link, then open it in the browser on the **same computer** where the stdio MCP server runs. The one-time authorization callback binds to 127.0.0.1 and expires after five minutes. The connection and its refresh token live only in the running MCP process and disappear when it exits. Use `google_connection_status`, `list_google_calendars` and `get_google_calendar_events` to confirm read access, and `preview_google_calendar_bridge` to compare a selected TimeTree and Google calendar.

This is **not a remote or ChatGPT mobile OAuth flow**. It does not implement Google event writes, background synchronization or encrypted long-term Google token storage. A running local MCP server is required. Tools remain usable as normal JSON/text in hosts without MCP Apps support.

## Offline verification (no GitHub Actions)

Run `npm ci && npm run typecheck && npm test && npm run build` on your own computer. All GitHub Actions workflow files have been removed from this fork to prevent automatic billing on pushes, schedules, or tags.

## Privacy and security

- Your email and password are stored only in your MCP client configuration, or in Claude Desktop's extension settings. They are sent only to TimeTree.
- Session cookies and CSRF tokens stay in memory and are never written to disk.
- Logs mask passwords, cookies, and tokens.
- On startup, the server makes one request to GitHub to check for a newer version. No credentials or calendar data are sent.

## Troubleshooting

**Not sure what is wrong**: ask your assistant to run `check_connection`. It reports whether sign-in works, the server version, whether an update is available, and whether read-only mode is on, and says what to do next. Failed tool calls start with a category code such as `[AUTH_FAILED]` or `[NETWORK]` followed by the next step.

**Some items are missing from a list**: if TimeTree returns an item in an unexpected shape, the list still returns the valid items and reports how many were left out as `skipped_items`.

**"Missing required environment variables"**: set `TIMETREE_EMAIL` and `TIMETREE_PASSWORD` in your MCP configuration. For the Claude Desktop extension, open its settings and enter them again.

**Sign-in fails**: check that you can sign in on the TimeTree web app with the same email and password. The server signs in with email and password only.

**No calendars or events**: make sure the account has calendars, and check the client's MCP logs. TimeTree may have changed its web API; please [open an issue](https://github.com/ODU33104/TimeTree-MCP/issues).

Questions and bug reports are welcome on [GitHub Issues](https://github.com/ODU33104/TimeTree-MCP/issues).

## How it works

The server signs in to the TimeTree web app with your email and password, then calls the same endpoints the web app uses. It signs in again when the session expires, limits requests to 10 per second with retries on HTTP 429, and reads every page of large calendars.

Write requests need a CSRF token, which the server reads from the TimeTree web page after signing in.

## Contributing

Issues and pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Credits

This project is a fork of [ehs208/TimeTree-MCP](https://github.com/ehs208/TimeTree-MCP). Thanks to the upstream contributors:

<a href="https://github.com/ehs208/TimeTree-MCP/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=ehs208/TimeTree-MCP" alt="Upstream contributors">
</a>

API insights from [TimeTree-Exporter](https://github.com/eoleedi/TimeTree-Exporter) by [@eoleedi](https://github.com/eoleedi).

## License

MIT. See [LICENSE](LICENSE). Not affiliated with TimeTree, Inc. See [DISCLAIMER.md](DISCLAIMER.md).
