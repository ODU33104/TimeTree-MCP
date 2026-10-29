# ローカルPC実機検証手順・司令塔向け統合管理メモ — 2026-10-29 JST

> **司令塔は現在のChatGPTセッションが継続担当。PC担当者は実機検証だけを行い、司令塔権限を引き継がない。** この文書は2026-10-29時点のGitHub実査に基づく。実行前にPR・SHA・claims・レビュー・Actionsを再取得すること。既存の [COORDINATOR-HANDOFF](../COORDINATOR-HANDOFF.md) と [QUEUE](../QUEUE.md) も必読。

## 0. ユーザー決定と最優先事項

- ユーザーは当面スマホで開発を指揮していたが、**Codespacesのスマホ画面が使いづらいため、今後はローカルPCに展開して実行検証する**。
- ユーザーの懸念: **PRが33件開いたまま、mainのREADMEが初期状態に近い。成果を実際に統合・公開できる状態へ進めたい**。
- **司令塔は現在のChatGPTセッションから交代しない。** PC担当セッションはGitHubの正確なSHAのチェックアウト、Nodeテスト、ビルド、npm audit、ログ提出のみ担当。PR統合方針、README担当調整、claim配分、マージ判断は引き続き司令塔が行う。
- 司令塔は新規workerの乱立より、**PCでの実測テスト → 安全なPR統合 → README同期**を優先する。
- GitHub Actionsの起動、integration/release-candidateへのpush、mainへのマージ、デプロイ、有料契約、実TimeTree認証情報・個人予定の利用は**事前のユーザー承認なしに行わない**。
- TimeTree非公式フォーク。内部Web APIを公認APIと表現しない。公式モバイルChatGPT接続も未実証。

## 1. 2026-10-29 実査スナップショット

Repository: https://github.com/ODU33104/TimeTree-MCP

- `main` SHA: `3f77995f4d074364c6ffe14bb95a9d0c43a7c1d8`。上流由来のMCPツール29個が基線。
- `integration/release-candidate` SHA: `fd676e74b5c86846704fdb175e5966a83acb94db`。既存29 + read-only 3ツール = 32登録済み（main未反映）。
- Open PR: **33件（#1–#33、すべてDraft）**。大半は integration/release-candidate か coordination branch をbaseとする。**番号順にマージしない**。
- `main/README.md` は上流 `ehs208/TimeTree-MCP` のCI/release/インストールリンクを多く含み、フォーク独自機能・13言語・現在の開発段階を適切に案内できていない。
- `work/docs-brand` に13言語READMEの作業あり。**PR #23は `work/docs-brand` 向けの差分**であり、main向けREADME更新PRではない。README/アイコンはDOCS-BRAND owner領域。
- 過去CIはNode22/24で172テスト成功という証拠があるが、過去のrelease QAで `npm audit` FAIL。新PRのexact-SHAのローカル検証は多くがNOT RUN。
- 最新Actions履歴（取得時）：2026-10-26 09:15 UTCのrunが直近。新規起動禁止を維持。

## 2. PCに移行した最初の安全な作業

Windows: PowerShell/Git Bash、macOS/Linux: terminal。Node.js 22+、Git、npmを準備。最初は実データ・TimeTreeのログイン情報を使わない。

```bash
git clone https://github.com/ODU33104/TimeTree-MCP.git
cd TimeTree-MCP
git status --short
git fetch origin --prune
git branch -a
node --version
npm --version
git --version
```

**重要:** `npm ci` と npm scripts は取得したコードを実行する。依存と `package.json` のスクリプトを確認し、信頼できる隔離環境でのみ実行する。まず対象PRのhead SHAをGitHubから再取得し、`git checkout --detach <SHA>` → `git rev-parse HEAD` の一致を検証する。テスト結果にはPR番号・SHA・Node/npmバージョン・実測コマンド・PASS/FAIL/NOT RUN・ログを必ず記録。

安全な実行環境を確保できた場合の候補:
```bash
node --test tests/offline-verify-harness.test.mjs
node --test tests/ux-mobile-brief-view.test.mjs
npm run typecheck
npm test
npm run build
npm audit
```

上記コマンドは**該当ファイル/スクリプトが存在する正しいPR SHAでのみ**実行。監査にはネットワークが必要。ローカルで通った一部テストを全体PASSとしない。PR #31/#32の検証スクリプトには npm script実行・出力先検証などのレビュー指摘があるため、先に確認する。

## 3. マージ戦略（ユーザーの「なぜマージしない？」への回答）

