# Phase 9 Preview Environment Plan

## 1. Phase 9の目的

Phase 9では、Supabase localで確認済みのQuiz World MVPを、Quiz World専用のPreview環境へ移す準備を行う。

目的は、10人テスト前にcloud上で少人数確認できる状態を設計することである。まだProduction環境ではなく、Preview / development扱いにする。

Phase 9で確認したいこと:

- localで通ったMVP主要ループがPreview環境でも動くこと
- Supabase development projectとVercel Preview projectがSmart Buzzerと完全分離されていること
- envがrepoに漏れず、Vercel env / Supabase Dashboard側で管理されること
- migration、初期world、初期admin、invite codeを安全に作れること
- Preview環境のデータを削除・resetする運用手順があること
- 10人テストへ進む前にProductionを作るべきか判断できること

## 2. まだ作らないもの

Phase 9計画段階では、以下はまだ作らない。

- Supabase cloud projectの実作成
- Vercel projectの実作成
- Production project
- Production deploy
- Stripe連携
- Web Push
- Realtime
- APNs / FCM / Expo Push
- 10人テスト本番データ
- 本番課金
- ギルド
- Smart Buzzer側のSupabase / Vercel / Stripe / env変更

Phase 9でcloud環境を実作成する場合も、実行前に別途明示確認を行う。

## 3. Supabase development project 作成方針

Preview環境用に、Quiz World専用のSupabase development projectを1つ作る想定にする。

方針:

- Project名は `quiz-world-preview` など、Smart Buzzerと混同しない名前にする
- Smart BuzzerのSupabase project、database、storage、auth、envとは絶対に混ぜない
- Regionは10人テストの主参加者に近い場所を選ぶ
- Production用途には使わない
- Preview DBはいつでもresetできる前提にする
- Supabase service role keyはVercel server envだけに入れる
- clientにsecretを出さない
- Supabase DashboardでRLSが有効になっていることを確認する

作成前に決めること:

- Project名
- Region
- Free / Pro planの扱い
- Preview DBの保持期間
- reset権限を持つ管理者

## 4. Vercel Preview project 作成方針

Preview環境用に、Quiz World専用のVercel projectを作る想定にする。

方針:

- Project名は `quiz-world-preview` または `quiz-world` とする
- Smart BuzzerのVercel projectとは絶対に混ぜない
- Production Domainはまだ設定しない
- Preview URLで少人数確認する
- GitHub repoはQuiz World専用repoだけを接続する
- envはVercel Project SettingsでPreview環境にだけ入れる
- Production envはまだ入れない

作成前に決めること:

- Vercel project名
- GitHub repo接続先
- Preview branch運用を `main` 直結にするか、Preview専用branchにするか
- Preview URLを誰に共有するか

## 5. env設計

Preview環境では、secretをrepoに入れない。`.env.local`、Supabase localのkey、service role keyの実値はcommitしない。

Preview env案:

| env | 用途 | 配置 | 注意 |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase development project URL | Vercel Preview env | public値だがrepoには入れない |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon / publishable key | Vercel Preview env | public値だがrepoには入れない |
| `SUPABASE_SERVICE_ROLE_KEY` | server-side admin操作、signup補助、admin API | Vercel Preview env | server専用。clientに出さない |
| `NEXT_PUBLIC_APP_URL` | Preview URL | Vercel Preview env | callbackや表示用 |
| `ADMIN_EMAILS` | 初期admin許可メール | Vercel Preview env | カンマ区切り |
| `QUIZ_WORLD_ID` | 初期world id | Vercel Preview env | local seedと同じUUIDでもよい |
| `MAX_INITIAL_MEMBERS` | 初期参加枠 | Vercel Preview env | MVPは10 |

現時点では `NOTIFICATION_PHASE` はenv化しない。MVP初期は15秒ポーリングで固定し、Realtime / Web Push導入時にenv化を再検討する。

## 6. local / preview / production の分離

| 環境 | 用途 | DB | Vercel | データ扱い |
| --- | --- | --- | --- | --- |
| Local | 開発と検証 | Supabase local | `npm run dev` | `npx supabase db reset` でreset可 |
| Preview | 10人テスト前のcloud確認 | Quiz World専用Supabase development project | Quiz World専用Vercel Preview | 手順化して削除 / reset可 |
| Production | 10人テスト直前以降 | 未作成 | 未作成 | Phase 9では扱わない |

禁止:

- Localの `.env.local` をPreviewへそのまま流用しない
- Smart BuzzerのSupabase URL / keysを使わない
- Smart BuzzerのVercel envを使わない
- Production環境をPreview検証のために作らない

## 7. Supabase migration適用手順

Preview projectを作成した後の想定手順:

1. Supabase projectがQuiz World専用であることを確認する
2. Supabase project URLとkeysを取得する
3. Vercel Preview envに必要なenvを設定する
4. ローカルからPreview projectへ接続する前に、接続先project idを明示確認する
5. `supabase/migrations` の順序を確認する
6. Preview DBにmigrationを適用する
7. RLS有効状態を確認する
8. `worlds`、`invites`、`profiles`、`admin_audit_logs` など初期状態を確認する

適用対象migration:

