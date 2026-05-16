# 通知型早押しクイズワールド MVP API仕様

## 目的

このドキュメントは、MVP向けAPIの仕様案を整理する。
実装コードやDB migrationは作成しない。

## 共通原則

- 出題対象抽選はサーバー側で行う。
- 回答順位はサーバー受信順で決める。
- クライアント時刻は信用しない。
- 出題者本人には配信しない。
- quiet hours、通知上限、ブロック関係をサーバーで見る。
- 参加枠上限もサーバーで見る。
- 18歳以上確認と規約同意はサーバー側で記録する。
- 招待コード検証はサーバー側で行う。
- 同一ユーザーの同一launchへの重複回答を防ぐ。
- end_at後の回答を拒否する。
- 配信対象者以外の回答を拒否する。
- 回答前に他人のanswersを見せない。
- 通報・ブロックはユーザー本人操作として記録する。
- admin APIは `profiles.role = admin` のみ許可する。
- suspended userは出題、回答、評価、通報、ブロック作成などの主要操作を制限する。
- 管理者操作は admin_audit_logs に必ず記録する。
- admin操作とadmin_audit_logs記録は同一transaction扱いにし、ログ記録に失敗した場合は操作全体を失敗扱いにする。
- `category_note` は `その他` 選択時のみ許可し、回答者向けAPIや結果APIには返さない。
- RLSだけに任せず、重要処理はAPI route / server function側でも検証する。

## 共通HTTPステータス

| ステータス | 用途 |
| --- | --- |
| 200 | 取得、更新、検証成功。 |
| 201 | 作成成功。 |
| 400 | request body不正、必須項目不足。 |
| 401 | 未認証。 |
| 403 | 権限なし、配信対象外、停止中。 |
| 404 | 対象リソースなし。 |
| 409 | 重複、満員、すでに回答済み、すでに評価済み。 |
| 422 | バリデーションは通るが業務ルール上処理不可。 |

## `POST /api/signup`

| 項目 | 内容 |
| --- | --- |
| 目的 | 招待コードを持つ18歳以上ユーザーを登録し、ワールド参加を確定する。 |
| 認証 | 未認証。認証作成処理と連動。 |
| 権限 | 有効な招待コードを持つユーザー。 |

### request body

```json
{
  "displayName": "ユーザー名",
  "email": "user@example.com",
  "inviteCode": "ABC123",
  "ageConfirmed": true,
  "termsAccepted": true,
  "privacyAccepted": true
}
```

### response

```json
{
  "profileId": "uuid",
  "worldId": "uuid",
  "status": "joined"
}
```

### バリデーション

- displayName必須。
- email必須。
- inviteCode必須。
- ageConfirmed / termsAccepted / privacyAccepted が true。
- 招待コードが有効、未使用、有効期限内。

### サーバー側で必ず行う判定

- 招待コード検証。
- world.member_limit と active world_members count の確認。
- age_confirmed_at / terms_accepted_at / privacy_accepted_at の保存。
- 満員時は参加させず waitlist 導線を返す。

### エラー

- 400: 必須項目不足。
- 403: 18歳以上確認または同意が不足。
- 404: 招待コードなし。
- 409: 参加枠満員。
- 422: 招待コード期限切れまたは使用済み。

## `POST /api/waitlist`

| 項目 | 内容 |
| --- | --- |
| 目的 | 満員時や招待コード未所持のユーザーをwaitlistへ登録する。 |
| 認証 | 不要または任意。 |
| 権限 | 誰でも登録可能。ただし重複制限あり。 |

### request body

```json
{
  "email": "user@example.com",
  "displayName": "ユーザー名"
}
```

### response

```json
{
  "waitlistId": "uuid",
  "status": "waiting"
}
```

### バリデーション

- email必須。
- displayName任意または必須。
- 同じemailの重複登録を防ぐ。

### エラー

- 400: email不正。
- 409: 登録済み。

## `GET /api/world`

| 項目 | 内容 |
| --- | --- |
| 目的 | 現在のワールド状態を取得する。 |
| 認証 | ログイン済み推奨。一部公開情報は未ログインでも可。 |
| 権限 | world memberは詳細表示。未ログインは概要のみ。 |

### response

```json
{
  "id": "uuid",
  "name": "クイズワールド",
  "memberLimit": 10,
  "memberCount": 8,
  "currentSeason": 0,
  "stats": {
    "questionCount": 120,
    "answerCount": 450,
    "averageRating": 0.82,
    "reportRate": 0.01
  }
}
```

### サーバー側で必ず行う判定

