# Phase 9 Preview Smoke Results

## 概要

Phase 9 Step Gとして、Quiz World専用Vercel Preview deploymentに対するsmoke確認を実行した。

結果は **NO-GO**。Preview deployment自体はReadyだが、通常アクセスがVercel Deployment Protectionで止まり、Vercel CLIのprotection bypass経由でもアプリルートが `404 NOT_FOUND` になったため、MVP主要ループのUI/API確認には進めなかった。

この結果はPreview環境のアクセス制御/保護設定の問題として扱う。Production deploy、Production env設定、Production domain設定、Stripe、Web Push、Realtime、Smart Buzzer側の変更は行っていない。

## 実行情報

| 項目 | 内容 |
| --- | --- |
| 実行日時 | `2026-05-25 03:01 JST` |
| Preview deployment URL | `https://quiz-world-preview-pm23q56vf-chop0522s-projects.vercel.app` |
| deployment id | `dpl_A7W6voaK5BjXHqabVQ4DCA4XnEe7` |
| branch / commit | `preview` / `45ded1e` |
| deployment status | Ready |
| deployment environment | Preview |
| Production Branch | `production-hold` |
| Production env | 未設定 |
| Production custom domain | 未設定 |
| `NEXT_PUBLIC_APP_URL` | 未設定。今回のblockerはbuildではなくPreviewアクセス制御のため、runtime影響は未確認 |

## 実行コマンド

```bash
git status --short --branch
git log --oneline --decorate -5
git branch -vv
npx vercel inspect https://quiz-world-preview-pm23q56vf-chop0522s-projects.vercel.app --timeout 120s
npx vercel list quiz-world-preview
npx vercel env ls
curl -sS -D - -o /tmp/quiz-world-preview-root.html https://quiz-world-preview-pm23q56vf-chop0522s-projects.vercel.app/
curl -sS -D - -o /tmp/quiz-world-preview-world.json https://quiz-world-preview-pm23q56vf-chop0522s-projects.vercel.app/api/world
npx vercel curl / --deployment dpl_A7W6voaK5BjXHqabVQ4DCA4XnEe7 -- --include --silent --show-error
npx vercel curl /api/world --deployment dpl_A7W6voaK5BjXHqabVQ4DCA4XnEe7 -- --include --silent --show-error
npx vercel inspect https://quiz-world-preview-pm23q56vf-chop0522s-projects.vercel.app --logs
npx vercel logs https://quiz-world-preview-pm23q56vf-chop0522s-projects.vercel.app --since 30m --json
```

一時的にVercel Preview envをlocal確認用の一時ファイルへpullしたが、確認後に削除した。env実値はdocs、README、repo、commit messageには記録しない。

## 事前確認

| 確認 | 結果 |
| --- | --- |
| git状態 | `main...origin/main`、作業開始時点でclean |
| `origin/main` | `eddba1d docs: record phase 9 preview deploy` |
| `origin/preview` | `45ded1e docs: record phase 9 preview deploy preflight` |
| Preview deployment Ready | pass |
| 追加Production deployment | なし。既存Production deployment 2件のみ |
| Preview env名 | 必要env名はPreview environmentに設定済み。値は記録しない |
| Production env | 未設定 |
| Production custom domain | 未設定 |
| Smart Buzzer | 操作対象外。触っていない |
| secret実値 | docs / README / git diffに記録なし |

## 確認対象画面

今回、以下の画面はPreview URL上で通常表示まで到達できなかった。

| 画面 | 結果 | 理由 |
| --- | --- | --- |
| `/` | fail | Deployment Protectionの401 |
| `/signup` | not checked | `/` で認証block |
| `/login` | not checked | `/` で認証block |
| `/home` | not checked | `/` で認証block |
| `/create` | not checked | `/` で認証block |
| `/quiz/[launchId]` | not checked | launch作成まで進めず |
| `/result/[launchId]` | not checked | launch / answer作成まで進めず |
| `/profile` | not checked | signup/loginまで進めず |
| `/admin` | not checked | admin loginまで進めず |
| `/world` | not checked | `/` で認証block |
| `/invite` | not checked | `/` で認証block |
| `/legal/terms` | not checked | `/` で認証block |
| `/legal/privacy` | not checked | `/` で認証block |

## MVP主要ループ確認

| シナリオ | 結果 | メモ |
| --- | --- | --- |
| Preview URLが開ける | fail | HTTP `401 Authentication Required` |
| `/signup` が表示される | not checked | Deployment Protectionで停止 |
| 18歳以上確認 / terms / privacy | not checked | signupへ到達できず |
| Preview invite code `SEASON0-PREVIEW-001` でsignup | not checked | signupへ到達できず |
| 初期admin email対象ユーザーがadminになる | not checked | signupへ到達できず |
| login | not checked | loginへ到達できず |
| `/home` | not checked | loginへ到達できず |
| question作成 | not checked | loginへ到達できず |
| launch作成 | not checked | question作成へ到達できず |
| recipientの `/home` 表示 | not checked | launch作成へ到達できず |
| `start_at` 前の秘匿 | not checked | launch作成へ到達できず |
| answer作成 | not checked | launch作成へ到達できず |
| result表示 | not checked | answer作成へ到達できず |
| rating作成 | not checked | result表示へ到達できず |
| report作成 | not checked | result表示へ到達できず |
| rank_events作成 | not checked | answer/rating作成へ到達できず |
| `/profile` score / rank表示 | not checked | loginへ到達できず |
| `/admin` moderation確認 | not checked | admin loginへ到達できず |
| admin_audit_logs作成 | not checked | admin操作へ到達できず |

