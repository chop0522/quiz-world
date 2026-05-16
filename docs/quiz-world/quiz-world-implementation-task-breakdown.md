# 通知型早押しクイズワールド 実装タスク分解

## 目的

実装に進む場合の作業をPhase単位で分解する。
このドキュメントは実装準備であり、まだ実装コード、DB migration、cloud環境作成は行わない。

## Phase 0: プロジェクト初期化

| 項目 | 内容 |
| --- | --- |
| 目的 | Quiz World専用プロジェクトとして土台を作る。 |
| 実装対象 | Next.js App Router、TypeScript、lint/test基盤、docs構成。 |
| 対象画面 | なし。 |
| 対象API | なし。 |
| 対象テーブル | なし。 |
| 完了条件 | ローカルで空アプリが起動し、lint/testコマンド方針が決まる。 |
| テスト観点 | 初期画面表示、型チェック、lint。 |
| MVPでやらないこと | 既存Smart Buzzer流用、cloud接続、Stripe導入。 |

## Phase 1: 認証/signup/18歳以上確認

| 項目 | 内容 |
| --- | --- |
| 目的 | 18歳以上かつ規約同意済みのユーザーだけ登録できるようにする。 |
| 実装対象 | signup、login、profile作成、同意日時保存。 |
| 対象画面 | `/signup`, `/login` |
| 対象API | `POST /api/signup` |
| 対象テーブル | profiles |
| 完了条件 | 18歳以上確認、規約同意、プライバシー同意なしでは登録不可。 |
| テスト観点 | チェック未完了時の拒否、age_confirmed_at等の保存。 |
| MVPでやらないこと | 生年月日保存、保護者同意、16〜17歳対応。 |

## Phase 2: ワールド参加枠/invite/waitlist

| 項目 | 内容 |
| --- | --- |
| 目的 | Season 0の10人招待制参加を成立させる。 |
| 実装対象 | 招待コード検証、参加枠確認、waitlist登録。 |
| 対象画面 | `/signup`, `/invite`, `/world`, `/admin` |
| 対象API | `POST /api/invites/validate`, `POST /api/waitlist`, admin invite API |
| 対象テーブル | worlds, world_members, invites, waitlist, admin_audit_logs |
| 完了条件 | 有効な招待コードのみ参加可能。11人目はwaitlistへ誘導。 |
| テスト観点 | code無効、期限切れ、使用済み、満員、waitlist重複。 |
| MVPでやらないこと | 一般ユーザー招待、自動招待枠配布。 |

## Phase 3: 四択クイズ作成

| 項目 | 内容 |
| --- | --- |
| 目的 | MVP標準の四択クイズを作れるようにする。 |
| 実装対象 | 問題文、選択肢4つ、正解、難易度、カテゴリ。 |
| 対象画面 | `/create` |
| 対象API | `POST /api/questions` |
| 対象テーブル | questions |
| 完了条件 | active memberが正しい四択クイズを作成できる。 |
| テスト観点 | 選択肢不足、正解未選択、停止ユーザー、カテゴリ不正。 |
| MVPでやらないこと | AI判定、自由入力のみ、画像問題。 |

## Phase 4: quiz_launches/quiz_recipients作成

| 項目 | 内容 |
| --- | --- |
| 目的 | 出題者ランクに応じて配信対象をサーバー側で作成する。 |
| 実装対象 | launch作成、recipient抽選、start_at/end_at設定。 |
| 対象画面 | `/create`, `/home` |
| 対象API | `POST /api/quiz-launches` |
| 対象テーブル | quiz_launches, quiz_recipients, notification_logs, blocks, profiles |
| 完了条件 | 出題者本人、quiet hours、通知上限、ブロック相手を除外して配信対象が作られる。 |
| テスト観点 | 出題者除外、ブロック除外、上限除外、start_at=now+15秒、end_at=start_at+60秒。 |
| MVPでやらないこと | クライアントによる対象者指定、課金による配信増加。 |

## Phase 5: 画面内通知

| 項目 | 内容 |
| --- | --- |
| 目的 | Phase 1通知として `/home` に届いたクイズを表示する。 |
| 実装対象 | quiz_recipients一覧、状態表示、ポーリングまたはRealtime。 |
| 対象画面 | `/home` |
| 対象API | `GET /api/quiz-launches` 追加候補 |
| 対象テーブル | quiz_recipients, quiz_launches, answers |
| 完了条件 | 開始前、回答可能、回答済み、終了済みが区別できる。 |
| テスト観点 | 対象者のみ表示、状態遷移、空状態。 |
| MVPでやらないこと | Web Push、ネイティブPush。 |

## Phase 6: quiz回答

