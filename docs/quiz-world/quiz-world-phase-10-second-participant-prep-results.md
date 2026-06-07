# Phase 10 Second Participant Prep Results

実施日: 2026-06-07 JST

## 1. 目的

信頼できる1名の個別テスト開始後、2名目へ限定共有できるかを確認した。

この確認では、Preview URLと参加者別invite codeはまだ2名目へ共有していない。10人テスト候補全員への共有、SNS/公開ページ共有、Production deploy、Production env設定、Production custom domain設定、Stripe、Web Push、Realtimeは行っていない。Smart Buzzerにも触れていない。

## 2. GPT Proレビュー結果

GPT Proへの追加レビューでは、2名目共有前のP0/P1実装修正は残っていないという判断だった。

整理された優先度:

- P0: なし
- P1: なし
- forgot password: Phase 10の1〜2名テストではP2。まずはownerへの個別DMサポートで運用する
- username変更: P2。実装する場合は `/account` に保存ボタンと保存APIをセットで置く
- avatar設定: P3。Web Previewの1〜2名テストでは不要

2名目共有前に行うべき作業は、read-only DB確認、`/account` / `/admin` / `/api/admin/*` の保護確認、2名目用の参加者別invite code発行、`invite_created` audit log確認である。

## 3. 対象環境

| 項目 | 値 |
| --- | --- |
| Supabase project | `quiz-world-preview` |
| Supabase project ref | `ogfuohrvzfjmgvdewvcl` |
| Preview deployment | `https://quiz-world-preview-38ugdhavs-chop0522s-projects.vercel.app` |
| branch / commit | `preview` / `3d0895c` |
| Production Branch | `production-hold` |

secret実値、service role key、anon key、DB password、初期admin email実値、Vercel token、bypass secret、参加者別invite code実値はdocs/repoに記録していない。

## 4. Read-only DB確認

2名目用invite発行前に、Preview DBをread-onlyで確認した。

| 項目 | 結果 |
| --- | --- |
| `auth.users` | `2` |
| `profiles` | `2` |
| `profiles` 内訳 | `admin:active=1`, `user:active=1` |
| `world_members` | `2` |
| `world_members` 内訳 | `member:active=2` |
| active member count | `2` |
| remaining seats | `8` |
| initial world | `クイズワールド` |
| member_limit | `10` |
| current_season | `0` |
| Preview invite code `SEASON0-PREVIEW-001` | active |
| local用 invite code `SEASON0-TEST-001` | Preview DBに存在しない |
| participant-specific invites | `1` |
| participant-specific invite status | 1件は使用済み |
| `admin_audit_logs` | `1` |

テーブル件数:

| table | count |
| --- | ---: |
| `waitlist` | `0` |
| `invites` | `2` |
| `questions` | `1` |
| `blocks` | `0` |
| `quiz_launches` | `1` |
| `quiz_recipients` | `1` |
| `answers` | `1` |
| `question_ratings` | `1` |
| `reports` | `0` |
| `rank_events` | `3` |
| `admin_audit_logs` | `1` |

この状態は、owner/admin確認用ユーザー1名と信頼できる参加者1名が入っているPhase 10の1名テスト状態として想定内である。Preview DBはseed直後の空状態ではないが、2名目共有前の再cleanupは行わない方針と一致している。

## 5. Preview API / route確認

Vercel CLIのDeployment Protection bypassで確認した。

| 対象 | 結果 |
| --- | --- |
| `/api/world` | pass。`activeMemberCount=2`, `memberLimit=10`, `remainingSeats=8`, `currentSeason=0` を返す |
| `/account` 未ログイン表示 | pass。ログインが必要であること、パスワード変更とログアウト導線の説明を表示する |
| `/account` raw内部状態 | pass。可視テキストにraw `role` / `status` / `active` は出ない |
| `/admin` 未ログイン表示 | pass。管理者だけが利用できるページであることと、ログインが必要であることを表示する |
| `/admin` 内部DB条件 | pass。可視テキストに `profiles.role` / `profiles.status` / `Phase 7 admin` は出ない |
| `/api/admin/users` 未ログイン保護 | pass。`ログインが必要です。` を返す |
| `/api/admin/reports` 未ログイン保護 | pass。`ログインが必要です。` を返す |
| `/api/admin/questions` 未ログイン保護 | pass。`ログインが必要です。` を返す |

`/admin` page と `/api/admin/*` のserver-side protectionは維持されている。

## 6. 2名目用invite発行

2名目用の参加者別invite codeを1件発行した。

発行内容:

- 用途: Phase 10 second limited participant
- `max_uses`: `1`
- status: `active`
- use_count: `0`
- `admin_audit_logs.action`: `invite_created`
- audit reason: `Phase 10 second limited participant`

確認結果:

| 項目 | 結果 |
| --- | --- |
| 2名目用invite作成 | pass |
| 2名目用invite active確認 | pass |
| 2名目用invite max_uses | `1` |
| 2名目用invite use_count | `0` |
| `admin_audit_logs` の `invite_created` | pass |
| Preview invite code `SEASON0-PREVIEW-001` | activeのまま維持 |
| 2名目へのPreview URL共有 | 未実行 |
| 2名目へのinvite code共有 | 未実行 |

2名目用の参加者別invite code実値はdocs、README、commit message、PR本文に書かない。共有する場合はownerが安全な方法で実値を確認し、Preview URLと一緒に個別DMでのみ渡す。

## 7. Production / secret確認

| 項目 | 結果 |
| --- | --- |
| Production deployment追加 | なし |
| Production env | 未設定のまま |
| Production custom domain | 未設定のまま |
| Stripe / Web Push / Realtime | 未実施 |
| Smart Buzzer | 未変更 |
| secret実値 | docs/repoに未記録 |

## 8. 判断

判定: 2名目への限定共有はGO候補。

ただし、2名目へのPreview URL共有とinvite code共有はまだ実行していない。実行する場合は、Preview URLと参加者別invite codeを個別DMでのみ共有する。10人テスト候補全員への共有、SNS/公開ページ共有、Production deploy、Production env設定、Production custom domain設定、Stripe、Web Push、Realtimeは引き続き行わない。

## 9. 次の作業

1. ownerが2名目へ共有する相手を最終確認する。
2. 2名目へPreview URLと参加者別invite codeを個別DMで共有する。
3. 共有実行日時をdocsに記録する。
4. 2名目のsignup / login / 主要ループ / 不具合報告を確認する。
5. P0/P1が出た場合は2名目以降の拡張を止める。
