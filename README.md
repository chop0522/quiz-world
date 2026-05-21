# Quiz World

通知型早押しクイズワールドの専用リポジトリです。

現在はPhase 1の signup/auth ローカル実装段階です。既存Smart Buzzerとは別プロジェクトとして扱います。

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

Phase 1ではSupabase cloud projectを作らず、Supabase localを使います。
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

まだ作らないもの:

- Supabase cloud project
- Vercel project
- Stripe連携
- Web Push
- クイズ作成API
- quiz_launches / quiz_recipients / answers
- ranking
- admin本実装
- Realtime
- production deploy

## Environment

`.env.example` を `.env.local` にコピーして使います。

Phase 1では実際のDB接続はSupabase localだけに限定します。
Smart Buzzer のSupabase/Vercel/Stripe/envとは混ぜません。

## Docs

- [Quiz World docs README](docs/quiz-world/README.md)
- [実装前最終決定](docs/quiz-world/quiz-world-pre-implementation-decisions.md)
- [Phase 1 signup/auth plan](docs/quiz-world/quiz-world-phase-1-signup-auth-plan.md)

## Current Status

- MVP初期方針はほぼ固定済みです。
- Phase 1では signup / login / 18歳以上確認 / 規約同意 / 招待コード / 参加枠 / waitlist までを扱います。
- Phase 1 signup/auth local実装は、Supabase local DB込みで検証済みです。
- Supabase / Vercel / Stripe のcloud環境はまだ作成しません。
