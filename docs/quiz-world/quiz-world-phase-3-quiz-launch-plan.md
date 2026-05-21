# Phase 3 Quiz Launch / Recipients 実装計画

## 1. Phase 3 の目的

Phase 3 では、Phase 2 で作成した `active` な四択クイズを、同じワールド内の選ばれた回答者へ配信できる状態にする。

目的は次の通り。

- author本人が自分の `active` question を出題できる
- サーバー側で `quiz_launches` を作る
- サーバー側で配信対象者を抽選し、`quiz_recipients` を作る
- 出題者本人、停止ユーザー、停止member、ブロック関係の相手を対象外にする
- `start_at = now + 15秒`、`end_at = start_at + 60秒` をサーバーで設定する
- `/home` の15秒ポーリングで、本人宛の届いたクイズを表示できる

Phase 3 は「問題を飛ばす」段階であり、「回答する」「順位を決める」「結果を表示する」段階ではない。

## 2. Phase 3 の範囲

Phase 3 で扱うもの。

- `quiz_launches` テーブル
- `quiz_recipients` テーブル
- 最小 `blocks` テーブル
- `POST /api/quiz-launches`
- `GET /api/quiz-launches`
- `GET /api/quiz-launches/[id]`
- `/home` の届いたクイズ一覧
- `/create` または question詳細からの「出題する」導線
- `start_at` / `end_at` のサーバー設定
- 配信対象者抽選
- 出題者ランクによる `recipient_count` 制限の初期実装
- Phase 1の15秒ポーリング前提の画面内通知

Phase 3 でまだ扱わないもの。

- 回答送信
- 回答順位
- 正解者順位
- 結果完全表示
- クイズ評価
- 通報本実装
- Web Push
- Realtime
- admin本実装
- quiet hoursの厳密適用
- 1日の通知上限の厳密適用

## 3. `quiz_launches` テーブル方針

DB migration SQLはPhase 3計画段階ではまだ作らない。実装時にmigrationとして追加する。

### カラム案

| カラム | 型案 | nullable | 方針 |
| --- | --- | --- | --- |
| `id` | uuid | no | primary key |
| `question_id` | uuid | no | `questions.id` 参照 |
| `author_id` | uuid | no | 出題者。`profiles.id` 参照 |
| `world_id` | uuid | no | MVPでは初期worldのみ |
| `recipient_count` | integer | no | 実際に作成したrecipient数 |
| `requested_recipient_count` | integer | yes | UIから要求された人数。初期は省略可 |
| `start_at` | timestamptz | no | サーバー時刻で `now + 15秒` |
| `end_at` | timestamptz | no | `start_at + 60秒` |
| `status` | text | no | `scheduled` / `open` / `closed` / `cancelled` |
| `created_at` | timestamptz | no | default now |
| `updated_at` | timestamptz | no | update trigger |

### status

| status | 意味 | Phase 3での扱い |
| --- | --- | --- |
| `scheduled` | `start_at` 前。回答受付前 | 作成直後の基本状態 |
| `open` | 回答受付中 | Phase 3ではAPIで動的判定してもよい |
| `closed` | `end_at` 後 | Phase 3ではバッチ更新までは不要 |
| `cancelled` | 管理者または運営都合で停止 | admin本実装まで作成のみ想定 |

Phase 3では、DB上の `status` を常に自動更新する仕組みまでは作らない。画面/APIでは `now`, `start_at`, `end_at` から `scheduled` / `open` / `closed` 相当を表示用に計算してよい。

### 制約案

- `question_id` は必須
- `author_id` は必須
- `world_id` は必須
- `recipient_count >= 0`
- `start_at < end_at`
- `status in ('scheduled', 'open', 'closed', 'cancelled')`
- `question_id` は `status = active` のquestionのみ出題可能にする
  - DB checkだけでは表現しづらいためAPI側で必ず検証する

### index案

- `quiz_launches_author_created_idx` on `(author_id, created_at desc)`
- `quiz_launches_world_created_idx` on `(world_id, created_at desc)`
- `quiz_launches_question_idx` on `(question_id)`
- `quiz_launches_status_start_idx` on `(status, start_at)`

## 4. `quiz_recipients` テーブル方針

### カラム案

