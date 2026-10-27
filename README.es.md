<p align="center"><img src="docs/assets/icon.svg" alt="TimeTree MCP" width="96" height="96"></p>

# TimeTree MCP — Español

[English](README.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Deutsch](README.de.md) · [繁體中文](README.zh-Hant.md) · [Français](README.fr.md) · [Español](README.es.md) · [Português (Brasil)](README.pt-BR.md) · [简体中文](README.zh-Hans.md) · [Italiano](README.it.md) · [ไทย](README.th.md) · [Bahasa Indonesia](README.id.md) · [Bahasa Melayu](README.ms.md)

> Este es un fork independiente y no oficial. Proyecto original: [ehs208/TimeTree-MCP](https://github.com/ehs208/TimeTree-MCP) (MIT). No está afiliado a TimeTree, Inc.

**Security / Español:** Nunca introduzcas credenciales de TimeTree en chats o instrucciones para IA. Guárdalas solo en la configuración local del cliente MCP.

**Compatibility:** No se han verificado las versiones de este fork, el acceso remoto desde ChatGPT móvil ni la compatibilidad con todos los clientes.

## Estado de las funciones (27/10/2026)

- **Rama `main`:** 29 herramientas MCP registradas para calendarios, eventos, recurrencias, notas y listas, comentarios, miembros, etiquetas, festivos y actividad reciente.
- **Candidato de integración, no publicado:** 3 herramientas adicionales de solo lectura (búsqueda entre calendarios, horarios libres y conflictos), 32 en total. Aunque hubo pruebas satisfactorias, **la auditoría de seguridad global falló**.
- **Prototipos, todavía no disponibles como herramientas MCP:** simulación de cambios de horario y exportación `.ics` con privacidad por defecto. No se ha verificado la conexión directa desde ChatGPT móvil, la operación pública multiusuario ni una autorización oficial de TimeTree.


[Feature coverage / 機能対応表](https://github.com/ODU33104/TimeTree-MCP/blob/coordination/parallel-workstreams/docs/coordination/TIMETREE-FEATURE-COVERAGE-20261026.md) · [What-if prototype PR #21](https://github.com/ODU33104/TimeTree-MCP/pull/21) · [iCalendar export prototype PR #22](https://github.com/ODU33104/TimeTree-MCP/pull/22)

## TimeTree MCP

Consulta calendarios y eventos, modifica eventos, gestiona comentarios y notas, y consulta festivos.

## Instalación y referencia técnica

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
