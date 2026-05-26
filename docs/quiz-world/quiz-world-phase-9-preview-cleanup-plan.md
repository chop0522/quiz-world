# Phase 9 Preview Cleanup / Reset Plan

## 目的

Phase 9 Step G Preview smoke は、Framework PresetをNext.jsへ明示した後のGit連携Preview deploymentでpassした。

一方で、Preview DBにはsmoke検証で作成したtest users、question、launch、answers、rating、report、rank_events、admin_audit_logs、追加invite、suspended userなどが残っている。

Step Hの目的は、10人テスト候補へPreview URLを共有する前に、Preview DBを清潔な状態へ戻す方針と手順を整理することである。

このドキュメントはcleanup / reset実行前の計画である。

実行結果は `docs/quiz-world/quiz-world-phase-9-preview-cleanup-results.md` に記録する。

## 前提

- 対象projectはQuiz World専用Supabase Preview project `quiz-world-preview`
- Supabase project refは `ogfuohrvzfjmgvdewvcl`
- Smart BuzzerのSupabase projectではない
- Preview URL共有範囲はowner/adminのみ
- 10人テスト候補へはまだ共有しない
- Production deployはしない
- Production envは設定しない
- Production custom domainは設定しない
- Stripe、Web Push、Realtimeは扱わない
- secret実値、service role key、anon key、DB password、初期admin email実値はdocs/repoに書かない

## cleanup対象候補

| 対象 | cleanup対象にする理由 |
| --- | --- |
| `auth.users` | smoke signupで作成した検証ユーザーが残る可能性がある |
| `profiles` | smoke用admin / author / recipient / suspended userが残る |
| `world_members` | smoke userの参加状態やsuspended状態が残る |
| `waitlist` | 満員導線や手動検証時の登録が残る可能性がある |
| `invites` | smoke中にadmin APIで追加発行したinviteが残る |
| `questions` | smoke用questionが残る |
| `blocks` | 手動検証でblockを作った場合に残る |
| `quiz_launches` | smoke用launchが残る |
| `quiz_recipients` | smoke用recipient配信履歴が残る |
| `answers` | smoke用回答が残る |
| `question_ratings` | smoke用ratingが残る |
| `reports` | smoke用reportが残る |
| `rank_events` | smoke用score/rank eventが残る |
| `admin_audit_logs` | smoke用admin操作ログが残る |

## 残すべき初期データ

cleanup / reset後は、以下の初期データを残す。

| データ | 値 |
| --- | --- |
| 初期world | `クイズワールド` |
| world id | `00000000-0000-4000-8000-000000000001` |
| member_limit | `10` |
| world status | `active` |
| Preview invite code | `SEASON0-PREVIEW-001` |
| invite status | `active` |
| 初期admin | 初期admin email対象ユーザーがsignup後に `profiles.role = admin` になる方針。email実値はdocsに書かない |

## cleanup方式の比較

### 1. full reset + seed再投入

Preview DBをschemaごとresetし、migrationとPreview seedを再適用する。

メリット:

- smoke検証データを最も確実に消せる
- table間の参照関係やrank/audit/log系の残骸を残しにくい
- 10人テスト前の状態を再現しやすい
- migration適用順とseed手順の再確認にもなる

デメリット:

- Auth usersの扱いを別途確認する必要がある
- Supabase Preview projectへの破壊的操作なので、対象project確認を厳密に行う必要がある
- 実行後にseed状態とRLSを再確認する必要がある

### 2. targeted cleanup

Preview DBの対象tableからsmoke検証データだけを削除する。

メリット:

- 必要な初期データを残しやすい
- resetより短時間で済む可能性がある
- Auth usersを個別に整理できる

デメリット:

- table間の依存順を間違えると削除に失敗する
- smoke由来データの識別条件が曖昧だと残骸が残る
- `admin_audit_logs` や `rank_events` など、監査/履歴系が混ざりやすい
- 削除SQL/APIの作成自体にリスクがある

