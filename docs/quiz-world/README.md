# 通知型早押しクイズワールド README

## このREADMEの目的

このREADMEは、節目ごとにChatGPT Proへ作業状況を共有し、次の進め方を決めるための引き継ぎ文書である。

実装者、設計レビュー担当、ChatGPT Proが、現時点の企画意図、作成済みdocs、決定事項、未確定事項、禁止事項を短時間で把握できることを目的にする。

## 企画の位置づけ

プロジェクト仮称は「通知型早押しクイズワールド」。

これは既存の Smart Buzzer とは別企画である。
Smart Buzzer の production、Stripe、Vercel、Supabase、env、legal page、cleanup、live key には触れない。

現時点では企画・設計フェーズであり、実装フェーズには入っていない。
このリポジトリ内では Quiz World の docs 作成・更新のみを行う。

## 現時点で作成済みのdocs

| ファイル | 内容 |
| --- | --- |
| `quiz-world-concept.md` | 企画コンセプト、世界観、1ワールド制、初期10人、参加枠成長、通知体験、ギルド構想。 |
| `quiz-world-mvp-spec.md` | MVPに含める機能、含めない機能、画面案、クイズ形式、回答ルール。 |
| `quiz-world-data-model.md` | MVP向けテーブル案、将来ギルド用テーブル、RLS方針、インデックス候補。 |
| `quiz-world-ranking-rules.md` | 出題者ランク、回答者ランク、順位定義、ワールド成長ルール。 |
| `quiz-world-notification-rules.md` | 通知対象条件、通知モード、quiet hours、通知送信フロー、通知疲れ対策。 |
| `quiz-world-safety-and-age-policy.md` | 18歳以上限定、UGC対策、通報、ブロック、安全機能、未成年対応の将来余地。 |
| `quiz-world-future-guilds.md` | 将来ギルド機能、解放段階、作成条件、安全対策。 |
| `quiz-world-infra-plan.md` | MVPインフラ案、PWA/Web Push、Supabase/Vercel利用案、拡張段階。 |
| `quiz-world-mvp-decisions.md` | MVPで固定した招待方式、評価方式、start_at/end_at、通知Phase、ランク、admin方針。 |
| `quiz-world-screen-spec.md` | MVP画面ごとの目的、表示要素、操作、権限、空状態、エラー状態、対象外範囲。 |
| `quiz-world-api-spec.md` | MVP APIの目的、認証、権限、request/response、バリデーション、サーバー側判定。 |
| `quiz-world-rls-policy-plan.md` | Supabase RLSの方針案、テーブル別のSELECT/INSERT/UPDATE/DELETE、service role境界。 |
| `quiz-world-admin-spec.md` | MVP管理画面の通報、停止、waitlist、招待、参加枠、ログ確認仕様。 |
| `quiz-world-design-review.md` | 既存docsの横断レビュー、矛盾、曖昧さ、実装前の決定事項。 |
| `quiz-world-implementation-task-breakdown.md` | Phase 0〜12の実装タスク分解、対象画面/API/テーブル、完了条件、テスト観点。 |
| `quiz-world-env-plan.md` | 新規Supabase/Vercel想定、Local/Preview/Production、env名、secret管理。 |
| `quiz-world-migration-draft.md` | SQLではないDB migration草案。admin_audit_logsを含むテーブル定義案。 |
| `quiz-world-legal-draft.md` | 利用規約・プライバシーポリシー草案論点、ドラフト文言、専門家確認事項。 |
| `quiz-world-test-plan.md` | unit/integration/E2E/RLS/admin/10人運用テスト計画。 |
| `quiz-world-10-user-ops-scenario.md` | 初期10人テストの募集、招待、1/3/7日目運用、成功条件。 |

## 現時点の主要決定事項

| 項目 | 決定内容 |
| --- | --- |
| 初期形態 | 1ワールド制。 |
| 初期参加枠 | 10人。 |
| 成長表現 | 参加枠が10人、15人、20人、30人、50人と増えるシーズン制。 |
| MVP年齢制限 | 18歳以上限定。18歳未満は保護者同意があっても不可。 |
| MVPクイズ形式 | 四択クイズを優先。AI自動判定には頼らない。 |
| 順位判定 | サーバー受信順。端末時刻は使わない。 |
| 招待方式 | Season 0は管理者発行の招待コード制。 |
| 評価方式 | 3段階評価 + 理由タグ。 |
| start_at | 通知作成から15秒後。サーバー側で決定。 |
| end_at | start_atから60秒後。 |
| 通知実装 | Phase 1は15秒ポーリングの画面内通知、Phase 1.5でRealtime検討、Phase 2でWeb Push検討。 |
| admin role | `profiles.role` をglobal admin判定に使う。値は `user` / `admin`。 |
| user停止 | `profiles.status` をglobal状態として使う。値は `active` / `suspended`。 |
| world member role | `world_members.role` は `member` / `world_admin`。将来の複数world向け。 |
| 操作ログ | `admin_audit_logs` をMVP初期データモデルに正式追加。 |
| カテゴリ | 固定カテゴリ + その他。その他のみ補足テキストを許可。 |
| 通報基準 | MVPはadmin確認ベース。2件以上で `review_required`、admin判断で `suspended`。 |
| 追加API | `/home`一覧、block解除、admin invite/waitlist/audit logs APIを正式追加。 |
| 配信人数増加 | 課金ではなく出題ランクで増える。 |
| 参加枠増加 | ワールド全体の成長で増える。 |
| 将来小集団 | ギルド。MVPには入れない。 |