## 発生したblocker

### P0: Preview smokeを実行できない

通常のPreview URLアクセスでVercel Deployment Protectionの `401 Authentication Required` が返った。

```text
HTTP/2 401
title: Authentication Required
```

Vercel CLIの `vercel curl` によるprotection bypassも試したが、`/` と `/api/world` のどちらもVercel側の `404 NOT_FOUND` になった。

```text
HTTP/2 404
x-vercel-error: NOT_FOUND
The page could not be found
```

一方で、`vercel inspect --logs` ではNext.js build自体は成功しており、`/`, `/signup`, `/login`, `/home`, `/create`, `/quiz/[launchId]`, `/result/[launchId]`, `/admin`, `/api/world` などのroutesはbuild log上で確認できた。

したがって、今回のStep Gは「app build失敗」ではなく「Previewアクセス制御またはbypass経路の未解決」によりNO-GOとする。

## NEXT_PUBLIC_APP_URL未設定の影響

`NEXT_PUBLIC_APP_URL` は未設定のまま。Step F前のlocal `vercel build` ではbuild blockerではないことを確認済み。

今回のStep GではDeployment Protectionで実画面/APIに到達できなかったため、runtime上の影響は未確認。Preview URL到達後に問題が出る場合は、確定済みPreview URLをPreview envに設定する案を検討する。

## Preview DB状態

今回の通常アクセスはDeployment Protectionで停止し、MVP主要ループのsignup / question / launch / answer / rating / report / admin操作には進めなかった。

そのため、今回のStep G起因でPreview DBにテストユーザーやクイズデータを追加した前提はない。DB cleanup / resetは不要と判断する。

ただし、次回Step G再実行時にbrowser認証やbypassを使ってMVP主要ループを通す場合は、実行後にPreview DB cleanup要否を再確認する。

## Production確認

| 確認 | 結果 |
| --- | --- |
| 追加Production deployment | なし |
| 既存Production deployment | Step E再開前に記録済みの2件のみ |
| Production Branch | `production-hold` |
| Production env | 未設定 |
| Production custom domain | 未設定 |
| Production deploy操作 | 実行していない |

## secret確認

以下はdocs、README、repo、commit messageに記録しない。

- Supabase anon / publishable key実値
- Supabase service role / secret key実値
- DB password
- 初期admin email実値
- Vercel token / bypass secret実値
- その他secret実値

今回の調査中、local Vercel CLI設定に含まれる認証tokenがterminal出力に一度表示された。repo/docsには記録していない。安全性を最大化する場合は、Vercel CLIの再ログインまたはtoken rotationを検討する。

## Vercel CLI token安全確認

2026-05-26 17:48 JSTに、次の安全確認を実施した。

- Vercel CLI認証ファイルに含まれるtoken-like値を、実値を表示せずにrepo / docs / README / git diff / git historyへ照合した
- token実値はrepo / docs / README / git diff / git historyに含まれていないことを確認した
- `.env.local` と `.vercel/` はtracked / stagedされていないことを確認した
- 安全側に倒して `npx vercel logout` を実行し、local Vercel CLI認証を破棄した
- `npx vercel login` で再ログインし、Vercel CLIの認証を再発行した
- Vercel APIのtoken metadataを確認し、terminal出力に表示された可能性が高い旧CLI tokenをrevokeした
- revoke後、該当旧CLI tokenがtoken一覧に残っていないことを確認した
- 再ログイン後のtoken-like値についても、repo / docs / README / git diff / git historyへの混入がないことを再確認した

記録しているのは確認結果のみであり、Vercel token、Supabase key、DB password、初期admin emailの実値はdocs、README、repo、commit messageに書かない。

## Step G再実行前 Deployment Protection / bypass 調査

2026-05-26 18:25 JSTに、Step G Preview smokeを再実行する前のアクセス方法と `vercel curl` bypass経由404の原因を追加調査した。

この調査ではPreview smoke本体、Production deploy、Production env設定、Production domain設定、Stripe、Web Push、Realtimeは実行していない。Smart Buzzerにも触っていない。

### 確認した状態

| 確認 | 結果 |
| --- | --- |
| git状態 | `main...origin/main`、調査開始時点でclean |
| 対象Vercel project | `quiz-world-preview` / `prj_fCviBUF2fYH077fLBUHV5uPFleMx` |
| 接続repo | `chop0522/quiz-world` |
| 対象Preview deployment | `dpl_A7W6voaK5BjXHqabVQ4DCA4XnEe7` |
| Preview URL | `https://quiz-world-preview-pm23q56vf-chop0522s-projects.vercel.app` |
| deployment branch / commit | `preview` / `45ded1e` |
| deployment status | Ready |
| Production Branch | `production-hold` |
| Production env | 未設定 |
| Production custom domain | 未設定 |
| project domain | `quiz-world-preview.vercel.app` のみ。custom production domainは未設定 |
| Preview env | 必要env名はPreview environmentに設定済み。値は記録しない |
| 追加Production deployment | なし。既存Production deployment 2件のみ |
| main push由来deployment | `5acef12` のpushでPreview deploymentが1件作成されたが、Ignored Build StepによりCanceled。Productionではない |
| secret実値 | docs / README / git diffには記録なし |

### Deployment Protection確認

