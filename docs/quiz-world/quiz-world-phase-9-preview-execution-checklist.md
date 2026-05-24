# Phase 9 Preview Execution Checklist

## 目的

このドキュメントは、Phase 9でQuiz World専用Preview環境を実作成する直前のGO/NO-GO判断と、Stepごとの実行結果記録に使うチェックリストである。

2026-05-24時点で、Step AとしてQuiz World専用Supabase development projectを作成済み、Step BとしてPreview DBへのmigration / seed適用済み、Step CとしてPreview DB smokeをpass済みである。Step DとしてVercel Preview project作成前のGO/NO-GOレビューを行い、Quiz World専用Vercel projectを作成済みである。Step D follow-upとしてVercel GitHub Appのrepository accessに `chop0522/quiz-world` を追加し、Vercel projectへGitHub repo接続を完了した。Step EのVercel Preview env設定前チェックでは、想定外のProduction deploymentを検出したため一度NO-GOとした。Step E再開前調査では、Production deploymentが2件あり、どちらもGitHub連携後の `main` push由来であることを確認した。その後、不要build抑止のためVercel Ignored Build Stepを一時的に `exit 0` に設定し、`origin/main` から `production-hold` branchを作成してpushしたうえで、Vercel Production Branchを `production-hold` に変更した。Step EとしてVercel Preview envをPreview environmentのみに設定済みである。Production envは未設定、Preview deployは未実行である。Stripe、Web Push、Realtimeはまだ作らない。Smart Buzzerのproduction / Stripe / Vercel / Supabase / env / legal page / cleanup / live keyには触らない。

## レビュー結果

2026-05-24時点のレビュー結果は「Step D Vercel project作成済み / GitHub repo接続済み / Step E再開前調査でGitHub main push由来のProduction deployment 2件を確認 / Ignored Build Stepを一時設定 / `production-hold` branch作成済み / Production Branchを `production-hold` に変更済み / Vercel Preview env設定済み / Production env未設定 / Preview deploy未実行」である。

local実装、Phase 8 smoke、manual UI rehearsal follow-up、Phase 9計画、migration順、seed方針、env項目、rollback / cleanup方針は整理済みである。今回、Supabase organization / workspace、region、plan、cleanup担当、最終GO/NO-GO判断を人間決定済みとして反映した。

cloud実作成はQuiz World専用Supabase development projectの作成、Preview DBへのmigration / seed適用、Quiz World専用Vercel project作成、GitHub repo接続、Vercel Preview env設定まで完了した。Preview deploy、追加のProduction deploy、Stripe、Web Push、Realtimeは行わない。Production deploymentはGitHub連携後の `main` pushで自動作成されたため、Step E再開前にproduction branch / deploy運用を整理した。現時点ではVercelのProduction Branch設定を `production-hold` に変更済みで、`main` は開発の安定branchとして残す。

決定済み:

- Supabase project名: `quiz-world-preview`
- Supabase organization / workspace: 個人アカウント
- Supabase region: `Northeast Asia (Tokyo) ap-northeast-1`
- Supabase plan: Free
- Vercel project名: `quiz-world-preview`
- GitHub repo: `chop0522/quiz-world`
- Preview branch: `preview`
- Preview invite code: `SEASON0-PREVIEW-001`
- Preview共有範囲: owner/adminのみから開始
- 初期admin email: 決定済み。実値はdocsに書かず、Vercel Preview envの `ADMIN_EMAILS` にのみ設定する
- Preview DB cleanup担当: 自分
- 最終GO/NO-GO判断: Step DでVercel project作成済み。Step D follow-upでGitHub repo接続済み。Step E再開前安全作業で `production-hold` branch作成とProduction Branch変更は完了。Step EでVercel Preview env設定済み。Preview deployは未実行

Step A作成後の記録:

- Supabase project id / ref: `ogfuohrvzfjmgvdewvcl`
- Supabase public URL: `https://ogfuohrvzfjmgvdewvcl.supabase.co`
- 作成日時: `2026-05-24 13:54 JST`
- 作成確認者: Codex via Supabase Dashboard