| カラム | 型案 | nullable | 方針 |
| --- | --- | --- | --- |
| `id` | uuid | no | primary key |
| `launch_id` | uuid | no | `quiz_launches.id` 参照 |
| `user_id` | uuid | no | 配信対象者。`profiles.id` 参照 |
| `notification_status` | text | no | Phase 3は `in_app_ready` を基本にする |
| `notified_at` | timestamptz | yes | 画面内通知の作成時刻としてlaunch作成時に入れてよい |
| `opened_at` | timestamptz | yes | Phase 4以降で詳細画面を開いた時に更新 |
| `created_at` | timestamptz | no | default now |

### notification_status

| status | 意味 | Phase 3での扱い |
| --- | --- | --- |
| `pending` | recipient作成済みだが通知準備前 | キュー導入時の余地 |
| `in_app_ready` | `/home` のポーリングで表示可能 | Phase 3の基本状態 |
| `skipped` | 条件により配信しなかった | Phase 3ではrecipientを作らない方針でもよい |
| `failed` | 通知送信失敗 | Web Push以降の余地 |

Phase 3ではWeb Pushを送らないため、`notification_status = in_app_ready` を基本にする。`notification_logs` はPhase 3では必須にしないが、将来のWeb Push導入時に追加・連携する。

### 制約案

- `(launch_id, user_id)` は unique
- `notification_status in ('pending', 'in_app_ready', 'skipped', 'failed')`
- 出題者本人をrecipientにしない
  - API側で必ず検証する
- 停止ユーザーをrecipientにしない
  - API側で必ず検証する

### index案

- `quiz_recipients_user_created_idx` on `(user_id, created_at desc)`
- `quiz_recipients_launch_idx` on `(launch_id)`
- `quiz_recipients_user_status_idx` on `(user_id, notification_status, created_at desc)`
- unique `(launch_id, user_id)`

## 5. `blocks` テーブル方針

Phase 3では、配信対象者抽選でブロック関係を除外するため、最小構成の `blocks` テーブルを追加する方針に固定する。

DB migration SQLはPhase 3計画段階ではまだ作らない。実装時にmigrationとして追加する。

### カラム案

| カラム | 型案 | nullable | 方針 |
| --- | --- | --- | --- |
| `id` | uuid | no | primary key |
| `blocker_id` | uuid | no | ブロックしたユーザー。`profiles.id` 参照 |
| `blocked_id` | uuid | no | ブロックされたユーザー。`profiles.id` 参照 |
| `created_at` | timestamptz | no | default now |

### 制約案

- unique `(blocker_id, blocked_id)`
- `blocker_id <> blocked_id`

### Phase 3での扱い

- ブロック関係は双方向除外として扱う
- authorがcandidateをブロックしている場合は除外
- candidateがauthorをブロックしている場合も除外
- Phase 3ではブロック作成UIやブロック解除APIの本実装は主対象にしない
- local検証ではDB上に作った `blocks` レコードで候補者除外を確認する

## 6. Phase 3 固定方針

| 項目 | MVP初期方針 |
| --- | --- |
| `blocks` | Phase 3で最小 `blocks` テーブルを追加する。`blocker_id`, `blocked_id`, `created_at`, unique `(blocker_id, blocked_id)`。 |
| ブロック除外 | 配信対象者抽選では双方向ブロックを除外する。 |
| quiet hours | Phase 3の初期local実装では厳密適用しない。candidate filterではPhase 4以降に回す。 |
| 1日の通知上限 | Phase 3では未実装。`notification_logs` 連携後、Phase 4以降または通知強化Phaseで実装する。 |
| 1日の出題回数 | Phase 3で実装する。日付境界はUTC基準。10人テスト前にJST基準を再検討する。 |
| `/home` 一覧 | `start_at` 前は問題本文・選択肢を返さない。出題者名、カテゴリ、難易度、`start_at`, `end_at`, 状態だけ返す。 |
| recipient 0件 | launchを作らず `409` を返す。 |
| recipient候補が上限未満 | 候補者全員に配信する。 |
| Web Push / Realtime | Phase 3では実装しない。`/home` の15秒ポーリングのみ。 |

## 7. API仕様

### `POST /api/quiz-launches`

目的: 自分の `active` question を出題し、配信対象者を抽選して `quiz_launches` / `quiz_recipients` を作る。

