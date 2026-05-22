# Phase 5 Result / Rating / Reports Plan

## 1. Phase 5 の目的

Phase 5では、回答後に `/result/[launchId]` で結果を確認できるようにする。

主目的は以下。

- 自分の正誤、`answer_rank`、`correct_rank` を分かりやすく表示する
- 全回答者の回答順位、正誤、正解者順位を表示する
- 未回答者も表示する
- 回答者がクイズを3段階評価できるようにする
- 回答者が問題を通報できるようにする

Phase 5では、`rank_events` 本格反映、出題者ランク自動更新、回答者ランク自動更新はまだ扱わない。

## 2. Phase 5 の範囲

Phase 5で扱うもの:

- `/result/[launchId]`
- `GET /api/quiz-launches/[id]/result`
- `POST /api/quiz-launches/[id]/rating`
- `POST /api/reports`
- `question_ratings` テーブル
- `reports` テーブル
- 自分の正誤
- `answer_rank`
- `correct_rank`
- 全回答者一覧
- 未回答者一覧
- 3段階評価
- 理由タグ
- 通報導線

Phase 5は結果確認とフィードバック導線のPhaseである。
ランク計算や管理画面の通報対応本実装は後続Phaseへ分ける。

## 3. question_ratings テーブル方針

`question_ratings` は、回答者によるクイズ評価を保持する。

| カラム | 型の案 | nullable | 方針 |
| --- | --- | --- | --- |
| `id` | `uuid` | no | primary key。 |
| `launch_id` | `uuid` | no | `quiz_launches.id` への外部キー。 |
| `question_id` | `uuid` | no | `questions.id` への外部キー。 |
| `rater_id` | `uuid` | no | 評価者。`profiles.id` / auth user id。 |
| `rating` | `text` | no | `good` / `normal` / `weak`。 |
| `reason` | `text` | yes | 理由タグ。MVP初期は1つだけ保存する。 |
| `created_at` | `timestamptz` | no | 作成時刻。 |

制約方針:

- `unique (launch_id, rater_id)` を付ける
- `rating in ('good', 'normal', 'weak')`
- `rater_id` は `quiz_recipients` に含まれる本人のみ
- author本人は自分の問題を評価できない
- ratingの更新はMVPでは不可
- 複数タグ `jsonb` は将来拡張とする

評価ラベル:

| DB値 | 表示 |
| --- | --- |
| `good` | 良問 |
| `normal` | 普通 |
| `weak` | 微妙 |

理由タグ:

- 面白い
- 難易度がちょうどいい
- 答えが曖昧
- 難しすぎる
- 簡単すぎる
- 不適切

固定方針:

- MVP初期は理由タグを1つだけ保存する
- `question_ratings.reason text` を使う
- 同一 `launch_id` / `rater_id` は1件のみ
- ratingの更新はMVPでは不可
- 変更したい場合は後続Phaseで検討する

## 4. reports テーブル方針

`reports` は、問題またはlaunchへの通報を保持する。

| カラム | 型の案 | nullable | 方針 |
| --- | --- | --- | --- |
| `id` | `uuid` | no | primary key。 |
| `question_id` | `uuid` | no | 通報対象の問題。 |
| `launch_id` | `uuid` | yes | launch文脈がある場合に保存。 |
| `reporter_id` | `uuid` | no | 通報者。 |
| `reason` | `text` | no | 通報理由。 |
| `status` | `text` | no | `open` / `reviewing` / `resolved` / `dismissed`。 |
| `created_at` | `timestamptz` | no | 作成時刻。 |
| `updated_at` | `timestamptz` | no | 更新時刻。 |

制約方針:

- `status default 'open'`
- `reason` は固定理由から選ぶ
- 同一 `question_id` / `launch_id` / `reporter_id` / `reason` の重複を防ぐ
- 同じreportを連打した場合は `409` を返す
- admin本実装までは `status = open` のまま保存してよい
- update/delete APIは作らない
- 完全削除ではなくstatus管理を優先する

