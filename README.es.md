<p align="center"><img src="docs/assets/icon.svg" alt="TimeTree MCP" width="96" height="96"></p>

# TimeTree MCP — Español

[English](README.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Deutsch](README.de.md) · [繁體中文](README.zh-Hant.md) · [Français](README.fr.md) · [Español](README.es.md) · [Português (Brasil)](README.pt-BR.md) · [简体中文](README.zh-Hans.md) · [Italiano](README.it.md) · [ไทย](README.th.md) · [Bahasa Indonesia](README.id.md) · [Bahasa Melayu](README.ms.md)

> Este es un fork independiente y no oficial. Proyecto original: [ehs208/TimeTree-MCP](https://github.com/ehs208/TimeTree-MCP) (MIT). No está afiliado a TimeTree, Inc.

**Security / Español:** Nunca introduzcas credenciales de TimeTree en chats o instrucciones para IA. Guárdalas solo en la configuración local del cliente MCP.

**Compatibility:** No se han verificado las versiones de este fork, el acceso remoto desde ChatGPT móvil ni la compatibilidad con todos los clientes.

## Estado de las funciones

- **Versión v0.8.0 (`main`): 32 herramientas MCP** para calendarios, eventos, recurrencias, notas y listas, comentarios, miembros, etiquetas, festivos y actividad reciente. Las 3 nuevas son de solo lectura: `search_events_across_calendars` (buscar eventos en varios calendarios), `find_available_slots` (buscar horarios libres) y `detect_event_conflicts` (detectar eventos solapados).
- **En desarrollo, sin publicar y sin herramientas MCP utilizables:** simulación de cambios de horario, exportación `.ics` con privacidad por defecto, protección contra duplicados, resúmenes de asistencia/listas y resumen móvil. No se ha verificado la conexión directa desde ChatGPT móvil, la operación pública multiusuario ni una autorización oficial de TimeTree.
- **Acceso:** por stdio se puede escribir como hasta ahora; con la variable de entorno `TIMETREE_READ_ONLY=true` el servidor es de solo lectura. Para HTTP remoto solo existe un módulo de políticas, sin servidor que acepte conexiones; no hay servicio remoto público.


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

The project uses undocumented TimeTree web endpoints and may stop working when TimeTree changes them. This fork is local-only: there is no hosted or remote service, and use from the ChatGPT mobile app has not been tested.

## License and attribution

MIT: [LICENSE](LICENSE). Original authors and contributors: [ehs208/TimeTree-MCP](https://github.com/ehs208/TimeTree-MCP). Independent community fork; not endorsed by TimeTree, Inc. [Disclaimer](DISCLAIMER.md).
