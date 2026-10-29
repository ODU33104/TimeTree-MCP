# Official TimeTree AI compatibility and safe interoperability

Reviewed: 2026-10-26. This repository is an **unofficial** fork, not affiliated with TimeTree. All official feature descriptions below are sourced from TimeTree's public documentation; no private endpoints were inspected.

## Capability matrix

| Capability | Official published status | This fork / integration boundary |
| --- | --- | --- |
| Conversational create, edit, delete, search | Web AI Chat **beta**, announced 2026-10-13 [1] | Existing MCP calendar tools are separate; do not claim unique AI chat or feature parity |
| Confirmation before changing events | Official Web AI Chat confirmation cards [1] | Preview-first and explicit user approval required for any batch mutation; no implied automatic approval |
| Paste email text to create several events | Official Web AI Chat supports it [1] | Not a differentiator; never forward email contents to an undocumented endpoint |
| Bulk label changes | Official Web AI Chat supports it [1] | Not unique; authorization and preview still required |
| Schedule Context Engine (SCE) | Announced as a **future AI context platform** in 2026-09-01 roadmap [2] | No publicly verified SCE integration API; do not implement or claim access |
| AI image-to-event scanning | Documented mobile app functionality [3] | Not unique; user must verify extracted dates before saving |
| Multi-calendar free/busy, private briefing, travel buffers, rollback previews | No official feature parity claim made here | Candidate differentiation only, contingent on implementation, security review and testing |

## Safe interoperability policy

1. Only use documented, authorized integration surfaces. Public news announcements are **not** API documentation.
2. Never reverse-engineer undocumented official AI or SCE endpoints, harvest cookies, scrape private calendars, or send credentials in LLM prompts.
3. Keep all event reads scoped to calendars explicitly authorized by the user. Prefer local processing of event details and avoid logging event titles, attendee data or secrets.
4. Use dry-run previews for proposed writes, obtain explicit confirmation for every destructive batch, and disclose non-atomic partial-failure behavior.
5. Treat future SCE availability as **unknown** until TimeTree publishes a usable integration contract, auth scope and privacy terms.
6. Do not advertise ChatGPT/iPhone remote MCP connectivity until a supported transport and end-to-end connection are verified.

## Sources

[1] TimeTree, "Web版で『AIチャット』が使えるようになりました" (2026-10-13): https://timetreeapp.com/intl/ja/newsroom/2026-10-13/web-ai-chat

[2] TimeTree, "ミッション・ビジョンを刷新" (2026-09-01): https://timetreeapp.com/intl/ja/newsroom/2026-09-01/mvw-redefine

[3] TimeTree Help, "画像から予定を作成したい（予定スキャン機能）": https://support.timetreeapp.com/hc/ja/articles/62131241037081

## Integration handoff

Coordinator should update the capability matrix only from official published sources and explicitly distinguish announced roadmap capabilities from supported APIs. This document does not grant access to TimeTree's AI service or imply a live integration.
