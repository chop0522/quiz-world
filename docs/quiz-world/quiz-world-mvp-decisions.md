# 通知型早押しクイズワールド MVP決定事項

## 目的

このドキュメントは、実装前にMVPの固定方針をまとめるための決定事項一覧である。

本プロジェクトは既存 Smart Buzzer とは別の「通知型早押しクイズワールド」専用企画として扱う。
ここではdocs上の設計のみを行い、実装コード、DB migration、Supabase / Vercel / Stripe などのcloud環境作成、cloud data変更は行わない。

## 招待方式

Season 0 は管理者発行の招待コード制にする。

| 項目 | 決定 |
| --- | --- |
| Season 0の参加方式 | 管理者発行の招待コード制。 |
| 招待コード発行者 | admin role を持つ管理者のみ。 |
| 登録条件 | 招待コードを持つ人だけ登録できる。 |
| 参加枠超過時 | waitlist へ誘導する。 |
| 一般ユーザー招待 | MVPでは不可。 |
| 将来拡張 | Season 1以降で上位出題者や上位回答者に招待枠を付与できる余地を残す。 |

### 登録時の判定順

1. 招待コードの入力を受け取る。
2. サーバー側で招待コードの存在、有効期限、使用状態、対象ワールドを検証する。
3. 18歳以上確認、利用規約同意、プライバシーポリシー同意を確認する。
4. world_members の有効人数と worlds.member_limit を確認する。
5. 参加枠に空きがあれば world_members を作成する。
6. 参加枠が埋まっていれば waitlist へ誘導する。

招待コード検証と参加枠確認は必ずサーバー側で行う。クライアント側の表示だけで参加可否を決めない。

## 評価方式

クイズ評価は5段階評価ではなく、3段階評価 + 理由タグにする。

### 評価

| 値 | 表示 | ランク影響の初期方針 |
| --- | --- | --- |
| good | 良問 | 出題者スコアに加点。 |
| normal | 普通 | 出題者スコアは変化なし。 |
| weak | 微妙 | 出題者スコアを軽く減点。 |

### 理由タグ

| タグ | 用途 |
| --- | --- |
| 面白い | 良問評価の理由。 |
| 難易度がちょうどいい | 良問評価または普通評価の理由。 |
| 答えが曖昧 | 減点理由。必要に応じて管理確認対象。 |
| 難しすぎる | 難易度調整の材料。 |
| 簡単すぎる | 難易度調整の材料。 |
| 不適切 | 通報導線と連動できる余地を残す。 |

MVPでは評価を出題者ランクの計算に使う。
「不適切」タグは、通報導線と連動できるようにしておく。

### 評価の保存方針

- question_ratings.rating に good / normal / weak 相当の値を保存する。
- question_ratings.reason に理由タグを保存する。
- 1人の回答者が1つの launch に対して評価できるのは1回までにする。
- 出題者本人は自分の出題に評価できない。
- 回答対象ではないユーザーは評価できない。

## start_at

start_at の初期値は通知作成から15秒後にする。

| 項目 | 決定 |
| --- | --- |
| 初期値 | quiz_launch 作成時点から15秒後。 |
| 決定者 | サーバー。 |
| 目的 | 通知到達差、画面更新差、ユーザーの開封差をある程度吸収する。 |
| クライアント時刻 | 使わない。 |

start_at 到達前は問題本文と選択肢を表示しない。
カウントダウンだけを表示する。

## end_at

end_at の初期値は start_at から60秒後にする。

| 項目 | 決定 |
| --- | --- |
| 初期値 | start_at + 60秒。 |
| MVP標準 | 四択クイズでは60秒。 |
| 将来拡張 | 難易度、問題タイプ、イベント形式により変更できる余地を残す。 |
| 回答受付 | start_at 以降、end_at 以前のみ。 |

end_at 後の回答は拒否する。
回答送信時にクライアント時刻を信用せず、サーバー側で現在時刻と end_at を比較する。

## 通知

MVPの通知は段階導入にする。

| Phase | 方針 |
| --- | --- |
| Phase 1 | `/home` の15秒ポーリングによる画面内通知で検証する。 |
| Phase 1.5 | Supabase Realtime化を検討する。 |
| Phase 2 | Web Pushを検討する。 |

### Phase 1

- `/home` に「届いたクイズ」を表示する。
- `/home` は15秒ごとに `GET /api/quiz-launches` を呼び、新着 quiz_recipients を確認する。
- 開始前、回答可能、回答済み、終了済みの状態を分けて表示する。
- API設計はRealtime化しやすい形にする。
- 通知対象抽選はサーバー側で行う。
- quiz_recipients に作られたユーザーだけが「届いたクイズ」として見られる。

### Phase 2

- Web Pushを検討する。
- push_tokens を利用する。
- notification_logs に送信結果を残す。
- quiet hours、通知上限、休憩モード、深夜通知設定を送信前に必ず見る。

### データモデル上の扱い

Phase 1でも、将来用として以下のテーブル設計は残す。

- push_tokens
- notification_logs

ただしPhase 1では、Push送信そのものは実装しなくてよい。

