# 通知型早押しクイズワールド README

## このREADMEの目的

このREADMEは、節目ごとにChatGPT Proへ作業状況を共有し、次の進め方を決めるための引き継ぎ文書である。

実装者、設計レビュー担当、ChatGPT Proが、現時点の企画意図、作成済みdocs、決定事項、未確定事項、禁止事項を短時間で把握できることを目的にする。

## 企画の位置づけ

プロジェクト仮称は「通知型早押しクイズワールド」。

これは既存の Smart Buzzer とは別企画である。
Smart Buzzer の production、Stripe、Vercel、Supabase、env、legal page、cleanup、live key には触れない。

docs設計フェーズは一区切り済みで、現在はPhase 0のローカル開発用プロジェクト土台を作成する段階である。
Phase 0では静的UI、ルーティング、型の骨組み、ローカル起動手順までを扱う。
DB migration SQL、Supabase / Vercel / Stripe のcloud環境、本格API処理、production deployはまだ扱わない。

## 現時点で作成済みのdocs

| ファイル | 内容 |
| --- | --- |
| `quiz-world-concept.md` | 企画コンセプト、世界観、1ワールド制、初期10人、参加枠成長、通知体験、ギルド構想。 |
| `quiz-world-mvp-spec.md` | MVPに含める機能、含めない機能、画面案、クイズ形式、回答ルール。 |
| `quiz-world-data-model.md` | MVP向けテーブル案、将来ギルド用テーブル、RLS方針、インデックス候補。 |
| `quiz-world-ranking-rules.md` | 出題者ランク、回答者ランク、順位定義、ワールド成長ルール。 |
| `quiz-world-notification-rules.md` | 通知対象条件、通知モード、quiet hours、通知送信フロー、通知疲れ対策。 |
| `quiz-world-safety-and-age-policy.md` | 18歳以上限定、UGC対策、通報、ブロック、安全機能、未成年対応の将来余地。 |
| `quiz-world-future-guilds.md` | 将来ギルド機能、解放段階、作成条件、安全対策。 |
| `quiz-world-infra-plan.md` | MVPインフラ案、PWA/Web Push、Supabase/Vercel利用案、拡張段階。 |
| `quiz-world-mvp-decisions.md` | MVPで固定した招待方式、評価方式、start_at/end_at、通知Phase、ランク、admin方針。 |
| `quiz-world-screen-spec.md` | MVP画面ごとの目的、表示要素、操作、権限、空状態、エラー状態、対象外範囲。 |
| `quiz-world-api-spec.md` | MVP APIの目的、認証、権限、request/response、バリデーション、サーバー側判定。 |
| `quiz-world-rls-policy-plan.md` | Supabase RLSの方針案、テーブル別のSELECT/INSERT/UPDATE/DELETE、service role境界。 |
| `quiz-world-admin-spec.md` | MVP管理画面の通報、停止、waitlist、招待、参加枠、ログ確認仕様。 |
| `quiz-world-design-review.md` | 既存docsの横断レビュー、矛盾、曖昧さ、実装前の決定事項。 |
| `quiz-world-implementation-task-breakdown.md` | Phase 0〜12の実装タスク分解、対象画面/API/テーブル、完了条件、テスト観点。 |
| `quiz-world-env-plan.md` | 新規Supabase/Vercel想定、Local/Preview/Production、env名、secret管理。 |
| `quiz-world-migration-draft.md` | SQLではないDB migration草案。admin_audit_logsを含むテーブル定義案。 |
| `quiz-world-legal-draft.md` | 利用規約・プライバシーポリシー草案論点、ドラフト文言、専門家確認事項。 |
| `quiz-world-test-plan.md` | unit/integration/E2E/RLS/admin/10人運用テスト計画。 |
| `quiz-world-10-user-ops-scenario.md` | 初期10人テストの募集、招待、1/3/7日目運用、成功条件。 |
| `quiz-world-pre-implementation-decisions.md` | 実装開始前に残っていた利用規約、Supabase/Vercel作成タイミング、audit transaction、Realtime範囲、カテゴリ補足表示範囲の最終決定。 |
| `quiz-world-phase-1-signup-auth-plan.md` | Phase 1のsignup/auth、18歳以上確認、規約同意、招待コード、参加枠、waitlist、初期admin付与方針。 |

## 現時点の主要決定事項