- ログイン状態とworld membership。
- 未ログインに公開してよい情報の制限。

### エラー

- 404: worldなし。

## `POST /api/invites/validate`

| 項目 | 内容 |
| --- | --- |
| 目的 | 招待コードが登録に使えるか検証する。 |
| 認証 | 不要。 |
| 権限 | 招待コードを持つユーザー。 |

### request body

```json
{
  "code": "ABC123"
}
```

### response

```json
{
  "valid": true,
  "worldId": "uuid",
  "expiresAt": "2026-05-01T00:00:00Z"
}
```

### サーバー側で必ず行う判定

- codeの存在。
- statusがactive。
- expires_atが未来。
- 参加枠の空き。

### エラー

- 400: code未入力。
- 404: codeなし。
- 409: 参加枠満員。
- 422: 期限切れまたは使用済み。

## `POST /api/questions`

| 項目 | 内容 |
| --- | --- |
| 目的 | 四択クイズを作成する。 |
| 認証 | 必須。 |
| 権限 | active world member。停止中ユーザー不可。 |

### request body

```json
{
  "body": "問題文",
  "choices": [
    { "id": "a", "text": "選択肢A" },
    { "id": "b", "text": "選択肢B" },
    { "id": "c", "text": "選択肢C" },
    { "id": "d", "text": "選択肢D" }
  ],
  "correctChoiceId": "a",
  "difficulty": 2,
  "category": "歴史"
}
```

### response

```json
{
  "questionId": "uuid",
  "status": "active"
}
```

### バリデーション

- 問題文必須。
- 選択肢は4つ。
- correctChoiceId は choices に含まれる。
- 難易度は許可範囲内。
- カテゴリは固定カテゴリから選ぶ。その他の場合のみ補足テキストを許可する。
- `その他` 以外の category_note は保存しない、またはサーバー側で無視する。

### サーバー側で必ず行う判定

- ユーザーが停止中でない。
- author_id は認証ユーザーから設定する。
- 不適切内容の初期チェック。
- category_note は出題者本人とadmin向けにだけ返す。

### エラー

- 400: body不正。
- 401: 未認証。
- 403: 停止中またはworld memberではない。
- 422: 選択肢不正。

## `POST /api/quiz-launches`

| 項目 | 内容 |
| --- | --- |
| 目的 | 作成済みクイズを出題し、対象者を抽選する。 |
| 認証 | 必須。 |
| 権限 | question author、active world member。 |

### request body

```json
{
  "questionId": "uuid"
}
```

### response

```json
{
  "launchId": "uuid",
  "recipientCount": 3,
  "startAt": "2026-04-25T12:00:15Z",
  "endAt": "2026-04-25T12:01:15Z",
  "status": "scheduled"
}
```

### サーバー側で必ず行う判定

- 出題者本人である。
- 今日の残り出題回数。
- 出題者ランクに応じた配信人数。
- world memberから候補抽出。
- 出題者本人を除外。
- quiet hours、通知上限、ブロック関係、休憩モードを確認。
- 対象者をサーバー側で抽選。
- start_at = now + 15秒。
- end_at = start_at + 60秒。
- quiz_recipients を作成。

### エラー

- 401: 未認証。
- 403: authorではない、停止中、上限到達。
- 404: questionなし。
- 409: 配信可能対象者なし。
- 422: questionが停止中。

## `GET /api/quiz-launches`

| 項目 | 内容 |
| --- | --- |
| 目的 | `/home` 用に、自分に届いたクイズ一覧を取得する。Phase 1の15秒ポーリングで使う。 |
| 認証 | 必須。 |
| 権限 | active world member。本人宛の quiz_recipients のみ。 |

### query

| パラメータ | 説明 |
| --- | --- |
| status | optional。upcoming, answerable, answered, closed など。 |
| since | optional。Realtime化しやすいよう、最終取得時刻以降の更新取得に使う。 |

### response

```json
{
  "items": [
    {
      "launchId": "uuid",
      "questionId": "uuid",
      "authorDisplayName": "出題者",
      "startAt": "2026-04-25T12:00:15Z",
      "endAt": "2026-04-25T12:01:15Z",
      "status": "scheduled",
      "myState": "upcoming",
      "answered": false
    }
  ],
  "pollingIntervalSeconds": 15
}
```

### サーバー側で必ず行う判定

- 認証ユーザーの quiz_recipients のみ返す。
- start_at前は問題本文と選択肢を返さない。
- suspended userには操作可能なlaunchとして返さない。
- ブロックや停止によって後から制限されたlaunchは状態を反映する。

### エラー

