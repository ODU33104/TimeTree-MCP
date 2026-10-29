<p align="center"><img src="docs/assets/icon.svg" alt="TimeTree MCP" width="96" height="96"></p>

# TimeTree MCP — Bahasa Melayu

[English](README.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Deutsch](README.de.md) · [繁體中文](README.zh-Hant.md) · [Français](README.fr.md) · [Español](README.es.md) · [Português (Brasil)](README.pt-BR.md) · [简体中文](README.zh-Hans.md) · [Italiano](README.it.md) · [ไทย](README.th.md) · [Bahasa Indonesia](README.id.md) · [Bahasa Melayu](README.ms.md)

> Ini ialah fork bebas yang tidak rasmi. Projek asal: [ehs208/TimeTree-MCP](https://github.com/ehs208/TimeTree-MCP) (MIT). Tiada kaitan dengan TimeTree, Inc.

**Security / Bahasa Melayu:** Jangan masukkan kelayakan TimeTree dalam sembang atau prom AI. Simpan hanya dalam tetapan setempat klien MCP.

**Compatibility:** Keluaran fork ini, sambungan jauh ChatGPT mudah alih dan keserasian semua klien belum disahkan.

## Status ciri

- **Keluaran v0.8.0 (`main`): 32 alat MCP** untuk kalendar, acara, acara berulang, memo dan data senarai semak, komen, ahli, label, cuti umum dan aktiviti terkini. Tiga alat baharu ialah baca-sahaja: `search_events_across_calendars` (cari acara merentas kalendar), `find_available_slots` (cari masa lapang) dan `detect_event_conflicts` (kesan acara yang bertindih).
- **Dalam pembangunan, belum dikeluarkan, bukan alat MCP yang boleh digunakan:** simulasi perubahan waktu acara, eksport `.ics` yang mengutamakan privasi, perlindungan pendua, ringkasan kehadiran/senarai semak dan taklimat mudah alih. Sambungan terus ChatGPT mudah alih, perkhidmatan awam berbilang pengguna dan kebenaran rasmi TimeTree belum disahkan.
- **Akses:** melalui stdio penulisan masih boleh dilakukan seperti biasa; tetapkan pemboleh ubah persekitaran `TIMETREE_READ_ONLY=true` untuk mod baca-sahaja. Untuk HTTP jauh hanya modul dasar disediakan, tanpa pelayan yang menerima sambungan; tiada perkhidmatan jauh awam.


## TimeTree MCP

Baca kalendar dan acara, cipta atau ubah acara, urus komen dan memo, serta semak cuti umum.

## Pemasangan dan rujukan teknikal

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
