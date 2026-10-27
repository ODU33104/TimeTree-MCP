<p align="center"><img src="docs/assets/icon.svg" alt="TimeTree MCP" width="96" height="96"></p>

# TimeTree MCP — Bahasa Melayu

[English](README.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Deutsch](README.de.md) · [繁體中文](README.zh-Hant.md) · [Français](README.fr.md) · [Español](README.es.md) · [Português (Brasil)](README.pt-BR.md) · [简体中文](README.zh-Hans.md) · [Italiano](README.it.md) · [ไทย](README.th.md) · [Bahasa Indonesia](README.id.md) · [Bahasa Melayu](README.ms.md)

> Ini ialah fork bebas yang tidak rasmi. Projek asal: [ehs208/TimeTree-MCP](https://github.com/ehs208/TimeTree-MCP) (MIT). Tiada kaitan dengan TimeTree, Inc.

**Security / Bahasa Melayu:** Jangan masukkan kelayakan TimeTree dalam sembang atau prom AI. Simpan hanya dalam tetapan setempat klien MCP.

**Compatibility:** Keluaran fork ini, sambungan jauh ChatGPT mudah alih dan keserasian semua klien belum disahkan.

## Status ciri (27 Oktober 2026)

- **`main`:** 29 alat MCP berdaftar untuk kalendar, acara, acara berulang, memo dan data senarai semak, komen, ahli, label, cuti umum dan aktiviti terkini.
- **Calon integrasi, belum dikeluarkan:** 3 alat baca-sahaja tambahan untuk carian rentas kalendar, masa lapang dan konflik jadual (jumlah 32). Walaupun ujian terdahulu lulus, **audit keselamatan keseluruhan gagal**.
- **Prototaip, belum boleh digunakan melalui MCP:** simulasi perubahan waktu acara dan eksport `.ics` yang mengutamakan privasi. Sambungan terus ChatGPT mudah alih, perkhidmatan awam berbilang pengguna dan kebenaran rasmi TimeTree belum disahkan.


[Feature coverage / 機能対応表](https://github.com/ODU33104/TimeTree-MCP/blob/coordination/parallel-workstreams/docs/coordination/TIMETREE-FEATURE-COVERAGE-20261026.md) · [What-if prototype PR #21](https://github.com/ODU33104/TimeTree-MCP/pull/21) · [iCalendar export prototype PR #22](https://github.com/ODU33104/TimeTree-MCP/pull/22)

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

The project uses undocumented TimeTree web endpoints and may stop working when TimeTree changes them. Do not assume this fork has a downloadable release or a working remote/mobile integration.

## License and attribution

MIT: [LICENSE](LICENSE). Original authors and contributors: [ehs208/TimeTree-MCP](https://github.com/ehs208/TimeTree-MCP). Independent community fork; not endorsed by TimeTree, Inc. [Disclaimer](DISCLAIMER.md).
