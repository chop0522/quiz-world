# Phase 6 Rank Events / Ranking Plan

## 1. Phase 6 の目的

Phase 6では、Phase 4の回答結果とPhase 5の評価結果を、MVP向けのシンプルなスコアとして反映する。

- 回答結果を `rank_events` として記録する
- クイズ評価を `rank_events` として記録する
- `profiles.answer_score` / `profiles.questioner_score` を更新する
- `profiles.answer_rank` / `profiles.questioner_rank` を初期ルールで更新する
- 複雑なランキング、シーズンランキング、ギルドランキングはまだ扱わない

Phase 6は、ランキング本格版ではなく「スコアが動き、ランクが上がる体験」をlocalで成立させるPhaseである。

## 2. Phase 6 の範囲

Phase 6で扱うもの:

- `rank_events` テーブル
- `profiles.answer_score`
- `profiles.questioner_score`
- `profiles.answer_rank`
- `profiles.questioner_rank`
- 回答者向け加点
- 出題者向け加点
- 正解 / 不正解
- `correct_rank`
- `difficulty`
- `rating`
- `reason`
- 重複しないrank event作成
- score更新とevent作成のtransaction相当処理

Phase 6で扱うAPI/RPC候補:

- answer作成後の回答者イベント作成
- rating作成後の出題者イベント作成
- local検証用の手動backfill RPCまたはlocal-only script案
- `GET /api/profile` のrank/score表示確認

## 2.1 実装前固定事項

Phase 6 local実装前の未確定事項は、MVP初期方針として以下で固定する。

| 項目 | 固定方針 |
| --- | --- |
| 0点イベント | 不正解、未回答、`rating = normal` など0点のケースでは `rank_events` を作らない。監査目的の0点イベントは後続Phaseで検討する。 |
| score下限 | `profiles.answer_score` / `profiles.questioner_score` は0未満にしない。減点で負数になりそうな場合は0に丸める。 |
| rank再計算 | rankはscore閾値から毎回再計算する。scoreが下がった場合、MVPではrankも下がってよい。rank降格通知や演出はまだ作らない。 |
| 回答者イベント | answer作成成功後に回答者向けrank eventを作る。実装時は既存 `submit_quiz_answer` RPCへの影響が小さい専用RPC `apply_answer_rank_events(p_answer_id)` 方式を優先検討する。 |
| 出題者イベント | rating作成成功後に出題者向けrank eventを作る。専用RPC `apply_rating_rank_events(p_rating_id)` を基本案にする。 |
| transaction | `profiles` のscore/rank更新と `rank_events` 作成は同一transaction相当にする。 |
| 正解率・参加率ボーナス | Phase 6初期実装では作らない。`launch_summary` イベントは後続Phaseで検討する。 |
| 通報による減点 | Phase 6では作らない。admin判断が必要なため、Phase 7 admin / moderation 以降に回す。 |
| backfill | local検証用の手動RPCまたはscript案はdocsに残す。主対象は新規answer/ratingからのイベント作成であり、既存データの自動backfillはPhase 6では必須にしない。 |
| 重複防止 | uniqueは `(user_id, type, source_type, source_id)` を基本にし、同一answer/ratingに対する同じtypeのイベント重複を防ぐ。 |

## 3. rank_events テーブル方針

既存データモデルの `rank_events` 案をベースにする。
MVP初期では、重複防止のためにイベント発生元を明示できるカラムを追加する。

| カラム | 型案 | nullable | 説明 |
| --- | --- | --- | --- |
| `id` | `uuid` | no | primary key。 |
| `user_id` | `uuid` | no | スコアが増減するユーザー。 |
| `type` | `text` | no | `answer_correct` / `answer_correct_rank_bonus` / `answer_difficulty_bonus` / `question_rating` / `question_quality_bonus` など。 |
| `points` | `integer` | no | 加減点。 |
| `reason` | `text` | no | 人間が読める理由。 |
| `source_type` | `text` | no | `answer` / `rating` / `launch_summary` など。 |
| `source_id` | `uuid` | no | `answers.id` または `question_ratings.id` など。 |
| `metadata` | `jsonb` | no | `launch_id`, `question_id`, `correct_rank`, `difficulty`, `rating`, `reason` など。 |
| `created_at` | `timestamptz` | no | 作成時刻。 |

