# 通知型早押しクイズワールド MVP管理画面仕様

## 目的

MVP管理画面の目的は、10人テストを安全に運用することである。

- 不適切クイズに対応する。
- 通報を確認する。
- waitlistを確認する。
- 必要なら参加枠を調整する。
- 招待コードを発行する。
- ユーザー停止を行う。
- 問題を削除ではなく停止する。
- 管理者操作を admin_audit_logs に残す。

## 基本方針

- MVPのadmin画面アクセスは `profiles.role = admin` を主判定にする。
- `profiles.role` は `user` / `admin` を想定する。
- `profiles.status` は `active` / `suspended` を想定する。
- `world_members.role` は `member` / `world_admin` を想定し、MVP admin判定には使わない。
- `world_members.status` は `active` / `suspended` を想定する。
- 将来、複数ワールドやギルドでは `world_members.role` / `guild_members.role` を使う余地を残す。
- 誤操作防止を入れる。
- 削除より停止を優先する。
- MVPでは完全削除を避ける。
- 通報対応では `question.status = review_required / suspended` を使う。
- `profiles.status = suspended` でログイン後の出題、回答、主要操作を制限する。
- 参加枠変更はadminのみ。
- admin操作と admin_audit_logs 記録は同一transaction扱いにする。
- admin_audit_logs を残せない場合、管理操作全体を失敗扱いにする。
- cloud dataを直接手動削除する運用を避ける。

## admin_audit_logs

admin_audit_logs はMVP初期データモデルに正式追加する。

### カラム案

| カラム | 内容 |
| --- | --- |
| id | 操作ログID。 |
| admin_user_id | 操作したadminユーザー。 |
| action | 操作種別。 |
| target_type | 対象種別。 |
| target_id | 対象ID。 |
| reason | 操作理由。 |
| metadata | 変更前後の値、関連ID、補足情報。 |
| created_at | 作成日時。 |

### 必ずログに残す操作

- ユーザー停止
- クイズ配信停止
- 参加枠変更
- 招待コード発行
- 通報対応
- waitlist操作

操作ログ記録に失敗した場合は、管理操作自体を失敗扱いにする。

## 通報対応基準

MVPではadmin確認ベースで運用する。

| 条件 | 操作 |
| --- | --- |
| 1回目の通報 | report作成、admin確認待ち。 |
| 同じ問題に2件以上の通報 | `question.status = review_required`。 |
| adminが不適切と判断 | `question.status = suspended`。 |
| 同じユーザーのsuspended問題が3件以上 | `profiles.status = suspended` 候補としてadminが確認。 |

自動停止は慎重にし、MVPではadmin判断を優先する。

## 通報一覧

| 項目 | 内容 |
| --- | --- |
| 目的 | 未対応の通報を見つけ、対応優先度を判断する。 |
| 権限 | `profiles.role = admin` のみ。 |

### 画面表示

- 通報ID
- 通報理由
- 対象question
- 対象launch
- 通報者
- 対象出題者
- status
- created_at
- 優先度

### 操作

- 通報詳細を開く。
- statusで絞り込む。
- 理由で絞り込む。
- 未対応順に並べる。

### 失敗時の扱い

- 取得失敗時は再読み込み導線を表示。
- admin権限がない場合は403表示。

## 通報詳細

| 項目 | 内容 |
| --- | --- |
| 目的 | 通報内容と対象クイズを確認し、対応する。 |
| 権限 | `profiles.role = admin` のみ。 |

### 画面表示

- 通報理由
- 通報詳細
- 問題文
- 選択肢
- 正解
- 出題者
- 配信日時
- 回答数
- 評価
- 過去の通報履歴
- 対象ユーザーの状態

### 操作

- reports.status を更新する。
- question.status を review_required または suspended にする。
- 必要に応じて profiles.status を suspended 候補として確認する。
- 対応メモを残す。
- admin_audit_logs に update_report を記録する。

### 確認ダイアログ

- クイズ停止時に確認。
- ユーザー停止時に確認。
- 通報をresolved/dismissedにする時に確認。

### 失敗時の扱い

- 操作失敗時はstatusを更新せず、再試行を促す。
- admin_audit_logs記録失敗時は管理操作自体を失敗扱いにする。

## クイズ配信停止

| 項目 | 内容 |
| --- | --- |
| 目的 | 不適切または曖昧なクイズを今後配信されないようにする。 |
| 権限 | `profiles.role = admin` のみ。 |

### 画面表示

- 対象問題
- 出題者
- 配信履歴
- 通報数
- 評価
- 現在status

### 操作

- question.status = suspended に変更する。
- 関連する未開始launchをcancelledまたはsuspendedにする。
- 出題者へのrank_eventsを必要に応じて作成する。
- admin_audit_logs に suspend_question を記録する。

### 確認ダイアログ

- 「このクイズを停止します。削除はされません。」と明示する。
- 停止理由入力を必須にする。

### 失敗時の扱い

- status変更失敗時は何も変更しない。
- 部分更新を避けるため、status変更、関連launch停止、admin_audit_logs記録は同一transaction扱いにする。