### 3. Supabase project作り直し

Preview project自体を削除し、新しいQuiz World専用Preview projectを作り直す。

メリット:

- 最も強い分離ができる
- Auth usersやStorageなども含めて完全に初期化できる

デメリット:

- project ref / public URL / Vercel Preview envの差し替えが必要
- Vercel envの再設定と再deployが必要になる
- Step AからStep Gの記録を再更新する必要がある
- 現時点では過剰

## 推奨方針

Preview DBは **full reset + seed再投入** を第一候補にする。

理由:

- Step G smokeで複数tableにまたがる検証データを作成している
- 10人テスト候補へ共有する前に、smoke検証データと本番候補データを混ぜないことを優先する
- targeted cleanupよりも、seed状態へ戻したことを説明しやすい

ただし、実行前にAuth usersの扱いを確認する。

確認事項:

- `supabase db reset --linked` またはremote reset相当の手順で `auth.users` が消えるか
- Auth usersが残る場合、Supabase DashboardまたはSQL/APIで検証ユーザーを整理する必要があるか
- 初期admin email対象ユーザーは、cleanup後に再signupする運用でよいか
- Preview invite code `SEASON0-PREVIEW-001` をseedで再投入できるか
- 現在のrepo内 `supabase/seed.sql` はlocal用 `SEASON0-TEST-001` を投入するため、Preview reset時には使わない
- Preview reset後は `supabase/seed.preview.sql` を使って `SEASON0-PREVIEW-001` を再投入する

## Preview seed方針

Preview seedはlocal seedと分離する。

| ファイル | 用途 | invite code |
| --- | --- | --- |
| `supabase/seed.sql` | Supabase local用 | `SEASON0-TEST-001` |
| `supabase/seed.preview.sql` | Supabase Preview用 | `SEASON0-PREVIEW-001` |

固定方針:

- `supabase/seed.sql` は維持し、local用として扱う
- `supabase/seed.preview.sql` はPreview cleanup / reset後のseed再投入専用にする
- `supabase/seed.preview.sql` は初期world `クイズワールド`、world id `00000000-0000-4000-8000-000000000001`、`member_limit=10` をidempotentに投入する
- `supabase/seed.preview.sql` はPreview invite code `SEASON0-PREVIEW-001` をidempotentに投入する
- `supabase/seed.preview.sql` には初期admin email実値、service role key、anon key、DB password、その他secret実値を書かない

Preview reset時は、local用seedが実行されないように `--no-seed` を使い、migration適用後にPreview seedを明示適用する。

実行案:

```bash
npx supabase db reset --linked --no-seed
npx supabase db query --linked --file supabase/seed.preview.sql
```

実行結果は `docs/quiz-world/quiz-world-phase-9-preview-cleanup-results.md` に記録した。

## Auth users cleanup方針

Auth usersはPreview cleanup / reset実行後に必ず件数を確認する。

固定方針:

- `supabase db reset --linked --no-seed` 後に `auth.users` 件数をread-onlyで確認する
- `auth.users` が0件なら、追加cleanupは不要とする
- `auth.users` が残った場合は、Supabase DashboardのAuthentication > Users、またはAdmin APIで検証ユーザーを削除する
- 削除対象はStep G smoke用の検証ユーザーのみとする
- 10人テスト用の実ユーザーが入る前に実行する
- 初期admin email実値はdocsに書かない
- Admin APIを使う場合でも、service role keyやtoken実値はdocs/repo/commit messageに書かない

Auth users cleanupの実行手順案:

1. Supabase Dashboardでprojectが `quiz-world-preview` / `ogfuohrvzfjmgvdewvcl` であることを確認する
2. Smart BuzzerのSupabase projectを開いていないことを確認する
3. Authentication > Usersで、Step G smoke用の検証ユーザーだけを対象にする
4. 10人テスト候補や本番候補ユーザーが含まれていないことを確認する
5. 対象ユーザーを削除する
6. `auth.users` 件数をread-onlyで再確認する
7. `profiles` / `world_members` に対応する残骸がないことを確認する

