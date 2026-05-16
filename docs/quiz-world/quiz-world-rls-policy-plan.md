# 通知型早押しクイズワールド Supabase RLS方針案

## 目的

このドキュメントは、MVP実装前にSupabase RLSの方針を整理するための設計メモである。
SQL migrationではない。

## 共通方針

- service role key はサーバー専用。
- クライアントにsecretを出さない。
- admin操作はadmin roleのみ可能にする。
- RLSだけでなく、重要処理はAPI route / server function側でも検証する。
- 順位計算はDB/API側で行う。
- 出題対象抽選はクライアントに出さない。
- 配信対象者リストを不必要に公開しない。
- 回答前に結果が漏れないようにする。

## roleの前提

| role | 説明 |
| --- | --- |
| anon | 未ログイン。公開情報のみ。 |
| authenticated | ログイン済みユーザー。 |
| world member | activeなworld_membersを持つユーザー。 |
| admin | `profiles.role = admin` のユーザー。MVP admin画面/APIの主判定。 |
| service role | サーバー専用。抽選、順位計算、admin処理など。 |

`world_members.role` は `member` / `world_admin` を想定するが、MVPのadmin画面アクセス判定には使わない。
将来、複数ワールドやギルド管理で `world_members.role` / `guild_members.role` を使う余地を残す。

## `profiles`

| 操作 | 方針 |
| --- | --- |
| SELECT | 本人は自分のprofileを読める。world memberは必要最小限の表示名、avatar、ランク概要のみ読める。adminは運用目的で読める。 |
| INSERT | signup API / server function経由。本人が直接任意INSERTしない。 |
| UPDATE | 本人はdisplay_name、avatar_url、通知設定の一部だけ更新可能。rank、score、role、status、同意日時は直接更新不可。adminは停止など必要範囲をAPI経由で更新可能。 |
| DELETE | 原則不可。MVPでは削除より停止を優先。 |

### API route / service role経由

- signup時のprofile作成。
- age_confirmed_at / terms_accepted_at / privacy_accepted_at の記録。
- answer_rank / answer_score / questioner_rank / questioner_score の更新。
- profiles.role = admin の管理判定。
- profiles.status = suspended の管理操作。

### 注意点

- 生年月日は持たない。
- 本人がrank、score、role、statusを更新できないようにする。

## `worlds`

| 操作 | 方針 |
| --- | --- |
| SELECT | world memberは読める。未ログインには公開可能な概要だけAPIで返す。adminは全項目を読める。 |
| INSERT | service role / adminのみ。MVPでは1件だけ。 |
| UPDATE | adminのみ。member_limit、current_season、statusの変更は操作ログ必須。 |
| DELETE | 原則不可。 |

### API route / service role経由

- member_limit変更。
- current_season変更。
- status変更。

### 注意点

- 参加枠変更は現在のactive member数未満にしない。

## `world_members`

| 操作 | 方針 |
| --- | --- |
| SELECT | world memberは一覧を読める。ただし必要最小限のプロフィール情報に制限する。本人は自分のmembershipを読める。adminは全体を読める。 |
| INSERT | signup API / invite承認処理経由。 |
| UPDATE | adminのみ。statusやrole変更。本人による任意role変更不可。 |
| DELETE | 原則不可。退会や停止はstatusで扱う。 |

### API route / service role経由

- signup時のworld_members作成。
- waitlist承認後の参加確定。
- profiles.status停止時の連動。

### 注意点

- roleをクライアントから変更させない。
- MVPのadmin画面判定には使わず、将来のworld内管理に備える。

## `waitlist`

| 操作 | 方針 |
| --- | --- |
| SELECT | 本人は自分のwaitlist状態を読める。adminは一覧を読める。 |
| INSERT | 未ログインまたはログイン済み本人が作成可能。ただし重複制限。 |
| UPDATE | adminのみ。status変更。本人は基本不可。 |
| DELETE | 原則不可。 |

### API route / service role経由

- 重複登録チェック。
- 招待または承認時のstatus変更。