制約方針:

- `points <> 0` を原則にする。MVP初期では0点イベントを作らない。
- 同一回答者イベントは `source_type = 'answer'` / `source_id = answer_id` で重複防止する。
- 同一出題者イベントは `source_type = 'rating'` / `source_id = rating_id` で重複防止する。
- 複数イベントを1つのanswerから作る場合は、`type` もunique keyに含める。
- unique: `(user_id, type, source_type, source_id)` を基本にする。

index案:

- `rank_events(user_id, created_at desc)`
- `rank_events(source_type, source_id)`
- `rank_events(type, created_at desc)`

## 4. 回答者スコア計算

回答者スコアは、正解、正解者順位、難問正解を中心に加点する。
見逃しと未回答にはペナルティを付けない。
不正解ペナルティもMVPでは付けない。

初期スコア案:

| 条件 | points | event type案 |
| --- | ---: | --- |
| 正解 | +3 | `answer_correct` |
| `correct_rank = 1` | +3 | `answer_correct_rank_bonus` |
| `correct_rank = 2` | +2 | `answer_correct_rank_bonus` |
| `correct_rank = 3` | +1 | `answer_correct_rank_bonus` |
| 難易度4以上の正解 | +2 | `answer_difficulty_bonus` |
| 不正解 | +0 | eventなし、または0点eventは作らない |
| 未回答 | +0 | eventなし |

計算例:

- 難易度4の問題で正解、`correct_rank = 1`: `+3 +3 +2 = +8`
- 難易度2の問題で正解、`correct_rank = 3`: `+3 +1 = +4`
- 難易度5の問題で不正解: `+0`

`answer_rank` は表示演出として重要だが、Phase 6の初期スコアでは直接加点しない。
ランクに強く効くのは `correct_rank` とする。

## 5. 出題者スコア計算

出題者スコアは、Phase 5のrating作成時点で反映する。
ratingはMVPでは更新不可のため、rating作成時に1回だけイベント化できる。

初期スコア案:

| 条件 | points | event type案 |
| --- | ---: | --- |
| `rating = good` / 良問 | +2 | `question_rating` |
| `rating = normal` / 普通 | +0 | eventなし |
| `rating = weak` / 微妙 | -1 | `question_rating` |
| `reason = 答えが曖昧` | -3 | `question_reason_penalty` |
| `reason = 不適切` | -5 | `question_reason_penalty` |

Phase 6初期実装では扱わないボーナス:

| 条件 | points | 将来event type案 |
| --- | ---: | --- |
| 正解率が30〜70% | +1 | `question_quality_bonus` |
| 参加率が高い | +1 | `question_participation_bonus` |

Phase 6の分割方針:

- rating作成時に、rating由来の出題者イベントを作る。
- 正解率30〜70%ボーナスと参加率ボーナスは、Phase 6初期実装では作らない。
- 正解率/参加率は将来のlaunch summary処理として検討する。
- 通報による減点はadmin判断が必要なため、Phase 7 admin / moderation 以降に回す。

## 6. rank更新ルール

MVP初期では、score閾値でrankを決める。
複雑なレートや相対順位ではなく、単純な累積スコア制にする。

回答ランク案:

| answer_score | answer_rank |
| ---: | ---: |
| 0〜19 | 0 |
| 20〜49 | 1 |
| 50〜99 | 2 |
| 100〜199 | 3 |
| 200以上 | 4 |

出題ランク案:

| questioner_score | questioner_rank |
| ---: | ---: |
| 0〜9 | 0 |
| 10〜29 | 1 |
| 30〜69 | 2 |
| 70〜149 | 3 |
| 150以上 | 4 |

注意:

- 出題ランクは配信人数と1日の出題回数に影響するため、上がりやすくしすぎない。
- rankはscore閾値から毎回再計算する。
- 減点でscoreが下がった場合、MVPではrankも下がってよい。
- rank降格の通知や演出はまだ作らない。
- scoreは0未満にしない。減点で負数になりそうな場合は0に丸める。

## 7. 重複防止ルール

重複防止はPhase 6の重要要件である。

回答者イベント:

- 同一 `answer_id` に対する回答者イベントは1セットだけ作る。
- unique: `(user_id, type, source_type, source_id)`
- `source_type = 'answer'`
- `source_id = answers.id`

出題者イベント:

- 同一 `rating_id` に対する出題者イベントは1セットだけ作る。
- unique: `(user_id, type, source_type, source_id)`
- `source_type = 'rating'`
- `source_id = question_ratings.id`

summaryイベント:

- Phase 6初期実装ではsummaryイベントを作らない。
- 将来、正解率や参加率のlaunch summaryを作る場合は、`source_type = 'launch_summary'`、`source_id = quiz_launches.id` とする。
- 同一launchに対するsummaryイベントを重複作成しない。

## 8. API/RPC方針

Phase 6では、score更新と `rank_events` 作成を同一transaction相当にする。
API route側だけで `insert rank_events` と `update profiles` を別々に実行する方式は、途中失敗時にscoreとeventがずれるため避ける。

候補A: answer作成時 / rating作成時に同期処理する

| 項目 | 内容 |
| --- | --- |
| 回答者 | `submit_quiz_answer` RPC内、または回答成功直後の専用RPCで回答者イベントを作る。 |
| 出題者 | rating作成API内、またはrating作成直後の専用RPCで出題者イベントを作る。 |
| 利点 | ユーザー操作直後にscore/rankが更新される。MVP体験が分かりやすい。 |
| 注意 | 既存のPhase 4/5 RPC/APIに影響するため、transaction境界を慎重に設計する。 |

候補B: result/rating後にまとめて処理する

| 項目 | 内容 |
| --- | --- |
| 回答者 | result表示時、またはlocal batchで未処理answerをrank event化する。 |
| 出題者 | rating作成後、またはlocal batchで未処理ratingをrank event化する。 |
| 利点 | 既存answer/rating作成処理への変更が少ない。 |
| 注意 | resultを見ないとscoreが更新されないなど、体験が分かりにくくなる。 |

MVP初期方針:

- 回答者イベントはanswer作成成功後に作る。
- 回答者イベントは、既存 `submit_quiz_answer` RPCへの影響が小さい専用RPC `apply_answer_rank_events(p_answer_id)` 方式を優先検討する。
- 出題者イベントはrating作成成功後に作る。
- 出題者イベントは専用RPC `apply_rating_rank_events(p_rating_id)` を基本案にする。
- `profiles` のscore/rank更新と `rank_events` 作成は同一RPC内に閉じる。
- 既存データの自動backfillはPhase 6では必須にしない。
- local検証用に手動RPCまたはscript案は残す。
- 候補Bのresult表示時処理は、MVP初期の主方針にはしない。

RPC候補:

- `apply_answer_rank_events(p_answer_id uuid)`
- `apply_rating_rank_events(p_rating_id uuid)`
- `recalculate_profile_rank(p_user_id uuid)`

## 9. RLS方針

`rank_events` はscoreの根拠であり、ユーザー本人が直接作成・更新してはいけない。

| 操作 | 方針 |
| --- | --- |
| `SELECT` | 本人とadminのみ。 |
| `INSERT` | client direct insert不可。RPC / API route / service role経由のみ。 |
| `UPDATE` | MVPでは不可。訂正が必要な場合は補正eventを作る。 |
| `DELETE` | MVPでは不可。 |

`profiles` のrank/score:

- 本人は読める。
- 本人は `answer_score`, `questioner_score`, `answer_rank`, `questioner_rank` を直接更新できない。
- 更新はRPC / API route / service role経由のみ。

## 10. validation

回答者イベント作成:

- `answer_id` が存在する
- answerの `user_id` がactive profileである
- 対象launch/questionが存在する
- `is_correct`、`correct_rank`、`difficulty` をDB側から読む
- クライアントからpointsを受け取らない
- 同一answer由来のevent重複を拒否またはidempotentに扱う

出題者イベント作成:

- `rating_id` が存在する
- rating対象のquestion/launchが存在する
- 出題者profileが存在する
- rating/reasonをDB側から読む
- クライアントからpointsを受け取らない
- 同一rating由来のevent重複を拒否またはidempotentに扱う

score/rank更新:

- score更新前後の値を `rank_events.metadata` に残す
- rank閾値はサーバー側定数またはDB function側で管理する
- scoreは0未満にしない
- rankはscore閾値から毎回再計算する

## 11. テスト方針

unit test:

- 正解時の回答者points計算
- `correct_rank = 1/2/3` のボーナス計算
- 難易度4以上の正解ボーナス
- 不正解は0点
- 未回答はeventなし
- 0点ケースではrank eventを作らない
- rating `good/normal/weak` のpoints計算
- reason `答えが曖昧` / `不適切` の減点計算
- scoreからrankへの変換
- 減点後のscoreが0未満にならない
- score低下時にrankが閾値どおり再計算される

integration / local DB test:

- answer作成後に回答者rank eventが1セットだけ作られる
- rating作成後に出題者rank eventが1セットだけ作られる
- 同一answerの二重処理でeventが増えない
- 同一ratingの二重処理でeventが増えない
- `profiles.answer_score` と `rank_events.points` が一致する
- `profiles.questioner_score` と `rank_events.points` が一致する
- 減点によりquestioner_scoreが負数になりそうな場合は0に丸められる
- `rating = normal` ではrank eventが作られない
- score更新とrank_events作成の片方だけが成功する状態を作らない
- 本人がclientからrank_eventsをinsertできない
- 本人がprofilesのrank/scoreを直接更新できない

manual local check:

- `/profile` でanswer_score / questioner_score / rankが変わる
- Phase 3の出題人数制限が `questioner_rank` 更新後も破綻しない
- `.env.local` とsecret実値がdiffに含まれない

## 12. Phase 6で作らないもの

- シーズンランキング
- ギルドランキング
- ELO/レート
- デイリーランキング
- 通知連携
- Web Push
- Realtime
- admin本実装
- moderationによる減点の確定処理
- 通報による減点
- 正解率/参加率のlaunch summaryイベント
- 既存データの自動backfill
- ランキング集計バッチ
- production deploy
- Supabase cloud project
- Vercel project
- Stripe

## 13. Phase 6完了条件

- `rank_events` テーブル方針に沿ったlocal migrationがある
- 回答者イベント作成がlocalで動く
- 出題者イベント作成がlocalで動く
- `profiles.answer_score` / `profiles.questioner_score` が更新される
- `profiles.answer_rank` / `profiles.questioner_rank` が閾値に沿って更新される
- 同一answer/rating由来のevent重複が防がれる
- score更新とevent作成が同一transaction相当で扱われる
- 0点イベントが作られない
- scoreが0未満にならない
- rankがscore閾値から再計算される
- Phase 6範囲外のランキング/通知/admin機能を含めない
- `npm run typecheck` が通る
- `npm run lint` が通る
- `npm run test` が通る
- `npm run build` が通る
- Supabase localで主要ケースを確認できる
- `.env.local` とsecret実値がcommit対象に含まれていない

## 14. Phase 7 admin / moderation へ進む条件

Phase 7へ進む前に、以下を満たす。

- rank_eventsが回答/評価から重複なく作られている
- profilesのscore/rankとrank_eventsの合計に大きな不整合がない
- 通報による自動停止や自動減点をPhase 6に混ぜていない
- adminが確認すべき通報、停止、補正eventの論点が整理されている

Phase 7で検討するもの:

- 通報一覧
- 通報詳細
- `question.status = review_required` / `suspended`
- `profiles.status = suspended`
- admin操作ログ
- moderation判断による補正rank_event
- 不適切問題の配信停止
- waitlist / invite / world状態のadmin操作
