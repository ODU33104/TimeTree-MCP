<p align="center"><img src="docs/assets/icon.svg" alt="TimeTree MCP" width="96" height="96"></p>

# TimeTree MCP — Italiano

[English](README.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Deutsch](README.de.md) · [繁體中文](README.zh-Hant.md) · [Français](README.fr.md) · [Español](README.es.md) · [Português (Brasil)](README.pt-BR.md) · [简体中文](README.zh-Hans.md) · [Italiano](README.it.md) · [ไทย](README.th.md) · [Bahasa Indonesia](README.id.md) · [Bahasa Melayu](README.ms.md)

> Fork indipendente e non ufficiale. Progetto originale: [ehs208/TimeTree-MCP](https://github.com/ehs208/TimeTree-MCP) (MIT). Nessuna affiliazione con TimeTree, Inc.

**Security / Italiano:** Non inserire mai le credenziali TimeTree in chat o prompt AI. Conservale solo nelle impostazioni locali del client MCP.

**Compatibility:** Non sono verificati i rilasci di questo fork, l'accesso remoto da ChatGPT mobile o la compatibilità con tutti i client.

## Stato delle funzionalità (27/10/2026)

- **`main`:** 29 strumenti MCP registrati per calendari, eventi, ricorrenze, promemoria e dati di checklist, commenti, membri, etichette, festività e attività recenti.
- **Candidato di integrazione non rilasciato:** 3 nuovi strumenti di sola lettura (ricerca multi-calendario, disponibilità, conflitti), 32 in totale. Nonostante i test precedenti superati, **l'audit di sicurezza complessivo non è passato**.
- **Prototipi, non ancora accessibili tramite MCP:** simulazione di spostamento e esportazione `.ics` rispettosa della privacy. Connessione diretta da ChatGPT mobile, servizio pubblico multiutente e autorizzazione ufficiale TimeTree non verificati.


[Feature coverage / 機能対応表](https://github.com/ODU33104/TimeTree-MCP/blob/coordination/parallel-workstreams/docs/coordination/TIMETREE-FEATURE-COVERAGE-20261026.md) · [What-if prototype PR #21](https://github.com/ODU33104/TimeTree-MCP/pull/21) · [iCalendar export prototype PR #22](https://github.com/ODU33104/TimeTree-MCP/pull/22)

## TimeTree MCP

Consulta calendari ed eventi, modifica eventi, gestisci commenti e promemoria e consulta le festività.

## Installazione e riferimento tecnico

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
