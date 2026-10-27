<p align="center"><img src="docs/assets/icon.svg" alt="TimeTree MCP" width="96" height="96"></p>

# TimeTree MCP — Deutsch

[English](README.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Deutsch](README.de.md) · [繁體中文](README.zh-Hant.md) · [Français](README.fr.md) · [Español](README.es.md) · [Português (Brasil)](README.pt-BR.md) · [简体中文](README.zh-Hans.md) · [Italiano](README.it.md) · [ไทย](README.th.md) · [Bahasa Indonesia](README.id.md) · [Bahasa Melayu](README.ms.md)

> Dies ist ein unabhängiger, inoffizieller Fork. Ursprüngliches Projekt: [ehs208/TimeTree-MCP](https://github.com/ehs208/TimeTree-MCP) (MIT). Keine Verbindung zu TimeTree, Inc.

**Security / Deutsch:** Zugangsdaten niemals in KI-Chats oder Prompts eingeben. Nur lokal in den MCP-Client-Einstellungen speichern.

**Compatibility:** Nicht verifiziert: Releases dieses Forks, mobile ChatGPT-Verbindungen und Kompatibilität mit allen Clients.

## Funktionsstatus (27.10.2026)

- **`main`:** 29 registrierte MCP-Tools für Kalender, Termine, Wiederholungen, Notizen/Checklisten-Daten, Kommentare, Mitglieder, Labels, Feiertage und Aktivitäten.
- **Integrationskandidat, noch nicht veröffentlicht:** 3 zusätzliche schreibgeschützte Tools für kalenderübergreifende Suche, freie Zeitfenster und Terminkonflikte (32 insgesamt). Der abschließende Sicherheits-Audit ist **fehlgeschlagen**, auch wenn frühere Tests erfolgreich waren.
- **Prototypen, keine nutzbaren MCP-Tools:** Was-wäre-wenn-Verschiebung und datensparsamer `.ics`-Export. Direkter ChatGPT-Mobilzugang, öffentliche Mehrbenutzer-Anbindung und offizielle TimeTree-Unterstützung sind nicht bestätigt.


[Feature coverage / 機能対応表](https://github.com/ODU33104/TimeTree-MCP/blob/coordination/parallel-workstreams/docs/coordination/TIMETREE-FEATURE-COVERAGE-20261026.md) · [What-if prototype PR #21](https://github.com/ODU33104/TimeTree-MCP/pull/21) · [iCalendar export prototype PR #22](https://github.com/ODU33104/TimeTree-MCP/pull/22)

## TimeTree MCP

Kalender und Termine lesen, Termine erstellen oder ändern, Kommentare und Notizen verwalten sowie Feiertage abrufen.

## Installation und technische Referenz

This localized quick-start provides the safe, verified-independent installation path. Full command reference and detailed instructions remain in [English README](README.md) and [MCP client documentation](docs/MCP_CLIENTS.md). This does **not** mean that all interfaces or date/time behavior are localized.

Requires Node.js 22+ and Git. Review repository contents and installation scripts before executing them.

```bash
git clone https://github.com/ODU33104/TimeTree-MCP.git
cd TimeTree-MCP
npm ci
npm run build
```

Configure your MCP client to launch `node /absolute/path/to/TimeTree-MCP/dist/index.js`. Set `TIMETREE_EMAIL` and `TIMETREE_PASSWORD` only in the client's local protected environment settings; never send credentials in AI prompts. See [MCP client setup](docs/MCP_CLIENTS.md) for the configuration format.

The project uses undocumented TimeTree web endpoints and may stop working when TimeTree changes them. Do not assume this fork has a downloadable release or a working remote/mobile integration.

## License and attribution

MIT: [LICENSE](LICENSE). Original authors and contributors: [ehs208/TimeTree-MCP](https://github.com/ehs208/TimeTree-MCP). Independent community fork; not endorsed by TimeTree, Inc. [Disclaimer](DISCLAIMER.md).
