# 通知型早押しクイズワールド 実装前デザインレビュー

## 目的

既存docsを横断し、実装前に矛盾、危険な曖昧さ、追加で決めるべき事項を整理する。

このレビューはdocs設計フェーズの成果物であり、実装コード、DB migration SQL、cloud環境作成、cloud data変更は行わない。

## 総評

主要方針は整合している。

- 1ワールド制、初期10人、18歳以上限定、招待コード制は一貫している。
- start_at / end_at をサーバー主導にする方針は、早押し順位の納得感と不正防止に合っている。
- 削除より停止を優先するadmin方針は、10人テストの安全運用に合っている。
- Phase 1は15秒ポーリングの画面内通知、Phase 1.5でRealtime、Phase 2でWeb Pushという段階設計に整理された。

前回レビューで曖昧だったadmin role、操作ログ、通知方式、カテゴリ、通報基準、追加APIはMVP初期方針として固定済み。

## 今回採用したMVP方針

| 項目 | 採用方針 |
| --- | --- |
| admin role | `profiles.role` をglobal admin判定に使う。値は `user` / `admin`。 |
| user停止 | `profiles.status` をglobal状態として使う。値は `active` / `suspended`。 |
| world member role | `world_members.role` は `member` / `world_admin`。将来の複数world向け。 |
| world member status | `world_members.status` は `active` / `suspended`。 |
| admin画面/API | MVPでは `profiles.role = admin` を主判定にする。 |
| 将来拡張 | 複数worldやguildでは `world_members.role` / `guild_members.role` を使う余地を残す。 |
| 操作ログ | `admin_audit_logs` をMVP初期データモデルに正式追加する。 |
| 通知方式 | Phase 1は15秒ポーリング。`/home` が `GET /api/quiz-launches` を15秒ごとに確認する。 |
| Realtime | Phase 1.5でSupabase Realtime化を検討する。 |
| Web Push | Phase 2で検討する。 |
| カテゴリ | 固定カテゴリ + その他。その他のみ補足テキストを許可。 |
| 通報対応 | 自動停止は慎重にし、MVPではadmin判断を優先する。 |
| 追加API | `/home`一覧、block解除、admin invite/waitlist/audit logs APIを正式追加する。 |

## 仕様の整合性チェック

| 観点 | 判定 | コメント |
| --- | --- | --- |
| 1ワールド制 | 整合 | concept、mvp-spec、data-model、screen-specで一致。 |
| 初期参加枠10人 | 整合 | worlds.member_limit=10、signup時の上限確認、waitlist誘導が一致。 |
| 18歳以上限定 | 整合 | signup、safety、data-modelでage_confirmed_at方針が一致。 |
| 招待コード制 | 整合 | Season 0はadmin発行コード制。 |
| 四択優先 | 整合 | create、questions、answers、APIがchoice_id前提。 |
| start_at / end_at | 整合 | サーバー決定で統一。 |
| 評価方式 | 解消済み | MVPは3段階評価 + 理由タグで固定。data-model側も更新対象。 |
| admin操作ログ | 解消済み | `admin_audit_logs` をMVP初期データモデルに正式追加。 |
| user停止 | 解消済み | `profiles.status` をglobal停止状態にする。 |
| admin role | 解消済み | `profiles.role = admin` を主判定にする。 |

## 画面仕様とAPI仕様の対応

| 画面 | 対応API | 状態 |
| --- | --- | --- |
| `/signup` | `POST /api/signup`, `POST /api/invites/validate`, `POST /api/waitlist` | 対応あり。 |
| `/home` | `GET /api/profile`, `GET /api/world`, `GET /api/quiz-launches` | 今回正式追加。15秒ポーリングで使用。 |
| `/create` | `POST /api/questions`, `POST /api/quiz-launches` | 対応あり。 |
| `/quiz/[launchId]` | `GET /api/quiz-launches/[id]`, `POST /api/quiz-launches/[id]/answer` | 対応あり。 |
| `/result/[launchId]` | `GET /api/quiz-launches/[id]/result`, `POST /api/quiz-launches/[id]/rating`, `POST /api/reports` | 対応あり。 |
| `/profile` | `GET /api/profile`, `PATCH /api/profile/notifications`, `POST /api/blocks`, `DELETE /api/blocks/[id]` | block解除APIを正式追加。 |
| `/world` | `GET /api/world` | 対応あり。 |
| `/invite` | `POST /api/invites/validate`, `POST /api/waitlist` | 対応あり。 |
| `/admin` | admin API群 | invite、waitlist、audit logs APIを正式追加。 |

## 正式追加するAPI

