# Quiz World Phase 10 Owner/Admin Final Check Results

実行日時: 2026-05-29 21:58 JST

## 1. 目的

10人テスト候補へPreview URLを共有する前に、owner/adminだけでPreview環境と案内docsを最終確認した。

この確認では、1〜2名への限定共有はまだ行っていない。Production deploy、Production env設定、Production custom domain設定、Stripe、Web Push、Realtimeは行っていない。Smart Buzzerにも触れていない。

## 2. 対象

- Supabase Preview project: `quiz-world-preview`
- Supabase project ref: `ogfuohrvzfjmgvdewvcl`
- Preview deployment URL: `https://quiz-world-preview-ri8igtw45-chop0522s-projects.vercel.app`
- Preview deployment id: `dpl_6YhA6LJudsrnBEbJ4UPdgGPwmUkx`
- branch / commit: `preview` / `7d63505`
- Preview invite code: `SEASON0-PREVIEW-001`

secret実値、service role key、anon key、DB password、初期admin email実値、Vercel token、bypass secretはdocs/repoに記録していない。

## 3. 実行コマンド

代表的に実行した確認:

```bash
git status --short --branch
npx supabase projects list
npx supabase db query --linked --output json "<read-only count query>"
npx vercel curl /api/world --deployment "<Preview deployment URL>" -- --silent --show-error --fail-with-body
npx vercel env pull "<temporary file>" --environment=preview --yes
npx vercel curl /admin --deployment "<Preview deployment URL>" -- "<temporary authenticated cookie check>"
npx vercel ls quiz-world-preview
```

Vercel envは一時ファイルにpullして確認後に削除した。env値そのものは出力・記録していない。

## 4. Preview DB seed状態確認

owner/admin signup前のread-only確認では、Preview DBはseed状態だった。

| 項目 | 結果 |
| --- | --- |
| `auth.users` | `0` |
| `profiles` | `0` |
| `world_members` | `0` |
| `waitlist` | `0` |
| `invites` | `1` |
| `questions` | `0` |
| `quiz_launches` | `0` |
| `quiz_recipients` | `0` |
| `answers` | `0` |
| `question_ratings` | `0` |
| `reports` | `0` |
| `rank_events` | `0` |
| `admin_audit_logs` | `0` |

初期worldも期待どおりだった。

| 項目 | 結果 |
| --- | --- |
| world name | `クイズワールド` |
| world id | `00000000-0000-4000-8000-000000000001` |
| member_limit | `10` |
| Preview invite code | `SEASON0-PREVIEW-001` |
| invite status | `active` |
| invite use_count | `0` |
| invite max_uses | `100` |

## 5. Preview URL確認

`/api/world` はVercel CLIのDeployment Protection bypass経由で正常レスポンスを返した。

確認結果:

- `ok: true`
- world id: `00000000-0000-4000-8000-000000000001`
- world name: `クイズワールド`
- memberLimit: `10`
- activeMemberCount: `0`
- remainingSeats: `10`

通常ブラウザアクセスはVercel Deployment Protection配下であるため、Preview URL共有範囲は引き続きowner/adminのみに限定する。

## 6. Signup / admin role確認

ADMIN_EMAILS対象ユーザーでPreview invite code `SEASON0-PREVIEW-001` を使ってsignupした。

確認結果:

| 項目 | 結果 |
| --- | --- |
| signup | pass |
| returned `ok` | `true` |
| returned `signedIn` | `true` |
| profile status | `active` |
| profile role | `admin` |
| world member status | `active` |

signup後のDB確認:

| 項目 | 結果 |
| --- | --- |
| `auth.users` | `1` |
| `profiles` | `1` |
| `world_members` | `1` |
| admin profile | `1` active admin |
| Preview invite code | still `active` |
| invite use_count | `1` |

この確認により、Preview DBは「seed状態そのもの」から「owner/admin確認用admin userが1件存在する状態」になっている。1〜2名へ共有する前に、このadmin userを残して開始するか、再cleanupしてから開始するかを人間が決める。

## 7. /admin確認

一時的なAuth sessionを使って `/admin` をHTTP確認した。

| 項目 | 結果 |
| --- | --- |
| `/admin` HTTP status | `200` |
| admin UI検出 | pass |
| response bytes | `30692` |

`/admin` はactive adminとして到達できる。

## 8. Participant Guide確認

`docs/quiz-world/quiz-world-phase-10-participant-guide.md` を確認した。

| 確認項目 | 結果 |
| --- | --- |
| Previewテストであり一般公開ではない | pass |
| Production環境ではない | pass |
| 18歳以上限定 | pass |
| Preview URLをSNSや公開ページに出さない | pass |
| データは削除される可能性がある | pass |
| 招待コードが必要 | pass |
| signup / login手順 | pass |
| クイズ作成手順 | pass |
| 届いたクイズへの回答手順 | pass |
| result / rating / reportの使い方 | pass |
| 不適切投稿禁止 | pass |
| 不具合報告テンプレート | pass |
| Web Pushなし / Realtimeなし / `/home` polling中心 | pass |
| profile rank説明と `/world` 補助指標が最小表示である既知制約 | pass |