通報できるユーザー:

- launch recipient
- launch author

admin確認ベース:

- 1件目: `reports.status = open`
- 同一問題に2件以上: admin候補表示、またはreport count表示に留める
- Phase 5では `question.status = review_required` へ自動更新しない
- admin判断で不適切: `question.status = suspended`
- `review_required` 自動更新はadmin本実装Phaseで検討する
- 自動停止はMVPでは行わない

## 5. API仕様

### GET /api/quiz-launches/[id]/result

目的:

- `/result/[launchId]` に必要な結果データを返す
- 自分の回答、全回答者、未回答者、正解情報を返す

認証:

- 必須

権限:

- launch recipient
- launch author
- adminは将来のadmin本実装で整理する

表示条件:

- `start_at` 前は結果を返さない
- recipientは、自分が回答済み、または `end_at` 後に結果を見られる
- authorは `start_at` 後に結果を見られる
- `start_at` 前は誰にもresultを見せない

response案:

```json
{
  "launch": {
    "id": "launch-id",
    "startAt": "2026-05-21T12:00:15.000Z",
    "endAt": "2026-05-21T12:01:15.000Z",
    "status": "closed",
    "authorDisplayName": "出題者",
    "category": "雑学",
    "difficulty": 2
  },
  "question": {
    "id": "question-id",
    "body": "問題文",
    "choices": [
      { "id": "choice_1", "text": "選択肢1" },
      { "id": "choice_2", "text": "選択肢2" }
    ],
    "correctChoiceId": "choice_2"
  },
  "viewerAnswer": {
    "choiceId": "choice_2",
    "isCorrect": true,
    "answerRank": 1,
    "correctRank": 1
  },
  "answeredRecipients": [],
  "unansweredRecipients": [],
  "rating": null,
  "canRate": true,
  "canReport": true
}
```

返してよいもの:

- resultでは正解表示のため `correctChoiceId` を返してよい
- `answer_rank`
- `correct_rank`
- 全回答者の表示名、回答順位、正誤、正解者順位
- 未回答者の表示名

返さないもの:

- `category_note`
- 他ユーザーのemail
- report詳細
- admin内部status

HTTPステータス例:

| status | 用途 |
| --- | --- |
| `200` | 結果取得成功。 |
| `401` | 未ログイン。 |
| `403` | 閲覧権限なし、または結果公開条件未達。 |
| `404` | launchが存在しない、または見せてよいlaunchではない。 |
| `422` | `start_at` 前など、結果表示条件を満たさない。 |

### POST /api/quiz-launches/[id]/rating

目的:

- 回答者がlaunch単位で問題を評価する

認証:

- 必須

request body案:

```json
{
  "rating": "good",
  "reason": "面白い"
}
```

validation:

- recipient本人のみ
- author本人は不可
- 同一 `launch_id` / `rater_id` は1件のみ
- ratingの更新はMVPでは不可
- `rating` は `good` / `normal` / `weak`
- `reason` は固定理由タグ
- `question.status` が `active` または `review_required` 相当であること

HTTPステータス例:

| status | 用途 |
| --- | --- |
| `201` | 評価作成成功。 |
| `400` | JSON不正。 |
| `401` | 未ログイン。 |
| `403` | recipientではない、author本人。 |
| `404` | launchまたはquestionが見つからない。 |
| `409` | 評価済み。 |
| `422` | rating/reason不正。 |

### POST /api/reports

目的:

- 問題またはlaunchへの通報を作成する

認証:

- 必須

request body案:

```json
{
  "launchId": "launch-id",
  "questionId": "question-id",
  "reason": "不適切"
}
```

validation:

- reporterはlaunch recipientまたはlaunch author
- `reason` は固定通報理由
- `question_id` と `launch_id` の対応をサーバー側で確認する
- 同一 `question_id` / `launch_id` / `reporter_id` / `reason` の重複を防ぐ
- 同じreportを連打した場合は `409` を返す
- `reports.status` は `open` で作成する
- admin本実装まではupdate/deleteしない

