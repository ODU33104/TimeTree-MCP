# 1回コピーで指示する運用 — ONE-PASTE DISPATCH (2026-10-27)

このファイルは **司令塔→各ChatGPT開発セッション** の標準仕様です。履歴/戦略/タスク衝突は [COORDINATOR-HANDOFF.md](COORDINATOR-HANDOFF.md) にあります。

## A. 1ボタン=1セッション=1メッセージの原則

- ユーザーは **ChatGPTの「指示文をコピー」ボタンを一度押し、そのまま目的の別チャットに貼って送信するだけ**。GitHubを開いたり、URLと詳細指示を分けて送ったりしない。ボタン内には **(1)指示書のGitHub URL、(2)今回固有のタスクIDと期待成果、(3)Git commit/レポート要求、(4)テスト・Actions禁止事項**を必ず同梱。
- コピー用テキストはChatGPTの1個のコピー操作で取得できる独立した塊。送った後に司令塔が「実は追加指示を送って」と小出しにしない。どうしても追記が必要なら既存担当のチャットに**差分指示1件**で済ませる。
- GitHubのMarkdownは独自JavaScriptの「コピーボタン」を埋め込む場所ではない。司令塔はChatGPTのコピーUI（実装可能な `GenUI.copy` 付きボタン）を返し、GitHub側では下記のテキストブロックを永続的な原本として管理する。GitHubのコードブロックもコピーできる。
- 割当の前にGitHubを検査: 該当report、claim、task branch、PR。既にclaimedなら同じ仕事を新規セッションに上書きさせない。STATUS/QUEUEは履歴を含み古い場合あり。作業先・ファイル所有・ブランチ起点を明記する。
- **運用の最後には必ず送信件数と送信先（例: DOCS担当1件、チェックリスト1件、参加者1件）を記載。** ボタンが使えないUIなら同一テキストを1つのコピー可能なブロックに示す。
- **司令塔自身の実装なし**。通常はPRレビュー/統合準備と担当への実装割当のみ。

## B. 最初に貼る：新しい「司令塔」セッション（1件・1回）

対象: 新しいChatGPTチャット（司令塔専用）。

~~~text
https://github.com/ODU33104/TimeTree-MCP/blob/coordination/parallel-workstreams/docs/coordination/COORDINATOR-HANDOFF.md

あなたは TimeTree-MCP プロジェクトの「新しい司令塔」です。上記GitHub引き継ぎ書と、そこからリンクされる ONE-PASTE-DISPATCH.md、QUEUE.md、claims、統合QA報告、現在のオープンPRを実際に確認してください。GitHubの最新状況を真実として、以前の担当に同じ仕事を重複依頼しないでください。司令塔は機能の個別実装を原則せず、担当への割当・PRレビュー・テスト確認・競合調整・統合判断・13言語README整合性を管理してください。TimeTreeの公式承認やスマホChatGPT接続が済んでいると誤認しないこと。開発途中のGitHub Actionsを起動せず、integration/release-candidateへ不用意にpushせず、mainへはマージしないでください。私が別チャットへ1回貼るだけで済むよう、各セッションへの指示を「GitHub指示書URL＋詳細指示文」を含む1つのコピーボタンで出してください。まず最新の課題と担当先・送信件数を短く整理してください。
~~~

## C. 既存「README・13言語・アイコン担当」へのフォロー（1件・1回）

対象: 以前から README と翻訳に取り組んでいる**同じ**DOCS-BRANDチャット。新しい一般開発チャットには送らない。専用ブランチ work/docs-brand の所有権は維持。

~~~text
https://github.com/ODU33104/TimeTree-MCP/blob/coordination/parallel-workstreams/docs/coordination/instructions/docs-brand.md
https://github.com/ODU33104/TimeTree-MCP/pull/23

あなたは既存のDOCS-BRAND担当です。PR #23 は、あなたの work/docs-brand をベースに13言語READMEの新機能ステータスを同期したドラフトです。まずPRの差分と既存の docs/coordination/reports/docs-brand.md を読み、本文/リンク/機能の実装段階を各言語で確認してください。既存翻訳とアイコンを壊さず、英日韓の詳細READMEと残る10言語のQuickstartの差を明記し、可能なら内容の不一致、誤った公開リリースや古いissueリンク、誇張されたモバイル接続/TimeTree公式対応表記を修正してください。README/iconに触れるのはDOCS-BRAND担当のみ。作業ブランチとコミットSHA、どの13言語を点検したか、リンク・翻訳レビューの結果（未実施ならNOT RUN）、残課題をGitHubの報告に追記してください。mainへマージしない、GitHub Actionsを起動しない、有料サービス・デプロイ不要です。変更は担当ブランチ/ドラフトPRに残し、統合判断は司令塔へ報告してください。
~~~

## D. 専任「チェックリスト進捗」実装担当（1件・1回）