- `GET /api/quiz-launches`
- `DELETE /api/blocks/[id]`
- `GET /api/admin/invites`
- `POST /api/admin/invites`
- `GET /api/admin/waitlist`
- `PATCH /api/admin/waitlist/[id]`
- `GET /api/admin/audit-logs`

## API仕様とデータモデルの対応

| API要件 | データモデル対応 | コメント |
| --- | --- | --- |
| 招待コード検証 | invites | code unique、有効期限、statusが必要。 |
| 参加枠確認 | worlds, world_members | active member countのindexが必要。 |
| admin判定 | profiles.role | `admin` のみadmin API可。 |
| user停止 | profiles.status | `suspended` は出題/回答不可。 |
| world内role | world_members.role | MVP admin判定には使わず将来拡張用。 |
| 18歳以上確認 | profiles | age_confirmed_atあり。 |
| 規約同意 | profiles | terms_accepted_at / privacy_accepted_atあり。 |
| 出題回数制限 | quiz_launches, profiles | 今日のlaunch数集計indexが必要。 |
| 配信対象抽選 | world_members, profiles, blocks, quiz_recipients | 通知モード、quiet hours、ブロック関係の参照が必要。 |
| 回答重複防止 | answers | unique(launch_id, user_id)が必要。 |
| 評価重複防止 | question_ratings | unique(launch_id, rater_id)が必要。 |
| 通報対応 | reports, questions, profiles | 2件以上でreview_required、admin判断でsuspended。 |
| admin操作ログ | admin_audit_logs | admin操作ごとに必須記録。 |

## RLS方針とAPI仕様の対応

RLS方針とAPI仕様は、重要処理をAPI route / server function側で行う点で整合している。

特に次はRLSだけに任せず、サーバー側で必ず判定する。

- 招待コード検証
- 参加枠確認
- admin role確認
- profile status確認
- 出題回数上限
- 配信対象抽選
- quiet hours / 通知上限 / ブロック関係
- start_at / end_at
- 重複回答
- answer_rank / correct_rank
- 評価権限
- 通報権限
- admin_audit_logs記録

## admin仕様と操作ログ

`admin_audit_logs` はMVP初期から正式に扱う。

対象操作は次の通り。

- ユーザー停止
- クイズ配信停止
- 参加枠変更
- 招待コード発行
- 通報対応
- waitlist操作

操作ログのカラム案は次。

- id
- admin_user_id
- action
- target_type
- target_id
- reason
- metadata
- created_at

削除より停止を優先し、停止操作も必ずログに残す。

## 通報対応基準

| 状態 | 方針 |
| --- | --- |
| 1回目の通報 | report作成、admin確認待ち。 |
| 同じ問題に2件以上の通報 | `question.status = review_required`。 |
| adminが不適切と判断 | `question.status = suspended`。 |
| 同じユーザーのsuspended問題が3件以上 | `profiles.status = suspended` 候補。 |
| 自動停止 | MVPでは慎重にし、admin判断を優先。 |

## 通知Phase 1と通知データモデル

Phase 1は15秒ポーリングで始める。

- `/home` が15秒ごとに `GET /api/quiz-launches` を呼ぶ。
- レスポンスは開始前、回答可能、回答済み、終了済みを区別できる形にする。
- API設計はRealtime化しやすいよう、`updated_at` や状態フィルタを考慮する。
- Phase 1.5でSupabase Realtime化を検討する。
- Phase 2でWeb Pushを検討する。

## カテゴリ方針

MVPカテゴリは固定カテゴリ + その他にする。

- 雑学
- 歴史
- 地理
- 科学
- エンタメ
- スポーツ
- 言葉
- 謎解き
- その他

その他を選んだ場合のみ、任意の補足テキストを許可する。

## 解消された曖昧さ

| 旧論点 | 結果 |
| --- | --- |
| admin roleをどこに持つか | `profiles.role` をglobal admin判定に使う。 |
| user停止状態をどこに持つか | `profiles.status` をglobal停止状態に使う。 |
| 操作ログをMVPに入れるか | `admin_audit_logs` を正式追加。 |
| 画面内通知をどう始めるか | Phase 1は15秒ポーリング。 |
| カテゴリ | 固定カテゴリ + その他。 |
| 通報基準 | admin確認ベースの初期基準を採用。 |
| 追加API | 7本を正式追加。 |

## まだ実装前に決めること

1. 利用規約・プライバシーポリシー文面。
2. 新規Supabase / Vercel環境の作成タイミング。
3. admin_audit_logs記録失敗時のtransaction方針。
4. カテゴリ「その他」の補足テキスト表示範囲。
5. Phase 1.5でRealtime化する対象範囲。
