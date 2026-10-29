<p align="center"><img src="docs/assets/icon.svg" alt="TimeTree MCP" width="96" height="96"></p>

# TimeTree MCP — Bahasa Indonesia

[English](README.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Deutsch](README.de.md) · [繁體中文](README.zh-Hant.md) · [Français](README.fr.md) · [Español](README.es.md) · [Português (Brasil)](README.pt-BR.md) · [简体中文](README.zh-Hans.md) · [Italiano](README.it.md) · [ไทย](README.th.md) · [Bahasa Indonesia](README.id.md) · [Bahasa Melayu](README.ms.md)

> Ini adalah fork independen tidak resmi. Proyek asal: [ehs208/TimeTree-MCP](https://github.com/ehs208/TimeTree-MCP) (MIT). Tidak berafiliasi dengan TimeTree, Inc.

**Security / Bahasa Indonesia:** Jangan pernah memasukkan kredensial TimeTree ke percakapan atau prompt AI. Simpan hanya di pengaturan lokal klien MCP.

**Compatibility:** Rilis fork ini, akses jarak jauh melalui ChatGPT seluler, dan kompatibilitas semua klien belum diverifikasi.

## Status fitur

- **Rilis v0.8.0 (`main`): 32 alat MCP** untuk kalender, acara, pengulangan, memo dan data daftar periksa, komentar, anggota, label, hari libur, dan aktivitas terbaru. Tiga alat baru bersifat baca-saja: `search_events_across_calendars` (cari acara di beberapa kalender), `find_available_slots` (cari waktu kosong), dan `detect_event_conflicts` (deteksi acara yang bertumpuk).
- **Dalam pengembangan, belum dirilis, belum menjadi alat MCP yang dapat dipakai:** simulasi pemindahan acara, ekspor `.ics` yang mengutamakan privasi, pencegahan duplikat, ringkasan kehadiran/daftar periksa, dan ringkasan seluler. Koneksi langsung ChatGPT seluler, layanan publik multi-pengguna, dan izin resmi TimeTree belum terverifikasi.
- **Akses:** melalui stdio penulisan tetap dapat dilakukan seperti sebelumnya; atur variabel lingkungan `TIMETREE_READ_ONLY=true` agar server hanya membaca. Untuk HTTP jarak jauh hanya ada modul kebijakan, tanpa server yang menerima koneksi; tidak ada layanan jarak jauh publik.


## TimeTree MCP

Baca kalender dan acara, buat atau ubah acara, kelola komentar dan memo, serta lihat hari libur.

## Instalasi dan referensi teknis

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