## MVPに含めるもの

- ユーザー登録
- 18歳以上確認
- 利用規約・プライバシーポリシー同意
- 1ワールド制
- 初期参加上限10人
- 満員時のウェイトリスト
- Season 0の管理者発行招待コード
- プロフィール
- 出題者ランク
- 回答者ランク
- 四択クイズ作成
- 固定カテゴリ + その他
- クイズ出題
- 通知対象のサーバー側抽選
- Phase 1の15秒ポーリング画面内通知
- 開始カウントダウン
- 回答
- 回答順位表示
- 正解者順位表示
- 3段階評価 + 理由タグ
- 通報
- ブロック/ブロック解除
- 通知設定
- quiet hours
- 1日の通知上限
- 深夜通知デフォルトOFF
- 簡易admin
- admin_audit_logs

## MVPに含めないもの

- タイムライン
- コメント
- DM
- フォロー
- ギルド
- ギルド対抗戦
- 課金
- AI自動判定
- 自由チャット
- 公開掲示板
- 一般ユーザーによる招待コード発行
- Phase 1でのWeb Push
- 完全削除を前提にした管理運用

MVPでは通知型早押しの面白さ、安全性、少人数運用を先に検証する。

## 今回固定済みになったもの

| 元の未確定事項 | 固定内容 |
| --- | --- |
| admin role | `profiles.role = admin` をMVP admin画面/APIの主判定にする。 |
| user停止状態 | `profiles.status = suspended` でログイン後の出題/回答/admin対象操作を制限する。 |
| world member role/status | `world_members.role = member/world_admin`、`world_members.status = active/suspended`。 |
| 操作ログ | `admin_audit_logs` をMVP初期データモデルに正式追加する。 |
| 通知方式 | Phase 1は `/home` が15秒ごとに `GET /api/quiz-launches` をポーリングする。 |
| Realtime | Phase 1.5でSupabase Realtime化を検討する。 |
| Web Push | Phase 2で検討する。 |
| カテゴリ | 雑学、歴史、地理、科学、エンタメ、スポーツ、言葉、謎解き、その他。 |
| 通報基準 | 1件目はadmin確認待ち、同一問題2件以上で `review_required`、admin判断で `suspended`。 |
| 追加API | `GET /api/quiz-launches`、`DELETE /api/blocks/[id]`、admin invite/waitlist/audit logs APIを正式追加。 |

## まだ未確定の事項

| 未確定事項 | 次に決める内容 |
| --- | --- |
| 利用規約文面 | 18歳以上確認、UGC、通知、通報、停止の正式文面。 |
| プライバシーポリシー文面 | 通知ログ、通報、ブロック、操作ログの扱い。 |
| 新規Supabase環境 | LocalはSupabase localで始めるか、新規development projectで始めるか。 |
| 新規Vercel環境 | Previewをいつ作るか。Productionは10人テスト直前でよいか。 |
| admin操作ログの失敗時扱い | 操作ログ記録失敗時に管理操作全体を失敗扱いにするか。推奨は失敗扱い。 |
| Phase 1.5のRealtime範囲 | `/home`一覧だけか、結果画面更新まで含めるか。 |
| カテゴリ補足テキスト | 「その他」補足をadminだけ見るか、結果画面にも出すか。 |

## 現時点で触ってはいけないもの

以下は明示的に禁止。

- 既存 Smart Buzzer の production 変更
- 既存 Smart Buzzer の Stripe 設定変更
- 既存 Smart Buzzer の Vercel env 変更
- 既存 Smart Buzzer の Supabase 設定変更
- 既存 Smart Buzzer の env 変更
- 既存 Smart Buzzer の legal page 変更
- cleanup 作業
- cloud data の変更
- live key 切り替え
- DB migration SQL作成
- 既存アプリコード変更
- 実装コード作成
- commit 作成

現時点ではdocsのみを扱う。

## 実装へ進む前の最終チェック

- 利用規約・プライバシーポリシー草案を専門家確認へ回すか。
- Local/Preview/Productionの作成タイミングを決める。
- Supabase local開始かdevelopment project開始かを決める。
- `admin_audit_logs` 記録失敗時のtransaction方針を決める。
- カテゴリ補足テキストの表示範囲を決める。
- Phase 0開始前にapi-spec/data-model/RLSの最終整合チェックを行う。

## 次の作業候補

### A. 実装前docsの最終整合

- screen-specへ15秒ポーリングと固定カテゴリを反映する。
- implementation-task-breakdownへ今回固定した追加APIを反映する。
- legal draftを専門家確認前の草案に整える。

### B. Phase 0へ進む準備

- プロジェクト初期化方針を決める。
- Local/Previewのenv方針を決める。
- migration草案をSQL化する前のレビューを行う。

### C. まだ実装に進まない

- 10人テスト運用手順をさらに細かくする。
- 通報対応のadmin手順書を作る。

## 現時点の推奨

次は実装コードではなく、今回固定した方針をChatGPT Proに共有して最終確認する。
問題なければ、Phase 0のプロジェクト初期化へ進む前に、env方針と法務文面の扱いだけ決める。