認証: 必須。

権限:

- `profiles.status = active`
- `world_members.status = active`
- author本人のみ
- questionは自分の `active` questionのみ
- `question.status = suspended` は不可

request body:

```json
{
  "questionId": "uuid"
}
```

初期は `recipientCount` をrequest bodyで受け取らない。サーバーが出題者ランクから上限を決める。

response:

```json
{
  "ok": true,
  "launch": {
    "id": "uuid",
    "questionId": "uuid",
    "authorId": "uuid",
    "worldId": "uuid",
    "recipientCount": 3,
    "startAt": "2026-05-21T00:00:15.000Z",
    "endAt": "2026-05-21T00:01:15.000Z",
    "status": "scheduled"
  },
  "recipients": [
    {
      "userId": "uuid",
      "notificationStatus": "in_app_ready"
    }
  ]
}
```

主なステータス:

- `201`: 作成成功
- `400`: request body不正
- `401`: 未ログイン
- `403`: 出題権限なし、停止ユーザー、inactive member
- `404`: questionなし、または自分のquestionではない
- `409`: 配信候補者が0人
- `422`: questionが `active` ではない、出題上限超過など

サーバー側で必ず行う判定:

- auth userの取得
- profile存在確認
- `profiles.status = active`
- `world_members.status = active`
- questionのauthor一致
- `question.status = active`
- `question.status != suspended`
- 同じworldの候補者抽出
- 出題者本人除外
- ブロック関係除外
- 候補者の `profiles.status = active`
- 候補者の `world_members.status = active`
- `start_at` / `end_at` をサーバー時刻で決める
- recipient作成はDB transaction相当で扱う

### `GET /api/quiz-launches`

目的: `/home` の15秒ポーリング用に、本人に届いたクイズ一覧と、自分が出題したlaunch概要を取得する。

認証: 必須。

query案:

- `scope=received`
  - 本人がrecipientのlaunch一覧
- `scope=authored`
  - 本人がauthorのlaunch一覧
- 省略時は `received`

response:

```json
{
  "ok": true,
  "launches": [
    {
      "id": "uuid",
      "questionId": "uuid",
      "authorDisplayName": "出題者",
      "category": "雑学",
      "difficulty": 2,
      "startAt": "2026-05-21T00:00:15.000Z",
      "endAt": "2026-05-21T00:01:15.000Z",
      "status": "scheduled",
      "notificationStatus": "in_app_ready"
    }
  ]
}
```

Phase 3の `/home` 一覧では、`start_at` 前に問題本文と選択肢を返さない方針に固定する。

返す情報:

- 出題者名
- カテゴリ
- 難易度
- `start_at`
- `end_at`
- 状態
- `notification_status`

返さない情報:

- 問題本文
- 選択肢
- 正解
- `category_note`

問題本文と選択肢は、Phase 4の `/quiz/[launchId]` で `start_at` 到達後に返す。

### `GET /api/quiz-launches/[id]`

目的: launch詳細を取得する。Phase 3では回答画面の完全実装前なので、recipient確認と開始時刻確認を主目的にする。

認証: 必須。

権限:

- author本人
- recipient本人
- admin

response:

```json
{
  "ok": true,
  "launch": {
    "id": "uuid",
    "questionId": "uuid",
    "authorId": "uuid",
    "worldId": "uuid",
    "recipientCount": 3,
    "startAt": "2026-05-21T00:00:15.000Z",
    "endAt": "2026-05-21T00:01:15.000Z",
    "status": "scheduled",
    "viewerRole": "recipient"
  }
}
```

Phase 3では回答機能を作らないため、このAPIは `/home` から遷移できる下準備に留める。問題本文と選択肢の返却はPhase 4で確定する。

## 8. 配信対象者抽選ロジック

### 候補者条件

候補者は次をすべて満たすユーザー。

- 同じ `world_id` の `world_members`
- `world_members.status = active`
- `profiles.status = active`
- 出題者本人ではない
- 出題者とブロック関係にない

Phase 3の初期local実装では、quiet hours と1日の通知上限はcandidate filterに適用しない。

- quiet hoursは、profileに将来用の設定を持つがPhase 3では未適用
- 1日の通知上限は、`notification_logs` 連携後にPhase 4以降または通知強化Phaseで実装
- `notification_mode = rest` の扱いも、通知強化Phaseでまとめて整理する

