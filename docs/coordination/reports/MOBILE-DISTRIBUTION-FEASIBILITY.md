# MOBILE-DISTRIBUTION-FEASIBILITY — ChatGPTスマホ版向けTimeTree MCP配布可否

調査日：2026-10-26（JST）。公開情報・リポジトリの静的レビューのみ。実機接続・デプロイ・契約・コード実装・GitHub Actions実行は行っていない。
対象：iPhone (iOS)、Android、Web、個人利用、自作MCP、ワークスペース配布、一般公開プラグイン。
判定：**スマホに既存の公開プラグインをインストールして利用する経路は公式に存在する。一方、スマホアプリから任意の非公開MCP URLを追加する経路は公式に Web-only と明記される。TimeTree公式API終了と現在の単一ユーザー認証構造のため、TimeTree MCPの一般公開は NO-GO。**

## 0. 用語・調査上の区別

- **MCPサーバー**：ツールを提供する外部サービス。ChatGPTから使うには、対応クライアント、接続可能なHTTPS/トンネル、認証と権限確認が必要。
- **カスタムMCP接続**：特定の開発者/ワークスペースが自作エンドポイントを登録。OpenAIの公式サポートFAQは「モバイルでカスタムMCPサーバーに接続できるか：No – web only」とする [O1]。
- **公開プラグイン**：OpenAIの審査・承認後、開発者が公開し、ChatGPT/Codex共通のPlugin Directoryから探してインストールするもの。プラグインはMCP接続、スキル等を含められる [O2][O3]。
- **アプリ (connected app)**：外部アカウントや操作との連携コンポーネント。**プラグイン**はそのアプリやスキル等を束ねた配布単位。単なるMCPリポジトリやClaude用.mcpb配布はChatGPTスマホでのインストール手段とはならない [O2][O4]。
- **Apps SDK / 開発者モード**：開発・検証・接続登録の仕組み。公開ディレクトリへ承認済みで載ることとは別。UIとツールの提供も別問題。
- **実用可否は2段階**：「ディレクトリ/インストールUIがある」と「TimeTreeの個人データにアクセスできる」は異なる。後者はアプリ権限、提供者認可、接続先、プラン、端末で確認する必要がある。

## 1. iOS / Android / Web対応マトリクス（2026-10-26）

| 利用形態 | iOS公式アプリ | Android公式アプリ | ChatGPT Web | 必要プラン・権限・注意 |
| --- | --- | --- | --- | --- |
| 公開済みPlugin Directoryの閲覧/インストール | **公式対応の経路あり** [O2][O5] | **公式対応の経路あり** [O2][O5] | **公式対応** [O2] | ディレクトリは各プランで利用可能だが、個別プラグインのインストール・実行・拡張機能はプラン/地域/アカウント/ワークスペース/端末依存。Free/Goではプラグイン拡張機能の制限あり [O2][O6] |
| 審査済みの公開MCP付きプラグインの利用 | **対応対象として明記**、当プロジェクト実機未検証 [O3] | **対応対象として明記**、実機未検証 [O3] | 対応する構成では利用可能 [O2][O7] | **各プランでの特定MCPツールの read/write 実行可否は一律保証なし**。アプリの要件に応じ確認 |
| 任意の非公開カスタムMCP URLをユーザーが登録 | **非対応（公式FAQ）** [O1] | **非対応（公式FAQ）** [O1] | **対応プラン/権限で登録可能** [O1][O7] | Business/Enterprise/Eduの管理者・権限付与ユーザーが中心。Proは個人向けread/fetch MCPの案内あり。Plus、Go、Freeの個人用カスタムMCP URL登録は確認できず、可能と宣言しない |
| 非公開ワークスペース向けカスタムMCP | 登録不可。公開後のモバイル実行は、公開プラグイン経路とは区別し**個別の対応状況を検証** | 同左 | 管理者/オーナー等が登録・審査・ワークスペース公開 [O1] | Businessは管理者/オーナー、Enterprise/EduはRBACによる権限付与。組織内公開は一般の公開ディレクトリ公開ではない |
| 書き込み/変更（フルMCP） | 公開プラグイン個別機能としては可能性あり、**当プロジェクト未検証** | 同左 | Business/Enterprise/EduのフルMCPが公式案内、段階的ベータ [O1] | Proの開発者モード接続はread/fetchでありフルMCP対象と見なさない。誤操作防止の確認と提供者側権限が必須 |
| MCPアプリの開発/設定 | モバイルアプリ単独で作成/URL接続までできるとする証拠なし | 同左 | 公式クイックスタートはWebのPluginsでURL登録→個人プラグイン化→Workで検証 [O7] | ブラウザの「PC版サイト表示」は公式サポートとして扱わない |
| ChatGPT Workで接続済みプラグインを使用 | 対象ユーザーに対応 [O8] | 対象ユーザーに対応 [O8] | 対応 [O8] | 既に接続・認可されたプラグインであり、新規MCP URLのモバイル登録を意味しない |

