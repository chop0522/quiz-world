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
Phase 4のanswer submission / ranking local実装もSupabase local DB込みで検証済み、commit・push済み、`v0.5.0-phase4-answer-submission` タグで固定済みである。
Phase 5のresult / rating / reports local実装もSupabase local DB込みで検証済み、commit・push済み、`v0.6.0-phase5-result-rating` タグで固定済みである。
Phase 6のrank_events / ranking local実装もSupabase local DB込みで検証済み、commit・push済み、`v0.7.0-phase6-rank-events` タグで固定済みである。
Phase 7 admin / moderation のlocal実装もSupabase local DB込みで検証済み、commit・push済み、`v0.8.0-phase7-admin-moderation` タグで固定済みである。
Phase 8 10-user local smoke / ops rehearsalはSupabase localのみで実行済み、89チェックpass、DB reset済みである。
Phase 8 manual UI rehearsal follow-upも完了・push済みである。P1は修正・再確認済みで、P2のrating/report送信後状態とlegal文言は最小修正済みである。rank説明とworld補助指標は既知制約として扱う。
Phase 9 Preview環境計画はcommit・push済みで、実行前チェックリストも作成済みである。Step AとしてQuiz World専用Supabase development projectを作成済み、Step BとしてPreview DBへのmigration / seed適用済み、Step CとしてPreview DB smokeをpass済みである。Step DとしてQuiz World専用Vercel project `quiz-world-preview` を作成済みである。GitHub repo接続はVercel側の権限エラーで未完了である。Vercel env設定、Preview deploy、Production deploy、Stripe、Realtime、Web Pushはまだ扱わない。

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
| `quiz-world-phase-5-result-rating-plan.md` | Phase 5の/result、結果表示、question_ratings、reports、評価、通報、RLS、テスト方針。 |
| `quiz-world-phase-6-rank-events-plan.md` | Phase 6のrank_events、回答者/出題者スコア、rank更新、重複防止、RLS、テスト方針。 |
| `quiz-world-phase-7-admin-moderation-plan.md` | Phase 7の/admin、admin API、admin_audit_logs、通報確認、question/user停止、invite/waitlist管理、RLS、テスト方針。 |
| `quiz-world-phase-8-local-smoke-ops-plan.md` | Phase 8の10-user local smoke / ops rehearsal、主要ループ、手動/API/UI/DB確認、失敗時切り分け、完了条件。 |
| `quiz-world-phase-8-local-smoke-results.md` | Phase 8 local smoke / ops rehearsalの実行結果、pass/fail、DB確認、reset状況、残課題。 |
| `quiz-world-phase-8-manual-ui-rehearsal-plan.md` | Phase 8の人間操作による最終UI rehearsal計画。signup、home、quiz、result、profile、adminなどの導線、表示、分かりやすさを確認する。 |
| `quiz-world-phase-8-manual-ui-rehearsal-results.md` | Phase 8 manual UI rehearsalの実行結果、UI-01〜UI-20、P0/P1/P2改善候補、DB reset状況、Phase 9判断。 |
| `quiz-world-phase-9-preview-environment-plan.md` | Phase 9のPreview環境計画。Quiz World専用Supabase development project、Vercel Preview project、env、migration、seed、smoke、cleanup方針。 |
| `quiz-world-phase-9-preview-execution-checklist.md` | Phase 9 Preview環境のGO/NO-GOチェックリスト。Supabase、Vercel、env、migration、seed、smoke、rollback/cleanupとStep A / Step B実行結果を確認する。 |
| `quiz-world-phase-9-preview-db-smoke-results.md` | Phase 9 Step CのSupabase Preview DB smoke結果。migration履歴、seed、主要table、RLS、件数、Smart Buzzer混入なしを確認する。 |

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
| 通報基準 | MVPはadmin確認ベース。Phase 5では2件以上のreportでも `review_required` へ自動更新せず、admin候補表示またはreport count表示に留める。 |
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
| 通報基準 | 1件目はadmin確認待ち。Phase 5では同一問題2件以上でも自動更新せず、admin候補表示またはreport count表示に留める。admin判断で `suspended`。 |
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
| Phase 5 result閲覧 | launch recipientとauthorが見られる。recipientは回答済み、または `end_at` 後に見られる。`start_at` 前は見せない。 |
| Phase 5正解表示 | resultでは正解表示のため `correct_choice_id` を返してよい。回答受付中のquiz APIでは返さない。 |
| Phase 5 rating理由タグ | MVP初期は理由タグを1つだけ `question_ratings.reason text` に保存する。複数タグ `jsonb` は将来拡張。 |
| Phase 5評価 | ratingできるのはrecipientのみ。author本人は自分の問題をratingできない。同一launch/raterは1件のみ。ratingの更新はMVPでは不可。 |
| Phase 5 report重複 | 同一 `question_id` / `launch_id` / `reporter_id` / `reason` の重複を防ぎ、同じreport連打は `409` にする。 |
| Phase 5通報 | reportできるのはrecipientまたはauthor。admin確認ベースで扱う。自動停止はMVPでは行わない。 |
| Phase 5 review_required更新 | 2件以上reportがあってもPhase 5では `question.status = review_required` に自動更新しない。admin候補表示またはreport count表示に留める。 |
| Phase 5 reports.status | 初期値は `open`。admin本実装までは `open` のまま保存し、update/deleteは作らない。 |
| Phase 5ランク反映 | `rank_events` 本格反映、出題者ランク/回答者ランク自動更新は作らない。 |
| Phase 6 0点イベント | MVP初期では0点イベントを作らない。不正解、未回答、`rating = normal` など0点ケースでは `rank_events` を作成しない。 |
| Phase 6 score下限 | `answer_score` / `questioner_score` は0未満にしない。減点で負数になりそうな場合は0に丸める。 |
| Phase 6 rank再計算 | rankはscore閾値から毎回再計算する。scoreが下がった場合、MVPではrankも下がってよい。rank降格通知や演出はまだ作らない。 |
| Phase 6回答者イベント | answer作成成功後に回答者向けrank eventを作る。実装時は専用RPC `apply_answer_rank_events(p_answer_id)` 方式を優先検討する。 |
| Phase 6出題者イベント | rating作成成功後に出題者向けrank eventを作る。専用RPC `apply_rating_rank_events(p_rating_id)` を基本案にする。 |
| Phase 6 transaction | `profiles` のscore/rank更新と `rank_events` 作成は同一transaction相当にする。 |
| Phase 6正解率/参加率ボーナス | Phase 6初期実装では作らない。`launch_summary` イベントは後続Phaseで検討する。 |
| Phase 6通報減点 | Phase 6では作らない。admin判断が必要なため、Phase 7 admin / moderation 以降に回す。 |
| Phase 6 backfill | local検証用の手動RPCまたはscript案は残すが、既存データの自動backfillはPhase 6では必須にしない。 |
| Phase 6重複防止 | `rank_events` のuniqueは `(user_id, type, source_type, source_id)` を基本にする。 |
| Phase 7 admin判定 | admin判定は `profiles.role = admin` かつ `profiles.status = active` を使う。 |
| Phase 7 admin操作 | admin操作はserver-side API route / service role経由にし、clientから直接 `admin_audit_logs` を書かない。 |
| Phase 7 audit transaction | admin操作と `admin_audit_logs` 記録は同一transaction相当にする。ログが残せない場合は操作全体を失敗扱いにする。 |
| Phase 7 moderation | 完全削除は行わず、questionは `review_required` / `suspended`、userは `profiles.status = suspended` を使う。 |
| Phase 7 report対応 | 2件以上reportがあるquestionはadmin画面で `review_required` 候補表示に留め、adminが明示的にstatus変更する。 |
| Phase 7減点 | 通報によるscore減点はPhase 7では作らない。 |
| Phase 7 `review_required` question | 新規launch不可、admin画面で優先表示、既存result閲覧は維持、既存回答済みデータは削除しない。通常ユーザーの新規出題対象からは外す。 |
| Phase 7 `suspended` question | 新規launch不可、回答、rating、通常表示から除外する。完全削除はせず、既存ログやresult用データは監査目的で残す。 |
| Phase 7 user suspension | `profiles.status = suspended` を主判定にし、対象ユーザーの `world_members.status` も同時に `suspended` へ更新する。自分自身の停止は禁止。解除API / 復帰APIはPhase 7では作らない。 |
| Phase 7 report status API | `PATCH /api/admin/reports/[id]` を追加する。`status` は `reviewing` / `resolved` / `dismissed`、reason必須、`admin_audit_logs` に `report_reviewed` として記録する。 |
| Phase 7 invite code生成 | admin入力を許可し、未入力ならserver側で `SEASON0-XXXXXX` 形式のcodeを生成する。codeはtrim + uppercase。unique違反時は再生成または409。reason必須。 |
| Phase 7 waitlist | `waiting` / `invited` / `joined` / `rejected` を使う。`rejected` の場合はreason必須。status更新は `admin_audit_logs` に記録する。 |
| Phase 7完全削除 | 削除APIを作らない。user / question / report / invite / waitlist はstatus管理を優先する。 |

