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

## 10人テスト前に残る課題

| 優先度 | 課題 | 方針 |
| --- | --- | --- |
| P0 | Preview URLのDeployment Protectionにより通常smoke不可 | owner/adminブラウザ、Shareable Link、または明示的なautomation bypass secretのいずれかで `/` 到達を確認する。実値はdocsに書かない |
| P0 | `vercel curl` bypassが `404_NOT_FOUND` になる | 自動bypass経路の問題か、deployment artifact / root / output問題かを切り分ける。Shareable Linkや明示的bypassでも404なら修正計画を作る |
| P1 | `NEXT_PUBLIC_APP_URL` runtime影響未確認 | Preview到達後に再確認。必要ならPreview URLをPreview envに設定する |
| P1 | Preview DB cleanup要否 | フルsmoke実行後にtest users / quiz / launch / answer / report / audit logの扱いを決める |

## Step Hへ進めるか

**NO-GO**。

Step Hへ進む前に、Step G Preview smokeを完了できるアクセス方法を確定し、Preview URLでMVP主要ループを通す必要がある。

推奨する次アクション:

1. Vercel Deployment画面からowner/adminブラウザでPreview URLを開けるか確認する。
2. 開けない場合はShareable Linkを発行し、実値をdocsに書かずに `/` 到達を確認する。
3. Shareable Linkでも404なら、automation bypass secretを明示指定する確認を行う。secret実値はdocs/repoに書かない。
4. 明示的bypassでも404なら、deployment artifact / root / output / CLI deploy methodの問題として扱い、Preview smoke再実行へ進まず修正計画を作る。
5. Preview URLで `/`, `/signup`, `/api/world` へ到達できることを確認してから、MVP主要ループを再実行する。
