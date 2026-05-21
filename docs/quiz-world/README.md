# 通知型早押しクイズワールド README

## このREADMEの目的

このREADMEは、節目ごとにChatGPT Proへ作業状況を共有し、次の進め方を決めるための引き継ぎ文書である。

実装者、設計レビュー担当、ChatGPT Proが、現時点の企画意図、作成済みdocs、決定事項、未確定事項、禁止事項を短時間で把握できることを目的にする。

## 企画の位置づけ

プロジェクト仮称は「通知型早押しクイズワールド」。

これは既存の Smart Buzzer とは別企画である。
Smart Buzzer の production、Stripe、Vercel、Supabase、env、legal page、cleanup、live key には触れない。

docs設計フェーズ、Phase 0のローカル土台作成、Phase 1のsignup/authローカル実装は一区切り済みである。
Phase 1はSupabase local DB込みで検証済み、commit・push済み、`v0.2.0-phase1-signup-auth` タグで固定済みである。
Phase 2の四択クイズ作成local実装もSupabase local DB込みで検証済み、commit・push済み、`v0.3.0-phase2-question-authoring` タグで固定済みである。
Phase 3のquiz launch / recipients local実装もSupabase local DB込みで検証済み、commit・push済み、`v0.4.0-phase3-quiz-launch` タグで固定済みである。
Phase 4のanswer submission / ranking local実装はSupabase local DB込みで検証済みである。
Supabase / Vercel / Stripe のcloud環境、production deploy、result完全表示、評価、通報、ランキング本格反映、admin本実装、Realtime、Web Pushはまだ扱わない。

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
| `quiz-world-phase-2-question-authoring-plan.md` | Phase 2の四択クイズ作成、questionsテーブル、/create、作成済み問題一覧、API、validation、RLS、テスト方針。 |
| `quiz-world-phase-3-quiz-launch-plan.md` | Phase 3のquiz_launches、quiz_recipients、配信対象者抽選、/homeポーリング、start_at/end_at、RLS、テスト方針。 |
| `quiz-world-phase-4-answer-submission-plan.md` | Phase 4のanswers、回答API、/quiz/[launchId]、answer_rank/correct_rank、正誤判定、RLS、テスト方針。 |

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
| 通知実装 | 初期は15秒ポーリングの画面内通知、Phase 1.5でRealtime検討、Web Pushは通知ロードマップ上の後続Phaseで検討。 |
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
| Web Push | 通知ロードマップ上の後続Phaseで検討する。四択クイズ作成Phase 2では扱わない。 |
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
| Phase 1 signup認証方式 | email/passwordから開始する。 |
| Phase 1 seed具体値 | 初期worldは `クイズワールド`、初期invite codeは `SEASON0-TEST-001`、初期参加枠は10人。 |
| Phase 2問題文上限 | `questions.body` は最大300文字。 |
| Phase 2選択肢 | 選択肢は4つ固定。各textは最大80文字。完全重複はエラー。 |
| Phase 2難易度 | `difficulty` は1〜5。 |
| Phase 2カテゴリ | 固定カテゴリのみ。雑学、歴史、地理、科学、エンタメ、スポーツ、言葉、謎解き、その他。 |
| Phase 2カテゴリ補足 | `category_note` は `category=その他` の場合のみ許可し、最大80文字。その他以外ではサーバー側で `null` にする。 |
| Phase 2作成権限 | `profiles.status=active` かつ `world_members.status=active` のユーザーのみ作成可。 |
| Phase 2 question status | ユーザーが設定できるのは `draft` / `active` のみ。`suspended` はadmin専用。 |
| Phase 2 DELETE | DELETE APIは作らない。 |
| Phase 3出題対象 | `active` questionのみ出題可能。author本人のみ自分のquestionを出題可能。 |
| Phase 3時刻 | `start_at = now + 15秒`、`end_at = start_at + 60秒` をサーバー側で決める。 |
| Phase 3配信人数 | MVP初期は出題者ランクLv.0で3人。候補者が3人未満なら候補者全員に配信する。 |
| Phase 3配信除外 | 出題者本人、停止ユーザー、停止world member、ブロック関係の相手は除外する。 |
| Phase 3通知 | Web Push / Realtimeは使わず、`/home` の15秒ポーリングで届いたクイズを表示する。 |
| Phase 3 blocks | Phase 3で最小 `blocks` テーブルを追加する。`blocker_id`, `blocked_id`, `created_at`, unique `(blocker_id, blocked_id)`。 |
| Phase 3 quiet hours | Phase 3の初期local実装では厳密適用しない。candidate filterではPhase 4以降に回す。 |
| Phase 3 1日の通知上限 | Phase 3では未実装。`notification_logs` 連携後、Phase 4以降または通知強化Phaseで実装する。 |
| Phase 3 1日の出題回数 | Phase 3で実装する。Lv.0=1回、Lv.1=2回、Lv.2=3回、Lv.3=5回、Lv.4以上=8回。日付境界はUTC基準。 |
| Phase 3 `/home` 一覧 | `start_at` 前は問題本文・選択肢を返さない。出題者名、カテゴリ、難易度、`start_at`, `end_at`, 状態だけ返す。 |
| Phase 3 recipient 0件 | launch自体を作らず `409` を返す。 |
| Phase 4回答対象 | 回答できるのは `quiz_recipients` に含まれる本人のみ。author本人は回答不可。 |
| Phase 4回答受付 | `start_at` 前と `end_at` 後は回答不可。判定はサーバー時刻で行い、クライアント時刻は使わない。 |
| Phase 4問題返却 | `/quiz/[launchId]` では `start_at` 到達後だけ問題本文・選択肢を返す。`correct_choice_id` は返さない。 |
| Phase 4重複回答 | 同一 `launch_id` / `user_id` の回答は1件のみ。 |
| Phase 4順位 | `answer_rank` は全回答者内のサーバー受信順、`correct_rank` は正解者だけのサーバー受信順。 |
| Phase 4正誤判定 | 四択のみ。`choice_id = correct_choice_id` で `is_correct` をサーバー側が決める。 |
| Phase 4順位採番方式 | DB function / RPC方式に固定。RPC名は `submit_quiz_answer`。`quiz_launches` 行を `FOR UPDATE` ロックしてrank競合を避ける。 |