## まだ未確定の事項

| 未確定事項 | 次に決める内容 |
| --- | --- |
| 利用規約・プライバシーポリシーの最終文面 | MVP草案で実装開始し、10人テスト前に専門家確認する。 |
| RLS policy test環境 | Supabase localで実行する前提だが、テスト方法を実装準備で具体化する。 |
| 1日の出題回数の日付境界 | Phase 3ではUTC基準。10人テスト前にJST基準へ変えるか再検討する。 |

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
- Phase 7計画範囲外の実装
- Supabase / Vercel / Stripe のcloud環境作成

Phase 7実装へ進む場合も、対象は admin / moderation / admin_audit_logs に限定する。

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

## Phase 4完了状態

Phase 4では、`quiz_recipients` に含まれる回答者が自分に届いたlaunchへ四択回答できるようにする。

扱ったもの:

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
- DB function / RPC方式の `submit_quiz_answer`

完了状態:

- Supabase local DB込みで検証済み。
- `feat: implement phase 4 answer submission locally` でcommit/push済み。
- `v0.5.0-phase4-answer-submission` タグで固定済み。

Phase 4ではまだ扱っていないもの:

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

## Phase 5完了状態

Phase 5では、回答後の `/result/[launchId]`、3段階評価、通報導線を実装対象にする。

