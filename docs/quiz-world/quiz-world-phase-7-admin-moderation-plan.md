# Phase 7 Admin / Moderation Plan

## 1. Phase 7 の目的

Phase 7では、10人テストを安全に運用するための簡易admin / moderation機能をlocalで成立させる。

- `reports` を確認できるようにする
- `question.status` を `review_required` / `suspended` に変更できるようにする
- `profiles.status` を `suspended` に変更できるようにする
- `waitlist` を確認し、statusを更新できるようにする
- adminがinvite codeを発行できるようにする
- admin操作を `admin_audit_logs` に必ず記録する
- 削除ではなく停止を優先する

Phase 7は、本番運用の管理基盤ではなく、10人テストの安全なlocal運用リハーサルを可能にするPhaseである。
Supabase cloud project、Vercel project、Stripe、production deploy、Web Push、Realtimeは扱わない。

## 2. Phase 7 の範囲

Phase 7で扱うもの:

- `/admin` 画面
- admin role判定
- `profiles.role = admin`
- `admin_audit_logs`
- reports一覧
- report詳細
- question moderation
- `question.status = review_required / suspended`
- user moderation
- `profiles.status = suspended`
- waitlist一覧
- waitlist status更新
- invite code発行
- world member / profile状態確認
- 管理操作の確認ダイアログ
- 管理操作ログ

Phase 7で扱うAPI:

- `GET /api/admin/reports`
- `GET /api/admin/reports/[id]`
- `PATCH /api/admin/questions/[id]/moderation`
- `PATCH /api/admin/users/[id]/suspend`
- `GET /api/admin/waitlist`
- `PATCH /api/admin/waitlist/[id]`
- `GET /api/admin/invites`
- `POST /api/admin/invites`
- `GET /api/admin/audit-logs`
- `GET /api/admin/users`
- `GET /api/admin/questions`

Phase 7で扱うDB追加候補:

- `admin_audit_logs`

既存テーブルで利用するもの:

- `profiles`
- `worlds`
- `world_members`
- `waitlist`
- `invites`
- `questions`
- `quiz_launches`
- `quiz_recipients`
- `answers`
- `question_ratings`
- `reports`
- `rank_events`

## 3. /admin 画面仕様

`/admin` は `profiles.role = admin` かつ `profiles.status = active` のユーザーだけが利用できる。
admin以外は403相当の画面を表示する。

### 画面構成

| タブ | 目的 |
| --- | --- |
| Overview | 10人テストの状態を俯瞰する。 |
| Reports | 通報一覧と詳細を確認する。 |
| Questions | 問題の状態、通報数、評価を確認し、moderationする。 |
| Users | ユーザー状態、出題数、回答数、通報関連を確認し、停止する。 |
| Waitlist | waitlistを確認し、statusを更新する。 |
| Invites | invite codeを確認・発行する。 |
| Audit Logs | admin操作ログを確認する。 |

### Overview

表示要素:

- current world name
- current season
- member count / member limit
- active users
- suspended users
- open reports count
- questions by status
- recent reports
- recent admin audit logs

主な操作:

- Reportsタブへ移動
- Questionsタブへ移動
- Usersタブへ移動
- Audit Logsタブへ移動

MVPでやらないこと:

- chart libraryを使った分析画面
- 本番監視ダッシュボード
- cloud project操作

### Reports

表示要素:

- report id
- reason
- status
- question id / body preview
- launch id
- reporter display name
- author display name
- created_at
- same question report count
- `review_required` 候補フラグ

フィルタ:

- status: `open` / `reviewing` / `resolved` / `dismissed`
- reason
- question status
- author status

操作:

- report詳細を開く
- reportを確認済みにする
- 対象questionを `review_required` にする
- 対象questionを `suspended` にする
- 対象userの停止画面へ移動

空状態:

- open reportがない場合は「未対応の通報はありません」と表示する。

エラー状態:

- admin権限がない場合は403。
- 取得失敗時は再読み込み導線を表示する。

### Report Detail

表示要素:

- report reason
- report status
- question body
- choices
- correct choice
- category / difficulty
- author
- reporter
- launch timing
- answer count
- ratings count
- same question report count
- past reports for same question
- current question status
- current author status

操作:

- report statusを `reviewing` / `resolved` / `dismissed` に変更する
- questionを `review_required` にする
- questionを `suspended` にする
- user停止操作へ進む

確認ダイアログ:

- question status変更時に対象question、変更前後status、reasonを表示する。
- user停止時に対象user、影響範囲、reasonを表示する。
- report status変更時に変更前後statusを表示する。