- `20260516000100_phase1_signup_auth.sql`
- `20260521000100_phase2_questions.sql`
- `20260521000200_phase3_quiz_launches.sql`
- `20260522000100_phase4_answers.sql`
- `20260522000200_phase5_result_rating_reports.sql`
- `20260522000300_phase6_rank_events.sql`
- `20260522000400_phase7_admin_moderation.sql`

注意:

- DB migration SQLを新規作成するPhaseではない
- 既存migrationをPreview DBへ適用する計画に留める
- 誤project適用を避けるため、project id / URLを作業前後に記録する

## 8. seed / initial data 方針

Preview環境ではlocal seedと同じ最小データから始める。

初期データ:

- world: `クイズワールド`
- world id: `00000000-0000-4000-8000-000000000001`
- member_limit: `10`
- current_season: `0`
- initial invite code: `SEASON0-TEST-001` またはPreview専用code

方針:

- Previewでは本番ユーザーを入れない
- 10人テスト前の内部確認ユーザーだけを入れる
- seedは再実行可能な形にする
- 初期invite codeはPreview専用に変える余地を残す
- Previewで作成したテストユーザー、questions、answers、reports、rank_events、admin_audit_logsは本番データではない

## 9. admin user作成方針

Preview環境の初期adminは、`ADMIN_EMAILS` に含まれるメールアドレスでsignupして作る。

方針:

- `ADMIN_EMAILS` はVercel Preview envにだけ設定する
- 初期admin emailは1〜2名に限定する
- signup後、`profiles.role = admin` になっていることを確認する
- adminは `/admin` を開けることを確認する
- non-adminは `/admin` に入れないことを確認する
- suspended adminはadmin APIを使えないことを確認する

作成前に決めること:

- 初期admin email
- admin作成担当者
- admin停止時の復旧方針

## 10. invite code作成方針

Previewでは、まず管理者発行のinvite codeで少人数を登録する。

方針:

- 初期codeは `SEASON0-TEST-001` を使うか、Preview専用に `SEASON0-PREVIEW-001` を作る
- 10人テスト本番前にはPreview用codeを無効化または削除対象にする
- admin画面から追加invite codeを発行できることを確認する
- invite code発行にはreasonを必須にする
- invite作成は `admin_audit_logs` に残す

作成前に決めること:

- Preview用invite code名
- max uses
- 招待対象者
- Preview確認後にcodeを残すか無効化するか

## 11. Preview smoke checklist

Preview環境ができた後に確認すること:

| 項目 | 期待結果 |
| --- | --- |
| `/` | 200。MVP状態の文言が表示される |
| `/signup` | 18歳以上確認、terms/privacy同意、invite codeで登録できる |
| `/login` | email/passwordでログインできる |
| `/home` | 届いたクイズ一覧が表示される |
| `/create` | active questionを作成できる |
| launch作成 | 出題者本人を除外しrecipientを作る |
| `/quiz/[launchId]` | start_at前は問題非表示、start_at後は回答可能 |
| `/result/[launchId]` | answer_rank / correct_rank / rating / reportを確認できる |
| rating送信後 | 評価済み表示、rating UI disabled |
| report送信後 | 通報済み表示、report UI disabled |
| `/profile` | score / rank / rank_eventsが表示される |
| `/admin` | adminだけアクセスできる |
| admin moderation | question/user停止、waitlist、invite、audit logが動く |
| non-admin制御 | admin API拒否 |
| secret露出 | client bundle / repoにservice role keyが出ない |

最低限のコマンド確認:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Preview URL確認はブラウザで行う。

## 12. rollback / cleanup方針

Preview環境は本番ではないため、いつでも削除・resetできるようにする。

方針:

- Preview DBの重要データは本番扱いしない
- 10人テスト前の個人情報やテスト投稿は必要最小限にする
- cleanup前に対象projectがQuiz World Previewであることを確認する
- cleanupは手順化し、実行前に確認する
- Smart Buzzerのcloud dataは絶対にcleanup対象にしない

cleanup候補:

- テストユーザー
- テストquestions
- quiz_launches / quiz_recipients / answers
- question_ratings / reports
- rank_events
- admin_audit_logs
- waitlist
- preview invite code

rollback例:

1. Vercel Preview deploymentを前のdeploymentに戻す
2. Preview DBをresetする
3. 必要ならPreview Supabase projectを削除する
4. Vercel Preview envを削除する

Phase 9ではrollback / cleanup手順を決めるだけで、実際のcloud cleanupは行わない。

## 13. 10人テストへ進む条件

10人テストへ進むには、少なくとも以下を満たす。

- Phase 8 local smoke / manual UI follow-upがpassしている
- Preview環境でsignupからadmin moderationまでの主要ループが通る
- Smart Buzzerとcloud/envが完全分離されている
- Preview DBをreset / cleanupできる手順がある
- service role keyがclientやrepoに出ていない
- legal草案の10人テスト前確認方針が決まっている
- invite code配布対象が決まっている
- admin担当者と緊急停止手順が決まっている
- Production環境を作るタイミングが改めて判断されている

## Phase 9実作成前に決めること

- Supabase development project名とRegion
- Vercel Preview project名
- Previewに使うbranch
- `ADMIN_EMAILS` の対象メール
- Preview用invite code
- Preview確認に参加する人数
- Preview DB cleanupの担当者
- 10人テスト前にProductionを作るか、Previewで限定確認を継続するか