### ブロック関係

ブロックは双方向除外として扱う。

- authorがcandidateをブロックしている
- candidateがauthorをブロックしている

いずれかに該当する場合は配信対象外。

Phase 3では最小 `blocks` テーブルを追加し、この除外を実装する方針に固定する。

### 抽選方法

MVP初期は単純ランダムでよい。

1. 候補者一覧をサーバーで取得する
2. 候補者をランダムに並べ替える
3. `recipient_count_limit` まで採用する
4. 候補者数が上限未満なら候補者全員に配信する
5. 候補者数が0件ならlaunchを作らず `409` を返す

将来の重み付け候補:

- 直近で受け取った通知数が少ない人を優先
- 直近ログインがある人を優先
- 回答参加率が高い人をやや優先
- 同じ相手に偏りすぎないようにする

Phase 3では重み付け抽選は作らない。

## 9. `start_at` / `end_at` ロジック

固定方針:

- `start_at = server now + 15秒`
- `end_at = start_at + 60秒`
- クライアント時刻は使わない
- DB/API側のサーバー時刻を基準にする

処理順:

1. `now` をサーバー側で取得する
2. `start_at = now + interval '15 seconds'`
3. `end_at = start_at + interval '60 seconds'`
4. `quiz_launches` に保存する
5. `quiz_recipients` に保存する

Phase 3では、`start_at` 前の問題本文表示を避ける設計にする。問題本文・選択肢の本格返却はPhase 4の回答実装で扱う。

## 10. `/home` 画面仕様

### 目的

15秒ポーリングで本人宛の `quiz_recipients` を確認し、届いたクイズを表示する。

### 表示要素

- 届いたクイズ一覧
- 開始前のクイズ
- 開始済みのクイズ
- 締切済みのクイズ
- 出題者名
- カテゴリ
- 難易度
- 開始までの残り秒数
- 締切までの残り秒数
- 「クイズへ」導線
- 自分が出題したlaunch概要

### 15秒ポーリング

- `/home` は15秒ごとに `GET /api/quiz-launches?scope=received` を呼ぶ
- Phase 3ではRealtimeを使わない
- Web Pushも送らない
- 新着があれば画面内で更新する
- Phase 3ではquiet hours、1日の通知上限、Web Push送信は扱わない

### 表示ルール

| 状態 | 条件 | 表示 |
| --- | --- | --- |
| 開始前 | `now < start_at` | 開始時刻、カウントダウン、カテゴリ、難易度 |
| 開始済み | `start_at <= now < end_at` | 「回答可能」相当の導線。ただしPhase 3では回答画面は未完成 |
| 締切済み | `now >= end_at` | 「締切済み」。結果表示はPhase 4以降 |

Phase 3では `/quiz/[launchId]` の回答UIはまだ作らないため、導線は既存の静的画面または準備中表示に留める。

### `/home` APIで返さない情報

Phase 3の `/home` 一覧では、既存方針に合わせて `start_at` 前に問題本文と選択肢を返さない。

- 問題本文は返さない
- 選択肢は返さない
- 正解は返さない
- `category_note` は返さない

問題本文と選択肢は、Phase 4の `/quiz/[launchId]` で `start_at` 到達後に返す。

## 11. `/create` または question詳細からの出題導線

### 目的

authorが自分の `active` question を選び、配信を開始できるようにする。

### 表示要素

- 作成済み問題一覧の各 `active` question に「出題する」ボタン
- `draft` には「activeにしてから出題」と表示
- `suspended` には出題不可表示
- 出題者ランク
- 今回の最大配信人数
- 候補者不足時は候補者全員に配信される旨
- start_at / end_at の説明

### 操作

- 「出題する」を押す
- 確認ダイアログを表示する
- `POST /api/quiz-launches` を呼ぶ
- 成功後、`/home` または launch詳細へ遷移する

### Phase 3でやらないこと

- 手動で配信対象者を選ぶ
- 手動でstart_atを指定する
- 手動でrecipient_countを増やす
- 課金で配信人数を増やす

## 12. validation

### `POST /api/quiz-launches`