### Questions

表示要素:

- question id
- body preview
- author display name
- status: `draft` / `active` / `review_required` / `suspended`
- category
- difficulty
- launch count
- answer count
- rating summary
- report count
- created_at / updated_at

操作:

- question詳細を開く
- `review_required` に変更する
- `suspended` に変更する

MVPでは削除しない。
`suspended` にしたquestionは、出題、回答、rating、reportの主要操作から除外する。

### Users

表示要素:

- user id
- display name
- role
- status
- world member status
- joined_at
- question count
- launch count
- answer count
- report count
- suspended question count
- answer_score / answer_rank
- questioner_score / questioner_rank

操作:

- user詳細を開く
- `profiles.status = suspended` に変更する

MVPではユーザー完全削除は行わない。
自分自身の停止は不可にする。

### Waitlist

表示要素:

- waitlist id
- email
- display_name
- status
- created_at
- updated_at

status候補:

- `waiting`
- `invited`
- `joined`
- `rejected`

操作:

- statusを更新する
- invite発行画面へ進む

### Invites

表示要素:

- invite id
- code
- status
- max_uses
- use_count
- expires_at
- created_at
- invited_by

発行フォーム:

- world
- code
- max_uses
- expires_at
- reason

初期方針:

- codeはadminが指定、またはserver側生成にする。
- MVP localでは管理しやすいprefixを使ってよい。
- 例: `SEASON0-TEST-002`

### Audit Logs

表示要素:

- id
- admin_user_id
- action
- target_type
- target_id
- reason
- metadata
- created_at

フィルタ:

- admin user
- action
- target type
- target id
- created_at range

## 4. admin API 仕様

すべてのadmin APIは認証必須であり、`profiles.role = admin` かつ `profiles.status = active` をサーバー側で確認する。
clientから直接 `admin_audit_logs` を書かせない。
重要操作は service role / server-side API route 経由で行う。

### 共通レスポンス

成功:

```json
{
  "ok": true
}
```

失敗:

```json
{
  "ok": false,
  "errors": ["理由"]
}
```

共通ステータス:

| status | 用途 |
| ---: | --- |
| 200 | 取得、更新成功。 |
| 201 | invite作成成功。 |
| 400 | JSON不正。 |
| 401 | 未ログイン。 |
| 403 | adminではない、または停止中。 |
| 404 | 対象なし。 |
| 409 | 重複、状態競合。 |
| 422 | validation error。 |

### `GET /api/admin/reports`

目的:

- report一覧を取得する。

query:

- `status`
- `reason`
- `questionStatus`
- `limit`
- `cursor`

response:

```json
{
  "ok": true,
  "reports": [
    {
      "id": "uuid",
      "reason": "不適切",
      "status": "open",
      "questionId": "uuid",
      "questionBody": "問題文preview",
      "launchId": "uuid",
      "reporter": { "id": "uuid", "displayName": "name" },
      "author": { "id": "uuid", "displayName": "name" },
      "sameQuestionReportCount": 2,
      "reviewRequiredCandidate": true,
      "createdAt": "iso"
    }
  ]
}
```

server側で必ず行う判定:

- admin role
- active profile

### `GET /api/admin/reports/[id]`

目的:

- report詳細と対象question / launch / author情報を取得する。

response:

```json
{
  "ok": true,
  "report": {},
  "question": {},
  "launch": {},
  "reporter": {},
  "author": {},
  "reportCount": 2,
  "ratingsSummary": {}
}
```

注意:

- admin向けなのでcorrect choiceを表示してよい。
- emailは必要最小限にし、MVPでは基本表示しない。

### `PATCH /api/admin/questions/[id]/moderation`

目的:

- questionのstatusを `review_required` または `suspended` に変更する。
- 必ず `admin_audit_logs` を作成する。

request:

```json
{
  "status": "review_required",
  "reason": "同一問題に複数通報があるため",
  "reportId": "uuid"
}
```

validation:

- `status` は `review_required` / `suspended` のみ
- `reason` は必須
- `reason` は1〜500文字
- 対象questionが存在する
- 既に同じstatusの場合は409またはidempotent responseを検討する

transaction相当で行う処理:

1. admin確認
2. question行をロックする
3. question.statusを更新する
4. 必要ならreport.statusを更新する
5. `admin_audit_logs` をinsertする

audit action:

- `question_review_required`
- `question_suspended`

### `PATCH /api/admin/users/[id]/suspend`

目的:

- userを停止する。

request:

```json
{
  "reason": "不適切な出題が継続しているため"
}
```

validation:

- `reason` は必須
- 自分自身は停止不可
- 対象profileが存在する
- 対象が既に `suspended` の場合は409またはidempotent responseを検討する

transaction相当で行う処理:

1. admin確認
2. profile行をロックする
3. `profiles.status = suspended` に更新する
4. 対象ユーザーの `world_members.status` も `suspended` にするかは実装前に最終確認する
5. `admin_audit_logs` をinsertする

audit action:

- `user_suspended`

Phase 7固定方針:

- `profiles.status = suspended` を主要な停止判定に使う。
- Phase 7では解除APIは作らない。解除は後続Phaseで検討する。

### `GET /api/admin/waitlist`

目的:

- waitlist一覧を取得する。

query:

- `status`
- `limit`
- `cursor`

response:

```json
{
  "ok": true,
  "waitlist": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "displayName": "name",
      "status": "waiting",
      "createdAt": "iso"
    }
  ]
}
```

### `PATCH /api/admin/waitlist/[id]`

目的:

- waitlist statusを更新する。

request:

```json
{
  "status": "invited",
  "reason": "Season 0追加招待候補"
}
```

validation:

- `status` は `waiting` / `invited` / `joined` / `rejected`
- `reason` は推奨。`rejected` は必須にする
- 対象waitlistが存在する

audit action:

- `waitlist_status_updated`

### `GET /api/admin/invites`

目的:

- invite一覧を取得する。

query:

- `status`
- `worldId`
- `limit`
- `cursor`

response:

```json
{
  "ok": true,
  "invites": [
    {
      "id": "uuid",
      "worldId": "uuid",
      "code": "SEASON0-TEST-002",
      "status": "active",
      "maxUses": 1,
      "useCount": 0,
      "expiresAt": null,
      "createdAt": "iso"
    }
  ]
}
```

### `POST /api/admin/invites`

目的:

- adminがinvite codeを発行する。

request:

```json
{
  "worldId": "uuid",
  "code": "SEASON0-TEST-002",
  "maxUses": 1,
  "expiresAt": null,
  "reason": "10人テスト追加招待"
}
```

validation:

- `worldId` は存在するactive world
- `code` は必須、trim後大文字化
- `code` はunique
- `maxUses` は1以上
- `expiresAt` はnullまたは未来日時
- `reason` は必須

audit action:

- `invite_created`

### `GET /api/admin/audit-logs`

目的:

- admin操作ログを取得する。

query:

- `adminUserId`
- `action`
- `targetType`
- `targetId`
- `limit`
- `cursor`

response:

```json
{
  "ok": true,
  "auditLogs": [
    {
      "id": "uuid",
      "adminUserId": "uuid",
      "action": "question_suspended",
      "targetType": "question",
      "targetId": "uuid",
      "reason": "不適切な内容",
      "metadata": {},
      "createdAt": "iso"
    }
  ]
}
```

### `GET /api/admin/users`

目的:

- moderation対象ユーザーを一覧する。

query:

- `status`
- `role`
- `q`
- `limit`
- `cursor`

response:

```json
{
  "ok": true,
  "users": [
    {
      "id": "uuid",
      "displayName": "name",
      "role": "user",
      "status": "active",
      "worldMemberStatus": "active",
      "questionCount": 3,
      "answerCount": 12,
      "reportCount": 1,
      "suspendedQuestionCount": 0
    }
  ]
}
```

### `GET /api/admin/questions`

目的:

- moderation対象questionを一覧する。

query:

- `status`
- `authorId`
- `reportedOnly`
- `limit`
- `cursor`

response:

```json
{
  "ok": true,
  "questions": [
    {
      "id": "uuid",
      "body": "問題文",
      "status": "active",
      "author": { "id": "uuid", "displayName": "name" },
      "category": "雑学",
      "difficulty": 3,
      "launchCount": 2,
      "answerCount": 5,
      "reportCount": 2,
      "reviewRequiredCandidate": true
    }
  ]
}
```

## 5. admin_audit_logs 方針

Phase 7では `admin_audit_logs` を実装対象に含める。
admin操作は、対象変更とaudit log記録を同一transaction相当にする。
audit logが残せない場合、管理操作全体を失敗扱いにする。

### カラム方針

| カラム | 型案 | nullable | 説明 |
| --- | --- | --- | --- |
| `id` | `uuid` | no | primary key。 |
| `admin_user_id` | `uuid` | no | 操作したadmin。`profiles.id` 参照。 |
| `action` | `text` | no | 操作種別。 |
| `target_type` | `text` | no | `question` / `user` / `invite` / `waitlist` / `report`。 |
| `target_id` | `uuid` | no | 対象ID。 |
| `reason` | `text` | no | 操作理由。 |
| `metadata` | `jsonb` | no | 変更前後の値、関連ID、補足情報。 |
| `created_at` | `timestamptz` | no | 作成時刻。 |