| 項目 | 決定内容 |
| --- | --- |
| 初期形態 | 1ワールド制。 |
| 初期参加枠 | 10人。 |
| 成長表現 | 参加枠が10人、15人、20人、30人、50人と増えるシーズン制。 |
| MVP年齢制限 | 18歳以上限定。18歳未満は保護者同意があっても不可。 |
| MVPクイズ形式 | 四択クイズを優先。AI自動判定には頼らない。 |
| 順位判定 | サーバー受信順。端末時刻は使わない。 |
| 招待方式 | Season 0は管理者発行の招待コード制。 |
| 評価方式 | 3段階評価 + 理由タグ。 |
| start_at | 通知作成から15秒後。サーバー側で決定。 |
| end_at | start_atから60秒後。 |
| 通知実装 | Phase 1は15秒ポーリングの画面内通知、Phase 1.5でRealtime検討、Phase 2でWeb Push検討。 |
| admin role | `profiles.role` をglobal admin判定に使う。値は `user` / `admin`。 |
| user停止 | `profiles.status` をglobal状態として使う。値は `active` / `suspended`。 |
| world member role | `world_members.role` は `member` / `world_admin`。将来の複数world向け。 |
| 操作ログ | `admin_audit_logs` をMVP初期データモデルに正式追加。 |
| カテゴリ | 固定カテゴリ + その他。その他のみ補足テキストを許可。 |
| カテゴリ補足 | `category_note` はその他のみ許可。出題者本人とadminだけ閲覧可。回答者・結果画面には出さない。 |
| 通報基準 | MVPはadmin確認ベース。2件以上で `review_required`、admin判断で `suspended`。 |
| 追加API | `/home`一覧、block解除、admin invite/waitlist/audit logs APIを正式追加。 |
| 法務草案 | 実装開始前に草案ページを用意し、10人テスト前に専門家確認する。 |
| Supabase | Phase 0〜3はSupabase local推奨。難しい場合のみQuiz World専用development project。Productionは10人テスト直前。 |
| Vercel | Phase 0では不要。local主要機能後にQuiz World専用Preview、10人テスト直前にProduction。 |
| admin audit失敗 | admin操作とaudit log記録は同一transaction扱い。ログが残せない場合は管理操作全体を失敗扱い。 |
| Phase 1.5 Realtime | `/home` の届いたクイズ一覧、つまり本人宛 `quiz_recipients` の新着だけ対象。結果画面RealtimeはMVP後回し。 |
| 初期admin付与 | `ADMIN_EMAILS` env + seedをMVP推奨にする。 |
| `NOTIFICATION_PHASE` | Phase 0〜1ではenv運用せず、コード定数 `polling` を優先する。 |
| 配信人数増加 | 課金ではなく出題ランクで増える。 |
| 参加枠増加 | ワールド全体の成長で増える。 |
| 将来小集団 | ギルド。MVPには入れない。 |

## MVPに含めるもの

- ユーザー登録
- 18歳以上確認
- 利用規約・プライバシーポリシー同意
- 1ワールド制
- 初期参加上限10人
- 満員時のウェイトリスト
- Season 0の管理者発行招待コード
- プロフィール
- 出題者ランク
- 回答者ランク
- 四択クイズ作成
- 固定カテゴリ + その他
- クイズ出題
- 通知対象のサーバー側抽選
- Phase 1の15秒ポーリング画面内通知
- 開始カウントダウン
- 回答
- 回答順位表示
- 正解者順位表示
- 3段階評価 + 理由タグ
- 通報
- ブロック/ブロック解除
- 通知設定
- quiet hours
- 1日の通知上限
- 深夜通知デフォルトOFF
- 簡易admin
- admin_audit_logs

## MVPに含めないもの

- タイムライン
- コメント
- DM
- フォロー
- ギルド
- ギルド対抗戦
- 課金
- AI自動判定
- 自由チャット
- 公開掲示板
- 一般ユーザーによる招待コード発行
- Phase 1でのWeb Push
- 完全削除を前提にした管理運用

MVPでは通知型早押しの面白さ、安全性、少人数運用を先に検証する。

## 今回固定済みになったもの