### 注意点

- waitlistの全メールアドレスを一般ユーザーに見せない。

## `invites`

| 操作 | 方針 |
| --- | --- |
| SELECT | adminのみ。一般ユーザーはAPI経由でvalidate結果だけ受け取る。 |
| INSERT | adminのみ。 |
| UPDATE | adminまたはsignup処理のservice roleのみ。使用済み、失効、停止など。 |
| DELETE | 原則不可。 |

### API route / service role経由

- 招待コード検証。
- 招待コード使用済み更新。

### 注意点

- 未使用コード一覧を一般ユーザーに公開しない。
- codeは推測困難にする。

## `questions`

| 操作 | 方針 |
| --- | --- |
| SELECT | author本人は自分の問題を読める。配信対象者はstart_at以降に必要範囲だけ読める。adminは読める。 |
| INSERT | active world member本人が作成可能。ただしAPI経由でauthor_idを固定する。 |
| UPDATE | author本人は未配信または許可範囲のみ更新可能。配信済みや停止済みは制限。adminはmoderation目的でreview_required / suspendedへstatus更新可能。 |
| DELETE | 原則不可。削除よりstatus=suspended/archiveを使う。 |

### API route / service role経由

- 不適切チェック。
- status変更。2件以上の通報でreview_required、admin判断でsuspended。
- 配信済み問題の編集制限。

### 注意点

- start_at前に問題文と選択肢が漏れないようにする。

## `quiz_launches`

| 操作 | 方針 |
| --- | --- |
| SELECT | authorとrecipientだけ読める。adminは読める。 |
| INSERT | quiz launch API / service role経由のみ。 |
| UPDATE | service roleまたはadminのみ。status、start_at、end_atの管理。 |
| DELETE | 原則不可。cancelledやsuspendedで扱う。 |

### API route / service role経由

- start_at = now + 15秒。
- end_at = start_at + 60秒。
- recipient_count設定。
- status変更。

### 注意点

- authorが任意のrecipient_countやstart_atを指定できないようにする。

## `quiz_recipients`

| 操作 | 方針 |
| --- | --- |
| SELECT | 本人宛のrecipientだけ読める。authorは集計に必要な範囲のみ。adminは読める。 |
| INSERT | quiz launch API / service role経由のみ。 |
| UPDATE | 本人はopened_atなど本人に関する範囲のみ。notification_statusはservice role。 |
| DELETE | 原則不可。 |

### API route / service role経由

- 出題対象抽選。
- notification_status更新。
- notified_at記録。

### 注意点

- 配信対象者リストを不必要に公開しない。

## `answers`

| 操作 | 方針 |
| --- | --- |
| SELECT | 本人は自分の回答を読める。回答後または終了後、recipientは結果として必要範囲を読める。adminは読める。 |
| INSERT | answer API / service function経由。本人が回答可能条件を満たす場合のみ。 |
| UPDATE | 原則不可。順位補正などはservice roleのみ。 |
| DELETE | 原則不可。 |

### API route / service role経由

- 配信対象者確認。
- start_at / end_at確認。
- 重複回答防止。
- answer_received_at記録。
- answer_rank / correct_rank計算。

### 注意点

- 回答前に他人のanswersを見せない。
- correct_choice_idや正解情報が回答前に漏れないようにする。

## `question_ratings`

| 操作 | 方針 |
| --- | --- |
| SELECT | 本人は自分の評価を読める。authorは集計結果のみ。adminは詳細を読める。 |
| INSERT | recipientであり、出題者本人でない回答者のみ。 |
| UPDATE | 原則不可。必要なら本人が短時間内だけ更新できる余地。 |
| DELETE | 原則不可。 |

### API route / service role経由

- 評価済みチェック。
- 理由タグ検証。
- 出題者スコアへの反映。

### 注意点

- authorに個別評価者を過度に見せない。

## `reports`