不足は見つからなかった。

## 9. Admin Ops Checklist確認

`docs/quiz-world/quiz-world-phase-10-admin-ops-checklist.md` を確認した。

| 確認項目 | 結果 |
| --- | --- |
| Preview DB seed状態確認 | pass |
| Preview invite code `SEASON0-PREVIEW-001` active確認 | pass |
| admin signup / login確認 | pass |
| `/admin`確認 | pass |
| invite発行手順 | pass |
| waitlist確認手順 | pass |
| report確認手順 | pass |
| question moderation手順 | pass |
| user suspension手順 | pass |
| `admin_audit_logs`確認手順 | pass |
| 1〜2名へ広げる前のGO条件 | pass |
| 最大10名へ広げる前のGO条件 | pass |
| テスト終了後cleanup手順へのリンク | pass |
| NO-GO条件 | pass |

大きな矛盾は見つからなかった。

## 10. GO / NO-GO判断

判定: 条件付きGO候補。ただし即時共有はまだNO-GO。

技術確認は通っている:

- Preview DBはowner/admin signup前にseed状態だった
- Preview invite code `SEASON0-PREVIEW-001` はactive
- Preview URLの `/api/world` に到達できる
- ADMIN_EMAILS対象ユーザーがsignupできる
- ADMIN_EMAILS対象ユーザーがadminになる
- `/admin` にactive adminとして到達できる
- participant guideに不足は見つからない
- admin ops checklistに大きな矛盾は見つからない

1〜2名へ限定共有する前の人間決定事項は、2026-05-29時点で以下に固定した。

- 最初は信頼できる1名から開始する
- その1名で問題がなければ2名目へ拡張する
- 最大10名への共有はまだ行わない
- 不具合報告先は、まずownerへの個別DMにする
- 不具合報告はparticipant guideのテンプレートを使う
- 専用Slack / Discord / LINEグループは、2名以上に広げる段階で再検討する
- 1〜2名共有では、admin画面で参加者別invite codeを発行する
- 共通Preview invite code `SEASON0-PREVIEW-001` はowner/admin確認用または予備として扱う
- 参加者別invite codeの実値はdocsに書かない
- 共有時は個別DMでPreview URLとinvite codeを渡す
- owner/admin確認用admin userは残したまま開始する
- 1〜2名共有前の再cleanupは行わない
- 共有前にread-onlyでPreview DB件数だけ軽く確認する
- Preview URL共有方法は個別DMのみとし、SNSや公開ページには出さない

上記により、この確認時点では1名限定共有はGO候補になった。ただし、この確認時点ではPreview URL共有前だった。10人テスト候補全員への共有、SNS公開、Production deployはまだNO-GO。

## 11. 確認後の状態

- Preview URL共有範囲はowner/adminのみ
- 10人テスト候補へはまだ共有していない
- 信頼できる1名への限定共有はGO候補だが、まだ共有していない
- Preview DBにはowner/admin確認用admin userが1件存在する
- Preview invite code `SEASON0-PREVIEW-001` はactive
- Production deployは行っていない
- Production envは設定していない
- Production custom domainは設定していない
- Stripe / Web Push / Realtimeは扱っていない
- Smart Buzzerには触っていない
- secret実値はdocs/repoに書いていない

## 12. 次アクション

1. 共有前にPreview DB件数をread-onlyで軽く確認する。
2. admin画面で最初の1名用の参加者別invite codeを発行する。
3. participant guideをベースに個別DM文面を作る。
4. Preview URLと参加者別invite codeを個別DMで1名に共有する。
5. 1名のsignup / login / 主要ループ / 不具合報告を確認後、2名目へ拡張するか判断する。

## 13. 1名限定共有前 read-only 確認結果

実行日時: 2026-05-29 23:36 JST

信頼できる1名へ限定共有する前に、Preview DBとVercel状態をread-onlyで確認した。Preview URLやinvite codeの共有、新しいinvite code発行、DB変更は行っていない。

対象確認:

- Supabase Preview project: `quiz-world-preview`
- Supabase project ref: `ogfuohrvzfjmgvdewvcl`
- Vercel project: `quiz-world-preview`

Supabase CLIのlinked projectは `quiz-world-preview` / `ogfuohrvzfjmgvdewvcl` だった。project一覧にはSmart Buzzer projectも存在するが、linked対象はQuiz World Previewであることを確認した。Smart BuzzerのSupabase projectには触っていない。

### DB件数

| 対象 | 件数 |
| --- | ---: |
| `auth.users` | 1 |
| `profiles` | 1 |
| `world_members` | 1 |
| `waitlist` | 0 |
| `invites` | 1 |
| `questions` | 0 |
| `blocks` | 0 |
| `quiz_launches` | 0 |
| `quiz_recipients` | 0 |
| `answers` | 0 |
| `question_ratings` | 0 |
| `reports` | 0 |
| `rank_events` | 0 |
| `admin_audit_logs` | 0 |