## ユーザー停止

| 項目 | 内容 |
| --- | --- |
| 目的 | 悪質または安全上問題のあるユーザーの利用を制限する。 |
| 権限 | `profiles.role = admin` のみ。 |

### 画面表示

- ユーザーID
- 表示名
- 参加日
- 出題数
- 回答数
- 通報数
- suspended問題数
- 現在status

### 操作

- profiles.status = suspended にする。
- 出題を禁止する。
- 回答を禁止する。
- 必要に応じて未開始launchを停止する。
- admin_audit_logs に suspend_user を記録する。

### 確認ダイアログ

- 停止理由入力を必須にする。
- 自分自身の停止は防ぐ。

### 失敗時の扱い

- status変更に失敗した場合は操作なし。
- 関連停止が失敗した場合はadminへ警告を出す。
- admin_audit_logs記録失敗時は停止操作全体を失敗扱いにする。

## waitlist一覧・操作

| 項目 | 内容 |
| --- | --- |
| 目的 | 参加希望者を確認し、招待対象を選ぶ。 |
| 権限 | `profiles.role = admin` のみ。 |

### 画面表示

- email
- display_name
- status
- created_at
- 招待済みか

### 操作

- 招待コード発行対象にする。
- waitlist.status を更新する。
- メモを残す。
- admin_audit_logs に update_waitlist を記録する。

### 確認ダイアログ

- waitlist状態変更時に確認。
- 招待コード発行時に確認。

### 失敗時の扱い

- 重複招待を防ぐ。
- 発行失敗時はstatusを変えない。

## 招待コード発行

| 項目 | 内容 |
| --- | --- |
| 目的 | Season 0の参加者を管理者が招待する。 |
| 権限 | `profiles.role = admin` のみ。 |

### 画面表示

- 発行フォーム
- 対象world
- 有効期限
- 発行済みコード一覧
- status

### 操作

- 招待コード発行。
- 招待コード失効。
- 招待コード再発行。
- admin_audit_logs に create_invite を記録する。

### 確認ダイアログ

- 発行前に対象と有効期限を確認。
- 失効前に確認。

### 失敗時の扱い

- code重複時は再生成。
- worldが停止中なら発行不可。

## 参加枠変更

| 項目 | 内容 |
| --- | --- |
| 目的 | Season進行に合わせてmember_limitを変更する。 |
| 権限 | `profiles.role = admin` のみ。 |

### 画面表示

- 現在の参加人数
- 現在の参加枠
- 現在のシーズン
- 次の参加枠候補
- 累計出題数
- 累計回答数
- 平均評価
- 通報率

### 操作

- member_limitを変更。
- current_seasonを変更。
- 理由を記録。
- admin_audit_logs に change_member_limit を記録する。

### 確認ダイアログ

- 変更前後の参加枠を表示。
- 現在参加人数より小さい値は拒否。

### 失敗時の扱い

- 不正な値は保存しない。
- admin_audit_logs記録失敗時は変更失敗扱いにする。

## world status確認

| 項目 | 内容 |
| --- | --- |
| 目的 | 10人テストの運用状態を把握する。 |
| 権限 | `profiles.role = admin` のみ。 |

### 画面表示

- world名
- status
- member_count
- member_limit
- current_season
- 累計出題数
- 累計回答数
- 平均評価
- 通報率
- 通知ログ概要

### 操作

- status確認。
- 必要に応じてworldをpausedにする。

## ランクイベント確認

| 項目 | 内容 |
| --- | --- |
| 目的 | ランク変動の理由を追えるようにする。 |
| 権限 | `profiles.role = admin` のみ。 |

### 画面表示

- user_id
- type
- points
- reason
- metadata
- created_at

### 操作

- ユーザー別に絞り込む。
- launch別に絞り込む。
- 必要に応じて補正イベントを追加する。

補正イベント追加時は admin_audit_logs に記録する。

## 通知ログ確認

| 項目 | 内容 |
| --- | --- |
| 目的 | 画面内通知や将来のWeb Pushの送信状態を確認する。 |
| 権限 | `profiles.role = admin` のみ。 |

### 画面表示

- user_id
- launch_id
- type
- status
- sent_at
- created_at
- 失敗理由

### 操作

- statusで絞り込む。
- launch別に確認。
- ユーザー別に確認。

## admin_audit_logs確認

| 項目 | 内容 |
| --- | --- |
| 目的 | admin操作の追跡と誤操作対応を可能にする。 |
| 権限 | `profiles.role = admin` のみ。 |

### 画面表示

- admin_user_id
- action
- target_type
- target_id
- reason
- metadata
- created_at

### 操作

- admin別に絞り込む。
- action別に絞り込む。
- 対象IDで検索する。

### 失敗時の扱い

- 取得失敗時は再読み込み。

## MVPでやらない管理機能

- 完全削除。
- cloud dataの直接手動削除前提の運用。
- Stripe操作。
- Vercel env操作。
- Supabase project操作。
- legal pageの本番反映。
- 自動AIモデレーション。
- 大規模な権限管理。
