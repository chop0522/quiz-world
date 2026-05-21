# Phase 4 Answer Submission Plan

## 1. Phase 4 の目的

Phase 4では、`quiz_recipients` に含まれる回答者が、自分に届いた `quiz_launches` に対して四択回答を送信できるようにする。

主目的は以下。

- `start_at` 到達後に問題本文と選択肢を返す
- `end_at` 後は回答不可にする
- 同一 `launch_id` / `user_id` への重複回答を防ぐ
- 正誤判定をサーバー側で行う
- `answer_rank` を全回答者内のサーバー受信順で決める
- `correct_rank` を正解者だけのサーバー受信順で決める
- `/quiz/[launchId]` の回答画面を成立させる

Phase 4では、評価、通報、rank_events本格反映、出題者ランク更新、回答者ランク更新はまだ扱わない。

## 2. Phase 4 の範囲

Phase 4で扱うもの:

- `answers` テーブル
- `POST /api/quiz-launches/[id]/answer`
- `GET /api/quiz-launches/[id]` の回答画面向け拡張
- `/quiz/[launchId]` 回答画面
- 回答済み状態
- 締切済み状態
- `answer_rank`
- `correct_rank`
- 四択の正誤判定
- 同一launchへの重複回答防止

Phase 4で扱う回答形式は四択のみとする。
自由入力回答、短文回答、正解別名、AI判定は扱わない。

## 3. answers テーブル方針

`answers` は回答送信の事実、正誤、順位を保持する。

| カラム | 型の案 | nullable | 方針 |
| --- | --- | --- | --- |
| `id` | `uuid` | no | primary key。 |
| `launch_id` | `uuid` | no | `quiz_launches.id` への外部キー。 |
| `user_id` | `uuid` | no | `profiles.id` / auth user id。 |
| `answer_text` | `text` | yes | 将来の短文回答用。Phase 4では使わない。 |
| `normalized_answer` | `text` | yes | 将来の短文回答用。Phase 4では使わない。 |
| `choice_id` | `text` | no | `question.choices` 内の選択肢id。 |
| `is_correct` | `boolean` | no | `choice_id = correct_choice_id` でサーバー側が決める。 |
| `answer_received_at` | `timestamptz` | no | サーバー受信時刻。クライアント時刻は使わない。 |
| `answer_rank` | `integer` | no | 全回答者内の受信順。1始まり。 |
| `correct_rank` | `integer` | yes | 正解者だけの受信順。不正解は `null`。 |
| `created_at` | `timestamptz` | no | 作成時刻。 |

制約方針:

- `unique (launch_id, user_id)` を付ける
- `answer_rank > 0`
- `correct_rank is null or correct_rank > 0`
- `choice_id` の妥当性はAPI / server function側で `question.choices` と照合する

index案:

- `(launch_id, answer_received_at, id)`
- `(launch_id, answer_rank)`
- `(launch_id, correct_rank)`
- `(user_id, created_at desc)`

## 4. API仕様

### GET /api/quiz-launches/[id]

目的:

- `/quiz/[launchId]` の回答画面に必要なlaunch情報を返す
- `start_at` 到達前は問題本文と選択肢を返さない
- `start_at` 到達後は回答対象者に問題本文と選択肢を返す
- 回答済み状態、締切済み状態を返す

認証:

- 必須

権限:

- `quiz_recipients.user_id = auth.uid()` の本人
- author本人は回答不可。Phase 4では回答画面用payloadではなくauthor向けsummaryに限定する
- admin閲覧は将来のadmin本実装で整理する

response案:

```json
{
  "launch": {
    "id": "launch-id",
    "startAt": "2026-05-21T12:00:15.000Z",
    "endAt": "2026-05-21T12:01:15.000Z",
    "status": "scheduled",
    "category": "雑学",
    "difficulty": 2,
    "authorDisplayName": "出題者"
  },
  "question": null,
  "answer": null,
  "state": {
    "isRecipient": true,
    "hasStarted": false,
    "hasEnded": false,
    "hasAnswered": false,
    "canAnswer": false
  }
}
```

`start_at <= server_now < end_at` の場合だけ、回答対象者へ次を返す。

```json
{
  "question": {
    "id": "question-id",
    "body": "問題文",
    "choices": [
      { "id": "choice_1", "text": "選択肢1" },
      { "id": "choice_2", "text": "選択肢2" },
      { "id": "choice_3", "text": "選択肢3" },
      { "id": "choice_4", "text": "選択肢4" }
    ]
  }
}
```

返してはいけないもの:

- `correct_choice_id`
- 他人の回答
- `answer_rank` / `correct_rank` の全体一覧
- `category_note`

HTTPステータス例:

| status | 用途 |
| --- | --- |
| `200` | 取得成功。 |
| `401` | 未ログイン。 |
| `403` | recipientではない、または停止ユーザー。 |
| `404` | launchが存在しない、または見せてよいlaunchではない。 |

### POST /api/quiz-launches/[id]/answer

目的:

- 回答対象者本人の四択回答を1件作成する
- 正誤、`answer_rank`、`correct_rank` をサーバー側で決める

認証:

- 必須

request body:

```json
{
  "choiceId": "choice_2"
}
```

response案:

```json
{
  "answer": {
    "id": "answer-id",
    "launchId": "launch-id",
    "choiceId": "choice_2",
    "isCorrect": true,
    "answerRank": 4,
    "correctRank": 2,
    "answerReceivedAt": "2026-05-21T12:00:23.123Z"
  }
}
```

HTTPステータス例:

| status | 用途 |
| --- | --- |
| `201` | 回答作成成功。 |
| `400` | request bodyがJSONとして不正。 |
| `401` | 未ログイン。 |
| `403` | recipientではない、author本人、停止ユーザー、停止member。 |
| `404` | launchまたはquestionが見つからない。 |
| `409` | 同一launchに回答済み。 |
| `422` | `choiceId` 不正、`start_at` 前、`end_at` 後、launch状態不正。 |

サーバー側で必ず行う判定:

- `quiz_recipients` に本人が含まれること
- author本人ではないこと
- `profiles.status = active`
- `world_members.status = active`
- `quiz_launches.status` が回答受付可能な状態であること
- `server_now >= start_at`
- `server_now < end_at`
- `choiceId` が `question.choices` 内に存在すること
- 同一 `launch_id` / `user_id` の回答が未作成であること

## 5. /quiz/[launchId] 画面仕様

目的:

- 届いたlaunchのカウントダウン、問題表示、四択回答、回答済み状態を表示する

表示状態:

| 状態 | 表示 |
| --- | --- |
| `start_at` 前 | カウントダウン、出題者名、カテゴリ、難易度、開始予定時刻。問題本文・選択肢は表示しない。 |
| 回答受付中 | 問題本文、選択肢4つ、回答送信ボタン、締切までの残り時間。 |
| 回答済み | 自分の選択、正誤、`answer_rank`、`correct_rank`。再回答ボタンは出さない。 |
| 締切済み・未回答 | 締切済み表示。回答フォームは無効。 |
| 対象外 | 自分に届いたquizではない旨のエラー。 |

主な操作:

- 選択肢を1つ選ぶ
- 回答を送信する
- 回答済み後に結果画面への導線を表示する

Phase 4では `/result/[launchId]` の完全表示は作らない。
回答直後に表示するのは、自分の正誤と順位に限定する。

## 6. start_at / end_at 判定

判定は必ずサーバー時刻で行う。
クライアント時刻は表示上のカウントダウンにのみ使い、受付可否の真実にはしない。

| 条件 | API動作 |
| --- | --- |
| `server_now < start_at` | 問題本文・選択肢を返さない。回答POSTは `422`。 |
| `start_at <= server_now < end_at` | 問題本文・選択肢を返す。回答POSTを受け付ける。 |
| `server_now >= end_at` | 回答POSTは `422`。Phase 4では結果完全表示は返さない。 |

`GET /api/quiz-launches/[id]` は、締切後でも本人の回答済み状態は返してよい。
ただし、他人の回答一覧や正解者順位一覧はPhase 5で扱う。

## 7. answer_rank / correct_rank 計算

順位はサーバー受信順で決める。
端末時刻、ブラウザ送信時刻、表示上の残り時間は順位計算に使わない。

初期方針:

1. API routeまたはDB functionで回答受付条件を検証する
2. launch単位で順位計算が競合しないようにロックする
3. 既存回答数から `answer_rank = count(*) + 1` を決める
4. 正解の場合だけ `correct_rank = count(is_correct = true) + 1` を決める
5. 不正解の場合は `correct_rank = null`
6. `answer_received_at = server_now`
7. `answers` にinsertする

実装方式はDB function / RPC方式に固定する。

- RPC名は `submit_quiz_answer` を基本案にする
- API route側だけで `count + insert` を行う方式は採用しない
- 理由は、同時回答時の `answer_rank` / `correct_rank` 競合を避けるため
- `submit_quiz_answer` 内で対象の `quiz_launches` 行を `select ... for update` してlaunch単位のrank採番を直列化する
- 順位計算、正誤判定、`answer_received_at` 設定、`answers` insertをDB function内でまとめる

Phase 4実装では、API routeは認証済みユーザーのセッションでRPCを呼び出す。
`auth.uid()` を回答者user_idとして扱うため、service role keyだけでRPCを呼び出す構成にはしない。

## 8. 正誤判定

Phase 4は四択のみ。

判定:

- `question.correct_choice_id === request.choiceId` なら正解
- それ以外は不正解