Step B適用後の記録:

- migration適用日時: `2026-05-24 14:39 JST`
- seed適用日時: `2026-05-24 14:39 JST`
- migration適用先project ref: `ogfuohrvzfjmgvdewvcl`
- seed済み初期world: `クイズワールド`
- seed済みPreview invite code: `SEASON0-PREVIEW-001`

Step C smoke後の記録:

- Preview DB smoke実行日時: `2026-05-24 15:13 JST`
- Preview DB smoke結果: pass
- 確認内容: migration履歴、初期world、Preview invite code、主要14table、RLS、table件数、Smart Buzzer混入なし

Step D Vercel作成前レビュー:

- git status: clean
- `HEAD` と `origin/main`: 一致
- Vercel project名: `quiz-world-preview` でGO候補
- GitHub repo: `chop0522/quiz-world` を確認
- Smart BuzzerのVercel projectとは別projectにする
- Production domain / Production env: 設定しない
- Preview branch: `preview` 方針でGO候補。ただし現時点でremote `preview` branchは未確認のため、作成前にbranch作成タイミングを最終確認する
- Vercel Preview env実値: Vercel Project SettingsのPreview envにのみ設定し、repo/docs/README/commit messageには書かない
- Step D判断: Vercel Preview project作成だけGO候補。Production deploy、Stripe、Web Push、RealtimeはNO-GO
- service role key / anon key / DB password: docs、README、repoには記録しない

Step D Vercel project作成後の記録:

- Vercel project name: `quiz-world-preview`
- Vercel project id: `prj_fCviBUF2fYH077fLBUHV5uPFleMx`
- owner / account: `chop0522's projects`
- created at: `2026-05-24 16:07 JST`
- root directory: `.`
- Node.js version: `24.x`
- latest production URL: なし
- Production domain: 未設定
- Production env: 未設定
- Vercel env: 未設定
- Preview deploy: 未実行
- env確認: `vercel env ls` でenvironment variablesなし
- deployment確認: `vercel list quiz-world-preview` でdeploymentsなし
- local link: `.vercel/project.json` 作成済み。ただし `.vercel/` はgitignore対象でcommitしない
- GitHub repo接続: 初回は `chop0522/quiz-world` への接続を試行したが、Vercel側の権限エラーで未完了
- repo接続エラー: `Failed to connect chop0522/quiz-world to project. Make sure there aren't any typos and that you have access to the repository if it's private.`

Step D follow-up GitHub App access確認:

- 実行日時: `2026-05-24 16:34 JST`
- 確認対象Vercel project: `quiz-world-preview` / `prj_fCviBUF2fYH077fLBUHV5uPFleMx`
- Smart Buzzer project: 開いていない。操作対象外
- Vercel env: 未設定のまま
- Production domain / Production env: 未設定のまま
- Preview deploy: 未実行のまま
- GitHub側のVercel App設定確認: GitHub Installed Apps上でVercel GitHub Appがインストール済みであることを確認
- GitHub sudo認証: GitHub Mobile認証を完了
- repository access: `Only select repositories` のまま、既存の `chop0522/smart-buzzer` は外さず、`chop0522/quiz-world` を追加
- GitHub App access確認結果: `chop0522/quiz-world` と `chop0522/smart-buzzer` の2repositoryが選択済み
- Vercel repo接続再試行: `https://github.com/chop0522/quiz-world` を `quiz-world-preview` に接続
- Vercel repo接続結果: `Connected`
- Vercel env / Preview deploy / Production deploy: 未実行

Step E Vercel Preview env設定前GO/NO-GO確認:

- 実行日時: `2026-05-24 16:46 JST`
- git状態: `main` と `origin/main` が同一commitでclean
- 確認対象Vercel project: `quiz-world-preview` / `prj_fCviBUF2fYH077fLBUHV5uPFleMx`
- GitHub repo接続: `chop0522/quiz-world` 接続済み
- Vercel env確認: environment variablesなし
- Production env: 未設定
- Preview env: 未設定
- deployments確認: 想定外のProduction deploymentが1件存在
- Step E判断: NO-GO
- NO-GO理由: Preview env設定前に想定外のProduction deploymentが存在するため、Vercel env設定へ進まない
- 実施しなかったこと: Vercel env設定、Preview deploy、Production deploy、Production domain設定、Stripe、Web Push、Realtime
- 次の必要作業: 想定外Production deploymentの扱いを決める。必要ならVercel側でdeploy/production設定の確認、cleanup、またはPreview branch運用を整理してからStep Eを再実行する