**プラン別の確度**：Free/Goはディレクトリ閲覧が可能だが拡張機能は制限（用途別に個別検証）。Plusは公開プラグインの要件次第で、個人の自作MCP URL直接登録は公式裏付けなし。Proは開発者モードの read/fetch カスタムMCP案内あり。Business/Enterprise/EduはWebでの管理者制御下のフルMCPベータ。費用を伴うプラン加入だけでスマホ側のカスタムURL追加が解禁されるわけではない。[O1][O2][O6]

地域：カスタムMCP接続の公式FAQは一般的な地理制限「なし」とする [O1]。しかし公開プラグインは公開時の指定国、ユーザー地域・ワークスペース・アカウントごとの制限があり得る [O2][O3]。日本アカウント/iPhone/Androidでの本プロジェクトの検証は未実施。特定OSバージョン・端末保証なし。

## 2. 配布方法の比較と推奨順位

| 経路 | スマホだけでの利用 | 初期セットアップ | 費用感（見積条件は§7） | 主な障壁 | 判定 |
| --- | --- | --- | --- | --- | --- |
| A. 個人用・非公開の自己ホストMCP | iOS/Android ChatGPTアプリからURLを直接追加できない [O1]。Web上の権限付き設定が前提 | 自前サーバー/HTTPSまたはSecure MCP Tunnel、WebのPluginsから接続、対応プラン、認証 | 単独試験なら0〜低額になり得るが継続運用が必要 | Web-only登録・TimeTree認証・公開用OAuth・端末依存 | **個人の技術検証のみ条件付きGO** |
| B. 公開Plugin DirectoryへMCP付きプラグイン申請 | 公開後はiOS/Androidのプラグイン画面からの配布・アプリ権限認可が公式に想定 [O2][O3] | 運営者がドメイン、HTTPS MCP、OAuth、個人/法人確認、審査情報、動作検証を準備。ユーザーはインストール/接続だけ | 認証・DB・監視・サポートの運営費が必要。審査無料とは断定しない | **TimeTreeが公式APIを終了**、単一ユーザー実装、申請審査とセキュリティ | **現状NO-GO、将来の本命** |
| C. ChatGPT Workで既存のサポート済みカレンダーアプリを使用 | スマホから会話型の予定参照/操作が可能な組合せあり [O8] | 公式プラグインを選び、外部アカウントを認可 | 利用プラン次第、独自のTimeTree統合なし | TimeTree独自データに直接アクセスできるわけではない | **使い勝手検証・代替サービス用にGO** |
| D. 自前のスマホ対応Webアプリ/PWA＋対話AI | ChatGPT公式アプリ内部ではないが、スマホ単体で自然言語UIは構築可能 | 公開Web URLにアクセス、適法な認証・データ源が必要 | ホスティング＋別途OpenAI APIを利用するなら従量料金 | 公式ChatGPT体験と異なる・TimeTree連携は別途許可が必要 | **代替経路として条件付きGO** |
| E. TimeTreeアプリの正式な外部カレンダー機能を利用 | iOS/Androidの標準カレンダー経由なら実際の公式サポートあり [T3] | OSカレンダーとGoogle等を連携、TimeTreeで表示/必要なら手動インポート | 既存アカウントで低費用になり得る | 自分だけの表示は自動更新、共有カレンダーへのインポートは**手動更新**で重複リスク。**TimeTreeから外部へは自動反映不可** [T3][T4] | **TimeTreeの非公式APIを使わない最小UX代替** |