- ログイン必須
- profile必須
- `profiles.status = active`
- `world_members.status = active`
- `questionId` 必須
- questionが存在する
- questionの `author_id = auth.uid()`
- questionの `status = active`
- questionの `status != suspended`
- author本人をrecipientに含めない
- candidateは同じworldのactive memberのみ
- candidateのprofileはactiveのみ
- block関係を除外
- recipient候補が0人なら `409`
- 候補者が上限未満なら候補者全員へ配信
- `recipient_count` は出題者ランクからサーバーで決める
- `start_at` / `end_at` はサーバーで決める
- quiet hoursはPhase 3では未適用
- 1日の通知上限はPhase 3では未実装

### 出題者ランク別recipient_count初期案

Phase 3ではランク計算本体をまだ作らないため、`profiles.questioner_rank` を使って上限を決める。

| questioner_rank | 1回の配信人数上限 |
| --- | --- |
| 0 | 3 |
| 1 | 5 |
| 2 | 8 |
| 3 | 12 |
| 4以上 | 20 |

MVP初期は全員 `questioner_rank = 0` のため、基本は3人配信になる。

### 1日の出題回数

出題者ランクによる1日の出題回数制限はPhase 3で実装する。

| questioner_rank | 1日の出題回数上限 |
| --- | --- |
| 0 | 1 |
| 1 | 2 |
| 2 | 3 |
| 3 | 5 |
| 4以上 | 8 |

判定方針:

- `quiz_launches` の当日作成数を見て制限する
- Phase 3の日付境界はUTC基準
- 10人テスト前にJST基準を再検討する

## 13. RLS方針

Phase 3でも重要処理はAPI route / server function側で行い、RLSだけに任せない。

### `quiz_launches`

SELECT:

- author本人
- recipient本人
- admin

INSERT:

- 原則API route / service role経由のみ
- クライアントから直接insertさせない

UPDATE:

- Phase 3では原則adminまたはserverのみ
- authorが直接status更新するAPIは作らない

DELETE:

- 作らない

注意:

- `question_id`, `author_id`, `world_id`, `start_at`, `end_at`, `recipient_count` はサーバーで決める
- authorが他人のquestionを出題できないようにAPI側で検証する

### `quiz_recipients`

SELECT:

- recipient本人
- launch author
- admin

INSERT:

- API route / service role経由のみ

UPDATE:

- Phase 3では `opened_at` 更新をまだ作らない
- 将来、recipient本人が `opened_at` を更新できる余地を残す

DELETE:

- 作らない

注意:

- recipient listを不必要に公開しない
- `/home` では本人宛のrecipientだけ返す
- author向けにはrecipient数だけ返し、全recipient名の公開はPhase 4以降で検討する

### 依存テーブル

- `questions`
  - author本人の `active` questionだけ出題可能
- `profiles`
  - `role`, `status`, `questioner_rank` を参照
- `world_members`
  - `world_id`, `status` を参照
- `blocks`
  - Phase 3で最小追加する
  - ブロック関係は配信対象者抽選で双方向除外する
  - 本人のブロック関係だけ読める方針にする

## 14. テスト方針

### unit test

- recipient_count上限計算
- `start_at` / `end_at` 計算
- candidate filter
- block関係除外
- status判定
- 1日の出題回数上限

### integration test

- active questionを出題できる
- draft questionは出題不可
- suspended questionは出題不可
- 他人のquestionは出題不可
- suspended userは出題不可
- inactive world memberは出題不可
- 出題者本人はrecipientにならない
- suspended userはrecipientにならない
- inactive world memberはrecipientにならない
- block関係の相手はrecipientにならない
- quiet hours設定中でもPhase 3ではcandidate filterに使われない
- 1日の通知上限はPhase 3では判定されない
- `questioner_rank = 0` は1日1回まで
- `questioner_rank = 1` は1日2回まで
- 日付境界はUTCで判定される
- 候補者が3人以上ならLv.0は3人に配信
- 候補者が3人未満なら候補者全員に配信
- 候補者0人ならlaunchを作らず409
- `quiz_launches.start_at` は作成時刻の約15秒後
- `quiz_launches.end_at` は `start_at` の約60秒後
- `/home` 用一覧で本人宛のlaunchだけ取得できる
- 他人宛のlaunchは取得できない
- `/home` 用一覧は問題本文・選択肢を返さない