Step E再開前 Production deployment調査:

- 実行日時: `2026-05-24 17:03 JST`
- 調査対象Vercel project: `quiz-world-preview` / `prj_fCviBUF2fYH077fLBUHV5uPFleMx`
- GitHub repo接続: `chop0522/quiz-world` 接続済み
- Production branch設定: `main`
- Vercel env確認: environment variablesなし
- Production env: 未設定
- Preview env: 未設定
- custom Production domain: 未設定
- Vercel automatic aliases: Production deploymentに自動aliasが割当済み
- Production deployment件数: 2件
- Production deploymentの原因: どちらもsourceは `git`。Vercel CLI手動deployではなく、GitHub連携後の `main` branch pushにより自動作成されたと判断する
- 外部共有確認: docs / READMEには調査前時点でdeployment URLを共有していなかった。Vercel CLIだけでは第三者共有履歴までは確認できない
- secret確認: service role key / anon key / DB password / 初期admin email実値は確認結果に記録しない

| created | source | branch | commit | message | status | target | deployment URL |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `2026-05-24 17:00:21 JST` | GitHub | `main` | `fe7e974` | `docs: record phase 9 vercel env setup no-go` | Ready | Production | `https://quiz-world-preview-ee43atdtz-chop0522s-projects.vercel.app` |
| `2026-05-24 16:39:05 JST` | GitHub | `main` | `39bf037` | `docs: record phase 9 vercel git connection` | Ready | Production | `https://quiz-world-preview-razogyaot-chop0522s-projects.vercel.app` |

扱いの提案:

- rollback: 非推奨。2件とも想定外のProduction deploymentであり、rollbackしても別の想定外Production deploymentへ戻るだけで根本原因を解決しない
- 削除: すぐには行わない。先にproduction branch設定と自動deploy運用を整理する。削除する場合も別途GO/NO-GO判断を行う
- 放置: 短期的な一時放置は可能。ただしautomatic production aliasesが存在するため、10人テスト前までに扱いを決める
- 記録のみ: 現時点の推奨。まず記録し、Step E再開前にproduction branchを `main` 以外にする、またはPreview branch運用を確定してからVercel Preview env設定へ進む

Step E再開前 branch / deployment運用整理:

- 実行日時: `2026-05-24 19:58 JST`
- 調査対象Vercel project: `quiz-world-preview` / `prj_fCviBUF2fYH077fLBUHV5uPFleMx`
- GitHub repo接続: `chop0522/quiz-world` 接続済み
- 操作対象確認: Quiz World専用Vercel project。Smart Buzzer projectは操作対象外
- Production Branch変更方針: `main` から `production-hold` へ変更したい
- 変更結果: 未成立
- 未成立理由: Vercelが `Branch "production-hold" not found in the connected Git repository.` を返したため
- 対応: 指示どおり、その場で `production-hold` branch作成やpushは行わず停止
- 現在のProduction Branch: `main`
- Preview branch運用方針: `preview` branchでPreview確認を行う
- `main` の扱い: 開発の安定branchとして残す
- 既存Production deployment 2件: 削除・rollbackせず、記録のみ
- 既存Production deployment URL: 外部共有しない
- Production env: 未設定
- Preview env: 未設定
- Vercel env: environment variablesなし
- Production domain: custom domainは未設定。ただしVercel自動aliasはProduction deploymentに割当済み
- Preview deploy: 未実行
- Production deploy: 追加実行なし
- secret確認: service role key / anon key / DB password / 初期admin email実値は記録しない

Step E再開前の判断:

- この時点ではNO-GO。Production Branchが `main` のままなので、この状態で `main` にcommit / pushするとProduction deploymentが増える可能性があった
- Step Eへ進むには、先に `production-hold` branchを作成してpushするか、Vercel Dashboard上で存在しないbranchを許可できる別手段があるかを人間が確認する必要があった
- `preview` branchへのPreview deploy運用は方針として固定するが、branch作成・push・Preview deployはまだ行わない

Step E再開前 Production Branch切り替え安全作業:

- 実行日時: `2026-05-24 22:37 JST`
- 作業対象Vercel project: `quiz-world-preview` / `prj_fCviBUF2fYH077fLBUHV5uPFleMx`
- GitHub repo接続: `chop0522/quiz-world` 接続済み
- 操作対象確認: Quiz World専用Vercel project。Smart Buzzer projectは操作対象外
- 作業前Production Branch: `main`
- 安全策: Vercel Ignored Build Stepを一時的に `exit 0` に設定
- 一時設定の目的: `production-hold` branch作成pushやdocs pushで不要なbuild/deploymentを発生させないため
- `production-hold` branch作成: `origin/main` の現在commitからremote branchとして作成済み
- `production-hold` branch commit: `fe7e974`
- Vercel側の確認: `production-hold` branch push後もdeployment一覧は既存Production deployment 2件のみ
- Production Branch変更: `production-hold` へ変更済み
- 作業後Production Branch: `production-hold`
- `main` の扱い: 開発の安定branchとして残す。今後の `main` pushはProduction Branch Trackingの対象ではない運用にする
- Preview branch運用方針: `preview` branchでPreview確認を行う。ただし `preview` branch作成・push・Preview deployはまだ行わない
- 既存Production deployment 2件: 削除・rollbackせず、記録のみ
- 既存Production deployment URL: 外部共有しない
- Production env: 未設定
- Preview env: 未設定
- Vercel env: environment variablesなし
- Production domain: custom domainは未設定。ただしVercel自動aliasは既存Production deploymentに割当済み
- Preview deploy: 未実行
- Production deploy: 追加実行なし
- Stripe / Web Push / Realtime: 未実施
- secret確認: service role key / anon key / DB password / 初期admin email実値は記録しない

Step F前の注意:

- Ignored Build Step `exit 0` は一時設定である
- Preview deployを実行するStep F前に、Ignored Build Stepを解除するか、Preview deployを許可する条件付きcommandへ見直す
- この一時設定を残したままではPreview deployもskipされる可能性がある

Step E Vercel Preview env設定後の記録:

- 実行日時: `2026-05-24 23:08 JST`
- 作業対象Vercel project: `quiz-world-preview` / `prj_fCviBUF2fYH077fLBUHV5uPFleMx`
- GitHub repo接続: `chop0522/quiz-world` 接続済み
- Production Branch: `production-hold`
- Ignored Build Step: 一時的に `exit 0` のまま
- Preview env設定: 完了
- Preview envに設定したenv名: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAILS`, `QUIZ_WORLD_ID`, `MAX_INITIAL_MEMBERS`
- `NEXT_PUBLIC_APP_URL`: Preview URL未確定のため未設定。推測値は入れない。Step F Preview deploy前後で設定タイミングを再確認する
- Production env: 未設定
- Preview deploy: 未実行
- Production deploy: 追加実行なし
- deployment確認: 既存Production deployment 2件とCanceled Preview 1件のみ。env設定による新規deployは発生していない
- secret確認: service role key / anon key / DB password / 初期admin email実値はdocs、README、repo、commit messageに記録しない

## 1. Phase 9で実作成するもの

Step Aの実行判断後に作成する対象は以下に限定する。

| 対象 | 用途 | レビュー結果 |
| --- | --- | --- |
| Quiz World専用 Supabase development project | Preview DB / Auth / RLS確認 | 作成済み。project名は `quiz-world-preview` |
| Preview DB migration / seed | Preview DB schema / 初期world / Preview invite code | Step Bで適用済み |

Step EでVercel Preview envは設定済みである。Step E後も、以下はまだ実行しない。

- Preview deploy
- 追加のProduction deploy

## 2. Phase 9でまだ作らないもの

Phase 9では以下を作らない。

- Production project
- Production deploy
- Production domain
- Production env
- Stripe
- Web Push
- Realtime
- 10人テスト本番データ
- APNs / FCM / Expo Push
- 課金
- ギルド
- Smart Buzzer側の変更

## 3. Supabase作成前チェック

| チェック | レビュー結果 | GO/NO-GO |
| --- | --- | --- |
| project名 | `quiz-world-preview` | GO候補 |
| organization / workspace | 個人アカウント | GO候補 |
| region | `Northeast Asia (Tokyo) ap-northeast-1` | GO候補 |
| plan | Free | GO候補 |
| project分離 | Smart Buzzerとは別projectを新規作成する。既存Smart Buzzer projectは開かない | GO条件 |
| reset / cleanup | Preview DBは破棄可能データのみ。reset / cleanup手順を本ドキュメントで定義済み | GO候補 |
| service role key | Vercel Preview envのserver側にのみ保存。repo、docs、client bundleには出さない | GO条件 |
| RLS | migration適用後、全対象tableでRLS有効を確認済み | 確認済み |
| project id記録 | project id / URLをこの表の下に記録済み。secretは書かない | 記録済み |

作成後の記録欄:

| 項目 | 値 |
| --- | --- |
| Supabase project name | `quiz-world-preview` |
| Supabase project id / ref | `ogfuohrvzfjmgvdewvcl` |
| Supabase public URL | `https://ogfuohrvzfjmgvdewvcl.supabase.co` |
| Supabase region | `Northeast Asia (Tokyo) ap-northeast-1` |
| Supabase plan | Free |
| Supabase compute | NANO |
| Supabase organization / workspace | 個人アカウント |
| service role key保存先 | Vercel Preview env only |
| 作成日時 | `2026-05-24 13:54 JST` |
| migration / seed適用日時 | `2026-05-24 14:39 JST` |

作成前に必ず確認すること:

- Smart BuzzerのSupabase URL / project idではない
- Localの `.env.local` をそのまま流用しない
- service role keyの保存先がVercel Preview envだけに限定されている
- Preview DBを削除しても困らないデータだけを入れる
- 作成前後にproject id / URLを確認して、誤project操作を避ける

## 4. Vercel作成前チェック

| チェック | レビュー結果 | GO/NO-GO |
| --- | --- | --- |
| project名 | `quiz-world-preview` | GO候補 |
| GitHub repo接続先 | `chop0522/quiz-world` のみ | GO条件 |
| Preview branch運用 | `preview` branchを使う | GO候補 |
| Production domain | 設定しない | GO条件 |
| Production env | 設定しない | GO条件 |
| project分離 | Smart BuzzerのVercel projectとは別projectにする | GO条件 |
| Preview URL共有範囲 | owner/adminのみから開始。smoke pass後に限定共有を検討 | GO候補 |

Step Dレビュー結果:

- Vercel project名は `quiz-world-preview` でGO候補。
- GitHub repoは `chop0522/quiz-world` を使う。
- Smart BuzzerのVercel projectとは別projectにする。
- Production domain / Production envは設定しない。
- Preview branchは `preview` を使う方針。ただし、現時点ではremote `preview` branchは未確認のため、branch作成タイミングをVercel作成直前に確認する。
- Vercel project作成だけをStep Dの対象にし、Preview deployやProduction deployへは進まない。

作成後の記録欄:

| 項目 | 値 |
| --- | --- |
| Vercel project name | `quiz-world-preview` |
| Vercel project id | `prj_fCviBUF2fYH077fLBUHV5uPFleMx` |
| owner / account | `chop0522's projects` |
| GitHub repo | Step D follow-upで `chop0522/quiz-world` への接続完了 |
| Preview branch | `preview` |
| Preview URL | 未作成 |
| Production domain | 未設定 |
| Production env | 未設定 |

作成前に必ず確認すること:

- Smart BuzzerのVercel projectにenvを追加しない
- Production環境を有効化しない
- Preview URLの共有先を決める
- Preview envの入力担当者を決める
- Vercel上でproject名とGitHub repo接続先を目視確認する
- GitHub repo接続はStep D follow-upで完了済み。次はVercel env設定前に別途GO/NO-GO判断を行う