対象: 別のChatGPT開発チャット1つ。**TIME-PARITY-CHECKLISTの既存claimがないことを司令塔が確認してから**送る。

~~~text
https://github.com/ODU33104/TimeTree-MCP/blob/coordination/parallel-workstreams/docs/coordination/instructions/native-feature-parity-dispatch.md

あなたは TIME-PARITY-CHECKLIST だけを担当する実装セッションです。指示書とTimeTree機能カバレッジ表、integration/release-candidateの既存MCP schemaを読んでください。最初にcoordination/parallel-workstreamsへ docs/coordination/claims/TIME-PARITY-CHECKLIST.md をcreate-fileで原子的に作成し、既存claimがあれば上書きせず担当と司令塔へ報告してください。新しいtask branchを integration/release-candidate から切り、既存events/memosのチェックリスト情報から未完了・完了件数をプライバシー重視で要約する読み取り専用の純関数、架空データの負例テスト、README以外の技術文書を作成してください。別task（参加者管理）には触れないこと。実行できたローカルテストだけPASSと記録し、未実行はNOT RUN。ブランチ上の docs/coordination/reports/TIME-PARITY-CHECKLIST.md に変更ファイル/commit SHA/結果/問題を残して integration/release-candidate 向けドラフトPRを作成してください。src/index.ts、MCP registry、README、package-lockに触れず、mainへマージしない。GitHub Actionsと有料デプロイは起動しないでください。完成済みMCPツールだと宣伝しないこと。
~~~

## E. 専任「参加者・仮想メンバー」実装担当（1件・1回）

対象: チェックリスト担当とは**違う**ChatGPT開発チャット1つ。**TIME-PARITY-ATTENDANCEの既存claimがないことを司令塔が確認してから**送る。

~~~text
https://github.com/ODU33104/TimeTree-MCP/blob/coordination/parallel-workstreams/docs/coordination/instructions/native-feature-parity-dispatch.md

あなたは TIME-PARITY-ATTENDANCE だけを担当する実装セッションです。指示書とTimeTree機能カバレッジ表、integration/release-candidateの参加者・仮想メンバーの既存MCP schemaを読んでください。最初にcoordination/parallel-workstreamsへ docs/coordination/claims/TIME-PARITY-ATTENDANCE.md をcreate-fileで原子的に作成し、既存claimがあれば上書きしないでください。integration/release-candidateを起点に独立task branchを切り、閲覧権限のあるカレンダーだけから実参加者と仮想メンバーを区別する読み取り専用要約ロジック、匿名化オプション、架空データの失敗系テストと技術文書を実装してください。RSVP承認・通知送信・出欠回答を推測したり実装したりしない。チェックリストtaskやREADMEには触れないでください。ローカルテストの実際のコマンド・結果を記録し、未実行ならNOT RUN。docs/coordination/reports/TIME-PARITY-ATTENDANCE.md にbranch/commit SHA/テスト/制限をコミットして integration/release-candidate 向けドラフトPRを作成。mainへのマージなし、GitHub Actionsなし、デプロイなし。MCP登録は司令塔レビュー後です。
~~~

## F. 重複チェックPR #24の検証担当（1件・1回）

対象: 既存実装担当・QA担当のどちらか**1セッションだけ**。PR #24の試作に再実装ではなくテスト・設計レビューを実施。

~~~text
https://github.com/ODU33104/TimeTree-MCP/pull/24
https://github.com/ODU33104/TimeTree-MCP/blob/work/duplicate-guard-20261027/docs/coordination/reports/DUPLICATE-GUARD-PAUSED.md

PR #24 の重複登録ガードの検証・引継ぎ担当です。司令塔が既に試作コードを作っていますが、型チェックもテストも未実施です。作り直さず差分と報告を読み、ブランチ/ファイル所有権を確認してから別のQA用ブランチまたは既存担当権限に従って、架空データによる日本語/多言語タイトル正規化、日付・DST、終日イベント、繰り返し、別カレンダー、見逃し/誤検出、秘密情報の漏洩、上限件数について単体テストを実装し、実行結果を証拠付きでGitHubにコミットしてください。ユーザーのTimeTree実アカウントを使わず、編集や削除はしない。『8件PASS』という古い途中報告は信用せず再計測する。新規機能を司令塔の代わりに検証可能にすることが目的。ドラフトPRとcommit SHA/報告ファイルを残し、mainへマージしない、GitHub Actionsを起動しない、有料サービスを使わないでください。
~~~

## G. 依存脆弱性修正担当の再開（条件付き・1件・1回）

対象: **ネットワークが使える環境**の既存セキュリティ担当か、司令塔がclaimの引継ぎを正式に記録した新担当。DNSが使えないまま同じ依頼を無限に繰り返さない。

~~~text
https://github.com/ODU33104/TimeTree-MCP/blob/coordination/parallel-workstreams/docs/coordination/claims/DEP-AUDIT-REMEDIATE.md
https://github.com/ODU33104/TimeTree-MCP/blob/coordination/parallel-workstreams/scripts/local-dependency-remediation.sh