### RLS test

- recipient本人は自分宛のlaunchを読める
- recipient本人は他人宛のrecipientを読めない
- authorは自分が出題したlaunchを読める
- author以外はrecipientでないlaunchを読めない
- クライアント権限で `quiz_launches` / `quiz_recipients` を直接insertできない
- 本人以外の `blocks` は読めない

### 画面確認

- `/home` に届いたクイズが表示される
- `/home` の15秒ポーリングで新着が増える
- `/create` のactive questionから出題できる
- draft / suspended questionでは出題ボタンが出ない、またはdisabledになる

## 15. Phase 3で作らないもの

- `POST /api/quiz-launches/[id]/answer`
- `answers`
- `answer_rank`
- `correct_rank`
- result完全表示
- `question_ratings`
- `reports`
- Web Push
- Realtime
- admin本実装
- quiet hoursの厳密適用
- 1日の通知上限
- production deploy
- Supabase cloud project
- Vercel project
- Stripe
- 手動recipient選択
- 課金による配信人数増加

## 16. Phase 3完了条件

Phase 3は次を満たしたら完了とする。

- `quiz_launches` / `quiz_recipients` のlocal migrationがある
- 最小 `blocks` テーブルのlocal migrationがある
- active questionのみ出題できる
- author本人のみ自分のquestionを出題できる
- suspended user / inactive member は出題不可
- suspended question は出題不可
- 配信対象者抽選がサーバー側で行われる
- 出題者本人がrecipientに入らない
- active user / active world member のみrecipientになる
- block関係を除外する
- quiet hoursはPhase 3では未適用であることがdocsと実装で一致している
- 1日の通知上限はPhase 3では未実装であることがdocsと実装で一致している
- 1日の出題回数制限がUTC基準で実装されている
- `start_at = now + 15秒`
- `end_at = start_at + 60秒`
- Lv.0の配信人数上限は3人
- 候補者不足時は候補者全員に配信される
- 候補者0件ならlaunchを作らず409を返す
- `/home` で本人宛の届いたクイズを取得できる
- `/home` 一覧が問題本文・選択肢を返さない
- `npm run typecheck` が通る
- `npm run lint` が通る
- `npm run test` が通る
- `npm run build` が通る
- Supabase local DB込みで主要API確認が通る
- `.env.local` やsecret実値がcommit対象に含まれない

## 17. Phase 4回答実装へ進む条件

Phase 4へ進む前に、次を確認する。

- `quiz_launches` / `quiz_recipients` のRLSとAPI境界が整理されている
- `/home` の15秒ポーリングで本人宛launchが見える
- 問題本文・選択肢を `start_at` 前に返さない方針が守られている
- Phase 4で `/quiz/[launchId]` に問題本文と選択肢を返す条件が決まっている
- 回答受付は `start_at <= now < end_at` のサーバー判定にする
- 同一launchへの重複回答防止unique制約をPhase 4で入れる
- 回答順位はサーバー受信順にする

## Phase 3実装前固定事項

| 項目 | 固定方針 |
| --- | --- |
| `blocks` テーブル | Phase 3で最小追加する。`blocker_id`, `blocked_id`, `created_at`, unique `(blocker_id, blocked_id)`。 |
| ブロック除外 | 配信対象者抽選では双方向ブロックを除外する。 |
| quiet hours | Phase 3の初期local実装では厳密適用しない。candidate filterではPhase 4以降に回す。 |
| 1日の通知上限 | Phase 3では未実装。`notification_logs` 連携後、Phase 4以降または通知強化Phaseで実装する。 |
| 1日の出題回数 | Phase 3で実装する。Lv.0=1回、Lv.1=2回、Lv.2=3回、Lv.3=5回、Lv.4以上=8回。 |
| 日付境界 | Phase 3ではUTC基準。10人テスト前にJST基準を再検討する。 |
| `/home` 一覧 | `start_at` 前は問題本文・選択肢を返さない。出題者名、カテゴリ、難易度、`start_at`, `end_at`, 状態だけ返す。 |
| recipient 0件 | launch自体を作らず `409` を返す。 |
| recipient候補が上限未満 | 候補者全員に配信する。 |
| Web Push / Realtime | Phase 3では実装しない。`/home` の15秒ポーリングのみ。 |
