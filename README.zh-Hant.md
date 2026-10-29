<p align="center"><img src="docs/assets/icon.svg" alt="TimeTree MCP" width="96" height="96"></p>

# TimeTree MCP — 繁體中文

[English](README.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Deutsch](README.de.md) · [繁體中文](README.zh-Hant.md) · [Français](README.fr.md) · [Español](README.es.md) · [Português (Brasil)](README.pt-BR.md) · [简体中文](README.zh-Hans.md) · [Italiano](README.it.md) · [ไทย](README.th.md) · [Bahasa Indonesia](README.id.md) · [Bahasa Melayu](README.ms.md)

> 本專案為獨立、非官方的分支。原始專案：[ehs208/TimeTree-MCP](https://github.com/ehs208/TimeTree-MCP)（MIT）。與 TimeTree, Inc. 無關。

**Security / 繁體中文:** 請勿在 AI 對話或提示詞中輸入 TimeTree 帳號密碼。請只在本機 MCP 用戶端設定中儲存憑證。

**Compatibility:** 本分支的發行檔、ChatGPT 行動裝置遠端連線及所有用戶端相容性尚未驗證。

## Documentation scope / Feature status

**Quickstart only:** This page is a localized summary, not a complete translation. English, Japanese and Korean have detailed guides. The 13 README languages do not imply that runtime localization, date/time behavior, or compatibility has been verified in 13 languages. The listed capabilities are repository-level features, not a guarantee of full TimeTree app coverage. No official TimeTree affiliation, confirmed ChatGPT mobile/remote connection, or guaranteed release artifacts. Consult the detailed guides for current limitations.

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