Vercel project API上、Deployment ProtectionはVercel Authentication相当の設定で、`ssoProtection.deploymentType = all_except_custom_domains` だった。Password ProtectionとTrusted IPsは未設定だった。

Protection Bypass for Automationはprojectに設定済みで、automation bypass用のsecretがdeployment envとして扱われていることを確認した。ただし、bypass secret実値は表示・記録していない。

Vercel公式docsでは、Protection Bypass for Automationは `x-vercel-protection-bypass` をHTTP headerまたはquery parameterとして渡す方式であり、`vercel curl` は保護されたdeploymentに対してbypass headerを自動付与するCLIとして説明されている。Shareable LinkはDeployment画面のShareから作成・管理できる。

### bypass / 404調査

`vercel curl` をdeployment id指定とURL指定の両方で再確認した。

```bash
npx vercel curl / --deployment dpl_A7W6voaK5BjXHqabVQ4DCA4XnEe7 -- --include --silent --show-error
npx vercel curl / --deployment https://quiz-world-preview-pm23q56vf-chop0522s-projects.vercel.app -- --include --silent --show-error
npx vercel curl /api/world --deployment https://quiz-world-preview-pm23q56vf-chop0522s-projects.vercel.app -- --include --silent --show-error
```

結果はいずれもVercelの `404 NOT_FOUND` だった。Vercel logs上では、bypass経由の `/` requestが `source=static` / `responseStatusCode=404` として記録された。

一方、通常の `curl` では `/` が `401 Authentication Required` になり、Vercel Authenticationの保護ページが返った。つまり、通常アクセスはDeployment Protectionで止まっており、`vercel curl` は少なくともVercel Authentication画面とは別の経路に進んでいる。

### build / artifact / project設定確認

`vercel inspect --logs` では、Preview deploymentのbuild log上でNext.js buildが成功しており、`/`、`/signup`、`/login`、`/home`、`/create`、`/quiz/[launchId]`、`/result/[launchId]`、`/admin`、`/api/world` などのroutesが出力されている。

ただし、Vercel deployment metadataでは `source=cli`、`builds=[]`、`routes=null`、`functions=[]` と見え、files APIではrootに `src` directoryだけが見え、`.next` や `.vercel/output` は確認できなかった。build logとmetadata / files APIの見え方が一致していないため、現時点では以下のどちらかを追加確認する必要がある。

- owner/adminのブラウザ認証、Shareable Link、または明示的なautomation bypass secretでは `/` が開けるが、`vercel curl` の自動bypass経路だけが不安定である
- CLI deploy artifact / root / outputの扱いに問題があり、bypass後にVercel runtimeがNext.js routeへ到達できていない

Project settings上、Root Directory、Framework Preset、Build Command、Output Directoryは明示設定なしで、Ignored Build Stepは `preview` branchだけbuildを許可する条件式のままだった。Step Fのbuild logではNext.js auto buildが成功しているため、Root Directoryの明確な誤設定とは断定しない。

### 再実行判断

現時点では、Step G Preview smoke再実行は **条件付きGO候補** に留める。

Step Gを再実行する前に、次のいずれかを確認する。

1. owner/adminとしてVercelにログイン済みのブラウザでDeployment画面からPreview URLを開き、`/` が表示できる
2. Shareable Linkを発行し、実値をdocsに書かずに `/` が表示できる
3. automation bypass secretを明示的に使い、実値をdocsに書かずに `/` と `/api/world` が200またはアプリ側の想定レスポンスになる

上記のどれでも `/` が404になる場合は、Deployment Protectionではなくdeployment artifact / root / output / deploy methodの問題として扱い、Preview smoke再実行へ進まず修正計画を作る。

## Step G再実行前 artifact / root / output / deploy method 調査

2026-05-26 18:26 JSTに、Preview deploymentのartifact、root directory、output、deploy methodを追加調査した。

この調査ではPreview smoke再実行、新規Preview deploy、Production deploy、Production env設定、Production domain設定、Stripe、Web Push、Realtimeは実行していない。Smart Buzzerにも触っていない。

### repo / branch確認

| 確認 | 結果 |
| --- | --- |
| `main` / `origin/main` | `edba2de docs: record phase 9 preview access investigation` |
| `preview` / `origin/preview` | `45ded1e docs: record phase 9 preview deploy preflight` |
| `preview` commitのsource | `package.json`、`next.config.ts`、`src/app/page.tsx`、`src/app/layout.tsx`、`src/app/api/world/route.ts`、`src/app/signup/page.tsx`、`src/app/admin/page.tsx` などを含む |
| `preview` commitのtracked file数 | 133 |
| `45ded1e..origin/main` 差分 | README / docsのみ。`src/`、`package.json`、`next.config.ts`、`supabase/` などの実装差分はなし |

結論として、`preview` branchの `45ded1e` にはNext.js app sourceが含まれており、現在の`main`との差分もdocs中心である。404の直接原因を「preview commitにapp sourceがない」とは見ない。

### Vercel project設定確認

