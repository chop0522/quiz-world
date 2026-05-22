# Phase 8 10-user Local Smoke / Ops Rehearsal Plan

## 1. Phase 8 の目的

Phase 8では、10人テスト前にlocal環境だけでMVP主要ループを通し確認する。

これは機能追加フェーズではなく、既に実装済みのPhase 1〜7を使った運用リハーサルである。Supabase localのみを使い、Supabase cloud project、Vercel project、Stripe、production deploy、Web Push、Realtimeには進まない。

確認する中心は次の通り。

- signup / login / invite / waitlist
- question authoring
- quiz launch / recipients
- `/home` の15秒ポーリング
- `/quiz/[launchId]` のstart_at / end_at制御
- answer submission / answer_rank / correct_rank
- `/result/[launchId]`
- rating / report
- rank_events / profile score / rank
- admin moderation / admin_audit_logs

## 2. Smoke Scenario

Phase 8の標準シナリオは、以下の順で実行する。

| No. | 手順 | 期待結果 |
| --- | --- | --- |
| 1 | admin user を用意する | `profiles.role = admin` かつ `profiles.status = active` になる。 |
| 2 | userA / userB / userC など複数ユーザーを用意する | 全員が通常ユーザーとしてsignupできる。 |
| 3 | admin が invite code を発行する | invite code が作成され、admin_audit_logs に記録される。 |
| 4 | user が signup する | invite code検証、18歳以上確認、terms/privacy同意、world_members作成が完了する。 |
| 5 | 参加枠 / waitlist を確認する | member_limit内は参加、満員時はwaitlistへ誘導される。 |
| 6 | userA が question を作成する | 四択、固定カテゴリ、difficulty、statusが保存される。 |
| 7 | userA が active question を launch する | quiz_launches / quiz_recipients が作成される。 |
| 8 | userB / userC に届く | 出題者本人はrecipientにならず、対象者だけに届く。 |
| 9 | `/home` の15秒ポーリングで届いたクイズが見える | 本人宛のlaunchだけ表示される。 |
| 10 | start_at前は問題本文・選択肢が見えない | `/home` と回答画面で本文・選択肢が漏れない。 |
| 11 | start_at後に `/quiz/[launchId]` で回答できる | recipient本人だけが回答できる。 |
| 12 | userB が正解する | `is_correct = true`、answer_rank、correct_rankが採番される。 |
| 13 | userC が不正解する | `is_correct = false`、answer_rankが採番され、correct_rankはnullになる。 |
| 14 | `/result/[launchId]` で結果を見る | 自分の正誤、全回答者、未回答者、正解が見える。 |
| 15 | rating を作成する | recipientが1回だけ評価できる。 |
| 16 | report を作成する | 重複reportは防がれ、statusはopenで保存される。 |
| 17 | rank_events が作られる | 正解・ratingに応じたイベントだけが作られる。0点イベントは作られない。 |
| 18 | `/profile` で score / rank が見える | answer_score / questioner_score / rank_events が表示される。 |
| 19 | `/admin` で report を確認する | adminだけがreport一覧と詳細を確認できる。 |
| 20 | admin が question を review_required / suspended にする | question statusが更新され、admin_audit_logsに記録される。 |
| 21 | admin が user を suspended にする | profiles.status と world_members.status がsuspendedになる。 |
| 22 | admin_audit_logs が残ることを確認する | すべてのadmin操作にreason付きログが残る。 |

## 3. Seed / Test User 方針

Phase 8は再現性を優先し、テスト前にSupabase localをseed状態へ戻す。

推奨手順:

```bash
npx supabase start
npx supabase db reset
```

テストユーザー方針:

| 種別 | 例 | 用途 |
| --- | --- | --- |
| admin | `admin@example.com` | invite発行、report確認、moderation、audit確認。 |
| userA | `user-a@example.com` | question author / launch author。 |
| userB | `user-b@example.com` | recipient、正解回答、rating、report。 |
| userC | `user-c@example.com` | recipient、不正解回答、rating、report。 |
| userD以降 | `user-d@example.com` など | 参加枠、waitlist、recipient抽選、suspension確認。 |

固定データ方針:

- 初期worldは `クイズワールド` を使う。
- 既存seedの `SEASON0-TEST-001` と、adminが発行したinvite codeを使い分ける。
- smoke用questionは、正解と不正解を確実に作れる内容にする。
- rehearsal後は `npx supabase db reset` でseed状態へ戻せる前提にする。
- cloud user、cloud database、Vercel環境は作らない。

## 4. 手動確認手順

手動確認は、ブラウザ上で実ユーザーに近い流れを確認する。

