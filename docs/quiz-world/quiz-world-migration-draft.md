# 通知型早押しクイズワールド DB migration草案

## 重要

これはMarkdownによるDB設計草案である。
SQLファイルはまだ作らない。
実際のmigrationはまだ作らない。
Supabase projectやcloud dataには触れない。

## 共通方針

- 主キーは基本 `uuid`。
- timestampは `timestamptz`。
- 削除よりstatus変更を優先する。
- RLS有効化前提。
- 重要処理はRLSだけでなくAPI / server function側でも検証する。
- `admin_audit_logs` をMVP初期データモデルに正式追加する。

## enum案

| enum | 値 |
| --- | --- |
| `world_status` | active, paused, archived |
| `member_role` | member, world_admin |
| `member_status` | active, suspended |
| `profile_role` | user, admin |
| `profile_status` | active, suspended |
| `invite_status` | active, used, revoked, expired |
| `waitlist_status` | waiting, invited, rejected, joined |
| `question_type` | multiple_choice |
| `question_status` | draft, active, review_required, suspended |
| `launch_status` | scheduled, active, closed, cancelled, suspended |
| `notification_status` | pending, shown, sent, failed, skipped |
| `rating_value` | good, normal, weak |
| `report_status` | open, reviewing, resolved, dismissed |
| `notification_mode` | normal, focus, rest, night |

## `worlds`

| カラム | 型 | nullable | 備考 |
| --- | --- | --- | --- |
| id | uuid | no | PK |
| name | text | no | |
| member_limit | integer | no | 初期10 |
| current_season | integer | no | 初期0 |
| status | world_status | no | default active |
| created_at | timestamptz | no | |
| updated_at | timestamptz | no | |

- unique: なし。MVPでは1件運用。
- index: `(status)`, `(current_season)`.
- FK: なし。
- RLS注意: memberは参照可、更新はadminのみ。
- API処理: member_limit変更時はactive member数以上か確認する。

## `profiles`

| カラム | 型 | nullable | 備考 |
| --- | --- | --- | --- |
| id | uuid | no | PK、auth.users.id |
| display_name | text | no | |
| avatar_url | text | yes | |
| role | profile_role | no | default user。global admin判定候補 |
| status | profile_status | no | default active |
| answer_rank | integer | no | default 0 |
| answer_score | integer | no | default 0 |
| questioner_rank | integer | no | default 0 |
| questioner_score | integer | no | default 0 |
| notification_mode | notification_mode | no | default normal |
| quiet_hours_start | time | no | default 22:00 |
| quiet_hours_end | time | no | default 08:00 |
| max_daily_notifications | integer | no | default 5 |
| deep_night_notifications_enabled | boolean | no | default false |
| age_confirmed_at | timestamptz | no | |
| terms_accepted_at | timestamptz | no | |
| privacy_accepted_at | timestamptz | no | |
| created_at | timestamptz | no | |
| updated_at | timestamptz | no | |

- unique: `id`.
- index: `(role)`, `(status)`, `(answer_rank)`, `(questioner_rank)`.
- FK: `id -> auth.users.id`.
- RLS注意: rank/score/role/statusは本人更新不可。
- API処理: signupで同意日時を保存。admin停止はserver側。

### role設計案

- MVP方針: `profiles.role` をglobal admin判定に使う。
- `world_members.role` はworld内のmember/adminに使う。
- MVPは1ワールドでも、将来複数worldやguildを考えると役割を分ける方が明確。

## `world_members`

| カラム | 型 | nullable | 備考 |
| --- | --- | --- | --- |
| id | uuid | no | PK |
| world_id | uuid | no | worlds.id |
| user_id | uuid | no | profiles.id |
| role | member_role | no | default member |
| status | member_status | no | default active |
| joined_at | timestamptz | no | |

- unique: `(world_id, user_id)`.
- index: `(world_id, status)`, `(user_id, status)`, `(role)`.
- FK: `world_id -> worlds.id`, `user_id -> profiles.id`.
- RLS注意: role/status更新はadminのみ。
- API処理: signup時、参加枠確認後に作成。

## `waitlist`

| カラム | 型 | nullable | 備考 |
| --- | --- | --- | --- |
| id | uuid | no | PK |
| email | text | no | lower保存推奨 |
| display_name | text | yes | |
| status | waitlist_status | no | default waiting |
| created_at | timestamptz | no | |

- unique: `lower(email)`相当を検討。
- index: `(status, created_at)`.
- FK: なし。
- RLS注意: 本人とadminのみ。メール一覧を一般公開しない。
- API処理: 重複登録防止。

## `invites`

| カラム | 型 | nullable | 備考 |
| --- | --- | --- | --- |
| id | uuid | no | PK |
| world_id | uuid | no | worlds.id |
| invited_by | uuid | no | profiles.id |
| code | text | no | 推測困難な文字列 |
| status | invite_status | no | default active |
| expires_at | timestamptz | no | |
| used_by | uuid | yes | profiles.id |
| used_at | timestamptz | yes | |
| created_at | timestamptz | no | |

