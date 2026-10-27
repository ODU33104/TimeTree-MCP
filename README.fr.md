<p align="center"><img src="docs/assets/icon.svg" alt="TimeTree MCP" width="96" height="96"></p>

# TimeTree MCP — Français

[English](README.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Deutsch](README.de.md) · [繁體中文](README.zh-Hant.md) · [Français](README.fr.md) · [Español](README.es.md) · [Português (Brasil)](README.pt-BR.md) · [简体中文](README.zh-Hans.md) · [Italiano](README.it.md) · [ไทย](README.th.md) · [Bahasa Indonesia](README.id.md) · [Bahasa Melayu](README.ms.md)

> Projet indépendant et non officiel. Projet d'origine : [ehs208/TimeTree-MCP](https://github.com/ehs208/TimeTree-MCP) (MIT). Sans affiliation avec TimeTree, Inc.

**Security / Français:** Ne saisissez jamais vos identifiants TimeTree dans une conversation IA. Configurez-les uniquement dans les paramètres locaux du client MCP.

**Compatibility:** Les versions publiées par ce fork, l'accès distant depuis ChatGPT mobile et la compatibilité avec tous les clients ne sont pas vérifiés.

## État des fonctionnalités (27/10/2026)

- **Branche `main` :** 29 outils MCP enregistrés : calendriers, événements, récurrences, mémos et données de listes, commentaires, membres, étiquettes, jours fériés et activité récente.
- **Candidat d'intégration, non publié :** 3 outils en lecture seule supplémentaires (recherche multi-calendriers, créneaux libres, conflits), soit 32. Malgré des tests précédemment réussis, **l'audit de sécurité global a échoué**.
- **Prototypes, non appelables via MCP :** simulation d'un déplacement d'événement et export `.ics` respectueux de la vie privée. La connexion directe sur ChatGPT mobile, l'hébergement multi-utilisateur et l'autorisation officielle de TimeTree restent non vérifiés.


[Feature coverage / 機能対応表](https://github.com/ODU33104/TimeTree-MCP/blob/coordination/parallel-workstreams/docs/coordination/TIMETREE-FEATURE-COVERAGE-20261026.md) · [What-if prototype PR #21](https://github.com/ODU33104/TimeTree-MCP/pull/21) · [iCalendar export prototype PR #22](https://github.com/ODU33104/TimeTree-MCP/pull/22)

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