| 設定 | 結果 | 判断 |
| --- | --- | --- |
| project | `quiz-world-preview` / `prj_fCviBUF2fYH077fLBUHV5uPFleMx` | 正しい |
| linked repo | `chop0522/quiz-world` | 正しい |
| Production Branch | `production-hold` | 正しい |
| Root Directory | 未指定 / `null` | repo root扱い。明確な誤設定は見つからない |
| Framework Preset | 未指定 / `null` | Next.js固定ではない。ただしbuild logではNext.jsが自動検出され、`npm run build` が実行済み |
| Build Command | 未指定 / `null` | package.jsonの `build: next build` が使われている |
| Install Command | 未指定 / `null` | Vercel default |
| Output Directory | 未指定 / `null` | Next.js default |
| Node.js | `24.x` | 現時点ではbuild成功済み |
| Ignored Build Step | `preview` branchだけbuild許可 | 意図どおり |
| Production env | 未設定 | 維持 |
| Production custom domain | 未設定 | 維持 |

`package.json` のscriptsは `build: next build`、`dev: next dev`、`start: next start` であり、Vercel側のdefault buildと矛盾しない。

### local `.vercel` 確認

`.vercel/project.json` は `quiz-world-preview` / `prj_fCviBUF2fYH077fLBUHV5uPFleMx` を指している。`.vercel/` と `.env.local` は `.gitignore` 対象であり、git管理対象外である。

### deployment method / artifact確認

対象deployment `dpl_A7W6voaK5BjXHqabVQ4DCA4XnEe7` はmetadata上 `source=cli` である。これはStep Fでlocal `preview` branchからVercel CLIでPreview deployしたため、想定どおりである。

ただし、同じdeploymentについて以下の不整合がある。

| 確認 | 結果 |
| --- | --- |
| `vercel inspect --logs` | Next.js build成功。`/`、`/signup`、`/api/world` などの主要routesがbuild logに出力されている |
| deployment metadata | `builds=[]`、`routes=null`、`functions=null` |
| files API | rootに `src` directoryのみが見える。`.next` や `.vercel/output` は確認できない |
| bypass経由request log | `/` が `source=static` / `responseStatusCode=404` |

build logは成功している一方で、runtime側のmetadata / files API / request logはNext.js routeへ到達しているように見えない。現時点で最も疑わしいのは、Deployment Protectionそのものではなく、CLI deploy由来のartifact / routing / output反映の問題である。

Framework Presetが未指定である点も改善候補だが、build logではNext.jsが自動検出されているため、単独の原因とは断定しない。Root DirectoryとOutput Directoryに明確な誤設定は見つかっていない。

### Git連携Preview deployとCLI deployの比較

| 方法 | 利点 | リスク / 注意 |
| --- | --- | --- |
| Git連携Preview deploy | VercelがGitHub repoから直接sourceを取得し、branch / commit / project設定が明確になる。`source=git` になり、Preview branch運用と一致する | `preview` branch pushにより新しいPreview deploymentが作成される。Production Branchは `production-hold` なのでProduction deployにはならない想定 |
| CLI deploy | 手元から即時deployできる。今回すでにbuild log上は成功している | 今回の対象deploymentは `source=cli` で、metadata / files API / request log上の不整合がある。再現すると同じ404を踏む可能性がある |

### 推奨修正方針

次のPreview deploymentは、古いCLI deploymentを使い続けず、Git連携Preview deployで作り直す方針を推奨する。

実行前の安全条件:

1. Vercel Production Branchが `production-hold` のままであることを再確認する
2. Ignored Build Stepが `preview` branchだけbuild許可のままであることを再確認する
3. Vercel projectのFramework PresetをNext.jsに明示設定するか、少なくとも設定変更しない理由を記録する
4. Root Directoryはrepo root、Build Command / Output DirectoryはNext.js defaultのままとする
5. `preview` branchを `origin/main` に追従させてpushし、Git連携Preview deploymentを作る
6. deployment sourceが `git`、branchが `preview`、commitが最新の `origin/main` 相当であることを確認する
7. Production deployが発生していないことを確認する
8. secret実値はdocs / README / repo / commit messageに書かない

Git連携Preview deploymentでも `/` や `/api/world` が404になる場合は、Vercel project設定またはNext.js/Vercel adapter側の問題として扱い、Framework Preset、Root Directory、Build Command、Output Directoryを明示設定する修正計画へ進む。

## Step G再実行前 Git連携Preview deploy preflight

2026-05-26 18:42 JSTに、Git連携Preview deployで作り直すためのpreflightを実施した。

このpreflightでは、新しいPreview deploy、Production deploy、Production env設定、Production domain設定、Stripe、Web Push、Realtimeは実行していない。Smart Buzzerにも触っていない。

### branch / commit確認

| 確認 | 結果 |
| --- | --- |
| git状態 | `main...origin/main`、開始時点でclean |
| `main` / `origin/main` | `be62e73 docs: record phase 9 preview access artifact investigation` |
| `preview` / `origin/preview` | `45ded1e docs: record phase 9 preview deploy preflight` |
| `origin/preview..origin/main` | 4 commits behind |
| preview更新元 | `origin/main` の `be62e73` に合わせる |
| 空commit要否 | 現時点では不要。`preview` branchが4 commits遅れているため、`preview` を `origin/main` に更新してpushすればGit連携Preview deploymentが発火する見込み |

### Vercel project / env確認

| 確認 | 結果 |
| --- | --- |
| Vercel project | `quiz-world-preview` / `prj_fCviBUF2fYH077fLBUHV5uPFleMx` |
| Git連携 | `github` / `chop0522/quiz-world` |
| Production Branch | `production-hold` |
| Production env | 未設定 |
| Production custom domain | 未設定。default project domainのみ存在 |
| Preview env | 必要env名はPreview environmentに設定済み。値は記録しない |
| `NEXT_PUBLIC_APP_URL` | 未設定 |
| Ignored Build Step | `if [ "$VERCEL_GIT_COMMIT_REF" = "preview" ]; then exit 1; else exit 0; fi` |
| Git連携Preview deploy | 有効。`preview` branch pushでPreview deploymentが作られる見込み |