実行結果は `docs/quiz-world/quiz-world-phase-9-preview-cleanup-results.md` に記録した。今回のresetでは `auth.users=0` になったため、追加のAuth users cleanupは不要だった。

## 実行前チェック

cleanup / reset実行前に、以下を確認する。

| チェック | 期待結果 |
| --- | --- |
| `git status --short --branch` | clean |
| 対象Supabase project | `quiz-world-preview` |
| project ref | `ogfuohrvzfjmgvdewvcl` |
| public URL | `https://ogfuohrvzfjmgvdewvcl.supabase.co` |
| Smart Buzzer project | 開いていない / 対象にしていない |
| Preview URL共有範囲 | owner/adminのみ |
| Production deploy | 実行しない |
| Production env | 設定しない |
| Production custom domain | 設定しない |
| secret実値 | docs / README / commit messageに書かない |
| cleanup前件数 | read-only SQL/APIで確認する |
| Auth users | cleanup方式で消えるか、別整理が必要か確認する |

cleanup前に確認する件数:

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

## 2026-05-26 read-only確認結果

2026-05-26 23:03 JST に、Supabase CLIの `db query --linked` を使い、Quiz World Preview projectに対してread-only SQLだけを実行した。

この確認ではcleanup / resetは実行していない。

### 対象project確認

| 項目 | 確認結果 |
| --- | --- |
| local git status | clean |
| linked project ref | `ogfuohrvzfjmgvdewvcl` |
| linked project name | `quiz-world-preview` |
| Supabase project status | `ACTIVE_HEALTHY` |
| region | `ap-northeast-1` |
| remote PostgreSQL | `17.6` |
| Smart Buzzer project | 対象外。project ref / table一覧ともQuiz World Previewで確認 |

### cleanup前件数

| 対象 | 件数 |
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

確認結果:

- Step G smoke検証データはPreview DBに残っている
- `profiles` は `admin/active=1`、`user/active=3`、`user/suspended=1`
- `world_members` は `member/active=4`、`member/suspended=1`
- `questions` は `review_required=1`
- `reports` は `reviewing=1`
- `rank_events` はanswer由来3件、rating由来1件
- `admin_audit_logs` は4件

### 初期データ確認

| データ | 確認結果 |
| --- | --- |
| 初期world | `クイズワールド` が存在 |
| world id | `00000000-0000-4000-8000-000000000001` |
| member_limit | `10` |
| world status | `active` |
| Preview invite code | `SEASON0-PREVIEW-001` が存在 |
| invite status | `active` |
| invite max_uses / use_count | `100` / `5` |
| invite expires_at | `null` |

### migration / table / RLS確認

適用済みmigration:

- `20260516000100_phase1_signup_auth`
- `20260521000100_phase2_questions`
- `20260521000200_phase3_quiz_launches`
- `20260522000100_phase4_answers`
- `20260522000200_phase5_result_rating_reports`
- `20260522000300_phase6_rank_events`
- `20260522000400_phase7_admin_moderation`

public schemaのtableは以下14件のみで、想定外tableは0件だった。

- `admin_audit_logs`
- `answers`
- `blocks`
- `invites`
- `profiles`
- `question_ratings`
- `questions`
- `quiz_launches`
- `quiz_recipients`
- `rank_events`
- `reports`
- `waitlist`
- `world_members`
- `worlds`

RLSは上記14 tableすべてで有効だった。

Smart Buzzer由来らしいtable名やデータは確認されなかった。

### auth.usersの扱い

read-only確認では、`auth.users` が5件存在することは確認できた。

一方で、実際に `supabase db reset --linked` を実行しない限り、remote resetで `auth.users` の行が消えるかは確定できない。