- 401: 未認証。
- 403: world memberではない、または停止中。

Phase 1は15秒ポーリングで開始する。
Phase 1.5でSupabase Realtime化する場合も、このAPIの返却形を基準にする。

## `GET /api/quiz-launches/[id]`

| 項目 | 内容 |
| --- | --- |
| 目的 | クイズ回答画面に必要なlaunch情報を取得する。 |
| 認証 | 必須。 |
| 権限 | recipient、author、admin。 |

### response

```json
{
  "launchId": "uuid",
  "startAt": "2026-04-25T12:00:15Z",
  "endAt": "2026-04-25T12:01:15Z",
  "status": "scheduled",
  "question": {
    "body": null,
    "choices": null
  }
}
```

start_at前は問題文と選択肢を返さない。
start_at後は問題文と選択肢を返す。

### サーバー側で必ず行う判定

- 配信対象者か。
- start_at到達済みか。
- question.statusが停止中でないか。

### エラー

- 401: 未認証。
- 403: 配信対象外。
- 404: launchなし。
- 422: launch停止中。

## `POST /api/quiz-launches/[id]/answer`

| 項目 | 内容 |
| --- | --- |
| 目的 | 回答を受信し、正誤と順位を記録する。 |
| 認証 | 必須。 |
| 権限 | recipientのみ。 |

### request body

```json
{
  "choiceId": "a"
}
```

### response

```json
{
  "answerId": "uuid",
  "isCorrect": true,
  "answerRank": 1,
  "correctRank": 1,
  "answerReceivedAt": "2026-04-25T12:00:20Z"
}
```

### サーバー側で必ず行う判定

- 認証ユーザーが quiz_recipients にいる。
- 出題者本人ではない。
- start_at以降。
- end_at以前。
- 同一launchへの未回答。
- choiceIdが選択肢に存在。
- answer_received_at はサーバーで設定。
- answer_rank と correct_rank をDB/API側で計算。

### エラー

- 400: choiceId不正。
- 401: 未認証。
- 403: 配信対象外。
- 404: launchなし。
- 409: すでに回答済み。
- 422: start_at前またはend_at後。

## `GET /api/quiz-launches/[id]/result`

| 項目 | 内容 |
| --- | --- |
| 目的 | 結果画面に必要な正誤、順位、全体結果を取得する。 |
| 認証 | 必須。 |
| 権限 | recipient、author、admin。 |

### response

```json
{
  "launchId": "uuid",
  "myResult": {
    "isCorrect": true,
    "answerRank": 1,
    "correctRank": 1
  },
  "answers": [
    {
      "userId": "uuid",
      "displayName": "回答者",
      "isCorrect": true,
      "answerRank": 1,
      "correctRank": 1
    }
  ],
  "unansweredRecipients": [
    { "userId": "uuid", "displayName": "未回答者" }
  ]
}
```

### サーバー側で必ず行う判定

- 回答済みまたはend_at後であること。
- 回答前に他人のanswersを見せない。
- 配信対象者以外に結果を見せない。

### エラー

- 401: 未認証。
- 403: 閲覧権限なし、回答前。
- 404: launchなし。

## `POST /api/quiz-launches/[id]/rating`

| 項目 | 内容 |
| --- | --- |
| 目的 | クイズ評価を作成し、出題者スコアに反映する。 |
| 認証 | 必須。 |
| 権限 | recipientであり、出題者本人ではないユーザー。 |

### request body

```json
{
  "rating": "good",
  "reasons": ["面白い", "難易度がちょうどいい"]
}
```

### response

```json
{
  "ratingId": "uuid",
  "status": "created"
}
```

### バリデーション

- rating は good / normal / weak。
- reasons は許可タグから選ぶ。
- 「不適切」は通報導線と連動可能。

### エラー

- 400: rating不正。
- 401: 未認証。
- 403: 評価権限なし。
- 404: launchなし。
- 409: 評価済み。

## `POST /api/reports`

| 項目 | 内容 |
| --- | --- |
| 目的 | 問題、配信、ユーザーに関する通報を作成する。 |
| 認証 | 必須。 |
| 権限 | ログイン済み本人。 |

### request body

```json
{
  "questionId": "uuid",
  "launchId": "uuid",
  "reason": "不適切",
  "detail": "詳細"
}
```

### response

```json
{
  "reportId": "uuid",
  "status": "open"
}
```

### サーバー側で必ず行う判定

- reporter_id は認証ユーザーから設定。
- 対象リソースの存在。
- 重複通報の抑制。
- 1回目の通報はreports.status=openで作成する。
- 同じ問題に2件以上の通報がある場合は question.status=review_required にする。
- 自動suspendedは行わず、admin判断を優先する。