| 元の未確定事項 | 固定内容 |
| --- | --- |
| admin role | `profiles.role = admin` をMVP admin画面/APIの主判定にする。 |
| user停止状態 | `profiles.status = suspended` でログイン後の出題/回答/admin対象操作を制限する。 |
| world member role/status | `world_members.role = member/world_admin`、`world_members.status = active/suspended`。 |
| 操作ログ | `admin_audit_logs` をMVP初期データモデルに正式追加する。 |
| 通知方式 | Phase 1は `/home` が15秒ごとに `GET /api/quiz-launches` をポーリングする。 |
| Realtime | Phase 1.5でSupabase Realtime化を検討する。 |
| Web Push | Phase 2で検討する。 |
| カテゴリ | 雑学、歴史、地理、科学、エンタメ、スポーツ、言葉、謎解き、その他。 |
| 通報基準 | 1件目はadmin確認待ち、同一問題2件以上で `review_required`、admin判断で `suspended`。 |
| 追加API | `GET /api/quiz-launches`、`DELETE /api/blocks/[id]`、admin invite/waitlist/audit logs APIを正式追加。 |
| 利用規約・プライバシーポリシー | 実装開始前に草案ページを用意し、signup同意を必須化。10人テスト前に専門家確認。 |
| 新規Supabase環境 | Phase 0〜3はSupabase local推奨。難しい場合のみQuiz World専用development project。Productionは10人テスト直前。 |
| 新規Vercel環境 | Phase 0では不要。local主要機能後にQuiz World専用Preview、10人テスト直前にProduction。 |
| admin操作ログ失敗時 | admin操作と `admin_audit_logs` 記録は同一transaction扱い。ログが残せない場合は操作全体を失敗扱い。 |
| Phase 1.5 Realtime範囲 | `/home` の本人宛 `quiz_recipients` 新着だけRealtime化。結果画面RealtimeはMVP後回し。 |
| カテゴリ補足テキスト | `その他` の場合だけ `category_note` を許可。出題者本人とadminのみ閲覧可。 |
| 初期admin付与方法 | `ADMIN_EMAILS` envをadmin許可リストにし、local seedでadmin profileを作る。 |
| `NOTIFICATION_PHASE` の扱い | Phase 0〜1ではenv切り替えではなくコード定数 `polling` とする。Realtime/Web Push導入時にenv化を再検討する。 |

## まだ未確定の事項

| 未確定事項 | 次に決める内容 |
| --- | --- |
| 利用規約・プライバシーポリシーの最終文面 | MVP草案で実装開始し、10人テスト前に専門家確認する。 |
| RLS policy test環境 | Supabase localで実行する前提だが、テスト方法を実装準備で具体化する。 |
| Phase 1のsignup認証方式詳細 | email/passwordから始めるか、magic linkを使うかを実装直前に決める。 |
| Phase 1 seedの具体値 | 初期world名、初期invite code、初期adminメールアドレスを実装直前に決める。 |

## 現時点で触ってはいけないもの

以下は明示的に禁止。

- 既存 Smart Buzzer の production 変更
- 既存 Smart Buzzer の Stripe 設定変更
- 既存 Smart Buzzer の Vercel env 変更
- 既存 Smart Buzzer の Supabase 設定変更
- 既存 Smart Buzzer の env 変更
- 既存 Smart Buzzer の legal page 変更
- cleanup 作業
- cloud data の変更
- live key 切り替え
- DB migration SQL作成
- 既存Smart Buzzerアプリコード変更
- Phase 0範囲外の本格API実装
- Supabase / Vercel / Stripe のcloud環境作成

Phase 1前のdocs整理ではQuiz World専用リポジトリ内のdocsのみを扱う。

## 実装へ進む前の最終チェック

- `quiz-world-phase-1-signup-auth-plan.md` のPhase 1方針をChatGPT Proへ共有する。
- Phase 1実装開始前に、現在のdocs差分をcommitする。
- Phase 1で作るものと作らないものを確認する。
- 実装開始時もSmart Buzzerのproduction / Stripe / Vercel / Supabase / env / legal page / cleanup / live keyに触れないことを再確認する。
- DB migration SQLとcloud環境作成は、Phase 1実装前docs整理では扱わない。

## 次の作業候補

### A. Phase 1前docsのcommit

- Phase 1 signup/auth planの差分を確認する。
- commit messageを決める。
- GitHubへpushする。

### B. Phase 1実装準備

- Supabase localの起動手順を確認する。
- `ADMIN_EMAILS` に入れる初期adminメールアドレスを決める。
- 初期world名と初期invite codeの扱いを決める。
- signup認証方式を決める。

### C. まだ実装に進まない

- 10人テスト運用手順をさらに細かくする。
- 通報対応のadmin手順書を作る。

## 現時点の推奨

Phase 1のsignup/auth実装準備に進める状態。
ただし、実装開始前にこのPhase 1前docs整理の内容をcommitする。