扱うもの:

- `/result/[launchId]`
- `GET /api/quiz-launches/[id]/result`
- `POST /api/quiz-launches/[id]/rating`
- `POST /api/reports`
- `question_ratings`
- `reports`
- 自分の正誤、`answer_rank`、`correct_rank`
- 全回答者一覧
- 未回答者一覧
- 3段階評価
- 理由タグは1つだけ `question_ratings.reason text` に保存する
- 同一launch/raterのratingは1件のみで、更新はMVPでは不可
- report重複は同一 `question_id` / `launch_id` / `reporter_id` / `reason` で防ぎ、重複時は `409`
- 2件以上reportがあってもPhase 5では `question.status = review_required` に自動更新しない
- `reports.status` は初期値 `open` のまま保存し、admin本実装まではupdate/deleteしない
- resultでは `correctChoiceId` を返してよいが、回答受付中のquiz APIでは返さない
- 通報導線

まだ扱わないもの:

- Web Push
- Realtime
- admin本実装
- rank_events本格反映
- 出題者ランク自動更新
- 回答者ランク自動更新
- production deploy
- Supabase cloud project
- Vercel project
- Stripe

完了状態:

- Supabase local DB込みで検証済み。
- `feat: implement phase 5 result rating reports locally` でcommit/push済み。
- `v0.6.0-phase5-result-rating` タグで固定済み。

## Phase 6完了状態

Phase 6では、回答結果とクイズ評価を `rank_events` として記録し、MVP向けのシンプルな回答者/出題者スコア更新を扱った。