### エラー

- 400: reason不正。
- 401: 未認証。
- 404: 対象なし。
- 409: 重複通報。

## `POST /api/blocks`

| 項目 | 内容 |
| --- | --- |
| 目的 | ユーザーをブロックする。 |
| 認証 | 必須。 |
| 権限 | ログイン済み本人。 |

### request body

```json
{
  "blockedUserId": "uuid"
}
```

### response

```json
{
  "blockId": "uuid"
}
```

### サーバー側で必ず行う判定

- blocker_id は認証ユーザーから設定。
- 自分自身をブロック不可。
- ブロック関係は通知対象抽選から除外。

### エラー

- 400: 自分自身。
- 401: 未認証。
- 404: 対象ユーザーなし。
- 409: すでにブロック済み。

## `DELETE /api/blocks/[id]`

| 項目 | 内容 |
| --- | --- |
| 目的 | 自分が作成したブロックを解除する。 |
| 認証 | 必須。 |
| 権限 | blocker本人のみ。 |

### response

```json
{
  "deleted": true
}
```

### サーバー側で必ず行う判定

- 対象blockが存在する。
- blocker_id が認証ユーザーである。
- 他人のblockを削除できない。

### エラー

- 401: 未認証。
- 403: blocker本人ではない。
- 404: blockなし。

## `GET /api/profile`

| 項目 | 内容 |
| --- | --- |
| 目的 | 自分のプロフィール、ランク、通知設定を取得する。 |
| 認証 | 必須。 |
| 権限 | 本人。 |

### response

```json
{
  "id": "uuid",
  "displayName": "ユーザー名",
  "answerRank": 1,
  "answerScore": 12,
  "questionerRank": 1,
  "questionerScore": 8,
  "notificationMode": "normal",
  "quietHoursStart": "22:00",
  "quietHoursEnd": "08:00",
  "maxDailyNotifications": 5,
  "deepNightNotificationsEnabled": false
}
```

### エラー

- 401: 未認証。
- 404: profileなし。

## `PATCH /api/profile/notifications`

| 項目 | 内容 |
| --- | --- |
| 目的 | 自分の通知設定を更新する。 |
| 認証 | 必須。 |
| 権限 | 本人。 |

### request body

```json
{
  "notificationMode": "normal",
  "quietHoursStart": "22:00",
  "quietHoursEnd": "08:00",
  "maxDailyNotifications": 5,
  "deepNightNotificationsEnabled": false
}
```

### サーバー側で必ず行う判定

- 本人のprofileだけ更新。
- notificationModeの許可値。
- maxDailyNotificationsの上限。
- quiet hoursの形式。

### エラー

- 400: 値不正。
- 401: 未認証。
- 404: profileなし。
- 422: 業務ルール上不正。

## `GET /api/admin/reports`

| 項目 | 内容 |
| --- | --- |
| 目的 | 通報一覧を取得する。 |
| 認証 | 必須。 |
| 権限 | admin roleのみ。 |

### response

```json
{
  "reports": [
    {
      "id": "uuid",
      "reason": "不適切",
      "status": "open",
      "createdAt": "2026-04-25T12:00:00Z"
    }
  ]
}
```

### エラー

- 401: 未認証。
- 403: `profiles.role = admin` ではない。

## `GET /api/admin/invites`

| 項目 | 内容 |
| --- | --- |
| 目的 | adminが招待コード一覧を確認する。 |
| 認証 | 必須。 |
| 権限 | `profiles.role = admin` のみ。 |

### response

```json
{
  "invites": [
    {
      "id": "uuid",
      "worldId": "uuid",
      "code": "ABC123",
      "status": "active",
      "expiresAt": "2026-05-01T00:00:00Z",
      "usedBy": null,
      "createdAt": "2026-04-25T12:00:00Z"
    }
  ]
}
```

### エラー

- 401: 未認証。
- 403: adminではない。

## `POST /api/admin/invites`

| 項目 | 内容 |
| --- | --- |
| 目的 | adminがSeason 0用の招待コードを発行する。 |
| 認証 | 必須。 |
| 権限 | `profiles.role = admin` のみ。 |

### request body

```json
{
  "worldId": "uuid",
  "expiresAt": "2026-05-01T00:00:00Z",
  "reason": "Season 0 participant invite"
}
```

### response

```json
{
  "inviteId": "uuid",
  "code": "ABC123",
  "status": "active"
}
```

### サーバー側で必ず行う判定

