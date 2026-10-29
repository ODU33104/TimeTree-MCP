<p align="center"><img src="docs/assets/icon.svg" alt="TimeTree MCP" width="96" height="96"></p>

# TimeTree MCP — 繁體中文

[English](README.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Deutsch](README.de.md) · [繁體中文](README.zh-Hant.md) · [Français](README.fr.md) · [Español](README.es.md) · [Português (Brasil)](README.pt-BR.md) · [简体中文](README.zh-Hans.md) · [Italiano](README.it.md) · [ไทย](README.th.md) · [Bahasa Indonesia](README.id.md) · [Bahasa Melayu](README.ms.md)

> 本專案為獨立、非官方的分支。原始專案：[ehs208/TimeTree-MCP](https://github.com/ehs208/TimeTree-MCP)（MIT）。與 TimeTree, Inc. 無關。

**Security / 繁體中文:** 請勿在 AI 對話或提示詞中輸入 TimeTree 帳號密碼。請只在本機 MCP 用戶端設定中儲存憑證。

**Compatibility:** 本分支的發行檔、ChatGPT 行動裝置遠端連線及所有用戶端相容性尚未驗證。

## 功能開發狀態（2026-10-27）

- **發佈目標 v0.8.0（`main` 加發佈候選）：32 個 MCP 工具**，涵蓋行事曆、活動、重複事件、備忘錄與清單資料、留言、成員、標籤、假日及最近變更。新增 3 個唯讀工具：`search_events_across_calendars`（跨多個行事曆搜尋活動）、`find_available_slots`（尋找空閒時段）、`detect_event_conflicts`（偵測重疊活動）。
- **開發中，尚未發佈，無法作為 MCP 工具使用：** 假設性改期分析、保護隱私的 `.ics` 匯出、重複防護、出席／清單摘要及行動裝置簡報。ChatGPT 手機版直接連線、公開多人服務及 TimeTree 官方授權尚未驗證。
- **存取方式：** 透過 stdio 仍可像以往一樣寫入；設定環境變數 `TIMETREE_READ_ONLY=true` 可讓伺服器唯讀。遠端 HTTP 目前只有政策模組，沒有接受連線的伺服器，也沒有公開的遠端服務。


## TimeTree MCP

可讀取行事曆與活動、建立或修改活動、管理留言與備忘錄，以及查詢國定假日。

## 安裝與技術文件

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
