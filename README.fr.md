<p align="center"><img src="docs/assets/icon.svg" alt="TimeTree MCP" width="96" height="96"></p>

# TimeTree MCP — Français

[English](README.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Deutsch](README.de.md) · [繁體中文](README.zh-Hant.md) · [Français](README.fr.md) · [Español](README.es.md) · [Português (Brasil)](README.pt-BR.md) · [简体中文](README.zh-Hans.md) · [Italiano](README.it.md) · [ไทย](README.th.md) · [Bahasa Indonesia](README.id.md) · [Bahasa Melayu](README.ms.md)

> Projet indépendant et non officiel. Projet d'origine : [ehs208/TimeTree-MCP](https://github.com/ehs208/TimeTree-MCP) (MIT). Sans affiliation avec TimeTree, Inc.

**Security / Français:** Ne saisissez jamais vos identifiants TimeTree dans une conversation IA. Configurez-les uniquement dans les paramètres locaux du client MCP.

**Compatibility:** Les versions publiées par ce fork, l'accès distant depuis ChatGPT mobile et la compatibilité avec tous les clients ne sont pas vérifiés.

## Documentation scope / Feature status

**Quickstart only:** This page is a localized summary, not a complete translation. English, Japanese and Korean have detailed guides. The 13 README languages do not imply that runtime localization, date/time behavior, or compatibility has been verified in 13 languages. The listed capabilities are repository-level features, not a guarantee of full TimeTree app coverage. No official TimeTree affiliation, confirmed ChatGPT mobile/remote connection, or guaranteed release artifacts. Consult the detailed guides for current limitations.

## TimeTree MCP

Consultez les calendriers et événements, modifiez les événements, gérez les commentaires et mémos, et consultez les jours fériés.

## Installation et référence technique

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