`profiles` は `active admin` が1件、`world_members` は `active` が1件だった。これはowner/admin確認用admin userを残す方針と一致する。

### 初期world / invite確認

| 項目 | 結果 |
| --- | --- |
| world name | `クイズワールド` |
| world id | `00000000-0000-4000-8000-000000000001` |
| member_limit | `10` |
| world status | `active` |
| Preview invite code | `SEASON0-PREVIEW-001` |
| Preview invite status | `active` |
| Preview invite use_count | `1` |
| Preview invite max_uses | `100` |
| local用 invite code `SEASON0-TEST-001` | Preview DBに存在しない |

### 想定外データ確認

以下はすべて0件であり、1名共有前の想定外データは見つからなかった。

- `questions`
- `quiz_launches`
- `quiz_recipients`
- `answers`
- `question_ratings`
- `reports`
- `rank_events`
- `admin_audit_logs`

### Vercel確認

- 直近のmain push由来deploymentは `Canceled / Preview`
- Production deploymentの追加作成なし
- Vercel envはPreview environmentのみ設定済み
- Production envは未設定
- Production custom domainは未設定
- project aliasはVercelのPreview / default `vercel.app` 系のみで、独自Production custom domainは確認されない

### 判断

判定: 1名限定共有前read-only確認はpass。

1名限定共有へ進む前提は満たしている。ただし、この確認時点ではPreview URL共有前だった。新しい参加者別invite codeもまだ発行していない。

次に進む場合の順序:

1. 最初の1名用の参加者別invite codeを発行する。
2. participant guideをベースに個別DM文面を作る。
3. Preview URLと参加者別invite codeを個別DMで1名に共有する。

引き続き、10人テスト候補全員への共有、SNS公開、Production deploy、Production env設定、Production custom domain設定、Stripe、Web Push、Realtimeは行わない。Smart Buzzerにも触らない。

## 14. 1名限定共有用 invite code 発行結果

実行日時: 2026-05-29 23:42 JST

信頼できる1名へ限定共有するための参加者別invite codeを1件発行した。Preview URLやinvite codeはまだ相手に共有していない。invite code実値はdocs、README、commit message、PR本文に書かない。

対象確認:

- Supabase Preview project: `quiz-world-preview`
- Supabase project ref: `ogfuohrvzfjmgvdewvcl`
- Smart BuzzerのSupabase projectには触っていない

発行方法:

- admin APIで使っている `admin_create_invite` RPCをPreview DBに対して実行した
- codeはserver生成にした
- `max_uses = 1`
- `expires_at = null`
- reason: `Phase 10 first limited participant`

確認結果:

| 項目 | 結果 |
| --- | --- |
| invite作成 | pass |
| 参加者別invite active確認 | pass |
| 参加者別invite use_count | `0` |
| 参加者別invite max_uses | `1` |
| `admin_audit_logs` の `invite_created` | pass |
| audit reason | `Phase 10 first limited participant` |
| Preview invite code `SEASON0-PREVIEW-001` | activeのまま維持 |
| Preview URL共有 | 未実行 |
| 参加者別invite code共有 | 未実行 |

発行後の件数:

| 対象 | 件数 |
| --- | ---: |
| `invites` | 2 |
| active invites | 2 |
| 参加者別 active invites | 1 |
| `admin_audit_logs` の matching `invite_created` | 1 |

参加者別invite codeの実値は記録していない。共有する段階ではownerがadmin画面で実値を確認し、個別DMでPreview URLと一緒に1名へ渡す。

### 判断

判定: 1名限定共有用invite発行はpass。

1名への個別DM共有へ進む前提は満たしている。ただし、Preview URL共有とinvite code共有はまだ実行していない。10人テスト候補全員への共有、SNS公開、Production deploy、Production env設定、Production custom domain設定、Stripe、Web Push、Realtimeは引き続き行わない。

## 15. 1名限定共有前 UI整理

実施日: 2026-05-31 JST

信頼できる1名へPreview URLと参加者別invite codeを共有する前に、Web Previewのheader / account / password変更まわりを最小整理した。

整理内容:

- 未ログイン時だけheaderにlogin / signup導線を表示する
- ログイン済み時はheaderにloginを表示しない
- ログイン済み時はheaderに `/account` 導線を表示する
- logoutはheaderには置かず、`/account` に置く
- `/account` はログイン済みユーザー向けのアカウント設定として使う
- `/account/password` でログイン済みユーザーがパスワードを変更できるようにする
- admin導線は `profiles.role = admin` かつ `profiles.status = active` のユーザーだけに表示する
- `/admin` pageと `/api/admin/*` のserver-side protectionは `getAdminContext()` により維持する
- header / global nav / app shellから参加者向けではない内部文言を外す

