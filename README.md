# Quiz World

通知型早押しクイズワールドの専用リポジトリです。

Phase 1の signup/auth ローカル実装は完了・push・tag済みです。Phase 2の四択クイズ作成local実装も完了・push・tag済みです。Phase 3 quiz launch / recipients local実装も完了・push・tag済みです。Phase 4 answer submission / ranking local実装も完了・push・tag済みです。Phase 5 result / rating / reports のlocal実装は検証済みです。既存Smart Buzzerとは別プロジェクトとして扱います。

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
- Phase 5 result / rating / reports local実装は、Supabase local DB込みで検証済みです。
- Phase 5のrating理由タグは1つだけ保存し、rating更新はMVPでは不可です。
- Phase 5のreport重複防止単位は `question_id` / `launch_id` / `reporter_id` / `reason` です。
- Phase 5では `question.status = review_required` の自動更新は行わず、admin候補表示またはreport count表示に留めます。
- Supabase / Vercel / Stripe のcloud環境はまだ作成しません。

## Next Work

- Phase 5完了地点をtagで固定する
- Phase 6 rank_events / ranking の計画docsへ進む
- rank_events本格反映 / Web Push / Realtime / admin本実装 / cloud環境はまだ作らない