### action候補

| action | target_type | 説明 |
| --- | --- | --- |
| `question_review_required` | `question` | questionをreview_requiredにした。 |
| `question_suspended` | `question` | questionをsuspendedにした。 |
| `user_suspended` | `user` | userをsuspendedにした。 |
| `invite_created` | `invite` | invite codeを発行した。 |
| `waitlist_status_updated` | `waitlist` | waitlist statusを更新した。 |
| `report_reviewed` | `report` | report statusを更新した。 |

### metadata例

```json
{
  "before": { "status": "active" },
  "after": { "status": "suspended" },
  "reportId": "uuid",
  "reportCount": 2
}
```

## 6. report moderation 方針

Phase 7では、reportをadminが確認し、必要に応じてquestion / userへ明示的なmoderation操作を行う。

固定方針:

- reportはadmin確認ベースで扱う
- 2件以上reportがあるquestionはadmin画面で `review_required` 候補として表示する
- Phase 7では自動で `question.status = review_required` にしない
- adminが明示的に `review_required` / `suspended` へ変更する
- report status更新はadmin操作としてaudit logに残す
- 通報によるscore減点はPhase 7では行わない

report status:

- `open`
- `reviewing`
- `resolved`
- `dismissed`

## 7. question moderation 方針

question moderationは削除ではなくstatus変更で行う。

対象status:

- `draft`
- `active`
- `review_required`
- `suspended`

adminが変更できるstatus:

- `review_required`
- `suspended`

効果:

| status | 効果 |
| --- | --- |
| `review_required` | admin確認が必要な状態。通常ユーザーの新規出題対象から外すかは実装前に最終確認する。 |
| `suspended` | 今後の出題、回答、rating、通常表示から除外する。 |

Phase 7初期方針:

- `suspended` questionは既存の出題/回答/評価フローから除外する。
- `review_required` questionの扱いは「admin画面で優先表示し、通常ユーザーの新規出題は止める」方針を基本案にする。
- 関連する未開始launchの停止は、Phase 7で実装するか実装前に最終確認する。

## 8. user suspension 方針

ユーザー停止は `profiles.status = suspended` を主判定にする。

効果:

- 出題不可
- 回答不可
- rating不可
- report不可
- admin API不可

既存実装との整合:

- Phase 2 question作成は `profiles.status = active` を見る
- Phase 3 launch作成とrecipient抽選は `profiles.status = active` を見る
- Phase 4 answerは `profiles.status = active` を見る
- Phase 5 rating/reportもPhase 7実装時に `profiles.status = active` を明示確認する

Phase 7初期方針:

- 停止時は `profiles.status = suspended` を更新する
- `world_members.status` も同時に `suspended` にするかは実装前に最終確認する
- 自分自身の停止は禁止する
- adminを停止できるかはMVPでは原則禁止または追加確認を必須にする
- 解除APIはPhase 7では作らない

## 9. invite / waitlist 管理方針

### invite

- Season 0はadmin発行invite code制を維持する
- 一般ユーザーによるinvite発行はMVPでは不可
- adminだけが `POST /api/admin/invites` を使える
- invite作成は `admin_audit_logs` に残す
- invite失効や削除はPhase 7では作らず、必要なら後続Phaseで扱う

### waitlist

- waitlistはadminだけが一覧確認できる
- waitlist statusはadminだけが更新できる
- status更新は `admin_audit_logs` に残す
- waitlist emailは必要最小限のadmin画面だけに表示する

waitlist status:

- `waiting`
- `invited`
- `joined`
- `rejected`

## 10. RLS / service role 境界

基本方針:

- admin判定は `profiles.role = admin`
- admin APIはserver-side routeでのみ処理する
- admin操作はservice role clientで行う
- clientにservice role keyやsecretを出さない
- clientから直接 `admin_audit_logs` をinsertしない
- RLSだけに依存せず、API route側でadmin判定を必ず行う

`admin_audit_logs` RLS案:

| 操作 | 方針 |
| --- | --- |
| `SELECT` | adminのみ。 |
| `INSERT` | client direct insert不可。server-side API / service roleのみ。 |
| `UPDATE` | 不可。 |
| `DELETE` | 不可。 |

admin APIでservice role経由にする処理:

- question status変更
- profile status変更
- waitlist status変更
- invite作成
- report status変更
- admin_audit_logs作成

## 11. validation

共通:

- 未ログインは401
- `profiles.role != admin` は403
- `profiles.status != active` は403
- JSON不正は400
- 対象なしは404
- 状態競合は409
- 入力不正は422

reason:

- question moderation、user suspension、invite作成、report処理ではreason必須
- waitlist status更新ではreason推奨。ただし `rejected` は必須
- 1〜500文字

question moderation:

- statusは `review_required` / `suspended` のみ
- `draft` / `active` への戻しはPhase 7では作らない

user suspension:

- 自分自身は停止不可
- 対象profileが存在する
- 対象profileが既にsuspendedの場合は409またはidempotent response

invite:

- code必須
- code unique
- maxUsesは1以上
- expiresAtはnullまたは未来日時

## 12. テスト方針

unit test:

- admin role判定
- admin payload validation
- reason validation
- invite code normalization
- audit log metadata builder

integration test:

- non-adminはadmin API不可
- suspended adminはadmin API不可
- adminはreports一覧を取得できる
- adminはreport詳細を取得できる
- adminはquestionを `review_required` にできる
- adminはquestionを `suspended` にできる
- adminはuserを `suspended` にできる
- adminはwaitlist statusを更新できる
- adminはinvite codeを発行できる
- admin操作ごとに `admin_audit_logs` が作成される
- audit log作成に失敗した場合、管理操作も失敗する

RLS / access test:

- `admin_audit_logs` はadmin以外から読めない
- `admin_audit_logs` はclient direct insertできない
- service role keyがclient bundleに含まれない

manual local smoke:

- `/admin` がadminで開ける
- `/admin` がnon-adminで403になる
- Reportsタブで通報を確認できる
- Questionsタブで対象questionを停止できる
- Usersタブで対象userを停止できる
- Waitlistタブでstatus更新できる
- Invitesタブでinvite発行できる
- Audit Logsタブで操作ログを確認できる

## 13. Phase 7で作らないもの

- production deploy
- Supabase cloud project
- Vercel project
- Stripe
- Web Push
- Realtime
- full moderation automation
- 通報による自動スコア減点
- 完全削除
- ギルド管理
- シーズンランキング
- ELO / レート
- large scale admin dashboard
- admin解除API
- user復帰API
- invite失効API
- legal本番反映

## 14. Phase 7完了条件

Phase 7 local実装の完了条件:

- `admin_audit_logs` がlocal DBに作成される
- `/admin` がadminだけに表示される
- non-adminは `/admin` とadmin APIを利用できない
- reports一覧とreport詳細を確認できる
- questionを `review_required` / `suspended` にできる
- userを `suspended` にできる
- waitlist一覧を確認し、statusを更新できる
- invite codeを発行できる
- すべてのadmin操作で `admin_audit_logs` が作成される
- audit log作成失敗時に管理操作が失敗する
- 削除APIを作らない
- `npm run typecheck` が通る
- `npm run lint` が通る
- `npm run test` が通る
- `npm run build` が通る
- Supabase local DB込みでadmin APIのlocal確認が通る
- 検証後にSupabase local DBをseed状態へ戻す
- `.env.local` とsecret実値がcommit対象に含まれない

## 15. Phase 8 10-user local smoke / ops rehearsal へ進む条件

Phase 8へ進む前に確認すること:

- Phase 7をcommit / push / tagで固定する
- admin操作ログが安全に残る
- suspended userが出題、回答、rating、reportをできない
- suspended questionが出題、回答、rating対象にならない
- 10人テストで使うadmin手順がREADMEまたはops docに整理されている
- 10人テスト前にまだcloud環境を作らない方針を維持するか確認する
- Realtime / Web Push / production deployへ進むかは別Phaseで判断する

## Phase 7実装前に決めるべきこと

実装前に最終確認したい小さな事項:

| 項目 | 推奨初期方針 |
| --- | --- |
| `review_required` questionの通常ユーザー扱い | 新規launch不可、admin画面で優先表示。既存result閲覧は維持。 |
| user停止時の `world_members.status` | `profiles.status` と同時に `suspended` へ更新する案を優先。 |
| report status更新API | `GET /api/admin/reports/[id]` と同じ階層で `PATCH /api/admin/reports/[id]` を追加するか、question moderation APIに含めるか決める。 |
| invite code生成 | admin入力を許可しつつ、未入力ならserver側生成にする案を優先。 |
| self-admin停止 | MVPでは禁止。複数admin運用前に解除/復帰設計を検討する。 |