公開済みプラグインのディレクトリ直リンクは配布動線になり得る。単なるGitHub URL、ローカルnpm、Claude Desktop拡張(.mcpb)、MCPエンドポイント文字列の共有だけではスマホChatGPT利用者の1タップ接続にならない [O2][O3][O9]。

## 3. 公開審査と配布条件（OpenAI公式）

1. **身元確認と登録権限**：OpenAI Platform組織の個人/法人確認、公開用プラグインの作成/提出権限。一般公開とワークスペース内共有は別制度 [O3][O10]。
2. **公開サーバー**：安定した公衆到達可能HTTPSホスト、通常 /mcp の Streamable HTTP、ドメイン所有検証。既存のローカル/ループバックMCPをそのまま提出できない [O3][O7][O10]。
3. **パッケージと審査**：plugin.json等をZIP化し、MCP接続設定・ツールスキャン・名称・機能説明・運営主体・サポートURL・プライバシーポリシーURL・利用規約URL・テストシナリオ、デモ接続を揃える。現行提出説明は**肯定5件と否定3件**のレビューケースを指定 [O10]。
4. **認証**：個人カレンダーは匿名MCPにしない。OAuth 2.1認可コード＋PKCE S256、/.well-known OAuthメタデータ、CIMDまたはDCR/固定クライアント方式、適切なscopes、audience/issuer/期限の検証、401のWWW-Authenticateを使う [O11]。
5. **ユーザーアカウント分離**：ChatGPTの接続利用者→当サービス認証主体→許可済みTimeTreeアカウントを確実に紐づけ、ユーザー間混線を防止。単一共有パスワード/共通bearerは不可。連携先TimeTreeから権限委任が受けられるかは**未確認/現状の公開API停止と矛盾** [O11][T1]。
6. **レビュー環境**：審査で利用できる安全なデモアカウントとサンプルデータ。認証に毎回SMS/メール/MFA介入が必要な状態は公開審査で問題となり得る。実ユーザーのTimeTreeアカウントを審査員に渡さない [O3][O12]。
7. **安全/表記**：公式TimeTreeではないこと、上流著作権/商標への配慮、データ利用目的、問い合わせ/削除・切断フロー、ツールの readOnly/destructive/openWorld 注釈を正確に表現。実動作に先行した「公式対応」「スマホ連携できる」などの広告表現は避ける [O12]。
8. **公開と更新**：審査が承認されても公開操作は別。公開後にディレクトリで検索・直リンク配布。ツールメタデータは継続審査されるため互換性管理が必要 [O3][O10]。

## 4. 既存リポジトリの静的監査（特に remote/onboard）

調査対象：
- integration/release-candidate/src/remote-server.ts：**存在しない（2026-10-26のGitHub取得で404）**。
- integration/release-candidate/src/remote/security.ts、src/credentials/local-vault.ts、src/onboarding/local-cli.ts：存在。
- work/remote-onboard-integrate-20261026/src/remote-server.ts：存在。該当ブランチの報告 docs/coordination/reports/REMOTE-ONBOARD-INTEGRATE.md にも「未検証、インターネット公開禁止」と記載。
- work/remote-onboard-integrate-20261026/package.json：buildはtsupの既存src/index.tsのみ。remote-server.tsをサーバー成果物としてビルドする設定は**確認できない**。

