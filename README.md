# Quiz World

通知型早押しクイズワールドの専用リポジトリです。

Phase 1の signup/auth ローカル実装は完了・push・tag済みです。Phase 2の四択クイズ作成local実装も完了・push・tag済みです。Phase 3 quiz launch / recipients local実装も完了・push・tag済みです。Phase 4 answer submission / ranking local実装も完了・push・tag済みです。Phase 5 result / rating / reports のlocal実装も完了・push・tag済みです。Phase 6 rank_events / ranking local実装も完了・push・tag済みです。Phase 7 admin / moderation のlocal実装も完了・push・tag済みです。Phase 8 10-user local smoke / ops rehearsalは89チェックpass、DB reset済みです。Phase 8 manual UI rehearsal follow-upも完了・push済みです。Phase 9 Step AとしてQuiz World専用Supabase development projectを作成済み、Step BとしてPreview DBへのmigration / seed適用済み、Step CとしてPreview DB smokeをpass済みです。Step DとしてQuiz World専用Vercel project `quiz-world-preview` を作成済みで、Step D follow-upとしてGitHub repo `chop0522/quiz-world` への接続も完了しました。Step EとしてVercel Preview envをPreview environmentのみに設定済みです。Step FとしてIgnored Build Stepを `preview` branchだけbuild許可する条件式へ変更し、`preview` branchを作成・pushしてPreview deployを実行しました。Preview deploymentはReadyです。Step G Preview smokeは実行を試みましたが、Vercel Deployment Protectionで通常アクセスが401になり、CLI bypass経由も404になったためNO-GOです。Step G再実行前のaccess investigation、artifact/root/output/deploy method調査、Git連携Preview deploy preflightも記録済みです。Step G再実行用に `preview` branchを最新の `origin/main` である `4fd64ef` に合わせてpushし、Git連携Preview deploymentを新規作成済みです。新deploymentはReadyですが、再実行でも通常アクセスは401、Vercel CLI bypassとChrome直接表示は404となり、`/` と `/api/world` に到達できませんでした。明示的Automation Bypassでも404で、Vercel serving artifact / routing metadataの不整合が有力です。その原因修正としてVercel Project SettingsのFramework PresetをNext.jsへ明示しました。Root Directoryはrepo root/default、Build Command / Output Directory / Install Commandはdefaultのままです。Framework Preset明示後に `preview` branchを `origin/main` の `7d63505` へ合わせ、新しいGit連携Preview deploymentを作成しました。新deploymentはReadyです。Step G smoke本体はまだ再実行していません。Production envは未設定、追加Production deployは行っていません。`NEXT_PUBLIC_APP_URL` は未設定ですが、現状のbuild blockerではありません。Stripe、Web Push、Realtimeはまだ行っていません。既存Smart Buzzerとは別プロジェクトとして扱います。

Smart Buzzer の production / Stripe / Vercel / Supabase / env / legal page / cleanup / live key には触れません。

## Local Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

ブラウザで `http://localhost:3000` を開きます。

品質確認:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## Supabase Local

Phase 1以降のlocal実装ではSupabase cloud projectを作らず、Supabase localを使います。
Supabase localの起動にはDocker DesktopまたはDocker互換runtimeが必要です。

```bash
npx supabase start
npx supabase status
```