| 操作 | 方針 |
| --- | --- |
| SELECT | 作成者は自分の通報を読める。adminは全通報を読める。 |
| INSERT | ログイン済み本人。reporter_idは認証ユーザーから設定。 |
| UPDATE | adminのみ。statusや対応メモ。 |
| DELETE | 原則不可。 |

### API route / service role経由

- 重複通報抑制。
- 対象存在確認。
- admin対応。

### 注意点

- 通報内容は当事者以外に見せない。

## `blocks`

| 操作 | 方針 |
| --- | --- |
| SELECT | 本人のblocker_idまたはblocked_idに関わる必要範囲だけ。基本はblocker本人。 |
| INSERT | blocker本人のみ。 |
| UPDATE | 原則不可。 |
| DELETE | blocker本人が解除可能。 |

### API route / service role経由

- 自分自身のブロック防止。
- 通知対象抽選時の除外。

### 注意点

- ブロック関係を第三者に公開しない。

## `notification_logs`

| 操作 | 方針 |
| --- | --- |
| SELECT | 本人は自分の通知ログを限定表示。詳細はadminのみ。 |
| INSERT | service roleのみ。 |
| UPDATE | service roleのみ。 |
| DELETE | 原則不可。 |

### API route / service role経由

- 画面内通知作成ログ。
- Phase 2のWeb Push送信ログ。
- sent / failed / skippedの記録。

### 注意点

- 失敗理由やprovider詳細はadmin向けに限定する。

## `push_tokens`

| 操作 | 方針 |
| --- | --- |
| SELECT | 本人のみ。adminは必要最小限。 |
| INSERT | 本人またはAPI経由。 |
| UPDATE | 本人が自分のtokenを無効化可能。service roleがlast_seen_at更新。 |
| DELETE | 本人が削除可能。ただしMVPではenabled=falseでもよい。 |

### API route / service role経由

- token登録。
- token無効化。
- last_seen_at更新。

### 注意点

- tokenはsecret相当として扱う。
- Phase 1では未使用でも将来用に設計を残す。

## `rank_events`

| 操作 | 方針 |
| --- | --- |
| SELECT | 本人は自分のrank_eventsを読める。adminは全体確認可能。 |
| INSERT | service roleのみ。 |
| UPDATE | 原則不可。訂正が必要な場合は補正イベントを追加。 |
| DELETE | 原則不可。 |

### API route / service role経由

- 回答結果による加点。
- 評価による出題者スコア更新。
- admin補正イベント。

### 注意点

- 本人が自分のrank_eventsを作れないようにする。
- 履歴を消さず、説明可能性を保つ。

## `admin_audit_logs`

| 操作 | 方針 |
| --- | --- |
| SELECT | `profiles.role = admin` のみ。 |
| INSERT | admin API / service role経由のみ。クライアント直接INSERT不可。 |
| UPDATE | 原則不可。訂正が必要な場合は別ログを追加。 |
| DELETE | 原則不可。 |

### API route / service role経由

- ユーザー停止。
- クイズ配信停止。
- 参加枠変更。
- 招待コード発行。
- 通報対応。
- waitlist操作。

### 注意点

- 管理操作と同じtransactionで記録する。
- admin_user_idは認証ユーザーから設定する。
- 操作ログ記録に失敗した場合、管理操作全体を失敗扱いにする。

## adminのみ可能な処理

- 招待コード発行。
- waitlist status変更。
- question.status = review_required / suspended。
- profiles.status = suspended。
- world.member_limit変更。
- world.current_season変更。
- report.status更新。
- rank補正イベント追加。
- 操作ログ閲覧。

## RLSだけに任せない処理

- 招待コード検証。
- 参加枠確認。
- profiles.role = admin の確認。
- profiles.status = suspended の確認。
- 出題回数上限確認。
- 出題対象抽選。
- quiet hours / 通知上限 / ブロック関係確認。
- start_at / end_at設定。
- 回答受付時間判定。
- answer_rank / correct_rank計算。
- 重複回答防止。
- 回答前の結果非公開判定。
- admin_audit_logs記録。