## まだ未確定の事項

| 未確定事項 | 次に決める内容 |
| --- | --- |
| 利用規約・プライバシーポリシーの最終文面 | MVP草案で実装開始し、10人テスト前に専門家確認する。 |
| RLS policy test環境 | Supabase localで実行する前提だが、テスト方法を実装準備で具体化する。 |
| 1日の出題回数の日付境界 | Phase 3ではUTC基準。10人テスト前にJST基準へ変えるか再検討する。 |
| Phase 4 RPCのlocal検証結果 | 実装後にSupabase localで同時回答に近いケースを確認する。 |

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
- 既存Smart Buzzerアプリコード変更
- Phase 4計画範囲外の本格API実装
- Supabase / Vercel / Stripe のcloud環境作成

Phase 4計画段階ではQuiz World専用リポジトリ内のdocs更新のみを扱う。
Phase 4実装へ進む場合も、対象は `answers`、回答API、`/quiz/[launchId]`、回答済み/締切済み状態に限定する。

## Phase 2完了状態

- Phase 2 question authoring planとlocal実装結果をChatGPT Proへ共有済み。
- Supabase localで `npx supabase db reset` を実行し、Phase 1/2 migrationとseed適用を確認済み。
- `/create`、`/home`、`/profile`、`/world` は200確認済み。
- questions APIのlocal動作は57チェック通過済み。
- `npm run typecheck`、`npm run lint`、`npm run test`、`npm run build` は通過済み。
- `.env.local` とsecret実値がcommit対象に含まれないことを確認済み。
- `feat: implement phase 2 question authoring locally` でcommit/push済み。
- `v0.3.0-phase2-question-authoring` タグで固定済み。
- cloud環境作成、Stripe、production deployはPhase 2でも扱わない。

## Phase 3計画

Phase 3では、作成済みの `active` question を選ばれた回答者に配信する。

扱うもの:

- `quiz_launches`
- `quiz_recipients`
- 最小 `blocks`
- `POST /api/quiz-launches`
- `GET /api/quiz-launches`
- `GET /api/quiz-launches/[id]`
- `/home` の届いたクイズ一覧
- `/create` またはquestion詳細からの出題導線
- server-side `start_at` / `end_at`
- server-side recipient抽選
- UTC基準の1日出題回数制限
- `/home` 一覧で `start_at` 前に問題本文・選択肢を返さない制御

まだ扱わないもの:

- answers
- answer_rank / correct_rank
- result完全表示
- question_ratings
- reports
- Web Push
- Realtime
- quiet hoursの厳密適用
- 1日の通知上限
- admin本実装
- production deploy
- Supabase cloud project
- Vercel project
- Stripe

## Phase 3 local実装検証状態

- Phase 3 migrationは `blocks`、`quiz_launches`、`quiz_recipients` を追加する。
- `POST /api/quiz-launches`、`GET /api/quiz-launches`、`GET /api/quiz-launches/[id]` を実装済み。
- `/home` の届いたクイズ一覧と15秒ポーリングを実装済み。
- `/create` の作成済み問題一覧から「出題する」導線を実装済み。
- `npx supabase db reset` でPhase 1/2/3 migrationとseed適用を確認済み。
- `/home`、`/create` は200確認済み。
- Phase 3 APIのlocal動作は54チェック通過済み。
- `npm run typecheck`、`npm run lint`、`npm run test`、`npm run build` は通過済み。
- 検証後にSupabase local DBをseed状態へ戻し、`profiles`、`world_members`、`questions`、`blocks`、`quiz_launches`、`quiz_recipients` が0件であることを確認済み。
- `feat: implement phase 3 quiz launch locally` でcommit/push済み。
- `v0.4.0-phase3-quiz-launch` タグで固定済み。

## Phase 4計画

Phase 4では、`quiz_recipients` に含まれる回答者が自分に届いたlaunchへ四択回答できるようにする。

扱うもの:

- `answers`
- `POST /api/quiz-launches/[id]/answer`
- `GET /api/quiz-launches/[id]` の回答画面向け拡張
- `/quiz/[launchId]`
- `start_at` 到達後の問題本文・選択肢表示
- `end_at` 後の回答不可
- 同一launchへの重複回答防止
- 四択の正誤判定
- `answer_rank`
- `correct_rank`

まだ扱わないもの:

- question_ratings
- reports
- rank_events本格反映
- 出題者ランク更新
- 回答者ランク更新
- result完全表示
- 全回答者一覧
- Web Push
- Realtime
- admin本実装
- production deploy
- Supabase cloud project
- Vercel project
- Stripe

## 次の作業候補

### A. Phase 4完了地点の固定

- commit/push後にPhase 4完了地点をtagで固定する。
- result完全表示、評価、通報、rank_events本格反映、Web Push、Realtime、admin本実装、cloud環境はまだ作らない。

## 現時点の推奨

Phase 4 local実装差分を確認し、問題なければcommit/pushする。