Preview envに存在することだけを確認したenv名:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAILS`
- `QUIZ_WORLD_ID`
- `MAX_INITIAL_MEMBERS`

env実値、初期admin email実値、Supabase key、bypass secret、Vercel tokenは表示・記録していない。

### Vercel build設定確認

| 設定 | 結果 | 判断 |
| --- | --- | --- |
| Root Directory | 未指定 / `null` | repo root扱いで問題なし |
| Framework Preset | 未指定 / `null` | build logとpreflight buildでNext.js auto-detect済み。現時点でblockerではない |
| Build Command | 未指定 / `null` | `package.json` の `build: next build` と一致 |
| Install Command | 未指定 / `null` | Vercel default |
| Output Directory | 未指定 / `null` | Next.js default |
| package scripts | `build: next build`、`dev: next dev`、`start: next start` | Vercel default buildと矛盾なし |
| `.vercel/project.json` | `quiz-world-preview` / `prj_fCviBUF2fYH077fLBUHV5uPFleMx` | 正しい |
| `.vercel/` | git管理対象外 | 正しい |

Framework PresetはNext.jsに明示設定してもよいが、現時点では必須とは判断しない。Git連携Preview deploymentでも404が続く場合に、Framework PresetをNext.jsへ明示設定する修正計画に進む。

### build blocker確認

`NEXT_PUBLIC_APP_URL=` の状態で `npx vercel build` を実行し、build成功を確認した。Next.js route一覧には `/`、`/signup`、`/api/world` などが含まれていた。

このため、`NEXT_PUBLIC_APP_URL` 未設定は現時点でbuild blockerではない。ただし、Preview URL到達後のruntime影響は引き続きStep G smokeで確認する。

### deployment確認

preflight中に新しいPreview deploymentは作成していない。Vercel deployments上、追加Production deploymentも発生していない。

最新のmain push由来でCanceled Preview deploymentは存在するが、これはIgnored Build Stepによりbuild/deployがskipされたもので、Production deploymentではない。

### preflight判断

Git連携Preview deployで作り直す準備は **GO候補**。

次Stepで行うこと:

1. 作業前にgit clean、Production Branch `production-hold`、Production env/domain未設定を再確認する
2. `preview` branchを `origin/main` の `be62e73` に合わせる
3. `preview` branchをoriginへpushし、Git連携Preview deploymentを発火させる
4. deployment sourceが `git`、branchが `preview`、commitが `be62e73` であることを確認する
5. Production deploymentが発生していないことを確認する
6. 新しいPreview URLでStep G smokeを再実行する

## Step G再実行用 Git連携Preview deployment作成結果

2026-05-26 19:18 JSTに、Git連携Preview deploymentを新しく作成した。

この作業ではStep G smoke本体、Production deploy、Production env設定、Production domain設定、Stripe、Web Push、Realtimeは実行していない。Smart Buzzerにも触っていない。

### branch / commit

| 確認 | 結果 |
| --- | --- |
| 実行前 `origin/main` | `4fd64ef docs: record phase 9 git preview deploy preflight` |
| 実行前 `origin/preview` | `45ded1e docs: record phase 9 preview deploy preflight` |
| preflightとの差分 | preflight時点で想定していた `be62e73` は、その後のdocs commit前のmain。今回は最新の `origin/main` である `4fd64ef` を採用 |
| 実行内容 | `preview` branchを `origin/main` の `4fd64ef` に合わせてoriginへpush |
| 実行後 `origin/preview` | `4fd64ef` |

### deployment

| 確認 | 結果 |
| --- | --- |
| Preview deployment URL | `https://quiz-world-preview-j5hl87g7x-chop0522s-projects.vercel.app` |
| deployment id | `dpl_GwrDB65DmZxCJs4gA6H9468dmt4k` |
| status | Ready |
| source | Git連携 |
| branch / commit | `preview` / `4fd64ef` |
| environment | Preview |
| Vercel project | `quiz-world-preview` / `prj_fCviBUF2fYH077fLBUHV5uPFleMx` |
| Production Branch | `production-hold` |
| Production env | 未設定 |
| Production custom domain | 未設定。default project domainのみ存在 |
| 追加Production deployment | なし。既存Production deployment 2件のみ |

Build logで `Cloning github.com/chop0522/quiz-world (Branch: preview, Commit: 4fd64ef)` を確認した。

Build logのNext.js route一覧には、少なくとも以下が含まれている。

- `/`
- `/signup`
- `/login`
- `/home`
- `/create`
- `/quiz/[launchId]`
- `/result/[launchId]`
- `/admin`
- `/api/world`
- `/api/signup`
- `/api/quiz-launches/[id]/result`

secret実値、初期admin email実値、Supabase key、bypass secret、Vercel tokenは表示・記録していない。

### 次の判断

新しいGit連携Preview deploymentはReady。この時点ではStep G smoke本体はまだ未実行だったが、その後に下記の再実行を行った。

次はこの新Preview deployment URLで、Deployment Protectionのowner/adminアクセス、Shareable Link、または明示的automation bypassのいずれかを使い、MVP主要ループのPreview smokeを実行する。