## 5. envチェック

Preview envはVercel Project Settingsに設定する。repoには入れない。

| env | 値の方針 | GO/NO-GO |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase development projectのpublic URL。Preview envに設定済み。実値はrepoに書かない | 設定済み |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase development projectのanon / publishable key。Preview envに設定済み。実値はrepoに書かない | 設定済み |
| `SUPABASE_SERVICE_ROLE_KEY` | server専用。Vercel Preview envにのみ保存済み。実値はrepo、docs、clientに出さない | 設定済み |
| `NEXT_PUBLIC_APP_URL` | Vercel Preview URL。Preview URL未確定のため未設定。推測値は入れない | Step F前後で設定 |
| `ADMIN_EMAILS` | 初期admin emailは決定済み。実値はdocsに書かず、Vercel Preview envにのみ設定済み | 設定済み |
| `QUIZ_WORLD_ID` | `00000000-0000-4000-8000-000000000001` をPreview envに設定済み | 設定済み |
| `MAX_INITIAL_MEMBERS` | `10` をPreview envに設定済み | 設定済み |

確認事項:

- `.env.local` はcommitしない
- Supabase localのkeyをPreviewに混ぜない
- Smart Buzzerのenvを使わない
- secret実値をREADME、docs、issue、PR本文に書かない
- Preview env実値はVercel Project SettingsのPreview envにだけ設定する
- Production envにはまだ何も設定しない
- `ADMIN_EMAILS` の実値はdocsに書かない
- `SUPABASE_SERVICE_ROLE_KEY` がclient bundleに出ないことをPreview smokeで確認する

## 6. migration / seed チェック

### migration適用順

Preview project作成後に、以下の順序で既存migrationを適用済み。

1. `20260516000100_phase1_signup_auth.sql`
2. `20260521000100_phase2_questions.sql`
3. `20260521000200_phase3_quiz_launches.sql`
4. `20260522000100_phase4_answers.sql`
5. `20260522000200_phase5_result_rating_reports.sql`
6. `20260522000300_phase6_rank_events.sql`
7. `20260522000400_phase7_admin_moderation.sql`

適用前チェック:

- 接続先Supabase project id / URLがQuiz World Previewであることを確認する
- Smart Buzzer projectではないことを確認する
- migration適用前後のproject id / URLを記録する
- 新規DB migration SQLはこのレビューでは作らない

適用後チェック:

- 主要tableが作成されている
- RLSが有効である
- `complete_signup`、`submit_quiz_answer`、`apply_answer_rank_events`、`apply_rating_rank_events`、admin RPCが存在する
- non-admin / suspended user制御がsmokeで確認できる

Step B適用結果:

| 項目 | 結果 |
| --- | --- |
| migration適用先project ref | `ogfuohrvzfjmgvdewvcl` |
| migration適用状態 | 7本すべてRemote適用済み |
| RLS確認 | `worlds`、`profiles`、`world_members`、`waitlist`、`invites`、`questions`、`blocks`、`quiz_launches`、`quiz_recipients`、`answers`、`question_ratings`、`reports`、`rank_events`、`admin_audit_logs` で有効 |
| index確認 | 対象tableでindex作成を確認済み |
| remote DB version | PostgreSQL 17系 |
| local config note | local `supabase/config.toml` はPostgreSQL 15設定のため、今後local/preview差分を再確認する |

### seed投入手順

local seedと同じ初期worldを使う。

| データ | 値 | レビュー結果 |
| --- | --- | --- |
| 初期world | `クイズワールド` | GO候補 |
| world id | `00000000-0000-4000-8000-000000000001` | GO候補 |
| member_limit | `10` | GO候補 |
| current_season | `0` | GO候補 |
| 初期admin | 初期admin emailは決定済み。`ADMIN_EMAILS` 対象メールでsignup後に `profiles.role = admin` を確認。email実値はdocsに書かない | 決定済み / env作成時設定 |
| 初期invite code | `SEASON0-PREVIEW-001` | GO候補 |

