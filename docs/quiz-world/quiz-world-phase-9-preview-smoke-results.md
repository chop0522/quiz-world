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

## 10人テスト前に残る課題

| 優先度 | 課題 | 方針 |
| --- | --- | --- |
| P0 | Preview URLのDeployment Protectionにより通常smoke不可 | owner/adminが通せる認証手順、Vercel protection bypass、または一時的な保護設定の見直しを決める |
| P0 | `vercel curl` bypassが `404_NOT_FOUND` になる | Vercel Dashboard / CLIでbypass対象deployment、project protection設定、deployment URLの扱いを再確認する |
| P1 | `NEXT_PUBLIC_APP_URL` runtime影響未確認 | Preview到達後に再確認。必要ならPreview URLをPreview envに設定する |
| P1 | Preview DB cleanup要否 | フルsmoke実行後にtest users / quiz / launch / answer / report / audit logの扱いを決める |

## Step Hへ進めるか

**NO-GO**。

Step Hへ進む前に、Step G Preview smokeを完了できるアクセス方法を確定し、Preview URLでMVP主要ループを通す必要がある。

推奨する次アクション:

1. Vercel Deployment Protectionのowner/adminアクセス方法を確認する。
2. `vercel curl` bypassが404になる原因をVercel project/deployment設定で確認する。
3. 必要ならPreview deployment protection bypass secretを設定し、値はdocs/repoに書かずに再smokeする。
4. Preview URLで `/`, `/signup`, `/api/world` へ到達できることを確認してから、MVP主要ループを再実行する。