| 観点 | ソースで確認した事実 | 製品化への影響 |
| --- | --- | --- |
| トランスポート | StreamableHTTPServerTransport を使った /mcp、POST処理、MCP Serverをリクエストごとに生成、sessionIdGenerator: undefined | MCPの基本設計はあるがHTTP GET/SSE、Content negotiation、複数リクエスト・接続ライフサイクルのクライアント互換性未検証。HTTPとしての稼働も未検証 |
| バインド/TLS | 127.0.0.1/::1以外を拒否。httpモジュールのHTTPリスナーでTLS終端無し | インターネット公開用でない。正式なHTTPSリバースプロキシまたは許可されたSecure MCP Tunnelが必要 [O7] |
| 認証 | 環境変数の固定bearer（最低32 UTF-8 bytes）とOriginチェック、リクエストサイズ上限 | 単一開発者の境界。**OAuth 2.1のメタデータ/PKCE/スコープ/ユーザー同定は未実装**。Origin欠落時はbearerのみで判断される |
| TimeTree本人確認 | local-vaultの1件のtoken文字列にemail/password JSONを格納する設計。起動時に一度読んで TimeTreeAuthManager を1つ生成 | **全MCP接続が同じTimeTreeユーザーになる設計**。一般公開時は重大な個人データ混線リスク。tokenは保護ファイルでも保存形式は平文、デバイス紛失/クラウドバックアップ等の管理も要検討 |
| ローカル初期設定 | onboarding/local-cli.ts はTTY専用で非表示入力。ChatGPTスマホ内部やブラウザにセットアップUIなし | 運営者がPC/サーバー端末を用意する前提。利用者の「スマホのみ、端末CLIなし」の初期設定としては非対応 |
| 読み取り/書き込み | リモートは環境変数で書き込み有効化しない限り、shared allowlist のみ許可 | 安全側の初期設定は良い。ただしユーザー別権限、同意、変更前確認、細分化したスコープ・監査が未完成 |
| 開発上の検証 | remoteブランチ報告書でビルド・型チェック・テスト未実施と明記。統合ブランチ自体は別タスクの172テスト成功/監査失敗記録あり | **remote-serverの実動作が172テストに含まれて確認済みとは言えない**。現時点のスマホ接続成功主張は禁止 |

**脆弱性/独立ゲート**：統合ブランチの過去QAは高重大度のbody-parserとzod等でnpm audit失敗。今調査ではActions/実装は行っておらず、公開判定に必要な依存更新・安全性検証は未済。

## 5. スマホのみの初回体験（公開プラグインが審査通過した場合の想定）

前提：**運営者**が法的/技術的許可、OAuth、マルチテナント、公開HTTPS、審査を事前に完了。スマホ**利用者**にはCLI、GitHub clone、MCP URL手入力、開発者モードを要求しない。

1. iPhone/Androidの公式ChatGPTアプリを最新版にし、対象のアカウント/プランと居住地域を確認。
2. Pluginsディレクトリで公開名を検索、または公式の掲載URLを開く。もし「Desktop only」「Disabled by admin」「プラン対象外」なら案内を中止し、理由を説明（別経路に誘導）[O2]。
3. 権限・個人情報保護方針・非公式であること・読み取り専用範囲を見て「インストール」。
4. 「接続」が表示されたら当サービスのOAuth認可画面に遷移。ログイン・許可対象カレンダー/スコープを確認。**TimeTreeのパスワード/クッキーはChatGPT会話に入力しない**。
5. ChatGPT会話でプラグインを選択または@指定し「今日の予定を確認」と入力。取得対象アカウント/カレンダーが正しいことを画面で確認。
6. 最初は一覧1件と時間帯だけ読み取り。誤アカウント/過剰な情報返却/エラーがあれば公開停止/切断可能にする。編集/削除は別の承認・テストを経た後にのみ提供。
7. Settings > Pluginsから接続解除/再認証、許可の取り消しができることを確認。削除の際にはサーバー保管資格情報も適切に廃棄する [O4]。

**未確定・検証ポイント**：そもそもTimeTree側に正規のユーザー権限委任手段が見つかっていないので上記Step 4は今は**実装不能に近い仮説的UX**。スマホの接続・再認証・読み/書き・voiceの動作と各プラン差は実機確認が必要。スマホブラウザのPC表示を登録の代替として保証しない。

## 6. 最小の安全な概念実証（段階別、今回は実装しない）