検証結果:

- `npm run typecheck`: pass
- `npm run lint`: pass
- `npm run test`: pass
- `npm run build`: pass
- 未ログイン時のheaderはlogin / signup導線を表示する
- 未ログイン時の `/account` と `/account/password` はログインが必要である旨を表示する
- 未ログイン時の `/admin` はserver-side protectionによりアクセス不可表示になる
- `src/app` / `src/components` / `src/lib` から「MVPは18歳以上限定」などの内部向けheader文言が消えている

この整理時点ではPreview URL共有前だった。10人テスト候補全員への共有、SNS公開、Production deploy、Production env設定、Production custom domain設定、Stripe、Web Push、Realtimeは引き続き行わない。

## 21. `/create` / `/world` UI整理 Preview反映

実施日: 2026-06-03 JST

Phase 10の1名限定共有前 `/create` / `/world` UI整理commitをPreview deploymentへ反映した。

反映元:

- source: Git連携
- branch: `preview`
- commit: `8937775`
- commit message: `fix: simplify phase 10 create and world participant UI`

Preview deployment:

| 項目 | 内容 |
| --- | --- |
| URL | `https://quiz-world-preview-jc6wpmnrk-chop0522s-projects.vercel.app` |
| deployment id | `dpl_3W5oFuvoYbKBLwtk7kAj2w5NNbAg` |
| branch / commit | `preview` / `8937775` |
| environment | Preview |
| status | Ready |
| created | 2026-06-03 20:58:46 JST |

確認結果:

- `origin/main` の最新commit `8937775` を `preview` branchへ反映した
- Vercel build logで `github.com/chop0522/quiz-world`、branch `preview`、commit `8937775` のcloneを確認した
- deployment sourceはGit連携由来である
- deployment branchは `preview`
- deployment environmentはPreview
- deployment statusはReady
- Vercel build logで `/create` と `/world` を含むNext.js routes出力を確認した
- Production deploymentは追加作成されていない
- Production env、Production custom domainは未設定のまま
- build logとdocsにsecret実値、初期admin email実値、Supabase keys、Vercel token、bypass secret、参加者別invite code実値は記録していない

この反映時点ではPreview URL共有前だった。10人テスト候補全員への共有、SNS公開、Production deploy、Production env設定、Production custom domain設定、Stripe、Web Push、Realtimeは引き続き行わない。

## 22. `/create` / `/world` UI整理 Preview反映後確認

実施日: 2026-06-03 JST

Phase 10の1名限定共有前 `/create` / `/world` UI整理がPreview deployment上で参加者向け表示として反映されているか、Vercel CLIのDeployment Protection bypass経由で確認した。この確認ではPreview DBを変更する操作は行っていない。

対象deployment:

| 項目 | 内容 |
| --- | --- |
| URL | `https://quiz-world-preview-jc6wpmnrk-chop0522s-projects.vercel.app` |
| deployment id | `dpl_3W5oFuvoYbKBLwtk7kAj2w5NNbAg` |
| branch / commit | `preview` / `8937775` |
| environment | Preview |
| status | Ready |

`/create` 確認:

| 確認項目 | 結果 |
| --- | --- |
| 参加者向け可視テキストに `active` が出ない | pass |
| `rank events` が表示されない | pass |
| `admin moderation` が表示されない | pass |
| `local` が表示されない | pass |
| `後続画面` が表示されない | pass |
| 状態ラベルが自然な表現である | pass。`下書き` / `出題可能` を確認 |
| クイズ作成フォームが表示される | pass。問題文、4択、正解、難易度、状態、カテゴリ、保存ボタンを確認 |

補足: `active` は内部のselect option valueとしてHTML上には残るが、参加者向け可視テキストでは `出題可能` と表示される。内部値は実装上維持する。

`/world` 確認:

| 確認項目 | 結果 |
| --- | --- |
| `平均評価` が表示されない | pass |
| `良問 62%` が表示されない | pass |
| `解放条件` が表示されない | pass |
| `累計出題数` が表示されない | pass |
| `累計回答数` が表示されない | pass |
| `通報率` が表示されない | pass |
| `上位出題者/回答者数` が表示されない | pass |
| `次の解放枠` が表示されない | pass |
| 参加状況に絞った表示である | pass。`現在の参加人数`、`参加枠`、`残り枠`、`Season` を確認 |

`/api/world` 確認:

| field | value |
| --- | --- |
| `ok` | `true` |
| `activeMemberCount` | `2` |
| `memberLimit` | `10` |
| `remainingSeats` | `8` |
| `currentSeason` | `0` |

`/world` の数値表示はclient componentが `/api/world` をfetchし、`activeMemberCount`、`memberLimit`、`remainingSeats`、`currentSeason` を表示する実装であることを確認した。SSR HTMLでは読み込み中表示になるが、データソースはPreviewの `/api/world` 実データである。