1. Supabase localを起動し、local envが `.env.local` に入っていることを確認する。
2. `npm run dev -- --hostname 127.0.0.1` を起動する。
3. `/signup` でadmin/userA/userB/userCを作成する。
4. `/login` で各ユーザーにログインできることを確認する。
5. adminで `/admin` を開き、non-adminでは403相当になることを確認する。
6. adminでinvite codeを発行する。
7. userAで `/create` からactive questionを作る。
8. userAで作成済み問題一覧からlaunchする。
9. userB/userCで `/home` を開き、15秒ポーリングで届いたクイズを確認する。
10. start_at前に `/quiz/[launchId]` で本文・選択肢が見えないことを確認する。
11. start_at後にuserBは正解、userCは不正解で回答する。
12. `/result/[launchId]` で正誤、answer_rank、correct_rank、全回答者、未回答者を確認する。
13. userB/userCでratingとreportを作成する。
14. `/profile` でscore / rank / rank_eventsを確認する。
15. adminでreportを確認し、question/user moderationを実行する。
16. admin_audit_logsが作成されたことを確認する。

## 5. API確認手順

API確認は、画面で確認しづらい権限・重複・status制御を中心に行う。

| API | 確認内容 |
| --- | --- |
| `POST /api/signup` | invite、18歳以上確認、terms/privacy同意、member_limit、admin role付与。 |
| `POST /api/invites/validate` | 有効/無効code、使用済みcode、期限切れcode。 |
| `POST /api/waitlist` | 満員時登録、email重複防止。 |
| `GET /api/world` | 初期world、member_limit、active member count。 |
| `GET /api/profile` | profile、world membership、score/rank、recent rank_events。 |
| `POST /api/questions` | 四択validation、category、status、author権限。 |
| `GET /api/questions` | 自分の問題一覧だけ返ること。 |
| `PATCH /api/questions/[id]` | author編集、suspended指定不可。 |
| `POST /api/quiz-launches` | active questionのみ、author本人のみ、recipient抽選、daily limit。 |
| `GET /api/quiz-launches` | recipient本人宛だけ返ること。 |
| `GET /api/quiz-launches/[id]` | start_at前後の本文・選択肢制御、correctChoiceId非返却。 |
| `POST /api/quiz-launches/[id]/answer` | recipient本人、start_at/end_at、重複回答、rank採番。 |
| `GET /api/quiz-launches/[id]/result` | result閲覧権限、correctChoiceId、全回答者、未回答者。 |
| `POST /api/quiz-launches/[id]/rating` | recipientのみ、重複rating防止、reason固定。 |
| `POST /api/reports` | recipient/authorのみ、重複report防止、question.status自動更新なし。 |
| `GET /api/admin/reports` | adminのみ。 |
| `PATCH /api/admin/reports/[id]` | status更新、reason必須、audit log。 |
| `PATCH /api/admin/questions/[id]/moderation` | review_required / suspended、audit log。 |
| `PATCH /api/admin/users/[id]/suspend` | self suspend不可、profile/world_members同時suspend、audit log。 |
| `GET /api/admin/waitlist` | adminのみ。 |
| `PATCH /api/admin/waitlist/[id]` | status更新、rejected reason必須、audit log。 |
| `GET /api/admin/invites` | adminのみ。 |
| `POST /api/admin/invites` | code生成/入力、uppercase、reason必須、audit log。 |
| `GET /api/admin/audit-logs` | adminのみ。 |

## 6. UI確認手順

| 画面 | 確認内容 |
| --- | --- |
| `/` | MVPの状態がPhase 1〜7のlocal実装と矛盾しないこと。 |
| `/signup` | 18歳以上確認、terms/privacy同意、invite code、waitlist誘導。 |
| `/login` | email/password login。 |
| `/home` | 届いたクイズ一覧、15秒ポーリング、start_at/end_at状態。 |
| `/create` | 四択作成、作成済み問題一覧、launch導線。 |
| `/quiz/[launchId]` | start_at前非表示、回答受付中、回答済み、締切済み、対象外。 |
| `/result/[launchId]` | 自分の正誤、全回答者、未回答者、rating、report。 |
| `/profile` | score/rank、recent rank_events、profile状態。 |
| `/world` | member count、member_limit、world状態。 |
| `/invite` | invite code入力、waitlist状態。 |
| `/admin` | Overview、Reports、Questions、Users、Waitlist、Invites、Audit Logs。 |

## 7. DB確認手順

Supabase local上で、主要テーブルの整合性を確認する。

| テーブル | 確認内容 |
| --- | --- |
| `profiles` | role、status、answer_score/rank、questioner_score/rank。 |
| `world_members` | active/suspended、user suspension時の同期。 |
| `invites` | code、status、used_by、admin発行code。 |
| `waitlist` | status、email重複防止、admin更新。 |
| `questions` | author、status、category、category_note、suspended/review_required。 |
| `quiz_launches` | author、world、recipient_count、start_at、end_at。 |
| `quiz_recipients` | recipient本人、notification_status、出題者本人除外。 |
| `answers` | unique launch/user、answer_rank、correct_rank、is_correct。 |
| `question_ratings` | unique launch/rater、rating、reason。 |
| `reports` | unique question/launch/reporter/reason、status open。 |
| `rank_events` | 0点イベントなし、source重複なし、本人/adminのみ閲覧。 |
| `admin_audit_logs` | admin操作ごとのaction、target、reason、metadata。 |