HTTPステータス例:

| status | 用途 |
| --- | --- |
| `201` | 通報作成成功。 |
| `400` | JSON不正。 |
| `401` | 未ログイン。 |
| `403` | 通報権限なし。 |
| `404` | 対象が見つからない。 |
| `409` | 同一通報済み。 |
| `422` | reason不正。 |

## 6. /result/[launchId] 画面仕様

目的:

- 回答後または締切後に結果を確認する
- 評価と通報を行えるようにする

表示要素:

- 問題文
- 選択肢
- 正解
- 出題者名
- カテゴリ
- 難易度
- 自分の正誤
- 自分の `answer_rank`
- 自分の `correct_rank`
- 全回答者一覧
- 未回答者一覧
- クイズ評価フォーム
- 理由タグ
- 通報ボタン

主な状態:

| 状態 | 表示 |
| --- | --- |
| `start_at` 前 | 結果はまだ見られない。 |
| 回答受付中・未回答recipient | 結果はまだ見られない。回答画面へ誘導する。 |
| 回答済みrecipient | 自分の結果と現時点の回答者一覧を表示する。 |
| `end_at` 後recipient | 回答済み/未回答にかかわらず結果を表示する。 |
| author | `start_at` 後に結果を表示する。 |
| 対象外 | launchが見つからない、または権限なし。 |

## 7. 結果表示ルール

基本方針:

- `start_at` 前に結果を見せない
- 回答受付中の未回答recipientには結果を見せない
- 回答済みrecipientは結果を見られる
- `end_at` 後はrecipient全員が結果を見られる
- authorは `start_at` 後に結果を見られる
- result APIでは正解表示のため `correctChoiceId` を返してよい
- 通常の `/quiz/[launchId]` 回答APIでは `correctChoiceId` を返さない

全回答者一覧:

- 表示名
- 選択肢
- 正誤
- `answer_rank`
- `correct_rank`
- 回答時刻の相対表示または時刻

未回答者一覧:

- 表示名
- 通知状態
- 未回答ラベル

注意:

- emailは表示しない
- `category_note` は表示しない
- 管理者向け内部statusは表示しない

## 8. 評価ルール

評価できるユーザー:

- launch recipientのみ
- author本人は不可

評価タイミング:

- 自分が結果を見られる状態になってから
- 回答済みrecipientは回答後
- 未回答recipientは `end_at` 後

評価値:

- 良問
- 普通
- 微妙

理由タグ:

- 面白い
- 難易度がちょうどいい
- 答えが曖昧
- 難しすぎる
- 簡単すぎる
- 不適切

Phase 5では、評価を保存するところまで扱う。
出題者ランクへの本格反映はPhase 6以降に分ける。
ratingの更新はMVPでは不可とし、変更機能は後続Phaseで検討する。

## 9. 通報ルール

通報できるユーザー:

- launch recipient
- launch author

通報対象:

- question
- launch文脈付きquestion

通報理由:

- 答えが曖昧
- 不適切
- スパム
- その他

初期対応方針:

- report作成後はadmin確認待ち
- 同一問題に2件以上のreportがあっても、Phase 5では `question.status = review_required` に自動更新しない
- Phase 5ではadmin候補表示、またはreport count表示に留める
- `review_required` 自動更新はadmin本実装Phaseで検討する
- 自動停止はMVPでは行わない
- `question.status = suspended` はadmin判断のみ
- `reports.status` は初期値 `open` とし、admin本実装までは `open` のまま保存してよい

## 10. RLS方針

### question_ratings

| 操作 | 方針 |
| --- | --- |
| `SELECT` | 本人のrating、authorの自分のquestionに対する集計、admin。Phase 5 APIでは必要最小限だけ返す。 |
| `INSERT` | recipient本人のみ。実装はAPI route経由を優先。 |
| `UPDATE` | MVPでは不可。変更機能は後続Phaseで検討する。 |
| `DELETE` | MVPでは不可。 |

### reports