サーバーは `correct_choice_id` をクライアントへ返さない。
正誤判定後、responseには自分の `isCorrect` を返してよい。

自由入力回答、正解別名、AI判定、曖昧判定はPhase 4では扱わない。

## 9. RLS方針

`answers` は順位計算が重要なため、クライアントから直接insertさせない方針を優先する。

| 操作 | 方針 |
| --- | --- |
| `SELECT` | 本人は自分の回答を読める。adminは将来の管理目的で読める。authorの全回答閲覧はPhase 5 resultで整理する。 |
| `INSERT` | 原則API route / server function経由のみ。直接insertは許可しない。 |
| `UPDATE` | 原則不可。回答の変更はMVPでは扱わない。 |
| `DELETE` | 原則不可。削除より停止・非表示運用を優先する。 |

注意点:

- `answer_rank` / `correct_rank` はクライアント入力を信用しない
- `answer_received_at` はクライアント入力を信用しない
- `is_correct` はクライアント入力を信用しない
- `choice_id` だけをrequestとして受け取り、他の重要値はサーバー側で決める

## 10. validation

`POST /api/quiz-launches/[id]/answer` のvalidation:

- ログイン必須
- `profiles.status = active`
- `world_members.status = active`
- launchが存在する
- launchがactive / answering相当の状態である
- 自分が `quiz_recipients` に含まれる
- author本人ではない
- `server_now >= start_at`
- `server_now < end_at`
- 同一launchへ未回答
- `choiceId` 必須
- `choiceId` は `question.choices` 内のid
- questionが `active`
- suspended questionではない

`GET /api/quiz-launches/[id]` のvalidation:

- ログイン必須
- 自分宛のlaunchのみ回答画面用payloadを返す
- `start_at` 前は問題本文と選択肢を返さない
- `correct_choice_id` は常に返さない
- `category_note` は返さない

## 11. テスト方針

unit / integrationで確認すること:

- recipient本人は `start_at` 後に回答できる
- 未ログインでは回答不可
- author本人は回答不可
- recipientではないユーザーは回答不可
- suspended userは回答不可
- inactive world memberは回答不可
- `start_at` 前は回答不可
- `end_at` 後は回答不可
- `start_at` 前のGETでは問題本文・選択肢が返らない
- `start_at` 後のGETでは問題本文・選択肢が返る
- `correct_choice_id` はGETで返らない
- 不正な `choiceId` は `422`
- 同一launchへの重複回答は `409`
- 正解時に `is_correct = true`
- 不正解時に `is_correct = false`
- `answer_rank` が全回答者内の受信順になる
- `correct_rank` が正解者だけの受信順になる
- 不正解回答の `correct_rank` は `null`
- 回答送信時にクライアント時刻を使わない
- 他人の回答一覧はPhase 4では見えない

可能なら追加すること:

- 同時回答に近いケースでrankが重複しないこと
- `unique (launch_id, user_id)` がDBでも効くこと

## 12. Phase 4で作らないもの

- `question_ratings`
- `reports`
- `rank_events` 本格反映
- 出題者ランク更新
- 回答者ランク更新
- result完全表示
- 全回答者一覧
- 正解者順位一覧の公開
- Web Push
- Realtime
- admin本実装
- production deploy
- Supabase cloud project
- Vercel project
- Stripe

## 13. Phase 4完了条件

- `answers` テーブル方針に沿ったlocal migrationがある
- `POST /api/quiz-launches/[id]/answer` が実装されている
- `GET /api/quiz-launches/[id]` が回答画面向けに拡張されている
- `/quiz/[launchId]` でカウントダウン、問題表示、四択回答、回答済み状態、締切済み状態を確認できる
- `start_at` 前に問題本文・選択肢が漏れない
- `end_at` 後に回答できない
- 重複回答できない
- `answer_rank` / `correct_rank` がサーバー受信順で決まる
- `npm run typecheck` が通る
- `npm run lint` が通る
- `npm run test` が通る
- `npm run build` が通る
- Supabase localで回答APIの主要ケースを確認できる
- `.env.local` とsecret実値がcommit対象に含まれていない

## 14. Phase 5 result / rating へ進む条件

Phase 5へ進む前に、以下を満たす。

- Phase 4の回答送信がlocalで検証済み
- 同一launchへの回答重複防止がDB/API両方で効いている
- `answer_rank` / `correct_rank` に同時回答時の破綻がない
- `/quiz/[launchId]` が回答前、回答中、回答済み、締切済みを扱える
- 正解情報が回答前に漏れていない

Phase 5で検討するもの:

- `/result/[launchId]`
- 自分の正誤表示の拡張
- 全回答者一覧
- 未回答者
- 正解者順位
- 3段階評価 + 理由タグ
- 通報導線
- rank_eventsへの初期反映方針