- unique: `(code)`.
- index: `(world_id, status)`, `(expires_at)`.
- FK: `world_id -> worlds.id`, `invited_by -> profiles.id`, `used_by -> profiles.id`.
- RLS注意: adminのみ一覧参照。validateはAPI経由。
- API処理: code検証、使用済み更新、参加枠確認。

## `questions`

| カラム | 型 | nullable | 備考 |
| --- | --- | --- | --- |
| id | uuid | no | PK |
| author_id | uuid | no | profiles.id |
| type | question_type | no | multiple_choice |
| body | text | no | |
| choices | jsonb | no | 4 choices |
| correct_choice_id | text | no | |
| correct_answer | text | yes | 将来用 |
| answer_aliases | jsonb | yes | 将来用 |
| difficulty | integer | no | 1-5など |
| category | text | no | 固定カテゴリ。雑学/歴史/地理/科学/エンタメ/スポーツ/言葉/謎解き/その他。MVPではtext + CHECK想定 |
| category_note | text | yes | その他を選んだ場合のみ。出題者本人とadminのみ閲覧可 |
| status | question_status | no | default active |
| created_at | timestamptz | no | |
| updated_at | timestamptz | no | |

- unique: なし。
- index: `(author_id, status)`, `(category)`, `(difficulty)`, `(status, created_at)`.
- FK: `author_id -> profiles.id`.
- RLS注意: start_at前に配信対象者へbody/choices/correctを漏らさない。
- RLS注意: 回答者向けAPIや結果画面ではcategory_noteを返さない。
- API処理: author_id固定、choices検証、不適切内容チェック、category固定値検証、category_noteの表示制御。

## `quiz_launches`

| カラム | 型 | nullable | 備考 |
| --- | --- | --- | --- |
| id | uuid | no | PK |
| question_id | uuid | no | questions.id |
| author_id | uuid | no | profiles.id |
| world_id | uuid | no | worlds.id |
| recipient_count | integer | no | |
| start_at | timestamptz | no | now + 15秒 |
| end_at | timestamptz | no | start_at + 60秒 |
| status | launch_status | no | default scheduled |
| created_at | timestamptz | no | |
| updated_at | timestamptz | no | |

- unique: なし。
- index: `(world_id, status, start_at)`, `(author_id, created_at)`, `(question_id)`.
- FK: `question_id -> questions.id`, `author_id -> profiles.id`, `world_id -> worlds.id`.
- RLS注意: authorとrecipientのみ参照。
- API処理: start_at/end_at/recipient_countはサーバー決定。

## `quiz_recipients`

| カラム | 型 | nullable | 備考 |
| --- | --- | --- | --- |
| id | uuid | no | PK |
| launch_id | uuid | no | quiz_launches.id |
| user_id | uuid | no | profiles.id |
| notification_status | notification_status | no | default pending |
| notified_at | timestamptz | yes | Phase 1ではshown相当も可 |
| opened_at | timestamptz | yes | |
| created_at | timestamptz | no | |

- unique: `(launch_id, user_id)`.
- index: `(user_id, created_at)`, `(launch_id)`, `(notification_status)`.
- FK: `launch_id -> quiz_launches.id`, `user_id -> profiles.id`.
- RLS注意: 本人宛だけ参照。
- API処理: 対象抽選はserver側。出題者本人を含めない。

## `answers`

| カラム | 型 | nullable | 備考 |
| --- | --- | --- | --- |
| id | uuid | no | PK |
| launch_id | uuid | no | quiz_launches.id |
| user_id | uuid | no | profiles.id |
| answer_text | text | yes | 将来用 |
| normalized_answer | text | yes | 将来用 |
| choice_id | text | no | MVP必須 |
| is_correct | boolean | no | |
| answer_received_at | timestamptz | no | server時刻 |
| answer_rank | integer | no | |
| correct_rank | integer | yes | 不正解ならnull可 |
| created_at | timestamptz | no | |

- unique: `(launch_id, user_id)`.
- index: `(launch_id, answer_received_at)`, `(launch_id, is_correct, answer_received_at)`.
- FK: `launch_id -> quiz_launches.id`, `user_id -> profiles.id`.
- RLS注意: 回答前に他人のanswersを見せない。
- API処理: start_at/end_at、重複、recipient確認、順位計算。

## `question_ratings`

| カラム | 型 | nullable | 備考 |
| --- | --- | --- | --- |
| id | uuid | no | PK |
| launch_id | uuid | no | quiz_launches.id |
| question_id | uuid | no | questions.id |
| rater_id | uuid | no | profiles.id |
| rating | rating_value | no | good/normal/weak |
| reasons | text[] | yes | 許可タグのみ |
| created_at | timestamptz | no | |