`npx supabase status` で表示された local の key を `.env.local` に入れます。
Supabase CLIのバージョンにより `anon key` / `service_role key` ではなく `Publishable` / `Secret` と表示される場合があります。Phase 1 localでは `Publishable` を `NEXT_PUBLIC_SUPABASE_ANON_KEY`、`Secret` を `SUPABASE_SERVICE_ROLE_KEY` に入れます。

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ADMIN_EMAILS=admin@example.com
QUIZ_WORLD_ID=00000000-0000-4000-8000-000000000001
MAX_INITIAL_MEMBERS=10
```

local DBには次を用意しています。

- migration: `supabase/migrations/20260516000100_phase1_signup_auth.sql`
- migration: `supabase/migrations/20260521000100_phase2_questions.sql`
- migration: `supabase/migrations/20260521000200_phase3_quiz_launches.sql`
- migration: `supabase/migrations/20260522000100_phase4_answers.sql`
- migration: `supabase/migrations/20260522000200_phase5_result_rating_reports.sql`
- migration: `supabase/migrations/20260522000300_phase6_rank_events.sql`
- migration: `supabase/migrations/20260522000400_phase7_admin_moderation.sql`
- seed: `supabase/seed.sql`
- 初期world: `クイズワールド`
- 初期invite code: `SEASON0-TEST-001`

## Phase 1 Scope

- Next.js App Router / TypeScript / Tailwind CSS の初期構成
- Supabase local前提の最小schema
- `/signup` のemail/password登録
- 18歳以上確認、利用規約同意、プライバシーポリシー同意
- 招待コード検証
- 参加枠確認
- 満員時のwaitlist誘導
- `/login` のemail/passwordログイン
- Phase 1 API: `/api/signup`, `/api/invites/validate`, `/api/waitlist`, `/api/world`, `/api/profile`
- `.env.example`

## Phase 2 Scope

- 四択クイズ作成
- `questions` テーブル
- `/create` 画面
- 自分の作成済み問題一覧
- `POST /api/questions`
- `GET /api/questions`
- `GET /api/questions/[id]`
- `PATCH /api/questions/[id]`
- 固定カテゴリ + `その他`
- `category_note` の閲覧制御方針

Phase 2ではまだ作らないもの:

- Supabase cloud project
- Vercel project
- Stripe連携
- Web Push
- quiz_launches / quiz_recipients / answers
- ranking
- admin本実装
- Realtime
- production deploy

## Phase 3 Scope

- 作成済み `active` question の出題
- `quiz_launches` テーブル
- `quiz_recipients` テーブル
- 最小 `blocks` テーブル
- `POST /api/quiz-launches`
- `GET /api/quiz-launches`
- `GET /api/quiz-launches/[id]`
- `/home` の届いたクイズ一覧
- 15秒ポーリングの画面内通知
- `start_at = now + 15秒`
- `end_at = start_at + 60秒`
- サーバー側の配信対象者抽選
- 出題者本人、停止ユーザー、停止member、ブロック関係の除外
- UTC基準の1日出題回数制限
- `/home` の一覧では `start_at` 前に問題本文・選択肢を返さない

Phase 3ではまだ作らないもの:

- answers
- answer_rank / correct_rank
- result完全表示
- question_ratings
- reports
- Web Push
- Realtime
- admin本実装
- quiet hoursの厳密適用
- 1日の通知上限
- Supabase cloud project
- Vercel project
- Stripe連携
- production deploy

## Phase 4 Scope

Phase 4では、届いたquizに対する四択回答の送信と、回答順位の採番を扱います。
順位採番方式はDB function / RPC方式に固定済みです。`submit_quiz_answer` 内で `quiz_launches` 行を `FOR UPDATE` ロックし、同時回答時のrank競合を避けます。

- `answers` テーブル
- `POST /api/quiz-launches/[id]/answer`
- `GET /api/quiz-launches/[id]` の回答画面向け拡張
- `/quiz/[launchId]` 回答画面
- `start_at` 到達後の問題本文・選択肢表示
- `end_at` 後の回答締切
- 同一launchへの重複回答防止
- 四択の正誤判定
- `answer_rank` のサーバー受信順採番
- `correct_rank` の正解者内順位採番

Phase 4ではまだ作らないもの:

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
- Supabase cloud project
- Vercel project
- Stripe連携
- production deploy

## Phase 5 Scope

Phase 5では、回答後の結果表示、3段階評価、通報導線を扱います。

- `/result/[launchId]`
- `GET /api/quiz-launches/[id]/result`
- `POST /api/quiz-launches/[id]/rating`
- `POST /api/reports`
- `question_ratings` テーブル
- `reports` テーブル
- 自分の正誤、`answer_rank`、`correct_rank`
- 全回答者一覧
- 未回答者一覧
- 3段階評価: 良問 / 普通 / 微妙
- 理由タグ: 面白い / 難易度がちょうどいい / 答えが曖昧 / 難しすぎる / 簡単すぎる / 不適切
- MVP初期はrating理由タグを1つだけ `question_ratings.reason text` に保存する
- 同一 `launch_id` / `rater_id` のratingは1件のみ、更新はMVPでは不可
- 同一 `question_id` / `launch_id` / `reporter_id` / `reason` のreport重複は `409`
- Phase 5では2件以上のreportがあっても `question.status = review_required` へ自動更新しない
- `reports.status` は初期値 `open` とし、admin本実装までは更新/削除しない
- resultはrecipientが回答済みまたは `end_at` 後、authorが `start_at` 後に見られる
- resultでは `correctChoiceId` を返してよいが、回答受付中の `/quiz/[launchId]` APIでは返さない
- 通報導線

Phase 5ではまだ作らないもの:

- Web Push
- Realtime
- admin本実装
- rank_events本格反映
- 出題者ランク自動更新
- 回答者ランク自動更新
- Supabase cloud project
- Vercel project
- Stripe連携
- production deploy

## Phase 6 Scope

Phase 6では、回答結果とクイズ評価を `rank_events` として記録し、MVP向けのシンプルな回答者/出題者スコア更新を扱います。

- `rank_events` テーブル
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

Phase 6の固定方針:

- 不正解、未回答、`rating = normal` など0点のケースでは `rank_events` を作らない
- `answer_score` / `questioner_score` は0未満にしない
- rankはscore閾値から毎回再計算し、scoreが下がった場合はMVPではrankも下がってよい
- 回答者イベントはanswer作成成功後に作り、専用RPC `apply_answer_rank_events(p_answer_id)` 方式を優先検討する
- 出題者イベントはrating作成成功後に作り、専用RPC `apply_rating_rank_events(p_rating_id)` を基本案にする
- 正解率/参加率ボーナス、通報による減点、既存データ自動backfillはPhase 6初期実装では作らない
- `GET /api/profile` でscore/rankと直近rank_eventsを返す
- `/profile` でscore/rankと直近rank_eventsを表示する

Phase 6ではまだ作らないもの:

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
- Stripe連携

## Phase 7 Scope

Phase 7では、10人テストを安全に運用するための簡易admin / moderation機能をlocalで実装します。

- `/admin` 画面
- admin role判定: `profiles.role = admin`
- `admin_audit_logs`
- reports一覧 / report詳細
- question moderation: `question.status = review_required / suspended`
- user moderation: `profiles.status = suspended`
- waitlist一覧 / status更新
- invite code発行
- admin API: reports / questions / users / waitlist / invites / audit logs
- world member / profile状態確認
- 管理操作の画面内確認UI
- 管理操作ログ

Phase 7の固定方針:

- admin操作はserver-side API route / service role経由で行う
- clientから直接 `admin_audit_logs` を書かない
- admin操作と `admin_audit_logs` 記録は同一transaction相当にする
- audit logが残せない場合、管理操作全体を失敗扱いにする
- 完全削除はMVPでは行わず、question / user は停止を優先する
- 2件以上reportがあるquestionはadmin画面で `review_required` 候補として表示する
- Phase 7では自動停止や通報によるscore減点は行わない
- `review_required` questionは新規launch不可、admin画面で優先表示、既存result閲覧は維持する
- `suspended` questionは新規launch不可、回答、rating、通常表示から除外し、既存ログやresult用データは監査目的で残す
- user停止時は `profiles.status` と `world_members.status` を同時に `suspended` へ更新する
- report status更新APIとして `PATCH /api/admin/reports/[id]` を追加する
- invite codeはadmin入力を許可し、未入力ならserver側で `SEASON0-XXXXXX` 形式で生成する
- waitlistは `waiting` / `invited` / `joined` / `rejected` を使い、`rejected` はreason必須にする

Phase 7ではまだ作らないもの:

- production deploy
- Supabase cloud project
- Vercel project
- Stripe連携
- Web Push
- Realtime
- full moderation automation
- 通報による自動スコア減点
- 完全削除
- ギルド管理
- シーズンランキング
- ELO/レート

## Environment

`.env.example` を `.env.local` にコピーして使います。

Phase 1以降のlocal実装では実際のDB接続はSupabase localだけに限定します。
Smart Buzzer のSupabase/Vercel/Stripe/envとは混ぜません。

## Docs

- [Quiz World docs README](docs/quiz-world/README.md)
- [実装前最終決定](docs/quiz-world/quiz-world-pre-implementation-decisions.md)
- [Phase 1 signup/auth plan](docs/quiz-world/quiz-world-phase-1-signup-auth-plan.md)
- [Phase 2 question authoring plan](docs/quiz-world/quiz-world-phase-2-question-authoring-plan.md)
- [Phase 3 quiz launch plan](docs/quiz-world/quiz-world-phase-3-quiz-launch-plan.md)
- [Phase 4 answer submission plan](docs/quiz-world/quiz-world-phase-4-answer-submission-plan.md)
- [Phase 5 result rating reports plan](docs/quiz-world/quiz-world-phase-5-result-rating-plan.md)
- [Phase 6 rank events plan](docs/quiz-world/quiz-world-phase-6-rank-events-plan.md)
- [Phase 7 admin moderation plan](docs/quiz-world/quiz-world-phase-7-admin-moderation-plan.md)
- [Phase 8 local smoke ops plan](docs/quiz-world/quiz-world-phase-8-local-smoke-ops-plan.md)
- [Phase 8 local smoke results](docs/quiz-world/quiz-world-phase-8-local-smoke-results.md)
- [Phase 8 manual UI rehearsal plan](docs/quiz-world/quiz-world-phase-8-manual-ui-rehearsal-plan.md)
- [Phase 8 manual UI rehearsal results](docs/quiz-world/quiz-world-phase-8-manual-ui-rehearsal-results.md)
- [Phase 9 Preview environment plan](docs/quiz-world/quiz-world-phase-9-preview-environment-plan.md)
- [Phase 9 Preview execution checklist](docs/quiz-world/quiz-world-phase-9-preview-execution-checklist.md)
- [Phase 9 Preview DB smoke results](docs/quiz-world/quiz-world-phase-9-preview-db-smoke-results.md)
- [Phase 9 Preview smoke results](docs/quiz-world/quiz-world-phase-9-preview-smoke-results.md)

## Current Status

- MVP初期方針はほぼ固定済みです。
- Phase 1 signup/auth local実装は、Supabase local DB込みで検証済み、commit・push済みです。
- Phase 1完了地点は `v0.2.0-phase1-signup-auth` タグで固定済みです。
- Phase 2 question authoring local実装は、Supabase local DB込みで検証済み、commit・push済みです。
- Phase 2完了地点は `v0.3.0-phase2-question-authoring` タグで固定済みです。
- Phase 3 quiz launch / recipients local実装は、Supabase local DB込みで検証済み、commit・push済みです。
- Phase 3完了地点は `v0.4.0-phase3-quiz-launch` タグで固定済みです。
- Phase 4 answer submission / ranking local実装は、Supabase local DB込みで検証済み、commit・push済みです。
- Phase 4完了地点は `v0.5.0-phase4-answer-submission` タグで固定済みです。
- Phase 4の順位採番方式はDB function / RPC方式に固定済みです。
- Phase 5 result / rating / reports local実装は、Supabase local DB込みで検証済み、commit・push済みです。
- Phase 5完了地点は `v0.6.0-phase5-result-rating` タグで固定済みです。
- Phase 5のrating理由タグは1つだけ保存し、rating更新はMVPでは不可です。
- Phase 5のreport重複防止単位は `question_id` / `launch_id` / `reporter_id` / `reason` です。
- Phase 5では `question.status = review_required` の自動更新は行わず、admin候補表示またはreport count表示に留めます。
- Phase 6 rank_events / ranking local実装は、Supabase local DB込みで検証済み、commit・push済みです。
- Phase 6完了地点は `v0.7.0-phase6-rank-events` タグで固定済みです。
- Phase 6では0点イベントを作らず、score下限0、score閾値によるrank再計算、answer/rating後の専用RPC方針で実装済みです。
- Phase 6では正解率/参加率ボーナス、通報による減点、既存データ自動backfillは作っていません。
- Phase 7 admin / moderation local実装は、Supabase local DB込みで検証済み、commit・push済みです。
- Phase 7完了地点は `v0.8.0-phase7-admin-moderation` タグで固定済みです。
- Phase 7では `/admin`、admin API、`admin_audit_logs`、question/user moderation、invite/waitlist管理を実装済みです。
- Phase 8 10-user local smoke / ops rehearsal planを作成済みです。
- Phase 8では機能追加ではなく、Phase 1〜7のMVP主要ループをSupabase localだけで通し確認する方針です。
- Phase 8で確認するものはsignup、invite/waitlist、question、launch、/home polling、answer、result、rating/report、rank_events、admin moderation、admin_audit_logsです。
- Phase 8 local smoke / ops rehearsalは89チェックpass、実行後DB reset済みです。
- Phase 8 manual UI rehearsal planを作成済みです。自動smokeではなく、人間がブラウザで操作したときの導線、表示、分かりやすさをSupabase localだけで確認します。
- Phase 8 manual UI rehearsal follow-upは完了・push済みです。P0はなし、P1は修正・再確認済みです。P2のうちrating/report送信後状態とlegal文言は最小修正済みで、rank説明とworld補助指標は既知制約として残します。
- Phase 9 Preview環境計画docsはcommit・push済みです。Quiz World専用のSupabase development project / Vercel Preview projectへ移す準備は設計済みです。
- Phase 9 Step Aとして、Quiz World専用Supabase development project `quiz-world-preview` の作成だけ完了しました。project id / public URLは `quiz-world-phase-9-preview-execution-checklist.md` にpublic情報として記録済みです。
- Phase 9 Step Bとして、Preview DBへのmigration / seed適用を完了しました。初期world `クイズワールド` とPreview invite code `SEASON0-PREVIEW-001` を作成済みです。service role key / anon key / DB passwordはrepo/docsに記録していません。
- Phase 9 Step Cとして、Supabase Preview DB smokeを実行し、migration履歴、初期world、Preview invite code、主要table、RLS、table件数、Smart Buzzer混入なしを確認済みです。
- Phase 9 Step Dとして、Quiz World専用Vercel project `quiz-world-preview` を作成しました。Step D作成直後はdeploymentsなしでしたが、GitHub repo接続後の `main` pushにより想定外Production deploymentが作成されています。Production domain / Production envは未設定です。
- Step D follow-upとして、Vercel GitHub Appのrepository accessに `chop0522/quiz-world` を追加し、Vercel project `quiz-world-preview` へGitHub repo接続を完了しました。
- Phase 9 Step Eの事前確認で、想定外のProduction deploymentを1件検出したため一度NO-GOとしました。Step E再開前にProduction Branchを `production-hold` へ変更してからPreview env設定へ進みました。
- Step E再開前調査で、Production deploymentは2件存在し、どちらもGitHub連携後の `main` push由来であることを確認しました。
- Vercel Ignored Build Stepを一時的に `exit 0` に設定した後、Step Fで `preview` branchだけbuildを許可する条件式へ変更しました。
- `production-hold` branchを `origin/main` から作成してpushし、Vercel Production Branchを `production-hold` に変更しました。
- Phase 9 Step Eとして、Vercel Preview envに `NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`、`SUPABASE_SERVICE_ROLE_KEY`、`ADMIN_EMAILS`、`QUIZ_WORLD_ID`、`MAX_INITIAL_MEMBERS` を設定済みです。env実値はrepo/docsに記録していません。
- Step Fとして、Ignored Build Stepを `preview` branchだけbuildを許可する条件式へ変更し、`preview` branchを作成・pushしました。
- Preview deployment URL: `https://quiz-world-preview-pm23q56vf-chop0522s-projects.vercel.app`
- Preview deployment status: Ready
- Preview deployment branch / commit: `preview` / `45ded1e`
- Build log secret scan: pass
- Phase 9 Step G Preview smokeは実行を試みましたが、Preview URLの通常アクセスはVercel Deployment Protectionの `401 Authentication Required` で止まり、`vercel curl` のprotection bypass経由でも `/` と `/api/world` が `404_NOT_FOUND` になったため、MVP主要ループ確認には進めませんでした。
- Step G再実行前調査として、Deployment ProtectionがVercel Authentication相当であること、Protection Bypass for Automationが設定済みであること、`vercel curl` がdeployment id指定とURL指定の両方で404になること、deployment metadata上のartifact見え方に追加確認余地があることを記録しました。bypass secret実値はrepo/docsに記録していません。
- artifact/root/output/deploy method調査として、`preview` commitにはNext.js app sourceが含まれること、Root Directory / Build Command / Output Directoryに明確な誤設定はないこと、対象deploymentが `source=cli` でmetadata上 `routes/functions` が空に見えることを確認しました。次回はGit連携Preview deployで作り直す方針を優先します。
- Git連携Preview deploy preflightとして、`origin/preview` が `origin/main` より4 commits古いこと、Production Branchが `production-hold` であること、Preview env名が揃っていること、`NEXT_PUBLIC_APP_URL=` の状態で `npx vercel build` が成功することを確認しました。新しいPreview deployはまだ作っていません。
- Step G再実行用に、`preview` branchを最新の `origin/main` である `4fd64ef` に合わせてpushし、Git連携Preview deploymentを新規作成しました。preflight時点で想定していた `be62e73` は、その後のdocs commit前のmainです。
- 新Preview deployment URL: `https://quiz-world-preview-j5hl87g7x-chop0522s-projects.vercel.app`
- 新Preview deployment id: `dpl_GwrDB65DmZxCJs4gA6H9468dmt4k`
- 新Preview deployment status / source / branch / commit: Ready / Git連携 / `preview` / `4fd64ef`
- Build logでNext.js routesが出力され、`/`、`/signup`、`/api/world` などが含まれることを確認しました。secret実値は記録していません。
- 新しいGit連携Preview deploymentでStep G smokeを再実行しましたが、通常アクセスはDeployment Protectionにより `/` と `/api/world` が401、Vercel CLI bypassは `/` と `/api/world` が404、Chrome直接表示も `/` が404となりました。入口条件を満たせないため、MVP主要ループは未実行です。
- Step G判断は引き続きNO-GOです。次はShareable Linkまたは明示的automation bypass secretを使った到達確認、あるいはVercel projectのProtection / routing設定の追加調査が必要です。Shareable Linkやbypass secretの実値はrepo/docsに書きません。
- Step G NO-GO原因調査として、明示的Automation Bypassでも `/` と `/api/world` が404になること、Project SettingsのFramework Preset / Root Directory / Build Command / Output Directoryが未指定であること、build logではNext.js routesが出る一方でdeployment metadata上はroutes/functions/file treeを確認できないことを記録しました。
- Step G NO-GO原因修正として、Vercel Project SettingsでFramework PresetをNext.jsに明示しました。Root Directoryはrepo root/default、Build Command / Output Directory / Install Commandはdefaultのままです。Ignored Build Stepは `preview` branchだけbuildを許可する条件式を維持しています。
- Framework Preset明示後に `preview` branchを `origin/main` の `7d63505` へ合わせ、新しいGit連携Preview deploymentを作成しました。
- Framework Preset明示後の新Preview deployment URL: `https://quiz-world-preview-ri8igtw45-chop0522s-projects.vercel.app`
- Framework Preset明示後の新Preview deployment id: `dpl_6YhA6LJudsrnBEbJ4UPdgGPwmUkx`
- Framework Preset明示後の新Preview deployment status / source / branch / commit: Ready / Git連携 / `preview` / `7d63505`
- Build logでNext.js routesが出力され、`/`、`/signup`、`/api/world` などが含まれることを確認しました。secret実値は記録していません。
- Step G smoke本体はまだ再実行していません。Production env / Production custom domainは未設定で、追加Production deployは発生していません。
- Step G中に追加Production deploymentは発生していません。Production envとProduction custom domainは未設定のままです。
- `NEXT_PUBLIC_APP_URL` は未設定です。現状のapp codeでは参照されておらず、未設定でもbuildは成功していますが、Step GではPreview URLに到達できなかったためruntime影響は未確認です。
- Supabase PreviewとVercel project作成は完了済みです。Stripe / Production環境はまだ作成しません。
- Production deploy、Stripe、Web Push、Realtimeはまだ行いません。

## Next Work

- 新しいGit連携Preview deploymentでStep G Preview smokeを再実行したが、`/` と `/api/world` に到達できずNO-GO。MVP主要ループは未実行
- Vercel Project SettingsでFramework PresetをNext.jsに明示済み。Root Directory / Build Command / Output Directory / Install Commandはdefaultのまま
- Framework Preset明示後の新Preview deploymentで、Shareable Linkまたは明示的Automation Bypassによる `/` と `/api/world` の到達確認を行う。Shareable Linkやbypass secretの実値はrepo/docsに書かない
- Preview URLへ到達できた後、必要なら `NEXT_PUBLIC_APP_URL` をPreview URLで追加設定する
- Production deployはまだ行わない
- Web Push / Realtime / production deploy はまだ作らない