Vercel / secret確認:

- latest deploymentはPreview environment / Ready
- Production deploymentは追加作成されていない
- Vercel envはPreview environmentのみ設定済みで、Production envは未設定のまま
- Production custom domainは未設定のまま
- docs、README、git diffにsecret実値、初期admin email実値、Supabase keys、Vercel token、bypass secret、参加者別invite code実値は記録していない

### 判断

判定: `/create` / `/world` UI整理のPreview反映後確認はpass。

2026-06-03 JSTに同じPreview deploymentで再確認し、`/create` / `/world` の可視テキスト、`/api/world` の実データ、Production deployment追加なし、Preview envのみ設定済み、secret実値未記録の結果がこの記録と一致することを確認した。

この確認時点ではPreview URL共有前だった。10人テスト候補全員への共有、SNS公開、Production deploy、Production env設定、Production custom domain設定、Stripe、Web Push、Realtimeは引き続き行わない。

## 20. 1名限定共有前 `/create` / `/world` 参加者向けUI整理

実施日: 2026-06-03 JST

信頼できる1名へPreview URLと参加者別invite codeを共有する前に、`/create` と `/world` の参加者向け表示から内部仕様・未確定指標を削除した。この整理時点ではPreview URL共有前だった。

`/create` 整理内容:

- 上部説明文を「四択クイズを作成できます。作成したクイズは一覧から出題できます。」へ簡素化した
- フォーム内説明から `active`、`rank events`、`admin moderation`、`local`、後続画面説明を削除した
- statusの内部値 `draft` / `active` は維持し、参加者向けラベルは「下書き」「出題可能」にした
- 作成済み問題一覧のstatus badgeも内部値ではなく参加者向けラベルで表示する
- カテゴリ補足のヒントからAPI向け説明を削除した

`/world` 整理内容:

- `worldSnapshot` 由来のmock表示を `/world` から外した
- 平均評価、良問率、解放条件、累計出題数、累計回答数、平均クイズ評価、通報率、上位出題者/回答者数、次の解放枠を削除した
- `/world` は現在の参加人数、参加枠、残り枠、Seasonの確認に絞った
- 現在の参加人数はactiveな `world_members` 数を使う
- 参加枠は `worlds.member_limit` を使う
- 残り枠は `member_limit - active member count` を使う
- Seasonはworldの既存データに基づく

平均評価 `良問 62%` の原因:

- `src/lib/quiz-world.ts` の古いmock `worldSnapshot.averageRating` に固定値として残っていた
- 以前の `/world` はこのmock値を表示していたため、実際の `question_ratings` 集計と一致しない表示になっていた
- 今回、`/world` からこのmock参照を外した

後続課題:

- 平均評価を戻す場合は、`question_ratings` の実データから `good` / `normal` / `weak` の数値化ルールを決めて集計する
- 良問率を表示する場合は `good_count / rating_count` のように定義する
- rating件数が少ない場合は「評価データ不足」と表示する
- 参加枠解放条件を表示する場合は、参加枠増加ルールを正式に決めてから表示する

local表示確認:

- `/create` の表示テキストに `active`、`rank events`、`admin moderation`、`local`、`後続画面`、`確認済み` が出ないことを確認した
- `/create` に参加者向けstatusラベル「出題可能」が表示されることを確認した
- `/world` の表示テキストに `平均評価`、`良問 62%`、`解放条件`、`累計出題数`、`累計回答数`、`平均クイズ評価`、`通報率`、`上位出題者/回答者数`、`Season 0参加枠`、`次の解放` が出ないことを確認した
- `/world` に「現在の参加人数」「参加枠」「残り枠」「Season」が表示されることを確認した
- `/api/world` は `getActiveWorld()` を通じてactiveな `world_members` 数、`worlds.member_limit`、`current_season`、残り枠を返す実装であることを確認した
- local dev環境の `/api/world` は、この確認時点ではlocal Supabase接続状態により `world取得に失敗しました。` を返したため、DB接続込みの値確認はPreview反映後またはSupabase local起動時に再確認する

検証:

- `npm run typecheck`: pass
- `npm run lint`: pass
- `npm run test`: pass、7 files / 43 tests
- `npm run build`: pass

この整理時点ではPreview URL共有前だった。10人テスト候補全員への共有、SNS公開、Production deploy、Production env設定、Production custom domain設定、Stripe、Web Push、Realtimeは引き続き行わない。

## 19. `/home` UI整理 Preview反映後確認

実施日: 2026-05-31 JST

Phase 10の1名限定共有前 `/home` UI整理がPreview deploymentに反映されているか、Vercel CLIのDeployment Protection bypass経由で `/home` のHTMLを取得して確認した。

対象deployment:

| 項目 | 内容 |
| --- | --- |
| URL | `https://quiz-world-preview-gaojfq7gi-chop0522s-projects.vercel.app` |
| deployment id | `dpl_2zU6mSzTLsS6SHc9P3yw6uxt3B1Z` |
| branch / commit | `preview` / `cdab98c` |
| environment | Preview |
| status | Ready |