## Step G Preview smoke再実行結果（Git連携Preview deployment）

2026-05-26 19:43 JSTに、新しいGit連携Preview deploymentでStep G smokeを再実行した。

この確認では、Production deploy、Production env設定、Production domain設定、Stripe、Web Push、Realtimeは実行していない。Smart Buzzerにも触っていない。

### 対象deployment

| 確認 | 結果 |
| --- | --- |
| Preview deployment URL | `https://quiz-world-preview-j5hl87g7x-chop0522s-projects.vercel.app` |
| deployment id | `dpl_GwrDB65DmZxCJs4gA6H9468dmt4k` |
| status | Ready |
| source | Git連携 |
| branch / commit | `preview` / `4fd64ef` |
| environment | Preview |
| Vercel project | `quiz-world-preview` / `prj_fCviBUF2fYH077fLBUHV5uPFleMx` |
| Production Branch | `production-hold` |
| Production env | 未設定 |
| Production custom domain | 未設定。default project domainのみ存在 |
| 追加Production deployment | なし。既存Production deployment 2件のみ |

`origin/main` は `70efa67`、`origin/preview` は `4fd64ef` であることを確認した。今回の対象deploymentは `origin/preview` の `4fd64ef` で作られたReadyなPreview deploymentである。

### 到達確認

| 確認 | 結果 | 判断 |
| --- | --- | --- |
| 通常アクセス `/` | 401。Vercel Deployment Protectionで停止 | smoke不可 |
| 通常アクセス `/api/world` | 401。Vercel Deployment Protectionで停止 | smoke不可 |
| Vercel CLI bypass `/` | 404 `NOT_FOUND` | smoke不可 |
| Vercel CLI bypass `/api/world` | 404 `NOT_FOUND` | smoke不可 |
| Chrome直接表示 `/` | 404 `NOT_FOUND` | smoke不可 |
| alias URL通常アクセス `/` | 401。Vercel Deployment Protectionで停止 | smoke不可 |
| alias URLのVercel CLI bypass `/` | 404 `NOT_FOUND` | smoke不可 |
| alias URLのVercel CLI bypass `/api/world` | 404 `NOT_FOUND` | smoke不可 |

Vercel CLI bypassは、`vercel curl / --deployment <deployment-url>` と `vercel curl /api/world --deployment <deployment-url>` の形式で確認した。Shareable Linkや明示的automation bypass secretの実値は使用・記録していない。

ChromeでPreview URLを直接開いた場合もVercelの404画面になり、Quiz Worldの `/` には到達できなかった。

### build / route確認

前段のGit連携Preview deployment作成時に、build logでNext.js route一覧に `/`、`/signup`、`/login`、`/home`、`/create`、`/quiz/[launchId]`、`/result/[launchId]`、`/admin`、`/api/world` が含まれることは確認済みである。

今回のblockerは、少なくともsmoke実行経路上ではDeployment Protection通過またはrouting到達ができないことにある。`NEXT_PUBLIC_APP_URL` 未設定がbuild blockerでないことは確認済みだが、runtime影響はPreview appへ到達できていないため未確認のままである。

### MVP主要ループ

`/` と `/api/world` に到達できないため、以下のMVP主要ループには進んでいない。

- signup
- login
- question作成
- launch
- /homeでの届いたクイズ確認
- /quiz/[launchId]回答
- /result/[launchId]結果確認
- rating / report
- rank_events確認
- /profile確認
- /admin確認
- admin_audit_logs確認

Preview DBには今回の再実行によるsignup / question / launch / answer / rating / report / admin操作データは作成していないため、Preview DB cleanup / resetは不要である。

### 結果

**NO-GO**。

新しいGit連携Preview deploymentはReadyだが、Step G smokeの入口条件である `/` と `/api/world` 到達を満たせなかった。Preview smoke pass扱いにはしない。`v0.10.0-phase9-preview-ready` tagも作らない。

次の選択肢:

1. VercelのShareable Linkを発行し、実値をdocs/repoに書かずに `/` と `/api/world` へ到達できるか確認する。
2. 明示的automation bypass secretを使い、実値をdocs/repoに書かずに `/` と `/api/world` へ到達できるか確認する。
3. Shareable Linkまたは明示的bypassでも404の場合は、Vercel projectのProtection / routing設定、Framework Preset明示、Root Directory / Output Directory設定を含む修正計画へ進む。

## Step G NO-GO原因調査（Protection通過後404）

2026-05-26 20:25 JSTに、Step G NO-GOの原因を追加調査した。

この調査では、Preview smoke本体、Production deploy、Production env設定、Production custom domain設定、Stripe、Web Push、Realtimeは実行していない。Smart Buzzerにも触っていない。

### 対象確認

| 確認 | 結果 |
| --- | --- |
| 対象Vercel project | `quiz-world-preview` |
| project id | `prj_fCviBUF2fYH077fLBUHV5uPFleMx` |
| 対象deployment | `dpl_GwrDB65DmZxCJs4gA6H9468dmt4k` |
| deployment URL | `https://quiz-world-preview-j5hl87g7x-chop0522s-projects.vercel.app` |
| source / branch / commit | Git連携 / `preview` / `4fd64ef` |
| deployment status | Ready |
| Production Branch | `production-hold` |
| Production env | 未設定 |
| Production custom domain | 未設定。default project domainのみ存在 |
| 追加Production deployment | なし。既存Production deployment 2件のみ |

### Deployment Protection確認