seed投入方針:

- Previewでは本番ユーザーを入れない
- まずadmin 1名とテストユーザー2〜3名でsmokeする
- invite code発行はadmin画面でも確認する
- Preview用invite codeは10人テスト本番codeと混ぜない

Step B seed適用結果:

| データ | 結果 |
| --- | --- |
| 初期world | `クイズワールド` 作成済み |
| world id | `00000000-0000-4000-8000-000000000001` |
| member_limit | `10` |
| current_season | `0` |
| world status | `active` |
| Preview invite code | `SEASON0-PREVIEW-001` 作成済み |
| invite status | `active` |
| invite max_uses / use_count | `100` / `0` |
| 初期admin | 未作成。`ADMIN_EMAILS` 対象メールでsignup後に確認する |
| 主要データ | `profiles`、`world_members`、`waitlist`、`questions`、`quiz_launches`、`quiz_recipients`、`answers`、`question_ratings`、`reports`、`rank_events`、`admin_audit_logs` は0件 |
| Smart Buzzer混入確認 | `worlds` にSmart Buzzer由来らしい行なし |

### Preview reset手順

Preview resetは実行前に確認を挟む。

1. reset対象projectがQuiz World Previewであることを確認する
2. Smart Buzzerのproject id / URLではないことを確認する
3. test users、questions、launches、answers、ratings、reports、rank_events、admin_audit_logs、waitlist、invitesを削除またはreset対象にする
4. reset後に初期world / invite / adminを再作成できることを確認する
5. reset作業を行った日時、担当者、対象project idを記録する

Preview reset / cleanup担当は自分。

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
- service role keyがclient bundleやresponseに出ない

## 8. rollback / cleanup

Preview環境は本番ではないため、rollback / cleanupを事前に決める。

| 操作 | 方針 | GO/NO-GO |
| --- | --- | --- |
| Vercel Preview env削除 | Preview projectのenvだけ削除 | GO候補 |
| Supabase Preview DB reset | Preview DBだけreset | GO候補 |
| Supabase project削除判断 | Previewが不要になった場合のみ検討 | 後続判断 |
| test users削除 | Preview用ユーザーだけ対象 | GO候補 |
| invite code削除 | Preview用codeを削除または無効化 | GO候補 |
| audit log保持判断 | 監査目的で保持するかresetするか決める | 後続判断 |

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

cleanup担当は自分。audit log保持方針とSupabase project削除判断はPreview smoke後の後続判断にする。

## 9. GO条件

Step AからStep Cまでは以下を満たして実行済みである。Step DではVercel Preview project作成を行い、Step D follow-upでGitHub repo接続まで完了した。Step EでVercel Preview env設定まで完了した。Preview deploy、Production deployへ進む場合は、別途GO/NO-GO判断を行う。

すでに確認済み:

- local `main` がcleanである
- Phase 8 local smoke / manual rehearsalが通過済みである
- P0がない
- P1が対応済みである
- P2の残項目が既知制約として整理されている
- secretをrepoに入れない運用が確認済みである
- Smart Buzzerと混ざらない方針が明文化されている
- migration適用順が確認済みである
- env項目が整理済みである
- Preview DB smokeがpass済みである
- `HEAD` と `origin/main` が一致している
- Vercel project名、GitHub repo、Preview branch方針が整理済みである
- Vercel project `quiz-world-preview` が作成済みである

Step A実行時に確認済み / 今後も維持すること:

- latest tag / origin/mainを確認する
- Supabase作成先が個人アカウントであることを確認する
- Supabase regionが `Northeast Asia (Tokyo) ap-northeast-1` であることを確認する
- Supabase planがFreeであることを確認する
- `ADMIN_EMAILS` の実値をVercel Preview envにのみ設定する
- Preview reset / cleanup担当が自分であることを確認する
- 作成直前にSmart BuzzerのDashboardを開いていないことを確認する
- Vercel作成直前に、Smart BuzzerのVercel projectを開いていないことを確認する
- Preview branch `preview` の作成タイミングを確認する
- Vercel GitHub Appが `chop0522/quiz-world` にアクセスできることを確認済み

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
- migration / seed適用、Vercel project作成、Production deploy、Stripe、Web Push、RealtimeをStep Aと同時に行おうとしている
- Supabase作成条件が `quiz-world-preview`、個人アカウント、`Northeast Asia (Tokyo) ap-northeast-1`、Free planから外れている
- Vercel project作成と同時にProduction domain / Production env / Production deployを設定しようとしている
- Vercel Preview envにSmart Buzzer由来の値を入れようとしている