表示されないことを確認した文言:

| 文言 | 結果 |
| --- | --- |
| `15秒ポーリング` | pass |
| `polling` | pass |
| `quiz_recipients` | pass |
| `recipient` | pass |
| `start_at` | pass |
| `end_at` | pass |
| `本人宛recipientのみ` | pass |
| `start_at到達後` | pass |
| `最終更新` | pass |
| `秒前` / `秒後` | pass |
| `画面内通知` | pass |
| `MVP` | pass |

表示されることを確認した参加者向け文言:

| 文言 | 結果 |
| --- | --- |
| `届いたクイズ` | pass |
| `回答受付中` | pass |
| `開始待ち` | pass |
| `届いたクイズ一覧` | pass |

仕様確認:

- `/home` の15秒ごとの新着確認処理は内部処理として維持されている
- `/home` の参加者向けUIには、新着確認の内部仕様やDB名を表示しない
- 開始前は問題本文と選択肢を隠す仕様を維持する
- 届いたクイズ一覧は引き続き表示される
- Production deploymentは追加作成されていない
- docsとREADMEにsecret実値、初期admin email実値、Supabase keys、Vercel token、bypass secret、参加者別invite code実値は記録していない

判定: `/home` UI整理のPreview反映後確認はpass。

この確認時点ではPreview URL共有前だった。10人テスト候補全員への共有、SNS公開、Production deploy、Production env設定、Production custom domain設定、Stripe、Web Push、Realtimeは引き続き行わない。

## 19. `/home` 参加者向けUI整理 Preview反映

実施日: 2026-05-31 JST

Phase 10の1名限定共有前 `/home` UI整理commitをPreview deploymentへ反映した。

反映元:

- source: Git連携
- branch: `preview`
- commit: `cdab98c`
- commit message: `fix: simplify phase 10 home participant UI`

Preview deployment:

| 項目 | 内容 |
| --- | --- |
| URL | `https://quiz-world-preview-gaojfq7gi-chop0522s-projects.vercel.app` |
| deployment id | `dpl_2zU6mSzTLsS6SHc9P3yw6uxt3B1Z` |
| branch / commit | `preview` / `cdab98c` |
| environment | Preview |
| status | Ready |
| created | 2026-05-31 21:44:32 JST |

確認結果:

- `origin/main` の最新commit `cdab98c` を `preview` branchへ反映した
- Vercel build logで `github.com/chop0522/quiz-world`、branch `preview`、commit `cdab98c` のcloneを確認した
- Vercel build logで `/home` を含むNext.js routes出力を確認した
- deployment statusはReady
- deployment environmentはPreview
- Production deploymentは追加作成されていない
- Production env、Production custom domainは未設定のまま
- build logとdocsにsecret実値、初期admin email実値、Supabase keys、Vercel token、bypass secret、参加者別invite code実値は記録していない

Preview `/home` 表示確認:

| 文言 | 結果 |
| --- | --- |
| `15秒ポーリング` | 表示なし |
| `polling` | 表示なし |
| `quiz_recipients` | 表示なし |
| `recipient` | 表示なし |
| `start_at` | 表示なし |
| `end_at` | 表示なし |
| `本人宛recipientのみ` | 表示なし |
| `最終更新` | 表示なし |
| `秒前` / `秒後` | 表示なし |
| `画面内通知` | 表示なし |
| `MVP` | 表示なし |
| `届いたクイズ` | 表示あり |
| `回答受付中` | 表示あり |
| `開始待ち` | 表示あり |

この反映時点ではPreview URL共有前だった。10人テスト候補全員への共有、SNS公開、Production deploy、Production env設定、Production custom domain設定、Stripe、Web Push、Realtimeは引き続き行わない。

## 16. 1名限定共有前 UI整理 Preview反映

実施日: 2026-05-31 JST

Phase 10の1名限定共有前UI整理commitをPreview deploymentへ反映した。

反映元:

- source: Git連携
- branch: `preview`
- commit: `b48d73a`
- commit message: `fix: clean up phase 10 account and header navigation`

Preview deployment:

| 項目 | 内容 |
| --- | --- |
| URL | `https://quiz-world-preview-v9gt5omnv-chop0522s-projects.vercel.app` |
| deployment id | `dpl_FbYobAph698Pq58aWFfQEiUMeiUy` |
| branch / commit | `preview` / `b48d73a` |
| environment | Preview |
| status | Ready |
| created | 2026-05-31 16:15:58 JST |

確認結果:

- `origin/main` の最新commit `b48d73a` を `preview` branchへ反映した
- Vercel build logで `github.com/chop0522/quiz-world`、branch `preview`、commit `b48d73a` のcloneを確認した
- Vercel build logで `/account` と `/account/password` を含むNext.js routes出力を確認した
- deployment statusはReady
- deployment environmentはPreview
- Production deploymentは追加作成されていない
- Production env、Production custom domainは未設定のまま
- build logとdocsにsecret実値、初期admin email実値、Supabase keys、Vercel token、bypass secret、参加者別invite code実値は記録していない