| 確認 | 結果 | 判断 |
| --- | --- | --- |
| 通常アクセス `/` | 401 | Deployment Protectionで停止 |
| 通常アクセス `/api/world` | 401 | Deployment Protectionで停止 |
| owner/adminブラウザ相当のChrome直接表示 `/` | 404 `NOT_FOUND` | Protection通過後またはToolbar経由でもappへ到達できていない |
| Vercel CLI自動bypass `/` | 404 `NOT_FOUND` | Protectionだけではなくrouting / artifact側の問題を疑う |
| Vercel CLI自動bypass `/api/world` | 404 `NOT_FOUND` | 同上 |
| 明示的Automation Bypass `/` | 404 `NOT_FOUND` | 公式bypass方式でもapp routeへ到達できない |
| 明示的Automation Bypass `/api/world` | 404 `NOT_FOUND` | 同上 |
| Shareable Link | 未発行 | 追加の共有リンク作成は行わず、明示的Automation Bypassでpost-protection 404を確認した |

Automation Bypass secretの実値はdocs/repoに記録していない。CLI出力やdocsにもsecret実値を残していない。

この結果から、401はDeployment Protectionとして説明できるが、Protection通過後も404になるため、主因はProtectionだけではない可能性が高い。

### routing / artifact / project設定確認

| 確認 | 結果 | 判断 |
| --- | --- | --- |
| Root Directory | 未指定 / `null` | repo root扱い。`package.json` と `src/app` はrootに存在するため、明確な誤りは見えない |
| Framework Preset | 未指定 / `null` | build logではNext.js 16.2.6としてauto-detectされているが、明示設定はされていない |
| Build Command | 未指定 / `null` | Vercel defaultで `npm run build` が実行されている |
| Output Directory | 未指定 / `null` | Next.js default。誤った固定outputは設定されていない |
| Install Command | 未指定 / `null` | Vercel default |
| `package.json` scripts | `build: next build` | Vercel build logと一致 |
| repo root確認 | `package.json`, `next.config.ts`, `src/app/page.tsx`, `src/app/api/world/route.ts` がcommit `4fd64ef` に存在 | repo rootは正しく見えている |
| build log | `Cloning github.com/chop0522/quiz-world (Branch: preview, Commit: 4fd64ef)` | Git連携Preview deployであることを確認 |
| build log routes | `/`, `/signup`, `/login`, `/home`, `/create`, `/quiz/[launchId]`, `/result/[launchId]`, `/admin`, `/api/world` などが出力 | build時点ではNext.js routesが生成されている |
| deployment metadata | `builds=[]`, `routes=null`, `functions=null` に見える | build logとの不整合があり、Vercel側のartifact / output認識を疑う |
| files API | `File tree not found` | deployment artifactのfile treeを確認できない |

### 原因候補

現時点の有力候補:

1. Vercel Project Settings上のFramework Presetが未指定で、Next.js auto-detect buildは成功しているが、serving / routing metadataが期待通りに構成されていない。
2. deployment metadata上で `routes` / `functions` / file treeが確認できず、build log上のNext.js routesとVercel serving artifactの間に不整合がある。
3. Deployment Protection通過後も404になるため、Shareable Linkだけでは解決しない可能性がある。ただし、完全な人間向け共有導線確認としてShareable Linkはまだ未確認。

低そうな候補:

- repo rootの誤り: rootに `package.json` と `src/app` があり、build logも正しいbranch / commitをcloneしているため、可能性は低い。
- Output Directoryの誤設定: Output Directoryは未指定で、誤った固定値は見つかっていない。
- `NEXT_PUBLIC_APP_URL` 未設定: build blockerではなく、404の直接原因とは判断しにくい。

### 推奨修正方針

Preview smoke再実行前に、以下の順で修正計画を作る。

1. Vercel Project SettingsでFramework PresetをNext.jsに明示する。
2. Root Directoryはrepo rootのままにする。必要なら明示的に空 / repo root扱いであることを確認する。
3. Build Command / Output Directory / Install Commandはまずdefaultのまま維持する。Output Directoryを手動指定しない。
4. Framework Preset明示後、`preview` branchで新しいGit連携Preview deploymentを作り直す。
5. 新deploymentで明示的Automation BypassまたはShareable Linkを使い、`/` と `/api/world` の到達確認を行う。
6. それでも404の場合は、Vercel support / project artifactの詳細確認、またはVercel CLIではなくDashboardのdeployment file/output確認へ進む。

`vercel.json` によるframework明示は、現時点では第一候補にしない。まずVercel Project Settings側のFramework PresetをNext.jsへ明示する方針を優先する。

## Step G NO-GO原因修正（Vercel Project Settings最小変更）

2026-05-26 20:50 JST頃に、Step G NO-GOの有力原因であるVercel serving artifact / routing metadata不整合の切り分けとして、Vercel Project Settingsを最小修正した。

この作業では、Preview smoke本体、Preview deploy、Production deploy、Production env設定、Production custom domain設定、Stripe、Web Push、Realtimeは実行していない。Smart Buzzerにも触っていない。

### 設定変更結果