扱うもの:

- `rank_events`
- `profiles.answer_score`
- `profiles.questioner_score`
- `profiles.answer_rank`
- `profiles.questioner_rank`
- 回答者向け加点
- 出題者向け加点
- 正解 / 不正解
- `correct_rank`
- `difficulty`
- `rating`
- `reason`
- 同一answer/rating由来のrank event重複防止
- score更新とrank event作成のtransaction相当処理
- 0点イベントを作らない方針
- score下限0
- score閾値によるrank再計算

初期スコア案:

- 回答者: 正解 +3、`correct_rank=1` +3、`correct_rank=2` +2、`correct_rank=3` +1、難易度4以上の正解 +2。
- 回答者: 不正解と未回答は +0。見逃しペナルティは付けない。
- 出題者: 良問 +2、普通 +0、微妙 -1、`答えが曖昧` -3、`不適切` -5。
- 0点ケースでは `rank_events` を作らない。
- `answer_score` / `questioner_score` は0未満にしない。
- rankはscore閾値から毎回再計算する。
- answer作成成功後に回答者イベントを作り、専用RPC `apply_answer_rank_events(p_answer_id)` 方式を優先検討する。
- rating作成成功後に出題者イベントを作り、専用RPC `apply_rating_rank_events(p_rating_id)` を基本案にする。
- 正解率30〜70%ボーナス、参加率ボーナス、通報による減点はPhase 6初期実装では作らない。
- 既存データの自動backfillはPhase 6では必須にしない。
- `GET /api/profile` でscore/rankと直近rank_eventsを返す。
- `/profile` でscore/rankと直近rank_eventsを表示する。

まだ扱わないもの:

- シーズンランキング
- ギルドランキング
- ELO/レート
- デイリーランキング
- 通知連携
- Web Push
- Realtime
- admin本実装
- 正解率/参加率のlaunch summaryイベント
- 通報による減点
- 既存データの自動backfill
- production deploy
- Supabase cloud project
- Vercel project
- Stripe

完了状態:

- Supabase local DB込みで検証済み。
- `feat: implement phase 6 rank events locally` でcommit/push済み。
- `v0.7.0-phase6-rank-events` タグで固定済み。

## Phase 7計画

Phase 7では、10人テストを安全に運用するための簡易admin / moderation機能をlocalで実装する。

扱うもの:

- `/admin`
- admin role判定
- `profiles.role = admin`
- `admin_audit_logs`
- reports一覧 / report詳細
- question moderation
- `question.status = review_required / suspended`
- user moderation
- `profiles.status = suspended`
- waitlist一覧 / status更新
- invite code発行
- admin API: reports / questions / users / waitlist / invites / audit logs
- world member / profile状態確認
- 管理操作の画面内確認UI
- 管理操作ログ

Phase 7の固定方針:

- admin操作はserver-side API route / service role経由で行う。
- clientから直接 `admin_audit_logs` を書かない。
- admin操作と `admin_audit_logs` 記録は同一transaction相当にする。
- audit logが残せない場合、管理操作全体を失敗扱いにする。
- 完全削除はMVPでは行わない。
- 2件以上reportがあるquestionはadmin画面で `review_required` 候補として表示する。
- Phase 7ではadminが明示的に `review_required` / `suspended` へ変更する。
- 通報によるscore減点はPhase 7では作らない。
- `review_required` questionは新規launch不可、admin画面で優先表示、既存result閲覧は維持する。
- `suspended` questionは新規launch不可、回答、rating、通常表示から除外し、既存ログやresult用データは監査目的で残す。
- user停止時は `profiles.status` と `world_members.status` を同時に `suspended` へ更新する。
- report status更新APIとして `PATCH /api/admin/reports/[id]` を追加する。
- invite codeはadmin入力を許可し、未入力ならserver側で `SEASON0-XXXXXX` 形式で生成する。
- waitlistは `waiting` / `invited` / `joined` / `rejected` を使い、`rejected` はreason必須にする。
- Phase 7では削除APIを作らない。