Supabase CLIのhelpでは `supabase db reset --linked` はlinked projectをlocal migrationsでresetし、seed scriptを実行する挙動である。ただし、Auth usersはSupabase Auth管理領域のため、Step H実行時は以下のどちらかを前提にする。

- reset後に `auth.users` 件数を必ず再確認する
- `auth.users` が残った場合に備え、Dashboardまたは管理APIで検証ユーザーを整理する手順を用意する

### Preview seed再投入の注意

現在のrepo内 `supabase/seed.sql` はlocal用 `SEASON0-TEST-001` を投入する。

そのため、Preview DBをfull resetする場合、local用seedは使わず、Preview用 `supabase/seed.preview.sql` を使う。

Preview用seed手順は以下に固定する。

1. `supabase db reset --linked --no-seed` でlocal用seedをskipする
2. `supabase db query --linked --file supabase/seed.preview.sql` でPreview用seedを明示適用する
3. 初期worldと `SEASON0-PREVIEW-001` をread-onlyで確認する

Auth users cleanup手順とPreview seed再投入手順を固定し、この方針でStep H cleanup / resetを実行済みである。

実行結果は `docs/quiz-world/quiz-world-phase-9-preview-cleanup-results.md` に記録した。

## 実行手順案

実行時は人間GOを取ったうえで進める。

full reset + seed再投入の手順案:

1. `git status --short --branch` がcleanであることを確認する
2. Supabase CLIのlink先が `ogfuohrvzfjmgvdewvcl` であることを確認する
3. cleanup前の主要table件数をread-onlyで記録する
4. `npx supabase db reset --linked --no-seed` でPreview DBをresetし、migrationを再適用する
5. `npx supabase db query --linked --file supabase/seed.preview.sql` でPreview seedを投入する
6. `auth.users` 件数をread-onlyで確認する
7. `auth.users` が残っている場合は、Supabase DashboardまたはAdmin APIでStep G smoke用検証ユーザーを削除する
8. 初期worldとPreview invite codeを確認する
9. RLSが維持されていることを確認する
10. smoke検証データが消えていることを確認する
11. 必要なら初期admin email対象ユーザーで再signupし、admin roleを確認する

実行結果は `docs/quiz-world/quiz-world-phase-9-preview-cleanup-results.md` に記録した。

## 実行後確認

cleanup / reset後に確認すること:

| 確認 | 期待結果 |
| --- | --- |
| 初期world | `クイズワールド` が存在する |
| world id | `00000000-0000-4000-8000-000000000001` |
| member_limit | `10` |
| Preview invite code | `SEASON0-PREVIEW-001` がactive |
| smoke test users | 消えている、または人間が意図して残したものだけ |
| questions / launches / answers | smoke由来データが消えている |
| ratings / reports | smoke由来データが消えている |
| rank_events | smoke由来データが消えている |
| admin_audit_logs | smoke由来データが消えている、または保持判断が明記されている |
| RLS | 主要tableで有効 |
| Preview URL共有範囲 | owner/adminのみ |

## Step H完了条件

Step Hは、以下を満たしたら完了とする。

- cleanup / reset方針が決まる
- 実行手順が明文化される
- 実行前に人間GOを取る運用が明記される
- Auth usersの扱いが確認される
- cleanup / reset実行後に軽いPreview確認を行う手順がある
- Production deploy / Production env / Production custom domainに進まない方針が維持される
- Smart Buzzerと混ぜない方針が維持される

## Step Iへ進む条件

Step Iへ進む前に、以下を満たす。

- Step H cleanup / resetを実行済み
- Preview DBがseed状態に戻っている
- 初期world / Preview invite code / RLSを確認済み
- Preview URL共有範囲がowner/adminのみである
- 10人テスト候補への共有可否を別途GO/NO-GO判断する
- `v0.10.0-phase9-preview-ready` tagを作るかどうかを別途判断する
