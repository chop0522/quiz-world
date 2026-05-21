# Quiz World

通知型早押しクイズワールドの専用リポジトリです。

Phase 1の signup/auth ローカル実装は完了・push済みです。Phase 2の四択クイズ作成local実装も完了・push・tag済みです。Phase 3 quiz launch / recipients local実装は検証済みです。既存Smart Buzzerとは別プロジェクトとして扱います。

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

## Current Status

- MVP初期方針はほぼ固定済みです。
- Phase 1 signup/auth local実装は、Supabase local DB込みで検証済み、commit・push済みです。
- Phase 1完了地点は `v0.2.0-phase1-signup-auth` タグで固定済みです。
- Phase 2 question authoring local実装は、Supabase local DB込みで検証済み、commit・push済みです。
- Phase 2完了地点は `v0.3.0-phase2-question-authoring` タグで固定済みです。
- Phase 3 quiz launch / recipients local実装は、Supabase local DB込みで検証済みです。
- Supabase / Vercel / Stripe のcloud環境はまだ作成しません。

## Next Work

- Phase 3完了地点を必要に応じてtagで固定する
- Phase 4回答実装の計画docsを作成する
- answers / result / ranking / Web Push / Realtime / admin本実装 / cloud環境はまだ作らない
