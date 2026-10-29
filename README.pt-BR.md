<p align="center"><img src="docs/assets/icon.svg" alt="TimeTree MCP" width="96" height="96"></p>

# TimeTree MCP — Português (Brasil)

[English](README.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Deutsch](README.de.md) · [繁體中文](README.zh-Hant.md) · [Français](README.fr.md) · [Español](README.es.md) · [Português (Brasil)](README.pt-BR.md) · [简体中文](README.zh-Hans.md) · [Italiano](README.it.md) · [ไทย](README.th.md) · [Bahasa Indonesia](README.id.md) · [Bahasa Melayu](README.ms.md)

> Este é um fork independente e não oficial. Projeto original: [ehs208/TimeTree-MCP](https://github.com/ehs208/TimeTree-MCP) (MIT). Sem vínculo com a TimeTree, Inc.

**Security / Português (Brasil):** Nunca informe credenciais do TimeTree em conversas ou prompts de IA. Armazene-as apenas nas configurações locais do cliente MCP.

**Compatibility:** Não foram verificados os lançamentos deste fork, o acesso remoto pelo ChatGPT móvel nem a compatibilidade com todos os clientes.

## Status das funcionalidades (27/10/2026)

- **Alvo da versão v0.8.0 (`main` mais o candidato a lançamento): 32 ferramentas MCP** para calendários, eventos, recorrências, notas e dados de listas, comentários, membros, etiquetas, feriados e histórico recente. As 3 novas são somente de leitura: `search_events_across_calendars` (buscar eventos em vários calendários), `find_available_slots` (encontrar horários livres) e `detect_event_conflicts` (detectar eventos sobrepostos).
- **Em desenvolvimento, não lançado, sem ferramentas MCP utilizáveis:** simulação de mudança de horário, exportação `.ics` com foco em privacidade, proteção contra duplicatas, resumos de presença/listas e resumo móvel. A conexão direta pelo ChatGPT móvel, hospedagem pública multiusuário e autorização oficial da TimeTree não foram verificadas.
- **Acesso:** via stdio a escrita continua possível como antes; defina a variável de ambiente `TIMETREE_READ_ONLY=true` para somente leitura. Para HTTP remoto existe apenas um módulo de política, sem servidor que aceite conexões; não há serviço remoto público.


## TimeTree MCP

Consulte calendários e eventos, altere eventos, gerencie comentários e memorandos e consulte feriados.

## Instalação e referência técnica

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
