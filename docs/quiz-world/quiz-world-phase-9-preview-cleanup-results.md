# Phase 9 Preview Cleanup / Reset Results

## 概要

Phase 9 Step Hとして、Quiz World専用Supabase Preview project `quiz-world-preview` のPreview DB cleanup / resetを実行した。

結果は **pass**。

`supabase db reset --linked --no-seed` でPreview DBをfull resetし、local用seedを使わずに `supabase/seed.preview.sql` を明示適用した。reset後、初期worldとPreview invite codeは復元され、Step G smoke由来データは削除された。

Production deploy、Production env設定、Production custom domain設定、Stripe、Web Push、Realtime、Smart Buzzer側の変更は行っていない。

## 実行情報

| 項目 | 内容 |
| --- | --- |
| 実行日時 | `2026-05-27 01:38 JST` |
| 対象Supabase project | `quiz-world-preview` |
| project ref | `ogfuohrvzfjmgvdewvcl` |
| cleanup方式 | full reset + migration再適用 + Preview seed再投入 |
| Preview seed | `supabase/seed.preview.sql` |
| Preview URL共有範囲 | owner/adminのみ |
| `v0.10.0-phase9-preview-ready` tag | 未作成 |

## 実行コマンド

```bash
git status --short --branch
cat supabase/.temp/project-ref
npx supabase db query --linked --output json "<read-only count queries>"
npx supabase db reset --linked --no-seed --yes
npx supabase db query --linked --file supabase/seed.preview.sql --output json
npx supabase db query --linked --output json "<post-cleanup verification queries>"
npx vercel curl / --deployment https://quiz-world-preview-ri8igtw45-chop0522s-projects.vercel.app -- --silent --show-error --output /tmp/quiz-world-preview-root.html --write-out 'root_http_code:%{http_code}\n'
npx vercel curl /api/world --deployment https://quiz-world-preview-ri8igtw45-chop0522s-projects.vercel.app -- --silent --show-error --write-out '\napi_world_http_code:%{http_code}\n'
```

env実値、Supabase key、DB password、初期admin email実値、Vercel token、bypass secretは表示・記録していない。

## 実行前read-only確認

| 対象 | cleanup前件数 |
| --- | ---: |
| `auth.users` | 5 |
| `profiles` | 5 |
| `world_members` | 5 |
| `waitlist` | 0 |
| `invites` | 2 |
| `questions` | 1 |
| `blocks` | 0 |
| `quiz_launches` | 1 |
| `quiz_recipients` | 3 |
| `answers` | 2 |
| `question_ratings` | 1 |
| `reports` | 1 |
| `rank_events` | 4 |
| `admin_audit_logs` | 4 |

cleanup前にはStep G smoke由来データがPreview DBに残っていた。

## Reset / Migration結果

`npx supabase db reset --linked --no-seed --yes` を実行し、linked project `ogfuohrvzfjmgvdewvcl` に対してremote resetを行った。

適用されたmigration:

| version | 内容 |
| --- | --- |
| `20260516000100` | Phase 1 signup/auth |
| `20260521000100` | Phase 2 questions |
| `20260521000200` | Phase 3 quiz launches |
| `20260522000100` | Phase 4 answers |
| `20260522000200` | Phase 5 result/rating/reports |
| `20260522000300` | Phase 6 rank events |
| `20260522000400` | Phase 7 admin moderation |

reset output上、`auth.users` はtruncateされた。reset後の確認でも `auth.users=0` だったため、DashboardまたはAdmin APIでの追加Auth cleanupは不要だった。

## Preview Seed結果

`supabase/seed.preview.sql` を明示適用した。

復元された初期データ:

| データ | 結果 |
| --- | --- |
| 初期world | `クイズワールド` |
| world id | `00000000-0000-4000-8000-000000000001` |
| `member_limit` | 10 |
| world status | `active` |
| Preview invite code | `SEASON0-PREVIEW-001` |
| invite status | `active` |
| invite use count | 0 |

Preview DBには `SEASON0-TEST-001` は存在しない。

## Cleanup後DB確認

| 対象 | cleanup後件数 |
| --- | ---: |
| `auth.users` | 0 |
| `worlds` | 1 |
| `profiles` | 0 |
| `world_members` | 0 |
| `waitlist` | 0 |
| `invites` | 1 |
| `questions` | 0 |
| `blocks` | 0 |
| `quiz_launches` | 0 |
| `quiz_recipients` | 0 |
| `answers` | 0 |
| `question_ratings` | 0 |
| `reports` | 0 |
| `rank_events` | 0 |
| `admin_audit_logs` | 0 |

Step G smoke由来のusers、profiles、questions、launches、recipients、answers、ratings、reports、rank_events、admin_audit_logsは削除された。

## RLS確認

主要14 tableでRLSが有効であることを確認した。

対象:

- `worlds`
- `profiles`
- `world_members`
- `waitlist`
- `invites`
- `questions`
- `blocks`
- `quiz_launches`
- `quiz_recipients`
- `answers`
- `question_ratings`
- `reports`
- `rank_events`
- `admin_audit_logs`

## Smart Buzzer混入確認

public schemaのbase tableはQuiz World想定tableのみで、想定外public tableは0件だった。

Smart Buzzer由来のpublic tableやデータは確認されていない。

## Preview URL軽量確認

Vercel CLI protection bypass経由で、Preview URLの軽量確認を行った。

| route | 結果 |
| --- | --- |
| `/` | 200。Quiz WorldのHTMLを返した |
| `/api/world` | 200。初期world、`memberLimit=10`、`activeMemberCount=0`、`remainingSeats=10` を返した |
| `/signup` | 200 |
| `/legal/terms` | 200 |
| `/legal/privacy` | 200 |

`NEXT_PUBLIC_APP_URL` は未設定のままだが、今回の軽量確認ではruntime blockerは見つかっていない。

## Production / Secret確認

| 確認 | 結果 |
| --- | --- |
| Production deploy | 実行していない |
| Production env | 未設定 |
| Production custom domain | 未設定 |
| Stripe | 未実施 |
| Web Push / Realtime | 未実施 |
| Smart Buzzer | 触っていない |
| secret実値 | docs / README / repo / commit messageに記録していない |

## 結論

Phase 9 Step H cleanup / resetはpass。

Preview DBは、10人テスト候補へ共有する前のseed状態へ戻った。

残る次アクション:

1. cleanup resultsをcommit / pushする
2. 必要ならPreviewでsignupからの軽量再確認を行う
3. `v0.10.0-phase9-preview-ready` tagを作成するか判断する
4. Preview URL共有範囲は引き続きowner/adminのみを維持する
