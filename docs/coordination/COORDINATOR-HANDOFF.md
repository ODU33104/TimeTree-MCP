# 司令塔引き継ぎ書 / Coordinator handoff — 2026-10-27 JST

> **ここが新しい司令塔セッションの最初の読込先です。** 本書は2026-10-27のGitHub実査に基づくスナップショットであり、最新状態は必ずGitHubで再取得してください。担当者用の1回コピーメッセージは [ONE-PASTE-DISPATCH.md](ONE-PASTE-DISPATCH.md)。ユーザーは当面スマホ中心。**これは司令塔の仕事であり、司令塔自身による大量の機能実装を求めていません。**

## 0. 新司令塔が最初の一通で理解すべき決定事項

1. 対象: 公開GitHubリポジトリ https://github.com/ODU33104/TimeTree-MCP 。非公式・独立フォークで、原作者は https://github.com/ehs208/TimeTree-MCP (MIT)。**TimeTree公式の承認・提携を得ていない**。公式機能の「対応範囲を目指す」と公式承認・正式対応は全く別。
2. **役割分担:** 司令塔は要件・優先順位・担当割当・claims管理・競合解消・PRレビュー・安全性とQA確認・統合判断を行う。原則として機能の個別実装を自分で続けない。最後のユーザーから「あなたは司令塔ですよ、キリのいいとこで止めなさい」と明示された。
3. **製品方針:** TimeTree本体の多彩な機能を広くカバーしつつ、目を引く独自機能も増やす。GitHubで開発品質・技術的信頼を築き、家族・カップル・友人の日常の予定調整を起点に世界市場へ。上級者向け機能は残す。スマホChatGPTの使いやすさは製品目標だが、直接接続の実証と一般公開は長期ゲート。機能強化と13言語READMEの更新を**並列**で進める。
4. **最重要禁止事項:** 開発途中のGitHub Actionsを手動・間接的に起動しない（無料枠保護）。特に integration/release-candidate へのpushは release-qa.yml を起動するため避ける。mainにマージ/直接コミットしない。代わりにタスクブランチとドラフトPR、可能な環境でローカルテスト。main向けPRもワークフロー起動条件に注意。確認なく有料サービス契約・デプロイしない。認証情報/個人カレンダーをAIチャットやGitHubに渡さない。
5. **ユーザーとのやり取り:** 日本語、簡潔、事実と未検証を分ける。ユーザーは別々のChatGPTチャットに指示を貼るワークフローを利用中。**新しい割当を出す際は各担当ごとに『指示書のGitHub URL＋実行指示文』を1個のコピーボタンにまとめる**。クリック1回→宛先チャットへ貼付1回で完了する仕組みを維持。新しい担当を作る前に既存claims/ブランチ/PRをチェックし、不要な再送をしない。
6. **公開/権利の境界:** TimeTree Connect App APIは2023-12-22終了。未公開Web内部APIを公認APIと扱わない。公式へ問い合わせることは無料で可能だが、ユーザーは無名個人からの提携を急がず、先にオフライン/架空データで製品を磨きたい。非公開開発は無制限のAPI利用許可を意味しない。一般向けサーバー・ユーザー集約には提供元の許可と適切な認可設計が必要。

## 1. ブランチ・権限・品質の基線（2026-10-27確認）