| 項目 | 内容 |
| --- | --- |
| 目的 | start_at以降、end_at以前に1回だけ回答できる。 |
| 実装対象 | カウントダウン、問題表示、回答送信、順位保存。 |
| 対象画面 | `/quiz/[launchId]` |
| 対象API | `GET /api/quiz-launches/[id]`, `POST /api/quiz-launches/[id]/answer` |
| 対象テーブル | quiz_launches, quiz_recipients, answers |
| 完了条件 | start_at前は問題非表示、end_at後は回答不可、重複回答不可。 |
| テスト観点 | 配信対象外、出題者本人、重複回答、サーバー受信順。 |
| MVPでやらないこと | 回答後の選び直し、端末時刻順位。 |

## Phase 7: 結果表示

| 項目 | 内容 |
| --- | --- |
| 目的 | 回答後または終了後に結果を見られるようにする。 |
| 実装対象 | 自分の正誤、answer_rank、correct_rank、全回答者、未回答者。 |
| 対象画面 | `/result/[launchId]` |
| 対象API | `GET /api/quiz-launches/[id]/result` |
| 対象テーブル | answers, quiz_recipients, quiz_launches, profiles |
| 完了条件 | 回答前に他人のanswersが見えず、回答後/終了後に必要範囲が見える。 |
| テスト観点 | 回答前非公開、対象外非公開、正解者順位。 |
| MVPでやらないこと | コメント、DM、自由チャット。 |

## Phase 8: 評価/通報/ブロック

| 項目 | 内容 |
| --- | --- |
| 目的 | クイズ品質評価と安全導線を提供する。 |
| 実装対象 | 3段階評価、理由タグ、通報、ブロック、ブロック解除。 |
| 対象画面 | `/result/[launchId]`, `/profile` |
| 対象API | `POST /api/quiz-launches/[id]/rating`, `POST /api/reports`, `POST /api/blocks`, block解除API |
| 対象テーブル | question_ratings, reports, blocks |
| 完了条件 | 回答者のみ評価可能。本人操作として通報/ブロックが記録される。 |
| テスト観点 | 評価重複、出題者自己評価、通報重複、自分自身ブロック。 |
| MVPでやらないこと | 公開コメント、自由チャット、複雑なモデレーション自動化。 |

## Phase 9: ランク計算

| 項目 | 内容 |
| --- | --- |
| 目的 | 出題者ランクと回答者ランクを初期スコア式で更新する。 |
| 実装対象 | rank_events作成、profilesスコア更新、Lv計算。 |
| 対象画面 | `/home`, `/profile`, `/world` |
| 対象API | 回答API、評価API、admin補正API |
| 対象テーブル | rank_events, profiles, question_ratings, answers |
| 完了条件 | 正解、correct_rank、難問正解、評価がスコアに反映される。 |
| テスト観点 | 未回答ペナルティなし、誤答+0、評価反映、履歴の説明可能性。 |
| MVPでやらないこと | 複雑なシーズンリセット、自動不正検知。 |

## Phase 10: 簡易admin

| 項目 | 内容 |
| --- | --- |
| 目的 | 10人テストを安全に運用する。 |
| 実装対象 | 通報一覧、クイズ停止、ユーザー停止、waitlist、招待、参加枠、ログ確認。 |
| 対象画面 | `/admin` |
| 対象API | admin API群 |
| 対象テーブル | reports, questions, profiles, world_members, waitlist, invites, worlds, admin_audit_logs |
| 完了条件 | adminだけが操作でき、操作ログが残る。削除ではなく停止できる。 |
| テスト観点 | admin以外403、操作ログ、誤操作防止、停止後の出題/回答不可。 |
| MVPでやらないこと | 完全削除、cloud console直接操作前提、課金管理。 |

## Phase 11: E2Eテスト

| 項目 | 内容 |
| --- | --- |
| 目的 | 主要ユーザーフローが壊れていないことを確認する。 |
| 実装対象 | Playwright等によるsignup、出題、回答、結果、admin操作。 |
| 対象画面 | 全MVP画面 |
| 対象API | 全MVP API |
| 対象テーブル | 全MVPテーブル |
| 完了条件 | 主要E2Eがlocal/previewで通る。 |
| テスト観点 | 10人上限、start_at/end_at、配信対象、回答前結果非公開。 |
| MVPでやらないこと | 実cloud本番負荷試験、Stripeテスト。 |

## Phase 12: 10人テスト運用

| 項目 | 内容 |
| --- | --- |
| 目的 | 小規模で通知型早押しの面白さと安全性を検証する。 |
| 実装対象 | 招待運用、参加確認、日次確認、アンケート、admin対応。 |
| 対象画面 | `/home`, `/create`, `/quiz/[launchId]`, `/result/[launchId]`, `/admin` |
| 対象API | 運用に必要な全API |
| 対象テーブル | 運用に必要な全テーブル |
| 完了条件 | 7日間運用し、継続判断材料が集まる。 |
| テスト観点 | 通知疲れ、順位納得感、評価/通報利用、ランク理解。 |
| MVPでやらないこと | 一般公開、大規模拡散、課金。 |

