# 通知型早押しクイズワールド 環境設計案

## 目的

Quiz Worldを既存Smart Buzzerとは完全分離した新規プロジェクトとして扱うための環境設計案をまとめる。

このドキュメントはdocsのみであり、実際のenv作成、Supabase project作成、Vercel project作成、Stripe設定は行わない。

## 基本方針

- 既存Smart Buzzerとは完全分離する。
- 新規Supabase projectを作る想定にする。
- 新規Vercel projectを作る想定にする。
- StripeはMVPでは使わない。
- service role keyはサーバー専用。
- clientにsecretを出さない。
- Local / Preview / Production を分離する。
- Phase 0ではVercel不要。localで主要機能が動いてから新規Vercel Preview projectを作る。
- Phase 0〜Phase 3はSupabase localを推奨する。
- Supabase localが難しい場合のみ、Quiz World専用の新規development projectを使う。
- 10人テスト直前にProductionを有効化する。

## 環境区分

| 環境 | 用途 | cloud作成タイミング |
| --- | --- | --- |
| Local | 開発者ローカル。UI/API/RLS草案検証。 | Phase 0から。Supabase local推奨。 |
| Preview | 招待前の確認、ChatGPT Proレビュー後の動作確認。 | localで主要機能が動いてから。 |
| Production | 10人テスト本番。 | 10人テスト直前。 |

## Supabase方針

| 項目 | 方針 |
| --- | --- |
| project | Quiz World専用の新規project。 |
| Auth | Supabase Authを想定。 |
| DB | Supabase Postgresを想定。 |
| RLS | 全MVPテーブルで有効化前提。 |
| Realtime | Phase 1は15秒ポーリング。Phase 1.5では本人宛quiz_recipients新着だけ検討。 |
| service role | サーバー専用。clientへ露出禁止。 |

Phase 0〜Phase 3は Supabase local を推奨する。
Supabase local が難しい場合のみ、Smart Buzzerとは別のQuiz World専用development projectを使う。
Production projectは10人テスト直前に作る。

## Vercel方針

| 項目 | 方針 |
| --- | --- |
| project | Quiz World専用の新規Vercel project。 |
| Preview | localで主要機能が動いた後に作る。 |
| Production | 10人テスト直前に有効化する。 |
| env | Smart Buzzerとは共有しない。 |

Phase 0ではVercelを使わない。

## Stripe方針

MVPではStripeを使わない。

- 課金なし。
- 配信人数増加は課金ではなく出題ランクで行う。
- 参加枠増加はワールド全体の活動と品質で行う。
- 将来課金を入れる場合は、規約、プライバシーポリシー、DB、Webhook、server validationを別途設計する。

## env名の案

| env名 | 公開範囲 | 用途 |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | client可 | Supabase project URL。 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client可 | Supabase anon key。RLS前提で利用。 |
| `SUPABASE_SERVICE_ROLE_KEY` | server専用 | admin操作、抽選、順位計算など。client露出禁止。 |
| `NEXT_PUBLIC_APP_URL` | client可 | アプリURL。リンク生成やcallback用。 |
| `ADMIN_EMAILS` | server専用推奨 | 初期admin候補メール。カンマ区切りなど。 |
| `QUIZ_WORLD_ID` | server専用推奨 | MVPの単一world ID。 |
| `NOTIFICATION_PHASE` | server/client方針次第 | `screen` or `web_push`。Phase切り替え。 |
| `MAX_INITIAL_MEMBERS` | server専用推奨 | Season 0の初期上限。デフォルト10。 |

## secret取り扱い

- `SUPABASE_SERVICE_ROLE_KEY` はサーバー専用。
- `ADMIN_EMAILS` はclientへ出さない方がよい。
- `QUIZ_WORLD_ID` は公開しても致命的ではないが、server側で扱う方針に寄せる。
- `NEXT_PUBLIC_` が付くenvにはsecretを入れない。
- PreviewとProductionでenvを分ける。

## Local環境

Localでは次を使う。

- ローカルenvファイル。
- Supabase localを推奨。
- Supabase localが難しい場合のみ、Quiz World専用の新規Supabase development project。
- seedデータは10人テスト用とは分ける。
- service role keyはローカル専用。

Localで本番相当のsecretを使わない。

## Preview環境

Previewでは次を検証する。

- signup flow
- invite / waitlist
- 出題
- 回答
- 結果
- admin
- RLS

Previewのデータは本番10人テストと混ぜない。

## Production環境

Productionは10人テスト直前に作る。

作る場合は次を満たす。

- Quiz World専用Supabase project
- Quiz World専用Vercel project
- production envのレビュー
- adminユーザーの確認
- invite code発行手順
- rollbackまたは一時停止手順

## まだ作らないもの

- 実際のenvファイル
- Supabase project
- Vercel project
- Stripe account連携
- Web Push provider設定
- production secret
- live key

## Phase 0で決めること

1. `ADMIN_EMAILS` を初期admin付与に使うか。
2. `NOTIFICATION_PHASE` をenvで切り替えるか、MVP初期はコード定数にするか。
3. Supabase localが難しい場合にだけ使うdevelopment projectの作成手順。
