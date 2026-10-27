<p align="center"><img src="docs/assets/icon.svg" alt="TimeTree MCP" width="96" height="96"></p>

# TimeTree MCP — 简体中文

[English](README.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Deutsch](README.de.md) · [繁體中文](README.zh-Hant.md) · [Français](README.fr.md) · [Español](README.es.md) · [Português (Brasil)](README.pt-BR.md) · [简体中文](README.zh-Hans.md) · [Italiano](README.it.md) · [ไทย](README.th.md) · [Bahasa Indonesia](README.id.md) · [Bahasa Melayu](README.ms.md)

> 本项目是独立的非官方分支。原项目：[ehs208/TimeTree-MCP](https://github.com/ehs208/TimeTree-MCP)（MIT）。与 TimeTree, Inc. 无关。

**Security / 简体中文:** 请勿在 AI 对话或提示词中输入 TimeTree 登录凭据。请仅在本地 MCP 客户端设置中保存。

**Compatibility:** 此分支的发行包、ChatGPT 移动端远程连接及各客户端兼容性尚未验证。

## 功能开发状态（2026-10-27）

- **当前 `main`：** 已注册 29 个 MCP 工具，覆盖日历、日程、重复事件、备忘录及清单数据、评论、成员、标签、节假日和最近变更。
- **尚未发布的集成候选：** 另有 3 个只读工具（跨日历搜索、空闲时间、冲突检测），合计 32 个。此前测试虽然通过，**整体依赖安全审计仍失败**。
- **独立原型，尚不可通过 MCP 使用：** 改期冲突模拟和隐私优先的 `.ics` 导出。ChatGPT 手机端直接连接、公开多用户服务及 TimeTree 官方授权均未验证。


[Feature coverage / 機能対応表](https://github.com/ODU33104/TimeTree-MCP/blob/coordination/parallel-workstreams/docs/coordination/TIMETREE-FEATURE-COVERAGE-20261026.md) · [What-if prototype PR #21](https://github.com/ODU33104/TimeTree-MCP/pull/21) · [iCalendar export prototype PR #22](https://github.com/ODU33104/TimeTree-MCP/pull/22)

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
