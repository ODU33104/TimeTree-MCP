<p align="center"><img src="docs/assets/icon.svg" alt="TimeTree MCP" width="96" height="96"></p>

# TimeTree MCP — 繁體中文

[English](README.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Deutsch](README.de.md) · [繁體中文](README.zh-Hant.md) · [Français](README.fr.md) · [Español](README.es.md) · [Português (Brasil)](README.pt-BR.md) · [简体中文](README.zh-Hans.md) · [Italiano](README.it.md) · [ไทย](README.th.md) · [Bahasa Indonesia](README.id.md) · [Bahasa Melayu](README.ms.md)

> 本專案為獨立、非官方的分支。原始專案：[ehs208/TimeTree-MCP](https://github.com/ehs208/TimeTree-MCP)（MIT）。與 TimeTree, Inc. 無關。

**Security / 繁體中文:** 請勿在 AI 對話或提示詞中輸入 TimeTree 帳號密碼。請只在本機 MCP 用戶端設定中儲存憑證。

**Compatibility:** 本分支的發行檔、ChatGPT 行動裝置遠端連線及所有用戶端相容性尚未驗證。

## 功能開發狀態（2026-10-27）

- **目前 `main`：** 29 個已註冊 MCP 工具，涵蓋行事曆、活動、重複事件、備忘錄與清單資料、留言、成員、標籤、假日及最近變更。
- **尚未發佈的整合候選：** 另有 3 個唯讀工具（跨行事曆搜尋、空閒時段、衝突偵測），共 32 個；雖然先前測試通過，**整體依賴安全稽核仍失敗**。
- **獨立原型，尚不可由 MCP 呼叫：** 假設性改期衝突分析及保護隱私的 `.ics` 匯出。ChatGPT 手機版直接連線、公開多人服務及 TimeTree 官方授權尚未驗證。


[Feature coverage / 機能対応表](https://github.com/ODU33104/TimeTree-MCP/blob/coordination/parallel-workstreams/docs/coordination/TIMETREE-FEATURE-COVERAGE-20261026.md) · [What-if prototype PR #21](https://github.com/ODU33104/TimeTree-MCP/pull/21) · [iCalendar export prototype PR #22](https://github.com/ODU33104/TimeTree-MCP/pull/22)

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