**POC 0（費用ゼロ、最優先）**：TimeTreeには接続せず、架空の予定2件で read-only な search/list を出す検証サーバーを設計。公開でなくローカル+検証用HTTPS/安全なトンネルを前提に、Webの対応するChatGPTアカウントでMCPツール一覧/呼び出しを確認。OAuth資格情報の入力が必要なら専用デモIdPを使用。認証/書き込み/日程更新を実行しない。

**POC 1（プラットフォーム検証）**：公開プラグイン申請に必要な証拠が揃った段階で、審査用データだけを使用してiPhoneとAndroid実機で「ディレクトリ→インストール→同意→read-only呼び出し→解除」を確認。**公開されていないプラグインのスマホ使用可否をこの段階以前に成功と見なさない**。

**POC 2（TimeTreeとの正当な連携）**：TimeTree側から公的に認められたAPI/許可/権限委任方式が得られた場合のみ、ユーザー別OAuthアカウント分離とカレンダー単位の読み取りを1件検証。2人の別アカウントで誤配信ゼロ、失効・漏洩テスト、データ最小化を確認。書き込みはさらに承認/ロールバックの検証後に段階導入。

**代替POC（最短のスマホ体験）**：ChatGPTで自然言語の予定案を生成→明示確認→TimeTreeアプリにコピーして手動登録。もう一案は正規Googleカレンダープラグインに予定を登録してTimeTreeのホームにOSカレンダー経由で表示。ただし共有カレンダーは手動インポートであり、双方向リアルタイム同期を約束しない [T3][T4]。

テスト観点：日本語/英語、DST・タイムゾーン、アカウント切替、同意撤回、公開期間、2ユーザー同時利用、ネットワーク切断、書き込みの二重実行、認可切れ/リトライ、非公開の予定名の漏洩、端末UI、画面読み上げ。期待証拠：OS/アプリバージョン、プラン/ワークスペース、接続成功の匿名化画面、監査ログの機密マスク、ネットワークレスポンス、CIローカルテスト記録。個人予定や秘密情報は保存しない。

## 7. 費用と運用見積（通貨USD、承認・契約は今回なし）

- **調査・静的レビュー**：インフラ費 $0。OpenAIアカウントの既存プラン利用料は別。
- **自己管理サーバー**：参考となる公式掲示価格：DigitalOcean Basic VMは月 $4（512MiB）/ $6（1GiB）/ $12（2GiB） [C1]。Node.js+認証機構を安定運用できる最小スペックは**未ベンチマーク**。小規模試験では **$6〜$20/月**を *検討用の仮予算* とする。ドメイン、TLS/監視、バックアップ、トラフィック、障害対応、消費税/為替は別。商用の正式見積ではない。
- **サーバレス候補**：Cloudflare Workersには無料枠（例：100,000リクエスト/日、CPU制限あり）と有料プランがある [C2]。ただし、既存NodeサーバーをそのままWorkersで動かせるとは言えない。SDKストリーミング・TCP/ファイルシステム・資格情報暗号化/保管・IdP・耐久性の検証が必要。OAuth認証機構とDBは別コストの場合あり。
- **公開プラグイン**：審査/身元確認の準備とサポート運営コストが主。**公開審査の手数料は公式情報から確認できず、無料とは断定しない**。OpenAI APIを別Webアプリ/PWAで使う場合はChatGPTのサブスクとは別にAPIの従量課金となる [O13]。
- **ChatGPTユーザー**：Free/Go/Plus/Pro/Business等の料金・権限は最新のプラン・個別プラグインの要件による。ユーザー全員が課金不要、またはPlus契約だけで自作MCP URLが登録できるとはしない。
- **運営スケール**（推定・未契約）：100人以上に拡大すればIdP、暗号化付きユーザー別DB、運用ログ、障害対応、ドメイン/サポート要員等が必要で、単一$4 VMの見積は適用できない。**ランニングコストよりTimeTree側の許可とユーザー間分離が先の制約**。

## 8. ブロッカーの所在とGO/NO-GOゲート