PRがDraftなのは、未検証・未統合の試作や報告を含むため。**マージしないことが目的ではない**。次のゲートを通ったものから段階的に統合する。

1. **ドキュメント先行:** DOCS-BRAND ownerの `work/docs-brand` とPR #23を比較。READMEのフォーク固有URL、現行29ツール、候補32ツール、未登録試作、実証していないスマホ接続、監査ブロッカーを明確化。13言語で整合性を確保し、main向けの専用README PRを作る。既存PR #1/#2の内容と重複確認。ドキュメントだけでもユーザー承認とCI起動条件を確認してからマージ。
2. **基盤:** PR #3（更新通知先）、#4（HTTP credential境界）、#5（remote security）、#6（統合候補）を差分・依存関係・回帰テストで確認。#6は監査・認証ブロッカーが解消するまでmainへマージしない。
3. **既存統合済みとの重複排除:** PR #7–#19の一部は integration/release-candidate にすでに取り込み済み。各PRとintegrationの差分を確認し、二重マージを避ける。MCP登録は司令塔所有 `src/index.ts` とツール登録の安全性レビュー後。
4. **独立read-only試作:** PR #21 What-if、#22 iCalendar、#26 attendance、#27 checklist、#33 mobile briefing はadapter/認可/完全性/プライバシー/タイムゾーン/テストのゲートを満たすまでユーザー向け機能として宣伝しない。#24 duplicate guard と #25 QAは相互依存。#31/#32はQAの補助であり機能PRではない。
5. **リリースゲート:** exact-SHAのNodeテスト・typecheck・build・npm audit・必要な権限/安全性テストを実行し、脆弱性を解消。mainマージは個別にユーザーの承認を得てから。リリース・公開接続はさらに別承認。

## 4. 現時点の具体的ブロッカー

- **ネットワーク:** 過去worker環境は `github.com` DNS解決失敗。PR #31への2026-10-29レビューも `git ls-remote` exit128、exact-SHAのテストNOT RUN。PCではこの問題の解消を最初に確認する。
- **依存:** 過去release QAで `npm audit` FAIL。lockfile、互換性、依存解決、監査をPCで検証。未実行をPASSとしない。
- **認証/remote:** local vaultのシンボリックリンク経由書込、HTTP origin/認証・credential redactionなどPR #28の最新レビューを参照。既存ownerのファイルを無断変更しない。
- **機能:** #33の `calendarId` provenance、#27の完全snapshot/明示同意、#26のroster検証・匿名化、#21のDST/recurrence、#22の情報漏洩・UID/折返しを統合前に解決。
- **README:** mainは上流リンク中心。#23はwork/docs-brandがbaseで、mainへ直接反映されない。DOCS-BRANDの作業を尊重し、main向けPRを調整する。

## 5. 現司令塔の継続タスク（PC担当には委譲しない）

1. **現司令塔が継続して**最新PR/claims/reviews/reports/Actionsを再読し、ユーザーに現在の進捗を短く報告。
2. **PC担当者にのみ依頼:** 安全にソース取得できたら、まずPR #31、#33のexact-SHAテストを実行。次に#21/#22/#24–#27、基盤/統合ブランチの回帰テストと監査。結果をPR/SHA/コマンド/ログ付きで司令塔へ返す。PC担当者はREADME・統合・マージを担当しない。
3. DOCS-BRAND担当のREADMEをmain向けに整えるため、**既存担当への具体的依頼**を先行。未完成機能を実装済みと表現しない。
4. テスト結果を根拠にPRを `merge-ready` / `fix-required` / `blocked` / `superseded` に分類し、統合順序を提示。
5. mainマージ・Actions起動は必ずユーザーの個別承認を得る。自動巡回は停止中、勝手に再開しない。

## 6. 参照先

- [Coordinator handoff](../COORDINATOR-HANDOFF.md)
- [Queue](../QUEUE.md)
- [One-paste dispatch](../ONE-PASTE-DISPATCH.md)
- [PR一覧](https://github.com/ODU33104/TimeTree-MCP/pulls)
- [PR #23 README](https://github.com/ODU33104/TimeTree-MCP/pull/23)
- [PR #28 Security](https://github.com/ODU33104/TimeTree-MCP/pull/28)
- [PR #31 Offline harness](https://github.com/ODU33104/TimeTree-MCP/pull/31)
- [PR #32 Independent QA](https://github.com/ODU33104/TimeTree-MCP/pull/32)
- [PR #33 Mobile briefing](https://github.com/ODU33104/TimeTree-MCP/pull/33)