まだ扱わないもの:

- production deploy
- Supabase cloud project
- Vercel project
- Stripe
- Web Push
- Realtime
- full moderation automation
- 通報による自動スコア減点
- 完全削除
- ギルド管理
- シーズンランキング
- ELO / レート

完了状態:

- Supabase local DB込みで検証済み。
- `feat: implement phase 7 admin moderation locally` でcommit/push済み。
- `v0.8.0-phase7-admin-moderation` タグで固定済み。

## Phase 8計画

Phase 8では、10人テスト前にlocal環境でMVP主要ループを通し確認する。

Phase 8は機能追加ではなく、運用リハーサルと手順整理を目的とする。Supabase localのみを使い、cloud環境やproduction deployには進まない。

確認するもの:

- admin user / userA / userB / userC など複数ユーザーの用意
- adminによるinvite code発行
- signup、参加枠、waitlist
- userAによるquestion作成
- active questionのlaunch
- userB / userCへのrecipient作成
- `/home` の15秒ポーリング
- start_at前の問題本文・選択肢非表示
- `/quiz/[launchId]` での回答
- answer_rank / correct_rank
- `/result/[launchId]`
- rating / report
- rank_events
- `/profile` のscore/rank表示
- `/admin` のreport確認
- question review_required / suspended
- user suspended
- admin_audit_logs

まだ扱わないもの:

- Supabase cloud project
- Vercel project
- production deploy
- Stripe
- Web Push
- Realtime
- 課金
- ギルド
- 本番法務確定

実行結果:

- 2026-05-22にSupabase localのみでPhase 8 smoke / ops rehearsalを実行済み。
- typecheck / lint / test / build はpass。
- API / UI / DB smokeは89チェックpass。
- 実行後に `npx supabase db reset` でseed状態へ戻し済み。
- 結果は `quiz-world-phase-8-local-smoke-results.md` に記録済み。

manual UI rehearsal:

- 自動smokeとは別に、人間がブラウザで操作したときの導線、表示、分かりやすさを確認する。
- 対象は `/signup`、`/login`、`/home`、`/create`、`/quiz/[launchId]`、`/result/[launchId]`、`/profile`、`/admin`、`/world`、`/invite`、legal pages。
- 実行時もSupabase localのみを使い、cloud環境やproduction deployには進まない。
- 計画は `quiz-world-phase-8-manual-ui-rehearsal-plan.md` に記録済み。
- 2026-05-23にSupabase localのみでmanual UI rehearsalを実行済み。
- P0はなし。P1の古いPhase文言は更新済み、admin危険操作UIは対象・操作・reasonを見直せる画面内確認UIへ最小改善済み。P1修正後の限定再確認もpass。P2のうちrating/report送信後状態とlegal文言は最小修正済み。rank説明とworld補助指標は既知制約として残す。
- 結果は `quiz-world-phase-8-manual-ui-rehearsal-results.md` に記録済み。

## Phase 9 Preview環境計画

Phase 9では、local MVPをQuiz World専用のPreview環境へ移す準備を設計する。

目的:

- 10人テスト前にcloud上で少人数確認できる状態を設計する。
- まだProductionではなくPreview / development扱いにする。
- Smart BuzzerのSupabase / Vercel / Stripe / envとは絶対に混ぜない。

Phase 9で計画するもの:

- Quiz World専用Supabase development project
- Quiz World専用Vercel Preview project
- Preview env
- local / preview / production の分離
- migration適用手順
- seed / initial data
- admin user
- invite code
- Preview smoke checklist
- rollback / cleanup方針

Phase 9ではまだ実作成しないもの:

- Supabase cloud project
- Vercel project
- Production project
- Production deploy
- Stripe
- Web Push
- Realtime

計画は `quiz-world-phase-9-preview-environment-plan.md` に記録済み。

## Phase 9 Preview実行前チェックリスト

Phase 9でcloud環境を実作成する前に、GO/NO-GOを判断するチェックリストを作成し、未確認項目をレビューする。

レビュー済み / 決定済みの主な方針:

- Supabase project名は `quiz-world-preview`。
- Supabase organization / workspaceは個人アカウント。
- Supabase regionは `Northeast Asia (Tokyo) ap-northeast-1`。
- Supabase planはFree。
- Vercel project名は `quiz-world-preview`。
- GitHub repo接続先は `chop0522/quiz-world`。
- Preview branchは `preview`。
- `QUIZ_WORLD_ID` は `00000000-0000-4000-8000-000000000001`。
- `MAX_INITIAL_MEMBERS` は `10`。
- 初期invite codeは `SEASON0-PREVIEW-001`。
- Preview共有範囲はowner/adminのみから開始。
- 初期admin emailは決定済み。実値はdocsに書かず、Vercel Preview envの `ADMIN_EMAILS` にのみ設定する。
- Preview DB cleanup担当は自分。
- 最終GO/NO-GO判断はStep DでVercel project作成済み。GitHub repo接続は未完了。

Step A / Step B / Step C / Step D作成後の記録:

- Supabase project id / public URLは `quiz-world-phase-9-preview-execution-checklist.md` にpublic情報として記録済み
- Preview DBへのmigration / seed適用済み
- 初期world `クイズワールド` とPreview invite code `SEASON0-PREVIEW-001` を作成済み
- Preview DB smokeはpass済み。結果は `quiz-world-phase-9-preview-db-smoke-results.md` に記録済み
- Vercel project `quiz-world-preview` は作成済み。GitHub repo接続はVercel側の権限エラーで未完了

チェック対象:

- Phase 9で実作成するもの
- Phase 9でまだ作らないもの
- Supabase作成前チェック
- Vercel作成前チェック
- envチェック
- migration / seed チェック
- Preview smoke checklist
- rollback / cleanup
- GO条件
- NO-GO条件

Step AとしてQuiz World専用Supabase development projectを作成済み。Step BとしてPreview DBへのmigration / seed適用済み。Step CとしてPreview DB smokeをpass済み。Step DとしてQuiz World専用Vercel projectを作成済み。GitHub repo接続、Vercel env設定、Preview deploy、Production deploy、Stripe、Web Push、Realtimeはまだ作らない。

チェックリストは `quiz-world-phase-9-preview-execution-checklist.md` に記録済み。

## 次の作業候補

### A. Phase 9 Preview残作業のGO/NO-GO判断

- Vercel GitHub Appが `chop0522/quiz-world` にアクセスできるようにして、repo接続を再実行する。
- Preview branch `preview` の作成タイミングを確認する。
- Vercel project作成、Production deployはまだ行わない。
- 今後のcloud操作前に、Smart Buzzerと完全分離されることを再確認する。

### B. P2残項目整理

- profileのrank説明と `/world` の補助指標を、10人テスト前の既知制約として扱うか最終確認する。

### C. Phase 8以降の残作業整理

- Web Push、Realtime、cloud環境、production deployへ進む前の未確定事項を整理する。
- Web Push、Realtime、cloud環境、production deployはまだ作らない。

## 現時点の推奨

Phase 1〜7 local実装は完了・push・tag済み。Phase 8 10-user local smoke / ops rehearsalもSupabase localのみで実行済み、89チェックpass、DB reset済み。Phase 8 manual UI rehearsal follow-upも完了・push済み。Phase 9 Preview環境計画はcommit・push済み。Phase 9 Step AとしてQuiz World専用Supabase development project `quiz-world-preview` を作成済み、Step BとしてPreview DBへのmigration / seed適用済み、Step CとしてPreview DB smokeをpass済み。Step DとしてQuiz World専用Vercel project `quiz-world-preview` を作成済み。GitHub repo接続はVercel側の権限エラーで未完了。project id / public URL、migration / seed結果は `quiz-world-phase-9-preview-execution-checklist.md` にpublic情報として記録済みで、DB smoke結果は `quiz-world-phase-9-preview-db-smoke-results.md` に記録済み。次はVercel GitHub Appのrepoアクセス権確認とrepo接続再実行を行う。
