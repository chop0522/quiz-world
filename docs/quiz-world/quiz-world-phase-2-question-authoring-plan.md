# Phase 2 四択クイズ作成 実装計画

## 1. Phase 2 の目的

Phase 2 では、Phase 1 でログイン・参加状態を作ったユーザーが、自分の四択クイズを作成・保存・編集できる状態にする。

目的は次の通り。

- ログイン済みユーザーが四択クイズを作成できる
- MVPでは四択クイズを優先する
- 問題文、4つの選択肢、正解選択肢、難易度、固定カテゴリを保存できる
- 自分が作成した問題だけを一覧・詳細で確認できる
- `draft` と `active` をユーザーが使い分けられる
- `suspended` はadmin専用状態として扱う

Phase 2 では、AI自動判定、自由入力回答、クイズ配信、通知、回答、結果表示は扱わない。

## 2. Phase 2 の範囲

Phase 2 で扱うもの。

- `questions` テーブル追加方針
- `/create` 画面
- 自分の作成済み問題一覧
- `POST /api/questions`
- `GET /api/questions`
- `GET /api/questions/[id]`
- `PATCH /api/questions/[id]`
- `question.status = draft / active / suspended`
- 固定カテゴリ
- `category_note` の保存・閲覧制御
- Phase 2 向けvalidation
- Phase 2 向けRLS方針
- unit / integration / RLS観点のテスト計画

Phase 2 は「問題を作る」段階であり、「問題を飛ばす」段階ではない。

## 3. `/create` 画面仕様

### 目的

ログイン済みで `profiles.status = active` のユーザーが、四択クイズを作成する。

### 表示要素

- 問題文入力
- 選択肢4つ
- 正解選択肢の指定
- 難易度選択
- カテゴリ選択
- `その他` 選択時のみカテゴリ補足入力
- status選択
  - `draft`
  - `active`
- 保存ボタン
- 作成済み問題一覧への導線
- 不適切内容・曖昧な正解への注意文

### 主な操作

- draft保存
- active保存
- 入力内容のclient-side validation
- server-side validationエラーの表示
- 保存成功後、自分の作成済み問題一覧または詳細へ遷移

### 権限

- 未ログインユーザーは利用不可
- `profiles.status != active` のユーザーは作成不可
- profileが存在しないユーザーは作成不可
- `profiles.status = active` かつ `world_members.status = active` のユーザーのみ作成可

### 空状態

- 作成済み問題がない場合は、一覧側で「まだ作成した問題はありません」を表示する

### エラー状態

- 未ログイン
- profile未作成
- suspended user
- 問題文未入力
- 選択肢不足
- 空の選択肢
- 正解選択肢が不正
- 不正な難易度
- 不正なカテゴリ
- `category != その他` で `category_note` が送られた場合
  - サーバー側で `null` にする
  - エラーにはしない方針

## 4. 作成済み問題一覧仕様

### 目的

自分が作成した問題を確認し、編集対象を選べるようにする。

### 表示要素

- 問題文の短縮表示
- status
- 難易度
- カテゴリ
- 作成日時
- 更新日時
- 編集導線

### 表示対象

- 自分がauthorの問題のみ
- `draft`
- `active`
- `suspended`
  - 自分の問題がadminにより停止された場合、author本人には表示する
  - 編集可否は制限する

### `category_note` の扱い

- author本人には表示してよい
- adminには表示してよい
- 回答者向けAPIには返さない
- Phase 2では回答者向けAPI自体を作らない

### MVPでやらないこと

- 全ユーザー向け公開問題一覧
- 他人のactive問題閲覧
- 配信対象選択
- 回答数、正解率、評価の表示
- ranking連動

## 5. `questions` テーブル追加方針

DB migration SQLはPhase 2計画段階ではまだ作らない。実装時にmigrationとして追加する。

### カラム案

