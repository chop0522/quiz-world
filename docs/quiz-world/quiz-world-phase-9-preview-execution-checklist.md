# Phase 9 Preview Execution Checklist

## 目的

このドキュメントは、Phase 9でQuiz World専用Preview環境を実作成する直前のGO/NO-GO判断に使うチェックリストである。

現時点ではまだSupabase cloud project、Vercel project、Production環境、Stripe、Web Push、Realtimeは作らない。Smart Buzzerのproduction / Stripe / Vercel / Supabase / env / legal page / cleanup / live keyには触らない。

## 1. Phase 9で実作成するもの

Phase 9の実行判断後に作成する対象は以下に限定する。

| 対象 | 用途 | 注意 |
| --- | --- | --- |
| Quiz World専用 Supabase development project | Preview DB / Auth / RLS確認 | Smart Buzzerとは別projectにする |
| Quiz World専用 Vercel Preview project | Preview URLでの少人数確認 | Production domainは設定しない |
| Preview env | Supabase URL / keys / admin emailsなど | secretはVercel envにのみ置く |
| Preview seed data | 初期world、初期admin、invite code | 本番データではない |

## 2. Phase 9でまだ作らないもの

Phase 9では以下を作らない。

- Production project
- Production deploy
- Stripe
- Web Push
- Realtime
- 10人テスト本番データ
- APNs / FCM / Expo Push
- 課金
- ギルド
- Smart Buzzer側の変更

## 3. Supabase作成前チェック

| チェック | GO条件 | 状態 |
| --- | --- | --- |
| project名 | `quiz-world-preview` などSmart Buzzerと混同しない名前 | 未確認 |
| region | 10人テスト候補者に近いregionを選ぶ | 未確認 |
| plan | Preview用途に必要なplanを決める | 未確認 |
| project分離 | Smart Buzzerと別projectであることを確認する | 未確認 |
| reset / cleanup | Preview DBをreset / cleanupできる運用を決める | 未確認 |
| service role key | server専用。repoやclientに出さない運用を決める | 未確認 |
| RLS | migration適用後にRLS有効を確認する | 未確認 |
| project id記録 | 作業前後にproject id / URLを記録する | 未確認 |

作成前に必ず確認すること:

- Smart BuzzerのSupabase URL / project idではない
- Localの `.env.local` をそのまま流用しない
- service role keyの保存先がVercel Preview envだけに限定されている
- Preview DBを削除しても困らないデータだけを入れる

## 4. Vercel作成前チェック

| チェック | GO条件 | 状態 |
| --- | --- | --- |
| project名 | Quiz World専用名にする | 未確認 |
| GitHub repo接続先 | `chop0522/quiz-world` などQuiz World専用repoだけを接続する | 未確認 |
| Preview branch運用 | `main` 直結かPreview専用branchかを決める | 未確認 |
| Production domain | 未設定にする | 未確認 |
| Production env | 未設定にする | 未確認 |
| project分離 | Smart BuzzerのVercel projectとは別であることを確認する | 未確認 |
| Preview URL共有範囲 | 共有先を限定する | 未確認 |

作成前に必ず確認すること:

- Smart BuzzerのVercel projectにenvを追加しない
- Production環境を有効化しない
- Preview URLの共有先を決める
- Preview envの入力担当者を決める

## 5. envチェック

Preview envはVercel Project Settingsに設定する。repoには入れない。

| env | 必須 | 配置 | 注意 |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | 必須 | Vercel Preview env | Supabase development projectのURL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 必須 | Vercel Preview env | public値だがrepoには入れない |
| `SUPABASE_SERVICE_ROLE_KEY` | 必須 | Vercel Preview env | server専用。clientに出さない |
| `NEXT_PUBLIC_APP_URL` | 必須 | Vercel Preview env | Preview URL |
| `ADMIN_EMAILS` | 必須 | Vercel Preview env | 初期admin emailをカンマ区切りで指定 |
| `QUIZ_WORLD_ID` | 必須 | Vercel Preview env | 初期world id |
| `MAX_INITIAL_MEMBERS` | 必須 | Vercel Preview env | MVP初期は10 |

確認事項:

- `.env.local` はcommitしない
- Supabase localのkeyをPreviewに混ぜない
- Smart Buzzerのenvを使わない
- secret実値をREADME、docs、issue、PR本文に書かない
- `SUPABASE_SERVICE_ROLE_KEY` がclient bundleに出ないことをPreview smokeで確認する

## 6. migration / seed チェック

### migration適用手順

Preview project作成後に、以下の順序でmigrationを適用する。

1. 接続先Supabase project id / URLがQuiz World Previewであることを確認する
2. `supabase/migrations` の適用順を確認する
3. Preview DBへmigrationを適用する
4. RLSと主要indexを確認する
5. `worlds`、`profiles`、`world_members`、`questions`、`quiz_launches`、`answers`、`question_ratings`、`reports`、`rank_events`、`admin_audit_logs` の作成を確認する

### seed投入手順

初期seedは最小構成にする。

