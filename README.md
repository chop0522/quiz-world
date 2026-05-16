# Quiz World

通知型早押しクイズワールドの企画・設計ドキュメント用リポジトリです。

現在はPhase 0のローカル開発用プロジェクト土台です。既存Smart Buzzerとは別プロジェクトとして扱います。

Smart Buzzer の production / Stripe / Vercel / Supabase / env / legal page / cleanup / live key には触れません。

## Local Development

```bash
npm install
npm run dev
```

ブラウザで `http://localhost:3000` を開きます。

品質確認:

```bash
npm run typecheck
npm run lint
npm run build
```

## Phase 0 Scope

- Next.js App Router / TypeScript / Tailwind CSS の初期構成
- mobile-first の静的UI
- `/`、`/login`、`/signup`、`/home`、`/create`、`/quiz/[launchId]`、`/result/[launchId]`
- `/profile`、`/world`、`/invite`、`/admin`
- `/legal/terms`、`/legal/privacy`
- `.env.example`

まだ作らないもの:

- DB migration SQL
- Supabase cloud project
- Vercel project
- Stripe連携
- Web Push
- 本格API処理
- 本格RLS
- production deploy

## Environment

`.env.example` を `.env.local` にコピーして使います。

Phase 0では実際のDB接続は行いません。Supabase localは次Phase以降で利用できるようにenv名だけ準備しています。

## Docs

- [Quiz World docs README](docs/quiz-world/README.md)
- [実装前最終決定](docs/quiz-world/quiz-world-pre-implementation-decisions.md)

## Current Status

- MVP初期方針はほぼ固定済みです。
- Phase 0ではローカル土台、ルーティング、静的画面、型の骨組みまでを扱います。
- 実際のDB接続や本格API実装は次Phaseで行います。