## ランク

MVPではシンプルなスコア式にする。

| 方針 | 内容 |
| --- | --- |
| 見逃し | ペナルティなし。 |
| 誤答 | 軽め。初期案では+0。 |
| 出題者ランク | 良問評価、参加率、正解率の適正さ、通報で調整。 |
| 回答者ランク | 正解、正解者順位、難問正解を中心に加点。 |
| 配信人数 | 出題者ランクで増える。 |
| 参加枠 | ワールド全体の活動と品質で増える。 |

出題者の配信人数増加と、ワールド参加枠増加は別概念にする。

### 出題者スコア初期案

| イベント | 点数 |
| --- | ---: |
| 良問評価 | +2 |
| 普通評価 | +0 |
| 微妙評価 | -1 |
| 答えが曖昧 | -3 |
| 不適切通報 | -5 |
| 参加率が高い | +1 |
| 正解率が30〜70% | +1 |

「不適切通報」は、通報が妥当と判断された場合に強く反映する。
通報された時点ですぐに大きく減点するかは、運用時に慎重に決める。

### 回答者スコア初期案

| イベント | 点数 |
| --- | ---: |
| 正解 | +3 |
| 正解者1位 | +3 |
| 正解者2位 | +2 |
| 正解者3位 | +1 |
| 不正解 | +0 |
| 未回答 | +0 |
| 難問正解 | +2 |

answer_rank は表示上の順位として扱う。
回答者ランクに強く効くのは correct_rank と正解である。

## 管理

MVPでは簡易 admin を用意する。

### admin role / status

| 項目 | 決定 |
| --- | --- |
| global admin判定 | profiles.role を使う。 |
| profiles.role | user / admin。 |
| profiles.status | active / suspended。 |
| world_members.role | member / world_admin。MVP admin判定には使わない。 |
| world_members.status | active / suspended。 |
| admin画面アクセス | profiles.role = admin を主判定にする。 |

将来、複数ワールドやギルドでは world_members.role / guild_members.role を使う余地を残す。

### MVP adminで扱うもの

- 通報確認
- ユーザー停止
- クイズ配信停止
- waitlist 確認
- 招待コード発行
- 参加枠調整
- world状態確認
- ランクイベント確認
- 通知ログ確認
- 操作ログ確認

### 管理方針

- 削除より停止を優先する。
- 不適切クイズは question.status = review_required / suspended のように扱う。
- 問題の完全削除はMVPでは原則避ける。
- profiles.status = suspended によりログイン後の出題、回答、主要操作を制限する。
- 参加枠変更は admin のみ可能にする。
- 管理操作は admin_audit_logs に残す。
- cloud data を直接手動削除する運用を避ける。

### admin_audit_logs

admin_audit_logs をMVP初期データモデルに正式追加する。

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

対象操作は、ユーザー停止、クイズ配信停止、参加枠変更、招待コード発行、通報対応、waitlist操作とする。

## カテゴリ

MVPカテゴリは固定カテゴリ + その他にする。

| カテゴリ |
| --- |
| 雑学 |
| 歴史 |
| 地理 |
| 科学 |
| エンタメ |
| スポーツ |
| 言葉 |
| 謎解き |
| その他 |

その他を選んだ場合のみ、任意の補足テキストを許可する。

## 通報対応基準

MVPではadmin確認ベースで運用する。

| 条件 | 方針 |
| --- | --- |
| 1回目の通報 | report作成、admin確認待ち。 |
| 同じ問題に2件以上の通報 | question.status = review_required。 |
| adminが不適切と判断 | question.status = suspended。 |
| 同じユーザーのsuspended問題が3件以上 | profiles.status = suspended候補。 |
| 自動停止 | MVPでは慎重にし、admin判断を優先する。 |

## 追加API

以下をMVP APIとして正式追加する。

- `GET /api/quiz-launches`
- `DELETE /api/blocks/[id]`
- `GET /api/admin/invites`
- `POST /api/admin/invites`
- `GET /api/admin/waitlist`
- `PATCH /api/admin/waitlist/[id]`
- `GET /api/admin/audit-logs`

## 今回固定した項目

| 項目 | 固定内容 |
| --- | --- |
| 招待方式 | Season 0は管理者発行の招待コード制。 |
| 評価方式 | 3段階評価 + 理由タグ。 |
| start_at | 通知作成から15秒後。 |
| end_at | start_atから60秒後。 |
| 通知 | Phase 1は15秒ポーリングの画面内通知、Phase 1.5でRealtime検討、Phase 2でWeb Push。 |
| ランク | MVPはシンプルなスコア式。見逃しペナルティなし。 |
| 管理画面 | MVPでは簡易adminを用意。 |
| admin role | profiles.role = admin を主判定にする。 |
| admin_audit_logs | MVP初期データモデルに正式追加。 |
| カテゴリ | 固定カテゴリ + その他。 |
| 通報基準 | admin確認ベースの初期基準を採用。 |
| 追加API | `/home`一覧、block解除、admin invite/waitlist/audit logsを追加。 |