特に確認する漏えい防止:

- `/quiz/[launchId]` の回答受付中APIで `correctChoiceId` が返らない。
- resultで `category_note` やemailが返らない。
- start_at前に問題本文と選択肢が返らない。
- admin系データをnon-adminが読めない。
- service role keyやsecretがclient bundleやgit diffに含まれない。

## 8. Expected Results

Phase 8の期待結果は次の通り。

- Phase 1〜7の主要ループがSupabase localだけで通る。
- 10人未満の複数ユーザーでinvite、signup、launch、answer、result、rating、report、rank、admin確認まで通る。
- 参加枠上限とwaitlistの基本動作を確認できる。
- start_at前の問題本文・選択肢非表示が守られる。
- answer_rank / correct_rank がサーバー側で採番される。
- rank_eventsが正しく作られ、0点イベントは作られない。
- admin操作がadmin_audit_logsに必ず残る。
- suspended user / review_required question / suspended question の制限が効く。
- non-adminはadmin APIと `/admin` を利用できない。
- smoke後に `npx supabase db reset` でseed状態へ戻せる。

## 9. 失敗時の切り分け

| 症状 | 優先確認 |
| --- | --- |
| Supabase localが起動しない | Docker Desktop、`npx supabase status`、port競合。 |
| migration/seedが反映されない | `npx supabase db reset`、migration順、seed.sql。 |
| signupできない | invite code、18歳以上確認、terms/privacy、member_limit、ADMIN_EMAILS。 |
| login/sessionが不安定 | cookie、Supabase auth session、ブラウザのユーザー切替。 |
| launchできない | question.status、author権限、daily limit、候補者数、block/status。 |
| recipientが0件になる | active world members、出題者本人除外、suspended user、block関係。 |
| start_at前後の表示がずれる | サーバー時刻、start_at/end_at、クライアント側polling。 |
| 回答できない | recipient判定、start_at/end_at、choiceId、重複回答。 |
| rankが更新されない | RPC実行、rank_events unique、source_id、profile score更新。 |
| rating/reportが失敗する | recipient/author権限、重複制約、reason固定値。 |
| admin操作が失敗する | admin role/status、service role、audit log transaction相当処理。 |
| secret漏えいが疑わしい | `.env.local`、`git diff`、client bundle、`NEXT_PUBLIC_` prefix。 |

## 10. 10人テスト前に残る課題

Phase 8が通っても、10人テスト前には次を別途判断する。

- Supabase cloud projectをいつ作るか。
- Vercel Preview projectをいつ作るか。
- Production環境を10人テスト直前に作るか。
- MVP利用規約・プライバシーポリシー草案の専門家確認。
- invite配布対象と連絡方法。
- 10人テスト中の問い合わせ窓口。
- Web Pushを入れずに画面内通知だけで検証する範囲。
- Realtime化をPhase 1.5相当として先に入れるかどうか。
- local smokeの結果をどの形式で記録するか。

## 11. Phase 8で作らないもの

Phase 8では次を作らない。

- Supabase cloud project
- Vercel project
- production deploy
- Stripe
- Web Push
- Realtime
- 課金
- ギルド
- 本番法務確定
- 新規ゲーム機能
- full moderation automation
- 通報による自動スコア減点
- シーズンランキング
- ELO / レート

## 12. Phase 8完了条件

Phase 8は、以下を満たしたら完了とする。

- 標準smoke scenarioをlocalで1周できる。
- admin/userA/userB/userCを使い分けた権限確認ができる。
- `/home` 15秒ポーリングでrecipient本人宛launchを確認できる。
- start_at前後、end_at後の表示と回答制限を確認できる。
- result、rating、report、rank_events、admin moderationまで確認できる。
- admin_audit_logsが各admin操作に対して残る。
- non-admin / suspended user / suspended question の制限が期待通りに効く。
- `npm run typecheck`、`npm run lint`、`npm run test`、`npm run build` が通る。
- smoke後にDBをseed状態へ戻せる。
- cloud環境を作らずに完了できる。

## 13. Phase 9 Preview環境検討へ進む条件

Phase 9でPreview環境を検討するのは、次を満たした後にする。

- Phase 8 local smokeが複数回再現できる。
- 主要APIの権限、漏えい防止、status制御に重大な不具合がない。
- 10人テストで使うユーザー導線が説明可能な状態になっている。
- 10人テスト前の運用手順、問い合わせ対応、招待配布方法が整理されている。
- Supabase cloud / Vercel Previewを作るタイミングについて、明示的に判断できる。
- Smart Buzzerとは引き続き完全分離されている。