- admin role。
- worldの存在。
- world.statusがactive。
- codeを推測困難に生成する。
- invites.code uniqueを守る。
- admin_audit_logsに create_invite を記録する。

### エラー

- 400: expiresAt不正。
- 401: 未認証。
- 403: adminではない。
- 404: worldなし。
- 409: code生成重複。再生成で解消できない場合。

## `GET /api/admin/waitlist`

| 項目 | 内容 |
| --- | --- |
| 目的 | adminがwaitlist一覧を確認する。 |
| 認証 | 必須。 |
| 権限 | `profiles.role = admin` のみ。 |

### response

```json
{
  "items": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "displayName": "ユーザー名",
      "status": "waiting",
      "createdAt": "2026-04-25T12:00:00Z"
    }
  ]
}
```

### エラー

- 401: 未認証。
- 403: adminではない。

## `PATCH /api/admin/waitlist/[id]`

| 項目 | 内容 |
| --- | --- |
| 目的 | adminがwaitlistのstatusを更新する。 |
| 認証 | 必須。 |
| 権限 | `profiles.role = admin` のみ。 |

### request body

```json
{
  "status": "invited",
  "reason": "Season 0 invite target"
}
```

### response

```json
{
  "waitlistId": "uuid",
  "status": "invited"
}
```

### サーバー側で必ず行う判定

- admin role。
- waitlistの存在。
- status遷移が許可されている。
- admin_audit_logsに update_waitlist を記録する。

### エラー

- 400: status不正。
- 401: 未認証。
- 403: adminではない。
- 404: waitlistなし。
- 422: status遷移不正。

## `GET /api/admin/audit-logs`

| 項目 | 内容 |
| --- | --- |
| 目的 | adminが管理操作ログを確認する。 |
| 認証 | 必須。 |
| 権限 | `profiles.role = admin` のみ。 |

### query

| パラメータ | 説明 |
| --- | --- |
| action | optional。操作種別で絞り込み。 |
| targetType | optional。対象種別で絞り込み。 |
| targetId | optional。対象IDで絞り込み。 |

### response

```json
{
  "logs": [
    {
      "id": "uuid",
      "adminUserId": "uuid",
      "action": "suspend_question",
      "targetType": "question",
      "targetId": "uuid",
      "reason": "不適切",
      "metadata": {
        "previousStatus": "review_required",
        "newStatus": "suspended"
      },
      "createdAt": "2026-04-25T12:00:00Z"
    }
  ]
}
```

### エラー

- 401: 未認証。
- 403: adminではない。

## `PATCH /api/admin/questions/[id]/moderation`

| 項目 | 内容 |
| --- | --- |
| 目的 | 不適切クイズをreview_requiredまたはsuspendedにする。 |
| 認証 | 必須。 |
| 権限 | admin roleのみ。 |

### request body

```json
{
  "status": "suspended",
  "reason": "不適切"
}
```

### サーバー側で必ず行う判定

- admin role。
- questionの存在。
- 削除ではなく停止。
- statusは review_required / suspended を許可する。
- admin_audit_logsに suspend_question または mark_question_review_required を記録する。

### エラー

- 401: 未認証。
- 403: adminではない。
- 404: questionなし。
- 422: status不正。

## `PATCH /api/admin/users/[id]/suspend`

| 項目 | 内容 |
| --- | --- |
| 目的 | ユーザーを停止する。 |
| 認証 | 必須。 |
| 権限 | admin roleのみ。 |

### request body

```json
{
  "status": "suspended",
  "reason": "規約違反"
}
```

### サーバー側で必ず行う判定

- admin role。
- 対象ユーザーの存在。
- 自分自身の停止を防ぐなど誤操作防止。
- profiles.status = suspended に更新する。
- admin_audit_logsに suspend_user を記録する。

### エラー

- 401: 未認証。
- 403: adminではない。
- 404: userなし。
- 422: 対象不正。

## `PATCH /api/admin/world/member-limit`

| 項目 | 内容 |
| --- | --- |
| 目的 | ワールド参加枠を変更する。 |
| 認証 | 必須。 |
| 権限 | admin roleのみ。 |

### request body

```json
{
  "memberLimit": 15,
  "reason": "Season 1解放"
}
```

### サーバー側で必ず行う判定

- admin role。
- memberLimitが現在のactive member数以上。
- シーズン遷移の整合性。
- admin_audit_logsに change_member_limit を記録する。

### エラー

- 400: memberLimit不正。
- 401: 未認証。
- 403: adminではない。
- 404: worldなし。
- 422: 現在参加人数より小さい。
