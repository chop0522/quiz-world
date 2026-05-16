# 通知型早押しクイズワールド 実装前最終決定

## 目的

このドキュメントは、Phase 0の実装準備へ進む前に残っていた未確定事項を、MVP初期方針として最終固定するためのメモである。

ここではdocsのみを更新する。実装コード、DB migration SQL、Supabase / Vercel / Stripe などのcloud環境作成、cloud data変更は行わない。

## 前提

- このリポジトリは Quiz World 専用リポジトリであり、既存 Smart Buzzer とは完全に分離する。
- Smart Buzzer の production / Stripe / Vercel / Supabase / env / legal page / cleanup / live key には触れない。
- MVPは18歳以上限定であり、18歳未満は保護者同意があっても利用不可とする。
- Season 0は管理者発行の招待コード制とする。
- Phase 1は15秒ポーリングの画面内通知とする。
- Web PushはPhase 2以降で検討する。

## 1. 利用規約・プライバシーポリシー

MVP初期方針として、実装開始前に利用規約とプライバシーポリシーの草案ページを用意する。

| 項目 | MVP初期方針 |
| --- | --- |
| 草案ページ | 実装開始前に用意する。 |
| signup同意 | 利用規約同意とプライバシーポリシー同意を必須にする。 |
| 保存項目 | `terms_accepted_at` / `privacy_accepted_at` を保存する。 |
| 法務完成度 | 法務完成版ではなく、まずMVP草案でよい。 |
| 専門家確認 | 10人テスト前に専門家確認する。 |
| 年齢制限 | MVPは18歳以上限定。18歳未満は保護者同意があっても不可。 |

### signupで必須にすること

- 18歳以上であることの確認。
- 利用規約への同意。
- プライバシーポリシーへの同意。
- 招待コードの検証。
- 参加枠の確認。

### 実装上の扱い

- 生年月日はMVPでは保存しない。
- `age_confirmed_at`、`terms_accepted_at`、`privacy_accepted_at` はサーバー側で記録する。
- 同意チェックはクライアント表示だけにせず、API側でも必ず検証する。
- 草案文面は `quiz-world-legal-draft.md` を起点にする。

## 2. 新規Supabase環境

MVP初期方針として、Phase 0〜Phase 3は Supabase local を推奨する。

| 段階 | 方針 |
| --- | --- |
| Phase 0〜Phase 3 | Supabase local を推奨する。 |
| Supabase local が難しい場合 | Quiz World専用の新規development projectを使う。 |
| 10人テスト直前 | Quiz World専用のProduction projectを作る。 |
| Smart Buzzer | 既存Supabase projectとは絶対に混ぜない。 |

### secret取り扱い

- `SUPABASE_SERVICE_ROLE_KEY` はサーバー専用にする。
- clientにsecretを出さない。
- `NEXT_PUBLIC_` 付きenvには公開してよい値だけを置く。
- Local / Preview / Production のデータは混ぜない。

### cloud作成方針

- このdocs更新時点ではSupabase projectを作らない。
- Production projectは10人テスト直前まで作らない。
- development projectを使う場合も、Smart Buzzerとは別projectにする。

## 3. 新規Vercel環境

MVP初期方針として、Phase 0ではVercelを使わない。

| 段階 | 方針 |
| --- | --- |
| Phase 0 | Vercel不要。localで開始する。 |
| 主要機能がlocalで動いた後 | Quiz World専用の新規Vercel Preview projectを作る。 |
| 10人テスト直前 | Productionを有効化する。 |
| Smart Buzzer | 既存Vercel projectとは絶対に混ぜない。 |

### 実装上の扱い

- localで signup / invite / quiz作成 / launch / answer / result / admin の主要動線が動いてからPreviewを作る。
- Production envは10人テスト直前にレビューしてから有効化する。
- Vercel envはQuiz World専用にし、Smart Buzzerのenvを流用しない。

## 4. admin操作ログ記録失敗時の扱い

MVP初期方針として、admin操作と `admin_audit_logs` 記録は同一transaction扱いにする。

| 項目 | 方針 |
| --- | --- |
| transaction | admin操作と操作ログ記録を同一transaction扱いにする。 |
| audit log記録失敗 | 管理操作全体を失敗扱いにする。 |
| 部分更新 | 避ける。 |
| 完全削除 | MVPでは避け、停止を優先する。 |

### 対象操作

- ユーザー停止。
- クイズ配信停止。
- 参加枠変更。
- 招待コード発行。
- 通報対応。
- waitlist操作。

### 実装上の扱い

- 操作ログが残せない場合、ユーザー停止や参加枠変更などの本体操作もcommitしない。
- admin API / server function側でtransaction境界を持つ。
- clientから直接 `admin_audit_logs` を作成しない。

## 5. Phase 1.5のRealtime範囲

MVP初期方針として、Phase 1.5のRealtime対象は `/home` の届いたクイズ一覧に限定する。

| Phase | 方針 |
| --- | --- |
| Phase 1 | `/home` が15秒ごとに `GET /api/quiz-launches` をポーリングする。 |
| Phase 1.5 | `quiz_recipients` の本人宛新着だけRealtime化する。 |
| MVP後回し | 結果画面のRealtime更新。 |
| Phase 2 | Web Pushを検討する。 |

### Phase 1.5で扱うもの

- 自分宛の `quiz_recipients` insert。
- 自分宛の `quiz_recipients` status更新。
- `/home` の届いたクイズ一覧の新着表示。

### Phase 1.5で扱わないもの

- 結果画面のRealtime更新。
- answer一覧のRealtime反映。
- rankingのRealtime集計。
- Web Push。

## 6. カテゴリ補足テキスト

MVP初期方針として、カテゴリは固定カテゴリ + その他にする。

| 項目 | 方針 |
| --- | --- |
| category | 固定カテゴリから選ぶ。 |
| category_note | `その他` を選んだ場合だけ許可する。 |
| category_note閲覧 | 出題者本人とadminのみ見られる。 |
| 回答者表示 | 回答者にはカテゴリ `その他` のみ表示する。 |
| 結果画面 | MVPでは `category_note` を出さない。 |

### 初期カテゴリ

- 雑学
- 歴史
- 地理
- 科学
- エンタメ
- スポーツ
- 言葉
- 謎解き
- その他

### 実装上の扱い

- `category_note` は nullable にする。
- `category != その他` の場合、`category_note` は保存しない、またはサーバー側で無視する。
- `category_note` は出題管理、モデレーション、今後のカテゴリ改善に使う。
- 回答者向けAPIでは `category_note` を返さない。

## Phase 0へ進むための結論

今回の固定により、Phase 0の実装準備に進める状態になった。

ただし、実装開始前に次を行う。

1. docsの現時点の差分をレビューする。
2. このdocs設計フェーズの内容をcommitする。
3. Phase 0で作るものと作らないものを再確認する。

Phase 0でも、Smart Buzzer の production / Stripe / Vercel / Supabase / env / legal page / cleanup / live key には触れない。