この反映時点ではPreview URL共有前だった。10人テスト候補全員への共有、SNS公開、Production deploy、Production env設定、Production custom domain設定、Stripe、Web Push、Realtimeは引き続き行わない。

## 17. 1名限定共有前 UI整理 Preview反映後確認

実施日: 2026-05-31 JST

Phase 10の1名限定共有前UI整理がPreview deploymentに反映されているか、Vercel CLIのDeployment Protection bypass経由で確認した。Preview DBを汚さないため、この確認では新規signup、参加者別invite codeの使用、パスワード変更、admin操作は行っていない。

対象deployment:

| 項目 | 内容 |
| --- | --- |
| URL | `https://quiz-world-preview-v9gt5omnv-chop0522s-projects.vercel.app` |
| deployment id | `dpl_FbYobAph698Pq58aWFfQEiUMeiUy` |
| branch / commit | `preview` / `b48d73a` |
| environment | Preview |
| status | Ready |

画面確認:

| 対象 | 結果 | 確認内容 |
| --- | --- | --- |
| `/` | pass | 未ログイン時のheaderにlogin / signup導線が表示される。`/account` とlogoutは表示されない。`MVPは18歳以上限定` 文言は表示されない。 |
| `/login` | pass | ログイン画面が表示され、未ログイン時のheaderにlogin / signup導線が表示される。 |
| `/signup` | pass | signup画面が表示され、18歳以上確認、terms同意、privacy同意、invite code入力導線が残っている。 |
| `/account` | pass | 未ログイン時はログインが必要である旨を表示する。logoutはheaderではなくaccount pageに置く設計であることを確認した。 |
| `/account/password` | pass | 未ログイン時はログインが必要である旨を表示する。ログイン済みユーザー向けのpassword変更routeはbuild outputと実装で確認した。 |
| `/admin` | pass | 未ログイン時は `アクセスできません` / `ログインが必要です。` を表示する。 |

admin / account保護確認:

- `/api/admin/reports`、`/api/admin/users`、`/api/admin/questions` は未ログイン時に `401` / `ログインが必要です。` を返すことをPreviewで確認した
- header navは `loggedIn=false` の場合 `publicRoutes`、`loggedIn=true` の場合 `mainRoutes` を使う実装である
- `/account` は `mainRoutes` に含まれ、logged-in時のheader導線として使う
- logoutボタンはapp shell / headerには置かず、`/account` のみに置く
- admin導線は `profiles.role = admin` かつ `profiles.status = active` の場合だけ表示する実装である
- `/admin` pageと `/api/admin/*` は `getAdminContext()` によりserver-sideで `profiles.role = admin` かつ `profiles.status = active` を要求する

補足:

- この確認では、Preview DBを共有前の状態に保つため、ログイン済みブラウザセッションの作成や新規テストユーザー作成は行っていない
- ログイン済み時にloginが消え、`/account` が表示されることは、Preview反映済みcommit `b48d73a` のapp shell実装とNext.js build outputで確認した
- non-adminのadmin導線非表示はapp shellの表示条件で確認し、non-adminの `/admin` 直接アクセス拒否はserver-side protectionで維持される

Vercel / secret確認:

- latest deploymentはPreview environment / Ready
- Production deploymentは追加作成されていない
- Production envとProduction custom domainは未設定のまま
- docs、README、git diffにsecret実値、初期admin email実値、Supabase keys、Vercel token、bypass secret、参加者別invite code実値は記録していない

### 判断

判定: Phase 10の1名限定共有前UI整理 Preview反映後確認はpass。

次に進む場合も、まず信頼できる1名へ個別DMで限定共有する。この確認時点ではPreview URL共有前だった。10人テスト候補全員への共有、SNS公開、Production deploy、Production env設定、Production custom domain設定、Stripe、Web Push、Realtimeは引き続き行わない。

## 18. 1名限定共有前 `/home` 参加者向けUI整理

実施日: 2026-05-31 JST

信頼できる1名へPreview URLと参加者別invite codeを共有する前に、`/home` の参加者向け表示から開発者向け・内部仕様向けの文言を削除した。内部処理としての新着確認は維持するが、参加者向けUIには `polling`、`quiz_recipients`、`recipient`、`start_at`、`end_at` などを表示しない方針にした。

整理内容:

- `/home` 上部説明文を参加者向け文言へ変更した
- 「画面内通知 / polling / 15秒ごとに確認」カードを削除した
- stats cardは「届いたクイズ」「回答受付中」「開始待ち」に絞った
- 「本人宛recipientのみ」「start_at到達後」「最終更新」などの内部・監視寄り文言を削除した
- クイズカードの秒数表示を削除し、開始/締切の日時だけを表示するようにした
- クイズカードの状態表示を「開始前」「回答受付中」「回答期間は終了しました」「停止中」にした