- unique: `(launch_id, rater_id)`.
- index: `(question_id)`, `(rater_id)`, `(rating)`.
- FK: `launch_id -> quiz_launches.id`, `question_id -> questions.id`, `rater_id -> profiles.id`.
- RLS注意: 回答者のみ作成。author自己評価不可。
- API処理: 理由タグ検証、rank_events作成。

## `reports`

| カラム | 型 | nullable | 備考 |
| --- | --- | --- | --- |
| id | uuid | no | PK |
| question_id | uuid | yes | questions.id |
| launch_id | uuid | yes | quiz_launches.id |
| reporter_id | uuid | no | profiles.id |
| reason | text | no | 初期分類 |
| detail | text | yes | |
| status | report_status | no | default open |
| created_at | timestamptz | no | |
| updated_at | timestamptz | no | |

- unique: API側で重複抑制。必要なら `(reporter_id, question_id, launch_id, reason)`.
- index: `(status, created_at)`, `(reporter_id)`, `(question_id)`.
- FK: `question_id -> questions.id`, `launch_id -> quiz_launches.id`, `reporter_id -> profiles.id`.
- RLS注意: 作成者とadminのみ参照。
- API処理: 対象存在確認、重複通報抑制。

## `blocks`

| カラム | 型 | nullable | 備考 |
| --- | --- | --- | --- |
| id | uuid | no | PK |
| blocker_id | uuid | no | profiles.id |
| blocked_id | uuid | no | profiles.id |
| created_at | timestamptz | no | |

- unique: `(blocker_id, blocked_id)`.
- index: `(blocked_id)`.
- FK: `blocker_id -> profiles.id`, `blocked_id -> profiles.id`.
- RLS注意: 本人のみ参照・作成・解除。
- API処理: 自分自身ブロック不可、通知抽選時に除外。

## `notification_logs`

| カラム | 型 | nullable | 備考 |
| --- | --- | --- | --- |
| id | uuid | no | PK |
| user_id | uuid | no | profiles.id |
| launch_id | uuid | yes | quiz_launches.id |
| type | text | no | quiz_launch/result/adminなど |
| status | notification_status | no | |
| sent_at | timestamptz | yes | |
| created_at | timestamptz | no | |

- unique: なし。
- index: `(user_id, created_at)`, `(launch_id)`, `(status)`.
- FK: `user_id -> profiles.id`, `launch_id -> quiz_launches.id`.
- RLS注意: 本人は限定表示、詳細はadminのみ。
- API処理: Phase 1は任意、Phase 2ではPush送信結果を記録。

## `push_tokens`

| カラム | 型 | nullable | 備考 |
| --- | --- | --- | --- |
| id | uuid | no | PK |
| user_id | uuid | no | profiles.id |
| provider | text | no | web_push/expo/fcm/apns |
| token | text | no | secret相当 |
| platform | text | no | web/ios/android |
| enabled | boolean | no | default true |
| last_seen_at | timestamptz | yes | |
| created_at | timestamptz | no | |

- unique: `(provider, token)`.
- index: `(user_id, enabled)`.
- FK: `user_id -> profiles.id`.
- RLS注意: 本人のみ。tokenを第三者に見せない。
- API処理: Phase 2で使用。Phase 1では未使用可。

## `rank_events`

| カラム | 型 | nullable | 備考 |
| --- | --- | --- | --- |
| id | uuid | no | PK |
| user_id | uuid | no | profiles.id |
| type | text | no | answer/questioner/admin_adjustment |
| points | integer | no | |
| reason | text | no | |
| metadata | jsonb | yes | launch_idなど |
| created_at | timestamptz | no | |

- unique: なし。
- index: `(user_id, created_at)`, `(type)`.
- FK: `user_id -> profiles.id`.
- RLS注意: 本人とadminのみ参照。insertはservice roleのみ。
- API処理: 回答、評価、admin補正で作成。

## `admin_audit_logs`

| カラム | 型 | nullable | 備考 |
| --- | --- | --- | --- |
| id | uuid | no | PK |
| admin_user_id | uuid | no | profiles.id |
| action | text | no | suspend_user, suspend_questionなど |
| target_type | text | no | user/question/world/invite/waitlist/report |
| target_id | uuid | yes | 対象ID |
| reason | text | yes | 操作理由 |
| metadata | jsonb | yes | 変更前後の値、関連ID、補足情報 |
| created_at | timestamptz | no | |

- unique: なし。
- index: `(admin_user_id, created_at)`, `(target_type, target_id)`, `(action, created_at)`.
- FK: `admin_user_id -> profiles.id`.
- RLS注意: adminのみ参照。insertはadmin API / service roleのみ。
- API処理: admin操作と同一transactionで記録。ログ失敗時は操作全体を失敗扱いにする。

### 操作ログ対象

- ユーザー停止。
- クイズ配信停止。
- 参加枠変更。
- 招待コード発行。
- 通報対応。
- waitlist操作。

## 実装前に最終判断する項目

- rating reasonsを `text[]` にするかjsonbにするか。
- `ADMIN_EMAILS` を初期admin付与に使うか。
