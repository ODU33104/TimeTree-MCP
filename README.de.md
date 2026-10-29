<p align="center"><img src="docs/assets/icon.svg" alt="TimeTree MCP" width="96" height="96"></p>

# TimeTree MCP — Deutsch

[English](README.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Deutsch](README.de.md) · [繁體中文](README.zh-Hant.md) · [Français](README.fr.md) · [Español](README.es.md) · [Português (Brasil)](README.pt-BR.md) · [简体中文](README.zh-Hans.md) · [Italiano](README.it.md) · [ไทย](README.th.md) · [Bahasa Indonesia](README.id.md) · [Bahasa Melayu](README.ms.md)

> Dies ist ein unabhängiger, inoffizieller Fork. Ursprüngliches Projekt: [ehs208/TimeTree-MCP](https://github.com/ehs208/TimeTree-MCP) (MIT). Keine Verbindung zu TimeTree, Inc.

**Security / Deutsch:** Zugangsdaten niemals in KI-Chats oder Prompts eingeben. Nur lokal in den MCP-Client-Einstellungen speichern.

**Compatibility:** Nicht verifiziert: Releases dieses Forks, mobile ChatGPT-Verbindungen und Kompatibilität mit allen Clients.

## Funktionsstatus (27.10.2026)

- **Release-Ziel v0.8.0 (`main` plus Release-Kandidat): 32 MCP-Tools** für Kalender, Termine, Wiederholungen, Notizen/Checklisten-Daten, Kommentare, Mitglieder, Labels, Feiertage und Aktivitäten. Neu sind 3 schreibgeschützte Tools: `search_events_across_calendars` (Termine mehrerer Kalender durchsuchen), `find_available_slots` (freie Zeitfenster finden), `detect_event_conflicts` (überlappende Termine erkennen).
- **In Entwicklung, nicht veröffentlicht, keine nutzbaren MCP-Tools:** Was-wäre-wenn-Verschiebung, datensparsamer `.ics`-Export, Duplikatschutz, Teilnahme-/Checklisten-Zusammenfassungen und mobile Briefings. Direkter ChatGPT-Mobilzugang, öffentliche Mehrbenutzer-Anbindung und offizielle TimeTree-Unterstützung sind nicht bestätigt.
- **Zugriff:** Über stdio sind Schreibvorgänge wie bisher möglich; mit der Umgebungsvariable `TIMETREE_READ_ONLY=true` läuft der Server schreibgeschützt. Für Remote-HTTP gibt es nur ein Richtlinienmodul, aber keinen Server, der Verbindungen annimmt; einen öffentlichen Remote-Dienst gibt es nicht.


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