削除した参加者向けUI文言:

- `15秒ポーリング`
- `polling`
- `quiz_recipients`
- `recipient`
- `start_at`
- `end_at`
- `本人宛recipientのみ`
- `start_at到達後`
- `最終更新`
- `78311秒前` のような秒数表示
- `画面内通知`

維持した仕様:

- `/home` の新着確認処理は内部処理として維持する
- 開始前は問題本文と選択肢を表示しない
- 届いたクイズ一覧は引き続き表示する
- 回答可能になったら `/quiz/[launchId]` で回答できる

この整理時点ではPreview URL共有前だった。10人テスト候補全員への共有、SNS公開、Production deploy、Production env設定、Production custom domain設定、Stripe、Web Push、Realtimeは引き続き行わない。

## 23. 1名限定テスト開始後の追加確認

実施日: 2026-06-03 JST

GPT Proレビュー後、実態として信頼できる1名への個別共有が開始済みであることを反映し、read-only DB確認とadmin保護確認を行った。詳細は `docs/quiz-world/quiz-world-phase-10-first-participant-test-results.md` に記録した。

現在状態:

- 信頼できる1名への個別共有は開始済み
- Preview URLと参加者別invite codeは個別DMでのみ共有済み
- 2名目への共有、10人テスト候補全員への共有、SNS/公開ページ共有は未実施
- Production deploy、Production env設定、Production custom domain設定、Stripe、Web Push、Realtimeは未実施
- Smart Buzzerには触っていない

read-only確認:

- `auth.users=2`
- `profiles=2`
- `world_members=2`
- `profiles` 内訳はadmin active 1、user active 1
- `world_members` はmember active 2
- `invites` はactive 1件、used 1件
- `admin_audit_logs` は `invite_created` 1件
- `questions=1`、`quiz_launches=1`、`quiz_recipients=1`、`answers=1`、`question_ratings=1`、`rank_events=3`
- `reports=0`
- `/api/world` は `ok=true`、`activeMemberCount=2`、`memberLimit=10`、`remainingSeats=8`、`currentSeason=0`

解釈:

- `activeMemberCount=2` はowner/admin確認用ユーザー1名と信頼できる参加者1名で想定通り
- Preview DBはseed直後の空状態ではなく、1名テスト開始後の検証データがある状態
- 参加者別invite code実値、email実値、secret実値は記録していない

admin保護確認:

- `/api/admin/reports`、`/api/admin/invites`、`/api/admin/users` は未ログイン時に `ログインが必要です。` を返す
- `/admin` は未ログイン時に `ログインが必要です` を表示する
- headerの`/admin`導線は `profiles.role = admin` かつ `profiles.status = active` の場合だけ表示される実装である
- `/admin` pageと `/api/admin/*` は `getAdminContext()` によりserver-sideでactive adminだけを許可する
- `/invite` は参加者向けの招待コード / waitlist画面であり、adminのinvite code発行画面ではない

未実施:

- ログイン済みnon-admin本人のブラウザでheaderにAdmin導線が出ないことのライブ確認

理由:

- Codex側では参加者の認証情報を扱わないため

判断:

- P0なし
- 1名テスト継続はGO
- 2名目への共有はまだ保留

2名目へ進む前に、参加者本人または通常user相当でheaderにAdmin導線が出ないことを追加確認し、1名テストの不具合報告とP1整理を記録する。

## 24. GPT Proレビュー後の `/profile` P1整理

実施日: 2026-06-06 JST

ユーザーからのスクリーンショットと質問をもとに、GPT Proレビューで `/profile` の参加者向け表示を確認した。

確認した質問:

- 通常ユーザーに `role` / `status` を表示する必要があるか
- 保存ボタンのない表示名・通知設定フォームをどう扱うべきか

判断:

- P0なし
- 1名テスト継続はGO
- 2名目への拡張は、`/profile` P1整理の検証後まで保留
- 通常ユーザーにraw `role` / `status` を表示しない
- admin activeユーザーにだけ、最小の管理者表示を出す
- 保存できない表示名・通知設定フォームを削除する
- 「次Phase」などの内部向け文言を参加者向けUIから削除する

実装方針:

- `/profile` はスコア、ランク、最近の履歴、最小限のプロフィール表示に絞る
- 表示名編集、通知設定保存、通知モード、quiet hours、1日の通知上限は後続課題として扱う
- logoutとpassword変更は `/account` に置いたままにする

次の確認:

- `/profile` P1整理後の表示確認
- 通常ユーザーにraw `role` / `status` や保存できないフォームが出ないこと
- non-adminのadmin導線非表示と `/admin` / `/api/admin/*` 保護が維持されていること

Preview URL、参加者別invite code、email実値、Supabase keys、Vercel token、bypass secretはdocs/repoに書かない。