## Step A / Step B / Step C / Step D実作成結果メモ

Step AでQuiz World専用Supabase development projectを作成し、Step BでPreview DBへmigration / seedを適用した。Step CでPreview DB smokeを実行し、migration履歴、seed、主要table、RLS、table件数を確認した。Step DではVercel Preview projectを作成し、Step D follow-upでGitHub repo接続まで完了した。Step EでVercel Preview envを設定済みである。Preview deployは未実行である。

| 項目 | 値 |
| --- | --- |
| Supabase project名 | `quiz-world-preview` |
| Supabase project id / ref | `ogfuohrvzfjmgvdewvcl` |
| Supabase public URL | `https://ogfuohrvzfjmgvdewvcl.supabase.co` |
| Supabase region | `Northeast Asia (Tokyo) ap-northeast-1` |
| Supabase plan | Free |
| Supabase compute | NANO |
| Supabase organization / workspace | 個人アカウント |
| Supabase project作成日時 | `2026-05-24 13:54 JST` |
| migration / seed適用日時 | `2026-05-24 14:39 JST` |
| Preview DB smoke実行日時 | `2026-05-24 15:13 JST` |
| Preview DB smoke結果 | pass |
| smoke確認内容 | migration履歴、初期world、Preview invite code、主要14table、RLS、table件数、Smart Buzzer混入なし |
| Step Dレビュー | Vercel Preview project作成前GO/NO-GOを実施 |
| Vercel project名 | `quiz-world-preview` |
| Vercel project id | `prj_fCviBUF2fYH077fLBUHV5uPFleMx` |
| owner / account | `chop0522's projects` |
| GitHub repo | `chop0522/quiz-world` への接続完了 |
| GitHub App access follow-up | `chop0522/quiz-world` をVercel GitHub Appのrepository accessに追加済み。repo接続再試行結果は `Connected` |
| Preview branch | `preview` |
| Vercel project作成状態 | 作成済み |
| Production domain / env | 未設定 |
| Vercel env | Preview env設定済み。Production envは未設定 |
| Preview deploy | 未実行 |
| Step E事前確認 | 想定外のProduction deploymentを検出したためNO-GO |
| Step E env設定 | Preview envのみ設定済み。`NEXT_PUBLIC_APP_URL` はPreview URL未確定のため未設定 |
| Step E再開前調査 | Production deployment 2件を確認。どちらもGitHub連携後の `main` push由来 |
| Ignored Build Step | 一時的に `exit 0` を設定済み。Step F Preview deploy前に解除または見直す |
| `production-hold` branch | `origin/main` から作成し、originへpush済み |
| Production branch | `production-hold` へ変更済み |
| Preview branch運用 | `preview` branchでPreview確認する方針。ただしbranch作成・push・Preview deployは未実行 |
| deployment扱い提案 | 既存Production deployment 2件は削除・rollbackせず記録のみ |
| env確認 | Preview envに必要envを設定済み。Production envは未設定 |
| deployment確認 | Step D project作成直後はdeploymentsなし。Step E調査時点ではProduction deployment 2件 |
| 初期admin email | 決定済み。docsには実値を書かない。Vercel Preview envの `ADMIN_EMAILS` にのみ設定 |
| Preview invite code | `SEASON0-PREVIEW-001` |
| Preview共有先 | owner/adminのみから開始 |
| cleanup担当 | 自分 |
| GO / NO-GO判断 | Step E Preview env設定は完了。次はIgnored Build Stepの扱いと `NEXT_PUBLIC_APP_URL` を確認したうえでStep F Preview deployへ進む候補 |