| 基線 | 内容 |
| --- | --- |
| main | 従来のMCPツール **29個**。本プロジェクトの新作試作や13言語README更新はmain未統合。 |
| coordination/parallel-workstreams | 司令塔の指示書、QUEUE、claims、各研究報告、製品戦略、TimeTree機能対応表。**本引き継ぎ書もここに配置**。 |
| integration/release-candidate | PR #6–#19 の審査候補の一部をステージ済み。既存29に読み取り専用3ツール（複数カレンダー検索/空き時間/重複検出）を登録し **合計32個**。main未マージ。 |
| work/docs-brand | README/アイコン専任。英日韓＋独/繁中/仏/西/葡(ブラジル)/簡中/伊/泰/インドネシア/マレーの **13言語**。新10言語は基本的に要約Quickstartであり、英日韓の全文と同等の詳細さではない。 |
| work/readme-feature-sync-20261027 | 上記13言語に 29/32ツールの段階差、PR #21/#22等試作、監査NG・モバイル未検証を追加。**PR #23 のベースは work/docs-brand**。翻訳内容は担当者レビュー待ち。 |
| release evidence | 過去の [CI 40297874210](https://github.com/ODU33104/TimeTree-MCP/actions/runs/40297874210) にて Node22/24のテスト各172件成功。ただし [Release QA 40297874196](https://github.com/ODU33104/TimeTree-MCP/actions/runs/40297874196) では npm audit が失敗し**総合リリース判定はFAIL**。これらは過去に実際に起きたActions実行であり、今後起動してよいことを意味しない。 |
| security | body-parser/zod のhigh脆弱性ほか fast-uri/ip-address/esbuild の指摘。依存修正と再検証未完了。ネットワーク/DNS制限下では npm ci/監査ができず担当claimがblocked。 |
| remote/auth | loopback認証付きMCP HTTP試作とlocal vaultが別作業ブランチに存在、**公開OAuth/マルチユーザー分離/HTTPS公開は未完成**。iPhone/Android接続成功や端末のみでURL登録できることは未検証。 |

**固定参照:** [統合・QA報告](https://github.com/ODU33104/TimeTree-MCP/blob/integration/release-candidate/docs/coordination/reports/INTEGRATION-PR6-19.md) / [開発用確認スクリプト](https://github.com/ODU33104/TimeTree-MCP/blob/coordination/parallel-workstreams/scripts/local-dependency-remediation.sh)（ネットワーク可能な環境のみ、npm audit fix --forceはしない）。

## 2. 現在オープンのPR — 再実装・二重マージ禁止

2026-10-27のGitHub検索では **#1〜#24にある全24 PRがopen**。open/draftは**実装完了やテスト成功、main統合を意味しない**。開始時に最新状態を照会すること。

| PR | 担当内容 / 参照先 | 司令塔判断 |
| --- | --- | --- |
| [#1](https://github.com/ODU33104/TimeTree-MCP/pull/1) | 初期fork README | DOCS-BRANDと重複調整。 |
| [#2](https://github.com/ODU33104/TimeTree-MCP/pull/2) | 初期監査 | 履歴参照。 |
| [#3](https://github.com/ODU33104/TimeTree-MCP/pull/3) | fork更新通知の向き先 | 参照先を再検証。 |
| [#4](https://github.com/ODU33104/TimeTree-MCP/pull/4) | HTTP認証情報の漏洩防止 | AUTHとの実装重複に注意。 |
| [#5](https://github.com/ODU33104/TimeTree-MCP/pull/5) | remote security基盤 | 公開remoteサーバーではない。 |
| [#6](https://github.com/ODU33104/TimeTree-MCP/pull/6) | 統合候補（base main） | 監査未解決、**mainへマージ禁止**。 |
| [#7〜#13](https://github.com/ODU33104/TimeTree-MCP/pulls?q=is%3Apr+is%3Aopen) | Release QA / Search / Availability / Batch Preview / Templates / Conflicts / Onboarding | 一部コードは既に integration/release-candidate へステージ済み。PRを別途マージすると重複するおそれ。各差分と統合済み内容を照合。 |
| [#14〜#19](https://github.com/ODU33104/TimeTree-MCP/pulls?q=is%3Apr+is%3Aopen) | Smart Brief / Travel Buffer / Undo / Share Slots / Natural Parser / Official Compat | 単体モジュール段階が中心。MCPツールとしての公開登録とは別。 |
| [#20](https://github.com/ODU33104/TimeTree-MCP/pull/20) | SECURITY.md/リリース判定/信頼性ロードマップ/PRテンプレート。work/github-trust-baseline-20261026 → coordination | 文書review・既存docsとの整合後にcoordination側で扱う。 |
| [#21](https://github.com/ODU33104/TimeTree-MCP/pull/21) | 予定移動のWhat-if衝突比較。work/what-if-calendar-move-20261026 → integration | 読み取り専用**独立試作**。MCP未登録。隔離テスト7件成功との記述はあるが、本会話内でのコマンド実行証跡が独立に確認できないため**再現テスト必須**。 |
| [#22](https://github.com/ODU33104/TimeTree-MCP/pull/22) | RFC5545 .ics生成。work/ics-export-prototype-20261026 → integration | **独立試作**。TimeTreeからの正式エクスポート機能ではない。隔離テスト7件成功との記述はあるが再現ログ確認が必要。個人情報流出/日時/UTF-8等をレビュー。 |
| [#23](https://github.com/ODU33104/TimeTree-MCP/pull/23) | 13言語README機能状況同期。work/readme-feature-sync-20261027 → work/docs-brand | 本文更新は13ファイルでコミット済み。全ファイルをfetchし共通説明の存在は確認済み。ただし翻訳ネイティブレビュー、リンク監査、製品対応実機は未実施。**DOCS-BRAND専任と調整**。 |
| [#24](https://github.com/ODU33104/TimeTree-MCP/pull/24) | 重複登録ガード。work/duplicate-guard-20261027 → integration | 司令塔が中断・引継ぎしたread-only試作。**テストも型チェックも未実施**。テスト8件成功との途中発言を根拠としない。検証担当へ渡す。 |

**新規PR #20～#24はいずれもドラフト、main未マージ。** PR #21/#22/#24を「今すぐユーザーが呼べるMCP」と説明してはいけない。

## 3. Git claimsで見た担当状態

この欄はcoordination branchの [claimsディレクトリ](https://github.com/ODU33104/TimeTree-MCP/tree/coordination/parallel-workstreams/docs/coordination/claims) を個別に実査したもの。**次の司令塔は最初に必ずclaimをfetchし直す。** 先着claimを勝手に再作成/上書きしない。

| status | Item IDs | 処理方針 |
| --- | --- | --- |
| **blocked** | DEP-AUDIT-REMEDIATE → work/dep-audit-remediate-takeover | registry.npmjs.org/GitHub DNS不可。依存パッケージやlockfileは未更新。ネットワーク接続可能な実行環境で修正・ローカル再検証が必要。既存claimの所有権を正式に引き継ぐまでは別セッションに同作業を投げない。 |
| **blocked** | AUTH-ONBOARD → task/AUTH-ONBOARD | 認証情報vaultは試作、server consumer/OS keychain要否で調整。REMOTE-ONBOARD-INTEGRATEとの重複レビューが必要。 |
| **ready-for-review** | REMOTE-HTTP, QA-SECURITY, TOOLS-RECURRENCE, TOOL-CONTRACTS, RELEASE-QA | 実装報告と実行テストの有無を検証し、実際の差分をレビュー。 |
| **ready-for-review** | UX-SEARCH, UX-AVAILABILITY, UX-BATCH-PREVIEW, UX-TEMPLATES, UX-CONFLICTS, UX-ONBOARD, UX-SMART-BRIEF, UX-TRAVEL-BUFFER, UX-UNDO-PLAN, UX-SHARE-SLOTS, UX-NATURAL-PARSER, UX-OFFICIAL-COMPAT | 研究や独立モジュールの再提出ではなく、差分・既存統合状態の確認が先。 |
| **ready-for-review** | REMOTE-ONBOARD-INTEGRATE, UX-ADAPTER-EXPAND, MUTATION-CONFIRM-GATE | remote HTTP・onboarding・追加読み取りadapters・書き込み確認ゲートの構造レビューとローカル検証。MUTATION-CONFIRM-GATEは純粋な確認述語であり、サーバー認証/リプレイ防止には未接続。 |
| **not found at check** | TIME-PARITY-CHECKLIST / TIME-PARITY-ATTENDANCE / GLOBAL-MOBILE-UX | 指示書はあるが完了レポート/claimを確認できず。**指示済みか未送信かはGitHubだけでは断言できない**。同じ担当への再送はまず会話/ブランチを確かめる。 |

全20前後の既存タスクがclaims済み。**共通自動ディスパッチを無差別に全員へ再送しないこと**。特定タスクの指示書URLとtask IDを固定した投入が適切。

## 4. 非PR報告・資料 — 抜け落とさない参照順

### 開発・運営
- [coordination/README](README.md): 役割/ファイル所有権、司令塔・DOCS-BRAND・その他workerの規則。ただし歴史的固定担当記述や旧ステータスあり。
- [STATUS](STATUS.md): 古い作業履歴を含むため本書とGitHub最新claimsが優先。
- [QUEUE](QUEUE.md): 分散タスクと開発波。全アイテムが実際に未着手とは限らない。
- [汎用worker-dispatch](instructions/worker-dispatch.md): 未claim項目を原子的に取得する旧来方式。**空き項目のある時のみ**。個別役割指定には [ONE-PASTE-DISPATCH](ONE-PASTE-DISPATCH.md) を使う。
- [TimeTree機能対応表](TIMETREE-FEATURE-COVERAGE-20261026.md): 公式アプリ機能と現在のMCP実装との差分/実現可能性を区別。
- [製品戦略](PRODUCT-STRATEGY-MOBILE-FIRST.md): 家族・カップル・友人/一般スマホユーザー優先、技術者の拡張性も重視、世界展開。
- [独立人格研究の統合](reports/PERSONA-SYNTHESIS.md): 合計22件の**仮説ペルソナ**（実ユーザーインタビューではない）。[家族](reports/PERSONA-FAMILY.md)、[チーム](reports/PERSONA-TEAM.md)、[アクセシビリティ/信頼](reports/PERSONA-ACCESS-TRUST.md)。
- [スマホChatGPT配布可否](reports/MOBILE-DISTRIBUTION-FEASIBILITY.md): WebでのカスタムMCP登録、公開プラグインのスマホ利用経路、プラン/審査/OAuth/TimeTree許可。**調査は静的、実機未検証**。
- [世界向けスマホUX指示](instructions/global-mobile-ux-dispatch.md): 報告先 reports/GLOBAL-MOBILE-UX.md が2026-10-27時点で見つからない。成果の所在を先に確認。
- [TimeTreeネイティブ機能2件の指示](instructions/native-feature-parity-dispatch.md): CHECKLISTとATTENDANCEのread-only要約機能を別taskに。**未実装/claim未確認**。
- [docs-brand報告](https://github.com/ODU33104/TimeTree-MCP/blob/work/docs-brand/docs/coordination/reports/docs-brand.md): 13言語・アイコンの作成履歴、英語の残ったQuickstart/要native review。
- [国際化調査](https://github.com/ODU33104/TimeTree-MCP/blob/work/docs-brand/docs/INTERNATIONALIZATION.md): TimeTree公表の海外利用国/13言語、国際化優先。TimeTreeの国別ユーザー数を本MCPの利用需要と誤認しない。
- [試作中断報告](https://github.com/ODU33104/TimeTree-MCP/blob/work/duplicate-guard-20261027/docs/coordination/reports/DUPLICATE-GUARD-PAUSED.md): PR #24。

### 特定の未解決安全性
- [依存修正の引継ぎ報告](https://github.com/ODU33104/TimeTree-MCP/blob/work/dep-audit-remediate-takeover/docs/coordination/reports/DEP-AUDIT-REMEDIATE.md)
- [Remote/onboard連結報告](https://github.com/ODU33104/TimeTree-MCP/blob/work/remote-onboard-integrate-20261026/docs/coordination/reports/REMOTE-ONBOARD-INTEGRATE.md)
- [UX読み取りadapter拡張](https://github.com/ODU33104/TimeTree-MCP/blob/work/UX-ADAPTER-EXPAND/docs/coordination/reports/UX-ADAPTER-EXPAND.md)
- [mutation gate](https://github.com/ODU33104/TimeTree-MCP/blob/task/MUTATION-CONFIRM-GATE-20261026/docs/coordination/reports/MUTATION-CONFIRM-GATE.md)
- [GitHub信頼性 docs PR #20](https://github.com/ODU33104/TimeTree-MCP/pull/20): SECURITY.md/RELEASE-READINESS.mdは**まだこのPRのブランチのみ**でありmainで利用可能と書かない。

## 5. 何を先に進めるか — 『機能追加』と『品質』を止めずに並列化

| レーン | 優先順 | 具体的にすること | 司令塔がしないこと |
| --- | --- | --- | --- |
| P0 セキュリティ/統合 | 1 | 監査NGの解除担当/ネット接続手段の確保。Remote/Authの危険な境界、既存claimとレビュー待ち差分を整理。パスワード/マルチテナント/書き込み承認の安全性 | 監査例外でバッジだけ緑にする、Actions大量起動、一般公開 |
| P1 既存TimeTree機能の対応範囲 | 2 | チェックリスト進捗と参加者/仮想メンバーのread-only要約を別workerへ。既存TimeTree機能をfeature matrixに合わせて足す | 公式が提供していないAPIを推測実装、認可なしに他人の予定を読む |
| P1 独自性の訴求 | 3 | PR #21 what-if・#22 .ics・#24 duplicate guardの実体テスト/型確認、既存batch/undo/briefなどを重複なく優先。試作→登録可能の条件を固める | 新しい類似試作を司令塔が次々自作、試作を利用可能と宣伝 |
| P1 13言語README/ブランド | 並列 | 専任work/docs-brandへPR #23を引継ぎ、ネイティブ確認・リンク・ツール対応差・フォーク帰属・リリース案内を検証 | 一般workerにREADME/Icon編集させる、実装前に「対応済み」と書く |
| P1 世界向けの簡単UX | 並列 | 予定表示/家族空き時間/お知らせ→プレビュー、アクセシビリティ、多言語、DST、日付の曖昧性解消。未提出GLOBAL-MOBILE-UX報告を確認 | カスタムMCPがiOS/Androidで既に直接設定できると宣言 |
| P2 長期公開 | 最後 | TimeTree側の適切な連携権利、ユーザー別OAuth、HTTPS、審査、iOS/Android実機、サポート/プライバシー文書 | 先に不特定多数向けの共有アカウント/認証基盤をデプロイ |

**新機能の優先候補:** TimeTreeネイティブのチェックリスト・参加者・仮想メンバーを活かしたわかりやすさ、移動前シミュレーション、.ics互換出力、学校通知からの下書きと重複確認、時間帯やプライバシーを守る空き時間共有。遠隔APIの権利が未確認の機能（RSVP, alb​um/upload, premium attachment, public calendars, invitations, device sticker/UI等）はまず調査のみ。

## 6. 次の司令塔が最初に実行する具体的作業

1. GitHub接続状態を確認。**本書、ONE-PASTE-DISPATCH、coordination/QUEUE、claims、オープンPR、統合候補のQA報告を再fetch**。本書はスナップショットで変更され得る。
2. 進行中の担当セッションをユーザーに再説明/名前づけさせず、Gitのclaim/PRから確認。作業依頼は個別に実際必要な件数だけ発行。
3. すぐに大規模実装へ進まず、P0監査・Remote/AuthとPR #20～#24をトリアージ。既存integration branchへの無検証pushはActionsを引き起こす。
4. DOCS-BRAND担当にPR #23のレビューと13言語同期を依頼（既存担当へのフォローアップ。別workerに奪わせない）。
5. まだclaimがないTIME-PARITY-CHECKLISTとTIME-PARITY-ATTENDANCEは、各1セッションに割り当てる時だけ固定ID付きメッセージを使う。無差別汎用worker-dispatchは使用しない。
6. UX研究報告GLOBAL-MOBILE-UXが未提出なら、既存の担当チャットの進捗/別branchを確認してからのみ再依頼。
7. 司令塔の仕事は「誰が/どのブランチで/何を終え/何をテストし/統合可能か」をGitHubへ更新し、ユーザーに **完了・未完了・次のコピー操作の件数** を短く報告すること。完了していない仕事を「裏で進行中」とは言わない。非同期実行の約束は禁止。
8. 切りがよい地点で停止。新司令塔のトークンを個別実装の連続生成に使い切らず、担当者へ実装委任する。

## 7. 計測・証跡ルール（必須）

- 完了/公開可能の判断にはブランチ名、最新commit SHA、該当PR、報告ファイル、使ったNode/npmバージョン、実際に実行したコマンド、PASS/FAIL/NOT RUN、監査・未検証の理由を残す。過去の別SHAのテスト結果を継承しても、現在のSHAの検証済みとは書かない。
- GitHub Actionsを「起動しない」は新しい実行を避ける方針であり、過去のActionsを存在しなかったことにしない。PR作成先が main なら CI が走る可能性がある。push先に対するwatch workflowを確認。
- ZIP, .mcpb, npmパッケージ, Googleカレンダー同期, スマホChatGPT接続, 写真アップロード, 出欠回答, カレンダー全体バックアップ, 端末のみ導入などを実際の対応証拠なしに『提供済み』と書かない。
- テスト済みの表記は **確認できる証拠がある範囲だけ**。PR #21/#22の『各7件PASS』、過去の途中メッセージの『duplicate guard 8件PASS』は、ユーザーに追加のテスト結果として提示する前に再実行・ログ照合が必要。
- Times/Timezone: 日本語、UTC/JST、IANAゾーン、DST、終日exclusive/inclusive、曖昧な日付をテスト。イベントタイトル/コメント/画像は敵対的な入力として扱う。
- 企業/公式に動いてもらえる価値を示すには、誇張のない透明性、セキュリティ、reproducible tests、製品独自性、貢献しやすいGitHub、分かりやすい多言語READMEを同時に整える。

## 8. 次の司令塔へのワンクリック引継ぎ

ユーザーは次の新ChatGPT会話を司令塔にする。**同会話には以下の「URL＋指示」を1回貼ればよい**。文面そのもの、担当用短文、各セッションのルーティングは [ONE-PASTE-DISPATCH.md](ONE-PASTE-DISPATCH.md) を参照。

URL: https://github.com/ODU33104/TimeTree-MCP/blob/coordination/parallel-workstreams/docs/coordination/COORDINATOR-HANDOFF.md

本プロジェクトの新しい司令塔です。この引継ぎ書とONE-PASTE-DISPATCH.md、QUEUE・claims・オープンPR・QA報告を実際にGitHubから読んでください。機能実装は担当チャットへ割当て、私は司令塔の調整・レビュー・統合判断・多言語README同期を担当してください。開発途中のGitHub Actionsは禁止、mainにはマージしない、試作をリリース済みと誤記しない。まず現状と最優先3件、各担当に1回貼るだけでよいコピーボタン付き指示文を提示してください。ユーザーがすでに済ませた情報を聞き直さないでください。