| ブロッカー領域 | 判定 | 理由 | 解除条件・担当 |
| --- | --- | --- | --- |
| ChatGPTプラットフォーム：スマホで任意の自作MCP URL登録 | **NO-GO** | モバイルでのカスタムサーバー接続はWeb-onlyの公式FAQ [O1] | OpenAIが正式にモバイルでURL接続を開放したという文書/実機結果が必要 |
| ChatGPTプラットフォーム：公開プラグインをスマホ配布 | **条件付きGO（経路は確認）** | 公開Plugin Directoryとモバイル利用が文書化 [O2][O3] | 審査・公開・端末/プラン/地域テストで対象ユーザーが使えること |
| TimeTree側：公開API/第三者認可 | **NO-GO（重大）** | Connect App APIは2023-12-22終了 [T1]。新たな公開・第三者向けの公式API権限委任契約は本調査で未確認。Web内部API利用は公認とみなせない | TimeTreeから**公式の書面許可**、使用条件/規制、認証・レート制限の明示。法的評価を確認 |
| プロジェクトコード：認証/テナント分離 | **NO-GO** | 1つの資格情報ファイル＋TimeTreeAuthManager＋固定bearer。OAuth 2.1 未実装 | 2アカウント以上の完全分離、scopes/失効・監査/暗号化、再認証、安全なオンボーディング |
| ネットワーク・配布 | **NO-GO** | remote-serverは未統合・loopback限定、HTTPS配布/ドメイン検証なし | 正規HTTPS、サポート済みStreamable HTTP、MCP/OAuthメタデータ、公開審査用稼働、可用性の確認 |
| QA/依存セキュリティ | **NO-GO** | 既存の高深刻度依存脆弱性、remote HTTPの実働テストなし | 依存修正、ローカルunit/型/監査、実機検証、セキュリティ審査、個別write/delete試験 |

**実行提案**：
1. 次の開発判断を「公開TimeTree連携の権利・正規API」を最優先に置く。**公式APIの許可なしで多数ユーザーをサーバーに集約しない**。
2. 開発工程ではChatGPT公開プラグイン形式を目標にしつつ、TimeTreeなし・架空予定のみの read-only 製品UX検証でスマホ導線を確認。
3. 少人数に紹介できる早期UXは、公式プラグイン/Googleカレンダー（その連携制限を明記）か、TimeTreeへの手動確定・スマホ向け案内で代替。
4. ブロッカーが解除された後だけ、マルチテナント OAuth + プライバシー/運用体制を作り、OpenAI公開審査へ進む。

## 9. 未回答の質問と司令塔判断事項

- NEEDS_COORDINATOR_DECISION：TimeTree社への問い合わせ方針（現在の第三者連携可否/公式APIの有無/商用配布の許可条件）。これは公開判断の第1ゲート。
- NEEDS_COORDINATOR_DECISION：ChatGPTの主ターゲットをFree/Go/Plus/Proユーザーのどこにするか。プラン別権限とread/write制限を公式UI＋実機で判定し、公開時の対象国も確定。
- NEEDS_COORDINATOR_DECISION：初期製品の軸を (a) TimeTreeのread-only非公開技術検証、(b) 公式Googleカレンダー等によるスマホUX先行、(c) TimeTree社許可後の公開プラグイン、の順にするか。
- NEEDS_COORDINATOR_DECISION：公開に必要な運営者名義/身元確認・HTTPSドメイン・プライバシー通知・問い合わせ窓口・利用者資格情報の保管方式。今は契約・課金はしない。
- UNKNOWN：OpenAI公開プラグインの各プラン/日本iOS/Android実機での、このTimeTree互換機能に対する read / write の具体的可否、ユーザーごとの認可UI。端末/アカウントの実機検証が必要。
- UNKNOWN：TimeTree Web内部APIの継続サポート、安全な複数ユーザー権限委任、公式の許可条件。未確認のまま製品化しない。

## 10. 参照した一次資料（すべて2026-10-26アクセス）