| カラム | 型案 | nullable | 方針 |
| --- | --- | --- | --- |
| `id` | uuid | no | primary key |
| `author_id` | uuid | no | `profiles.id` 参照。auth user idと一致させる |
| `type` | text | no | Phase 2では `multiple_choice` 固定 |
| `body` | text | no | 問題文。最大300文字 |
| `choices` | jsonb | no | 4択の配列。例: `[{ "id": "choice_1", "text": "..." }]`。各textは最大80文字 |
| `correct_choice_id` | text | no | `choices` 内のid |
| `correct_answer` | text | yes | Phase 2では保存しない、または正解選択肢textの補助用途に限定 |
| `answer_aliases` | jsonb | yes | Phase 2では未使用。将来の短文回答用 |
| `difficulty` | integer | no | 1〜5 |
| `category` | text | no | 固定カテゴリのみ |
| `category_note` | text | yes | `category = その他` の場合のみ保存。最大80文字 |
| `status` | text | no | `draft` / `active` / `suspended` |
| `created_at` | timestamptz | no | default now |
| `updated_at` | timestamptz | no | update trigger |

### status

| status | 意味 | 設定できる人 |
| --- | --- | --- |
| `draft` | 下書き。配信候補ではない | author |
| `active` | 配信候補にできる問題 | author |
| `suspended` | adminにより停止 | adminのみ |

Phase 2では `active` は「将来配信可能な状態」を意味するだけで、実際の配信は行わない。

### 固定カテゴリ

- 雑学
- 歴史
- 地理
- 科学
- エンタメ
- スポーツ
- 言葉
- 謎解き
- その他

### 制約案

- `author_id` は必須
- `type = multiple_choice`
- `body` は空不可、最大300文字
- `choices` は4件必須
- 選択肢textは空不可、各80文字まで
- 選択肢textの完全重複はエラー
- `correct_choice_id` は `choices` 内のid
- `difficulty` は1〜5
- `category` は固定カテゴリのみ
- `category_note` は `category = その他` の場合のみ保持、最大80文字
- `category != その他` の場合はAPI側で `category_note = null` にする
- `status` は `draft / active / suspended`

DB制約で表現しづらい `choices` の件数や `correct_choice_id` の整合は、API側validationを主にする。DB側には最低限のcheck制約を置く。

### index案

- `questions_author_status_idx` on `(author_id, status, updated_at desc)`
- `questions_status_category_idx` on `(status, category)`
- `questions_created_at_idx` on `(created_at desc)`

## 6. API仕様

### `POST /api/questions`

目的: 四択クイズを作成する。

認証: 必須。

権限:

- `profiles.status = active`
- profileが存在する
- `world_members.status = active`

request body:

```json
{
  "body": "問題文",
  "choices": [
    { "id": "choice_1", "text": "選択肢1" },
    { "id": "choice_2", "text": "選択肢2" },
    { "id": "choice_3", "text": "選択肢3" },
    { "id": "choice_4", "text": "選択肢4" }
  ],
  "correctChoiceId": "choice_1",
  "difficulty": 3,
  "category": "雑学",
  "categoryNote": null,
  "status": "draft"
}
```

response:

```json
{
  "ok": true,
  "question": {
    "id": "...",
    "body": "...",
    "choices": [],
    "correctChoiceId": "choice_1",
    "difficulty": 3,
    "category": "雑学",
    "categoryNote": null,
    "status": "draft"
  }
}
```

HTTP status:

- `201`: 作成成功
- `400`: JSON不正
- `401`: 未ログイン
- `403`: suspended user / profileなし / world参加なし
- `422`: validation error

サーバー側で必ず行うこと:

- auth user取得
- profile取得
- `profiles.status = active` 確認
- `world_members.status = active` 確認
- author_idをclient inputから受け取らずauth user idで決定
- `status = suspended` の指定拒否
- `category != その他` の場合は `category_note = null`

### `GET /api/questions`

目的: 自分の作成済み問題一覧を取得する。

認証: 必須。

権限:

- 自分のquestionsのみ
- admin一覧用途はPhase 2では作らない

query:

- `status`
  - optional
  - `draft` / `active` / `suspended`
- `limit`
- `cursor` または `page`

response:

```json
{
  "ok": true,
  "questions": [
    {
      "id": "...",
      "bodyPreview": "...",
      "difficulty": 3,
      "category": "雑学",
      "categoryNote": null,
      "status": "draft",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

注意:

- author本人向けなので `categoryNote` を返してよい
- 他人の問題は返さない
- 回答者向け一覧ではない

HTTP status:

- `200`: 取得成功
- `401`: 未ログイン
- `403`: profileなし / suspended user

### `GET /api/questions/[id]`

目的: 自分の作成済み問題詳細を取得する。

認証: 必須。

権限:

- author本人
- adminはPhase 2ではAPI対象外。ただし将来admin moderation APIで全件閲覧可能にする

response:

```json
{
  "ok": true,
  "question": {
    "id": "...",
    "body": "...",
    "choices": [],
    "correctChoiceId": "choice_1",
    "difficulty": 3,
    "category": "その他",
    "categoryNote": "補足",
    "status": "active",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

HTTP status:

- `200`: 取得成功
- `401`: 未ログイン
- `403`: 閲覧権限なし
- `404`: 存在しない、または自分の問題ではない

### `PATCH /api/questions/[id]`

目的: 自分の作成済み問題を編集する。

認証: 必須。

権限:

- author本人
- `profiles.status = active`
- `world_members.status = active`
- `suspended` の問題はauthorが直接編集できない方針
- `suspended` 解除はadmin本実装まで扱わない

request body:

- `POST /api/questions` と同じ項目を部分更新または全量更新
- Phase 2では実装を単純にするため全量更新を推奨

HTTP status:

- `200`: 更新成功
- `400`: JSON不正
- `401`: 未ログイン
- `403`: 権限なし / suspended user / suspended question
- `404`: 対象なし
- `422`: validation error

サーバー側で必ず行うこと:

- author_idの変更禁止
- `status = suspended` のユーザー指定禁止
- `category != その他` の場合は `category_note = null`
- `choices` と `correct_choice_id` の整合確認

## 7. validation仕様

Phase 2では、client-side validationはUX用、server-side validationを正とする。

### 認証・状態

- ログイン必須
- `profiles.status = active` のみ作成可
- display_name / profile が存在するユーザーのみ作成可
- `world_members.status = active` のユーザーのみ作成可

### 問題文

- `body` は必須
- trim後に空文字は禁止
- 最大300文字

### 選択肢

- `choices` は4つ固定
- 各choiceに `id` と `text` が必要
- `text` の空文字は禁止
- `text` は各80文字まで
- `id` は重複不可
- 選択肢textの完全重複はエラー

### 正解

- `correct_choice_id` は4つの選択肢のいずれか
- 複数正解はPhase 2では扱わない

### 難易度

- `difficulty` は1〜5

### カテゴリ

- 固定カテゴリのみ
- `category = その他` の場合のみ `category_note` を許可
- `category_note` は最大80文字
- `category != その他` の場合はサーバー側で `category_note = null` にする

### status

- authorが設定できるのは `draft` / `active`
- `suspended` はadminのみ
- Phase 2ではadmin本実装をしないため、ユーザーAPIから `suspended` は常に拒否する

## 8. RLS方針

### 基本方針

- `questions.author_id` は auth user id
- authorは自分のquestionsを作成・閲覧・編集できる
- 他人のdraft questionsは見えない
- active questions の公開範囲はPhase 3以降で決める
- suspended question はauthorとadminのみ閲覧
- adminはmoderation目的で全件閲覧可能

### SELECT

許可:

- author本人が自分のquestionsをSELECT
- adminが全questionsをSELECT

Phase 2では、他人のactive questionsを一般公開しない。

### INSERT

許可:

- authenticated user
- `author_id = auth.uid()`
- active profile

重要処理:

- profile状態確認はAPI route / server function側でも行う
- clientから任意のauthor_idを受け取らない

### UPDATE

許可:

- author本人が自分の `draft` / `active` をUPDATE
- adminがmoderation目的でUPDATE

制限:

- authorは `suspended` を設定できない
- authorは `suspended` questionを直接編集できない
- author_id変更不可

### DELETE

Phase 2ではDELETEを作らない。

理由:

- 削除より停止を優先する既存方針に合わせる
- 誤操作防止
- 将来の通報・監査と整合させる

### `category_note` の注意

Supabase RLSは基本的に行単位の制御であり、列単位の秘匿には向かない。

Phase 2では、`category_note` はauthor本人向けAPIとadmin向けAPIだけで返す。将来回答者向けAPIを作る場合は、次のどちらかを採用する。

- 回答者向けAPI routeで `category_note` をselectしない
- 回答者向けviewを作り、`category_note` を含めない

clientから直接 `questions` を広くselectさせる設計にはしない。

## 9. テスト方針

### unit test

- category validation
- choices validation
- correct_choice_id validation
- status validation
- `category_note` normalization

### API integration test

- 未ログインでは作成不可
- bodyなしでは作成不可
- bodyが300文字を超えると作成不可
- choicesが4つ未満なら作成不可
- choicesが4つを超えても作成不可
- choicesに空文字があると作成不可
- choice textが80文字を超えると作成不可
- choice textの完全重複は作成不可
- 正解選択肢が不正なら作成不可
- 不正カテゴリなら作成不可
- `category = その他` の `category_note` が80文字を超えると作成不可
- `category = その他` 以外で `category_note` を送っても保存されない
- `status = suspended` はユーザーAPIから設定不可
- 自分の問題一覧だけ取得できる
- 他人のdraftは取得できない
- suspendedはユーザーが直接設定できない

### RLS policy test

- authorは自分のquestionsをselectできる
- authorは他人のdraft questionsをselectできない
- authorは自分のquestionsをinsertできる
- author_id偽装insertを拒否する
- adminはmoderation目的で全件selectできる

### UI test

- `/create` が未ログイン時にログイン導線を出す
- 必須項目不足時に保存できない
- `その他` 選択時だけ `category_note` 入力欄を出す
- 保存成功後に一覧へ反映される
- 一覧から編集画面へ遷移できる

## 10. Phase 2で作らないもの

- `quiz_launches`
- `quiz_recipients`
- `answers`
- `answer_rank`
- `correct_rank`
- 通知
- ranking
- `question_ratings`
- `reports`
- Web Push
- Realtime
- admin本実装
- production deploy
- Supabase cloud project
- Vercel project
- Stripe
- AI自動判定
- 自由入力回答
- 公開問題一覧
- クイズ配信
- 回答画面
- 結果画面

## 11. Phase 2完了条件

Phase 2は、次を満たしたら完了とする。

- Supabase local用の `questions` migrationがある
- `/create` で四択クイズを作成できる
- 自分の作成済み問題一覧を見られる
- 自分の作成済み問題詳細を見られる
- 自分の問題を編集できる
- 未ログイン・suspended userは作成できない
- fixed category validationがserver-sideで効く
- `body` 最大300文字、choice text最大80文字、`category_note` 最大80文字の制限がserver-sideで効く
- 選択肢4つ固定、完全重複エラー、`correct_choice_id` 整合チェックがserver-sideで効く
- `category_note` が `その他` の場合だけ保存される
- `category_note` が回答者向けに返らない設計が維持されている
- `npm run typecheck` が通る
- `npm run lint` が通る
- `npm run test` が通る
- `npm run build` が通る
- Supabase localでAPIの最小動作確認ができる

## 12. Phase 3へ進む条件

Phase 3へ進む前に、次を確認する。

- `questions` のstatus運用が固まっている
- `active` の意味が「配信可能な問題」であることが実装・UI・docsで一致している
- `category_note` が回答者向けに漏れない方針が実装で守られている
- 作成済み問題の編集可否が明確
- suspended questionをauthorがどう見るかが明確
- Phase 3で作る `quiz_launches / quiz_recipients` の最小範囲をdocs化する
- 出題者ランクによる配信人数制限はPhase 3以降に回すか、Phase 3で扱うかを決める
- 通知はまだWeb Pushではなく画面内表示から始める方針を再確認する