| 項目 | 変更後 | 判断 |
| --- | --- | --- |
| Vercel project | `quiz-world-preview` | Quiz World専用project |
| Framework Preset | `Next.js` | 未指定 / auto-detectから明示設定へ変更 |
| Root Directory | 未指定 / `null` | repo root/default扱い。誤ったsubdirectoryは指定していない |
| Build Command | 未指定 / `null` | Vercel framework default、または `package.json` の `build: next build` を使う |
| Output Directory | 未指定 / `null` | Next.js default。`.next` や `out` は手動指定していない |
| Install Command | 未指定 / `null` | Vercel default |
| Ignored Build Step | `if [ "$VERCEL_GIT_COMMIT_REF" = "preview" ]; then exit 1; else exit 0; fi` | `preview` branchだけbuildを許可する方針を維持 |
| Production Branch | `production-hold` | main pushがProduction扱いにならない運用を維持 |
| Production env | 未設定 | 変更なし |
| Production custom domain | 未設定。default project domainのみ存在 | 変更なし |

### 影響範囲

- 設定変更のみ。新しいPreview deploymentは作成していない。
- Production deploymentは作成していない。
- Preview smoke本体は再実行していない。
- env実値、Supabase key、Vercel token、bypass secret、初期admin email実値はdocs/repoに記録していない。

### 次の判断

Framework Preset明示後、次回はGit連携Preview deploymentを作り直し、明示的Automation BypassまたはShareable Linkで `/` と `/api/world` の到達確認を行う。到達確認が通るまで、Step GはNO-GOのままとする。

## Step G再実行用 Git連携Preview deployment作成結果（Framework Preset明示後）

2026-05-26 20:59 JSTに、Framework PresetをNext.jsへ明示した設定で、新しいGit連携Preview deploymentを作成した。

この作業では、Step G smoke本体、Production deploy、Production env設定、Production custom domain設定、Stripe、Web Push、Realtimeは実行していない。Smart Buzzerにも触っていない。

### branch更新

| 確認 | 結果 |
| --- | --- |
| 作業前 `origin/main` | `7d63505` |
| 作業前 `origin/preview` | `4fd64ef` |
| 更新後 `origin/preview` | `7d63505` |
| 更新方法 | `origin/main` を `preview` branchへfast-forward push |
| 空commit | 作成していない |

### deployment結果

| 項目 | 結果 |
| --- | --- |
| Preview deployment URL | `https://quiz-world-preview-ri8igtw45-chop0522s-projects.vercel.app` |
| deployment id | `dpl_6YhA6LJudsrnBEbJ4UPdgGPwmUkx` |
| source | Git連携 |
| branch / commit | `preview` / `7d63505` |
| environment | Preview |
| status | Ready |
| duration | 51s |
| branch alias | `quiz-world-preview-git-preview-chop0522s-projects.vercel.app` |

Build logでNext.js routesが出力され、`/`、`/signup`、`/login`、`/home`、`/create`、`/quiz/[launchId]`、`/result/[launchId]`、`/admin`、`/api/world` などが含まれることを確認した。

Production deploymentは追加作成されていない。Vercel deployment一覧では既存Production deployment 2件のみであり、今回新規作成されたものはPreview deploymentである。

secret実値、Supabase key、Vercel token、bypass secret、初期admin email実値はbuild log / docs / repoに記録していない。

### 次の判断

この新Preview deploymentで、次回Step G smokeを再実行する。最初にDeployment Protection通過後の `/` と `/api/world` 到達を確認し、到達できる場合のみMVP主要ループへ進む。到達確認が終わるまでは、Step Gは引き続きNO-GOのままとする。

## 10人テスト前に残る課題

| 優先度 | 課題 | 方針 |
| --- | --- | --- |
| P0 | Preview URLのDeployment Protectionにより通常smoke不可 | Shareable Link、または明示的なautomation bypass secretで `/` と `/api/world` 到達を確認する。実値はdocsに書かない |
| P0 | 新しいGit連携Preview deploymentでもVercel CLI bypassが `404_NOT_FOUND` になる | 自動bypass経路またはVercel projectのProtection / routing設定を切り分ける。Shareable Linkや明示的bypassでも404なら修正計画を作る |
| 解消済み | Framework Presetが未指定 | Vercel Project SettingsでFramework PresetをNext.jsに明示済み。次はGit連携Preview deploymentを作り直す |
| 解消済み | Framework Preset明示後のPreview deployment未確認 | 新しいGit連携Preview deploymentを `preview` / `7d63505` で作成済み。statusはReady |
| P0 | Framework Preset明示後のPreview deployment到達未確認 | 新しいPreview deploymentで `/` と `/api/world` 到達を確認する |
| 解消済み | CLI deploymentのartifact / routingが不審 | Git連携Preview deploymentを `preview` / `4fd64ef` で新規作成済み。ただし新deploymentでもStep GはNO-GO |
| 解消済み | `preview` branchがmainより古い | `preview` branchを最新の `origin/main` である `4fd64ef` に合わせてpush済み |
| P1 | `NEXT_PUBLIC_APP_URL` runtime影響未確認 | Preview到達後に再確認。必要ならPreview URLをPreview envに設定する |
| P1 | Preview DB cleanup要否 | フルsmoke実行後にtest users / quiz / launch / answer / report / audit logの扱いを決める |

## Step Hへ進めるか

**NO-GO**。

Step Hへ進む前に、Step G Preview smokeを完了できるアクセス方法を確定し、Preview URLでMVP主要ループを通す必要がある。

推奨する次アクション:

1. 新しいPreview deploymentで、Shareable Linkまたは明示的Automation Bypassを使い、実値をdocsに書かずに `/`, `/signup`, `/api/world` へ到達できることを確認する。
2. 到達確認後に、MVP主要ループを再実行する。