| ID | 発行元 | 公式資料URL | 使用箇所 |
| --- | --- | --- | --- |
| O1 | OpenAI Help | https://help.openai.com/en/articles/12584461-connecting-custom-mcp-servers-in-chatgpt | カスタムMCPはmobile no / web only、プラン・管理者制御、Pro read/fetch |
| O2 | OpenAI Help | https://help.openai.com/en/articles/20001256-plugins-in-chatgpt | Web・iOS・Androidのディレクトリとインストール、プラン/役割/サーフェス依存 |
| O3 | OpenAI Developers | https://developers.openai.com/plugins/deploy/app-review | 公開MCP URL/身元確認/審査/公開・モバイル対応テスト |
| O4 | OpenAI Help | https://help.openai.com/en/articles/11487775-connected-apps-in-chatgpt | 外部アプリの接続と認可 |
| O5 | OpenAI Help | https://help.openai.com/en/articles/6825453-chatgpt-release-notes | 2026-08-21モバイルプラグイン発見機能 |
| O6 | OpenAI Help | https://help.openai.com/en/articles/20001497-troubleshooting-plugins-and-apps-in-chatgpt | Free/Goの拡張機能制限 |
| O7 | OpenAI Developers | https://developers.openai.com/plugins/quickstart | WebからMCP登録しChatGPT Workで試す公式例 |
| O8 | OpenAI Developers | https://developers.openai.com/training/walkthroughs/working-on-your-phone | スマホWorkで接続済みPlugin利用 |
| O9 | OpenAI Developers | https://developers.openai.com/plugins/build/plugins | プラグインパッケージ/.mcpbとの違い・一般公開とworkspace公開の違い |
| O10 | OpenAI Developers | https://developers.openai.com/plugins/deploy/submission | ZIP/ドメイン検証/肯定5否定3のテスト・審査書類 |
| O11 | OpenAI Developers | https://developers.openai.com/plugins/build/auth | OAuth 2.1 PKCE S256/発見文書/アクセス権とユーザー別認証 |
| O12 | OpenAI Developers | https://developers.openai.com/plugins/plugin-guidelines | 公開プラグイン審査規約・端末UI・ユーザー保護 |
| O13 | OpenAI Help | https://help.openai.com/en/articles/11989085-what-is-chatgpt-go-1 | ChatGPT契約料金とOpenAI API利用の別課金 |
| T1 | TimeTree公式 | https://timetreeapp.com/intl/ja/newsroom/2023-12-14/connect-app-api-202312 | 外部開発者用Connect App API 2023-12-22終了 |
| T2 | TimeTree公式 | https://timetreeapp.com/intl/ja/terms/service?locale=ja | 過負荷/不正アクセス等の禁止事項（ただし本調査で一律のスクレイピング禁止とは認定していない） |
| T3 | TimeTree Help | https://support.timetreeapp.com/hc/ja/articles/360000629341 | 公式外部カレンダーの表示/共有・TimeTree側からのエクスポート不可 |
| T4 | TimeTree Help | https://support.timetreeapp.com/hc/ja/articles/360000639742 | 共有カレンダーインポートは自動更新不可 |
| C1 | DigitalOcean公式 | https://www.digitalocean.com/pricing/droplets | VPSの参考公開価格 |
| C2 | Cloudflare公式 | https://developers.cloudflare.com/workers/platform/limits/ | Workers無料枠と制約 |

## 11. 作業の監査ログ

- 指示書：docs/coordination/instructions/mobile-distribution-feasibility.md（coordination/parallel-workstreams）。
- 指定納品先：docs/coordination/reports/MOBILE-DISTRIBUTION-FEASIBILITY.md（coordination/parallel-workstreams）。
- 実施：OpenAI/TimeTree/DigitalOcean/Cloudflare公式サイトの調査、GitHubのintegration/release-candidateとwork/remote-onboard-integrate-20261026の静的レビュー。
- 不実施：コード変更、README/アイコン変更、TimeTree実アカウント認証、端末実機試験、GitHub Actions、ホスティング契約、API課金、mainへのマージ。
- コミットと報告ファイルURLはGitHubの作成結果に基づき司令塔に引き継ぐ。