| 操作 | 方針 |
| --- | --- |
| `SELECT` | reporter本人とadminのみ。authorにはreport詳細を直接見せない。 |
| `INSERT` | recipientまたはauthor本人。API route経由を優先。 |
| `UPDATE` | adminのみ。Phase 5ではadmin本実装を行わないため原則扱わない。 |
| `DELETE` | 原則不可。削除よりstatus管理を優先。 |

重要処理:

- rating作成権限はAPI側でも確認する
- report作成権限はAPI側でも確認する
- service role keyはサーバー専用
- clientにsecretを出さない

## 11. validation

result取得:

- ログイン必須
- launchが存在する
- viewerがrecipientまたはauthor
- `start_at` 前は不可
- recipientは回答済みまたは `end_at` 後
- suspended userは不可

rating作成:

- ログイン必須
- recipient本人のみ
- author本人は不可
- 同一launch/raterは1件のみ
- ratingは固定値
- reasonは固定理由タグ

report作成:

- ログイン必須
- recipientまたはauthor
- `question_id` と `launch_id` の対応確認
- reasonは固定理由
- 同一 `question_id` / `launch_id` / `reporter_id` / `reason` の重複は `409`
- `status = open` で作成

## 12. テスト方針

unit / integrationで確認すること:

- `start_at` 前はresult取得不可
- 未ログインではresult取得不可
- recipientではないユーザーはresult取得不可
- recipientは回答済みなら受付中でもresult取得可
- recipientは未回答でも `end_at` 後ならresult取得可
- recipientは未回答かつ受付中ならresult取得不可
- authorは `start_at` 後にresult取得可
- resultでは `correctChoiceId` が返る
- `/quiz/[launchId]` では `correctChoiceId` が返らない
- `category_note` はresultでも返らない
- 全回答者一覧が `answer_rank` 順で返る
- 正解者順位が `correct_rank` と一致する
- 未回答者一覧が返る
- recipientはrating作成可
- authorはrating不可
- rating重複は `409`
- 不正rating/reasonは `422`
- recipientまたはauthorはreport作成可
- 権限外ユーザーはreport不可
- 同一report重複は `409`
- reportが2件以上でもPhase 5では `question.status = review_required` に自動更新しない

## 13. Phase 5で作らないもの

- Web Push
- Realtime
- admin本実装
- `rank_events` 本格反映
- 出題者ランク自動更新
- 回答者ランク自動更新
- Supabase cloud project
- Vercel project
- Stripe
- production deploy

## 14. Phase 5完了条件

- `question_ratings` テーブル方針に沿ったlocal migrationがある
- `reports` テーブル方針に沿ったlocal migrationがある
- `GET /api/quiz-launches/[id]/result` が実装されている
- `POST /api/quiz-launches/[id]/rating` が実装されている
- `POST /api/reports` が実装されている
- `/result/[launchId]` で自分の正誤、順位、全回答者、未回答者を確認できる
- ratingを1件保存できる
- reportを1件保存できる
- rank_eventsやランク自動更新を呼ばない
- Web Push / Realtime / admin本実装を含めない
- `npm run typecheck` が通る
- `npm run lint` が通る
- `npm run test` が通る
- `npm run build` が通る
- Supabase localで主要ケースを確認できる
- `.env.local` とsecret実値がcommit対象に含まれていない

## 15. Phase 6 rank_events / ranking へ進む条件

Phase 6へ進む前に、以下を満たす。

- Phase 5のresult/rating/reportがlocalで検証済み
- 全回答者一覧と未回答者一覧の表示条件が破綻していない
- rating重複防止がDB/APIで効いている
- report作成権限がDB/APIで効いている
- Phase 5で `question.status = review_required` を自動更新しない方針が実装に反映されている

Phase 6で検討するもの:

- `rank_events`
- 出題者スコア反映
- 回答者スコア反映
- 良問評価による出題者ランク更新
- 正解率、速さ、難問正解による回答者ランク更新
- ランキング集計バッチの初期案