DEP-AUDIT-REMEDIATE の既存claimがblockedです。所有者を勝手に変えず、まず既存担当branch work/dep-audit-remediate-takeover と報告を読み、司令塔による担当変更の記録が必要ならcoordination claimsに記録してください。ネットワーク接続できるローカルcheckoutのtask branchで body-parser/zod等を修正し、生成lockfileを検証、Node22/24相当の型チェック・build・tests・npm auditの実際の結果を記録してください。Zod 3→4の互換性を無検証のまま --force で強制更新しない。DNS不可なら『blocked』のまま具体的障害を報告する。GitHub Actionsを起動しない、integration/release-candidateへpushしない、mainへマージしない。最後にbranch、commit SHA、報告書、PASS/FAIL/NOT RUNとリリース残障害を返してください。
~~~

## H. 世界向けUX研究セッション — 再送前に提出有無を確認

成果物: [GLOBAL-MOBILE-UX調査指示書](instructions/global-mobile-ux-dispatch.md) の指定レポート reports/GLOBAL-MOBILE-UX.md は2026-10-27時点でcoordination branchに見つからない。ただし過去に別チャットへ送信された可能性はある。**既存セッション/別ブランチ/レポートを探し、必要なときのみ再送**。

~~~text
https://github.com/ODU33104/TimeTree-MCP/blob/coordination/parallel-workstreams/docs/coordination/instructions/global-mobile-ux-dispatch.md

GLOBAL-MOBILE-UX の既存調査担当です。もし前回すでに納品済みなら、GitHubの作業ブランチ名、commit SHA、報告ファイルURLだけを提示してください。未提出の場合のみ、指示書に従って、日本語/英語の家族調整・日程案内・お知らせ→予定下書きの会話例、時差・多言語・アクセシビリティ・権限の試作UX設計を架空データでまとめ、指定の docs/coordination/reports/GLOBAL-MOBILE-UX.md にコミットしてください。コード実装、README変更、GitHub Actions、mainへのマージ、外部サービス課金は不要です。スマホChatGPTの実接続成功は主張しないでください。
~~~

## I. 汎用開発worker指示 — 空きtaskを確認済みのときだけ使用

**共通ディスパッチ:** https://github.com/ODU33104/TimeTree-MCP/blob/coordination/parallel-workstreams/docs/coordination/instructions/worker-dispatch.md

現在は多くのタスクがclaimed/ready-for-reviewであるため、この共通指示を無差別に大量送信するのは非推奨。具体的な未claim taskがあるか確認し、基本はD/Eのように **固定 task_id と専用owned paths** を含む1ボタンを優先する。

~~~text
https://github.com/ODU33104/TimeTree-MCP/blob/coordination/parallel-workstreams/docs/coordination/instructions/worker-dispatch.md

あなたはTimeTree-MCPの開発workerです。これは資料の要約依頼ではなく、GitHubでコード編集・テスト・コミット・報告を行う実装依頼です。指示書のQUEUEとclaimsを実際に読み、先着claimで排他的にタスクを取得してください。既存claimを上書きせず、作業済みPRの実装を重複しないでください。ブランチと所有範囲を守り、具体的な変更とローカルテスト記録をGitHubへ報告してください。GitHub Actionsなし、mainへのマージなし、README/icon変更なし、認証情報入力なし、有料サービス利用なし。空きタスクがなければ作業報告のみ返してください。
~~~

## J. 新しい司令塔が今後メッセージを生成するときの契約

以下のフィールドを1つのボタンに入れてください（ボタンの外に続きの必須文を置かない）。

~~~text
<指示書URL / PR URL>

あなたは <task_id,担当役割> の担当です。<何を実際に作る/レビューするか>。
既存 <claim・branch・PR> を確認し、重複作業は禁止。claimはcreate-fileで原子的に取得し、既存所有者のものを上書きしない。
作業ブランチ <起点と名称ルール>。変更対象 <owned paths>。
成果物 <コード・テスト・報告パス>。branch/commit SHA/PR URL/実行コマンド/結果 PASS・FAIL・NOT RUN/残課題をGitHubに記録。
GitHub Actionsを起動せず、integration/release-candidateやmainへ無検証push・マージしない。秘密情報・実カレンダー・有料サービス・公開デプロイなし。
指示文を要約せず、作業を実行してGitHubに結果をコミット。
~~~

**禁止:** 同じコピー文に複数担当分の依頼を詰める、明確なownerなしでREADMEを書き換えさせる、別のworkerに「司令塔に聞いて」と繰り返し返答させる、PR作成だけで済んだと誤記する。

**ユーザー向けの表示例:** 『今回の依頼は 2件・各1回。1) チェックリスト担当チャットへ「コピー」 2) 参加者担当チャットへ「コピー」。どちらもURLと全文入りなので追加送信不要。』
