<p align="center"><img src="docs/assets/icon.svg" alt="TimeTree MCP" width="96" height="96"></p>

# TimeTree MCP — 简体中文

[English](README.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Deutsch](README.de.md) · [繁體中文](README.zh-Hant.md) · [Français](README.fr.md) · [Español](README.es.md) · [Português (Brasil)](README.pt-BR.md) · [简体中文](README.zh-Hans.md) · [Italiano](README.it.md) · [ไทย](README.th.md) · [Bahasa Indonesia](README.id.md) · [Bahasa Melayu](README.ms.md)

> 本项目是独立的非官方分支。原项目：[ehs208/TimeTree-MCP](https://github.com/ehs208/TimeTree-MCP)（MIT）。与 TimeTree, Inc. 无关。

**Security / 简体中文:** 请勿在 AI 对话或提示词中输入 TimeTree 登录凭据。请仅在本地 MCP 客户端设置中保存。

**Compatibility:** 此分支的发行包、ChatGPT 移动端远程连接及各客户端兼容性尚未验证。

## 功能开发状态（2026-10-27）

- **发布目标 v0.8.0（`main` 加发布候选）：32 个 MCP 工具**，覆盖日历、日程、重复事件、备忘录及清单数据、评论、成员、标签、节假日和最近变更。新增 3 个只读工具：`search_events_across_calendars`（跨多个日历搜索日程）、`find_available_slots`（查找空闲时间）、`detect_event_conflicts`（检测重叠日程）。
- **开发中，尚未发布，不能作为 MCP 工具使用：** 改期模拟、隐私优先的 `.ics` 导出、重复防护、出席/清单摘要和移动端简报。ChatGPT 手机端直接连接、公开多用户服务及 TimeTree 官方授权均未验证。
- **访问方式：** 通过 stdio 仍可像以前一样写入；设置环境变量 `TIMETREE_READ_ONLY=true` 可使服务器只读。远程 HTTP 目前只有策略模块，没有监听连接的服务器，也没有公开的远程服务。


## TimeTree MCP

可读取日历和日程、创建或修改日程、管理评论与备忘录，以及查询节假日。

## 安装与技术参考

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