| データ | 値 |
| --- | --- |
| 初期world | `クイズワールド` |
| world id | `00000000-0000-4000-8000-000000000001` |
| member_limit | `10` |
| current_season | `0` |
| 初期admin | `ADMIN_EMAILS` 対象メールでsignup後に確認 |
| 初期invite code | `SEASON0-TEST-001` またはPreview専用code |

### Preview reset手順

Preview resetは実行前に確認を挟む。

- reset対象projectがQuiz World Previewであることを確認する
- Smart Buzzerのproject id / URLではないことを確認する
- test users、questions、launches、answers、ratings、reports、rank_events、admin_audit_logs、waitlist、invitesの扱いを決める
- reset後に初期world / invite / adminを再作成できることを確認する

## 7. Preview smoke checklist

Preview環境作成後に、最低限以下を確認する。

| 画面/API | チェック内容 | 期待結果 |
| --- | --- | --- |
| `/signup` | 18歳以上確認、terms/privacy同意、invite codeで登録 | 登録できる。不備は422相当 |
| `/login` | email/passwordログイン | ログインできる |
| `/home` | 届いたクイズ一覧 | 自分宛のlaunchだけ見える |
| `/create` | 四択question作成、active化 | 作成できる |
| `/quiz/[launchId]` | start_at前後の表示、回答 | start_at前は問題非表示、後は回答可能 |
| `/result/[launchId]` | answer_rank / correct_rank / rating / report | 結果と評価/通報が使える |
| `/profile` | score / rank / rank_events | 自分の状態が見える |
| `/admin` | adminアクセス、reports、moderation、invite、waitlist、audit logs | adminのみ使える |
| `/world` | 参加枠、シーズン、人数 | Preview初期値が見える |
| `/invite` | invite / waitlist導線 | 状態が分かる |
| `/legal/terms` | 18歳以上、UGC、通知、停止方針 | signup前提と矛盾しない |
| `/legal/privacy` | 収集情報、第三者サービス、削除依頼 | Preview前提と矛盾しない |

API / DB確認:

- non-adminがadmin APIを使えない
- suspended userが出題、回答、rating、reportをできない
- suspended questionが新規launchできない
- admin操作ごとに `admin_audit_logs` が残る
- `rank_events` がanswer/rating後に作られる
- `correctChoiceId` は `/quiz/[launchId]` の回答受付中APIでは返らない
- `category_note` とemailが不要なresponseに出ない

## 8. rollback / cleanup

Preview環境は本番ではないため、rollback / cleanupを事前に決める。

| 操作 | 方針 | 実行前確認 |
| --- | --- | --- |
| Vercel Preview env削除 | Preview projectのenvだけ削除 | Smart Buzzer projectではないこと |
| Supabase Preview DB reset | Preview DBだけreset | project id / URLがQuiz World Previewであること |
| Supabase project削除判断 | Previewが不要になった場合のみ検討 | 削除前に必要ログを控える |
| test users削除 | Preview用ユーザーだけ対象 | 本番ユーザーではないこと |
| invite code削除 | Preview用codeを削除または無効化 | 10人テスト用codeと混ぜない |
| audit log保持判断 | 監査目的で保持するかresetするか決める | 個人情報と運用記録の扱いを確認 |

cleanup対象候補:

- test users
- waitlist
- invites
- questions
- quiz_launches / quiz_recipients
- answers
- question_ratings / reports
- rank_events
- admin_audit_logs

## 9. GO条件

以下をすべて満たす場合のみ、Phase 9 Preview環境の実作成へ進める。

- local `main` がcleanである
- latest tagが確認済みである
- Phase 8 local smoke / manual rehearsalが通過済みである
- P0がない
- P1が対応済みである
- P2の残項目が既知制約として整理されている
- secretをrepoに入れない運用が確認済みである
- Smart Buzzerと混ざらないことを確認済みである
- Supabase development project名、region、planが決まっている
- Vercel Preview project名、repo接続先、Preview branch運用が決まっている
- `ADMIN_EMAILS` と初期invite codeが決まっている
- Preview reset / cleanupの担当と手順が決まっている

## 10. NO-GO条件

以下のいずれかに該当する場合は、Preview環境をまだ作らない。

- project名やenvがSmart Buzzerと混同しそう
- Smart BuzzerのSupabase / Vercel projectを開いたまま作業している
- service role keyの保存場所が未定
- secretをrepo、docs、README、PR本文に書く可能性がある
- migration手順が曖昧
- reset / cleanup方針が曖昧
- Previewを誰に共有するか未定
- legal草案が空、または18歳以上限定・UGC・通知・停止方針と大きく矛盾している
- Production domainやProduction envを同時に作ろうとしている
- Stripe、Web Push、Realtimeを同時に入れようとしている

## 実作成前の最終判断メモ

Phase 9実作成へ進む直前に、以下を埋める。

| 項目 | 値 |
| --- | --- |
| Supabase project名 | 未定 |
| Supabase region | 未定 |
| Supabase plan | 未定 |
| Vercel project名 | 未定 |
| Preview branch | 未定 |
| 初期admin email | 未定 |
| Preview invite code | 未定 |
| Preview共有先 | 未定 |
| cleanup担当 | 未定 |
| GO / NO-GO判断 | 未定 |
