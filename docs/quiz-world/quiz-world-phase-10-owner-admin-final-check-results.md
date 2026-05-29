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

上記により、1名限定共有はGO候補になった。ただし、Preview URL共有自体はまだ実行していない。10人テスト候補全員への共有、SNS公開、Production deployはまだNO-GO。

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
