# Phase 9 Preview DB Smoke Results

## Summary

Phase 9 Step Cとして、Quiz World専用Supabase Preview DBの読み取り中心smokeを実行した。

- 実行日時: `2026-05-24 15:13 JST`
- 対象project: `quiz-world-preview`
- Supabase project ref: `ogfuohrvzfjmgvdewvcl`
- Supabase public URL: `https://ogfuohrvzfjmgvdewvcl.supabase.co`
- region: `Northeast Asia (Tokyo) ap-northeast-1`
- plan: Free / NANO
- 結果: pass

service role key、anon key、DB password、その他secret実値はこのdocsにもrepoにも記録しない。

## Executed Commands

```bash
git status --short --branch
cat supabase/.temp/project-ref
git log --oneline --decorate -3
npx supabase migration list --linked
npx supabase db query --linked -o json "<world確認SQL>"
npx supabase db query --linked -o json "<invite確認SQL>"
npx supabase db query --linked -o json "<table存在確認SQL>"
npx supabase db query --linked -o json "<RLS確認SQL>"
npx supabase db query --linked -o json "<table件数確認SQL>"
npx supabase db query --linked -o json "<local invite code不在確認SQL>"
npx supabase db query --linked -o json "<Smart Buzzer混入確認SQL>"
npx supabase db query --linked -o json "<index件数確認SQL>"
```

## Git / Link Check

| Item | Result |
| --- | --- |
| git status | clean: `## main...origin/main` |
| Supabase linked project ref | `ogfuohrvzfjmgvdewvcl` |
| latest commit at execution | `e3ae29a docs: record phase 9 preview db migration seed` |
| Smart Buzzer project | not touched |

## Migration History

`npx supabase migration list --linked` で、local / remoteのmigration一致を確認した。

| Migration | Remote |
| --- | --- |
| `20260516000100` | applied |
| `20260521000100` | applied |
| `20260521000200` | applied |
| `20260522000100` | applied |
| `20260522000200` | applied |
| `20260522000300` | applied |
| `20260522000400` | applied |

## Seed Check

| Check | Result |
| --- | --- |
| 初期world | `クイズワールド` exists |
| world id | `00000000-0000-4000-8000-000000000001` |
| `member_limit` | `10` |
| world status | `active` |
| Preview invite code | `SEASON0-PREVIEW-001` exists |
| Preview invite status | `active` |
| local用 invite code | `SEASON0-TEST-001` はPreview DBに存在しない |

## Table Existence

以下14テーブルがPreview DBに存在することを確認した。

| Table | Exists |
| --- | --- |
| `worlds` | yes |
| `profiles` | yes |
| `world_members` | yes |
| `waitlist` | yes |
| `invites` | yes |
| `questions` | yes |
| `blocks` | yes |
| `quiz_launches` | yes |
| `quiz_recipients` | yes |
| `answers` | yes |
| `question_ratings` | yes |
| `reports` | yes |
| `rank_events` | yes |
| `admin_audit_logs` | yes |

## RLS Check

主要14テーブルすべてでRLSが有効であることを確認した。

| Table | RLS |
| --- | --- |
| `admin_audit_logs` | enabled |
| `answers` | enabled |
| `blocks` | enabled |
| `invites` | enabled |
| `profiles` | enabled |
| `question_ratings` | enabled |
| `questions` | enabled |
| `quiz_launches` | enabled |
| `quiz_recipients` | enabled |
| `rank_events` | enabled |
| `reports` | enabled |
| `waitlist` | enabled |
| `world_members` | enabled |
| `worlds` | enabled |

## Row Counts

Preview DBはseed想定どおり、初期worldとPreview invite codeのみを持つ状態だった。

| Table | Row count |
| --- | ---: |
| `admin_audit_logs` | 0 |
| `answers` | 0 |
| `blocks` | 0 |
| `invites` | 1 |
| `profiles` | 0 |
| `question_ratings` | 0 |
| `questions` | 0 |
| `quiz_launches` | 0 |
| `quiz_recipients` | 0 |
| `rank_events` | 0 |
| `reports` | 0 |
| `waitlist` | 0 |
| `world_members` | 0 |
| `worlds` | 1 |

## Index Check

主要テーブルにindexが存在することを確認した。

| Table | Index count |
| --- | ---: |
| `admin_audit_logs` | 4 |
| `answers` | 6 |
| `blocks` | 4 |
| `invites` | 4 |
| `profiles` | 4 |
| `question_ratings` | 4 |
| `questions` | 5 |
| `quiz_launches` | 5 |
| `quiz_recipients` | 5 |
| `rank_events` | 5 |
| `reports` | 7 |
| `waitlist` | 4 |
| `world_members` | 4 |
| `worlds` | 1 |

## Separation Check

| Check | Result |
| --- | --- |
| Smart Buzzer由来のworld名 | 0件 |
| Smart Buzzer由来のtable混入 | 確認対象tableはQuiz World想定どおり |
| 本番データ混入 | `profiles` / `questions` / `quiz_launches` / `answers` などは0件 |
| secret記録 | なし |

## Issues

なし。

## Next

- Vercel Preview project作成へ進む前に、別途GO/NO-GO判断を行う。
- Preview環境のenv設定では、service role key、anon key、初期admin email実値をrepo/docsに書かず、Vercel Preview envにのみ設定する。
- Production deploy、Stripe、Web Push、Realtimeは引き続き扱わない。
