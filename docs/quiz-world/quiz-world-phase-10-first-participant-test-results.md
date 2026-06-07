# Phase 10 First Participant Test Results

## 1. 目的

Phase 10の信頼できる1名への個別共有開始後に、Preview環境の現在状態、read-only DB確認、admin保護、次のGO/NO-GOを記録する。

この記録では、Preview URL実値、参加者別invite code実値、email実値、Supabase keys、service role key、DB password、Vercel token、bypass secretは書かない。

## 2. 現在状態

実施日: 2026-06-03 JST

| 項目 | 状態 |
| --- | --- |
| 共有済み人数 | 信頼できる1名 |
| 共有方法 | 個別DM |
| 2名目への共有 | 未実施 |
| 10人テスト候補全員への共有 | 未実施 |
| SNS / 公開ページ共有 | 未実施 |
| Production deploy | 未実施 |
| Production env | 未設定 |
| Production custom domain | 未設定 |
| Stripe / Web Push / Realtime | 未実施 |
| Smart Buzzer | 触っていない |

対象Preview deployment:

| 項目 | 内容 |
| --- | --- |
| source | Git連携 |
| branch / commit | `preview` / `8937775` |
| environment | Preview |
| status | Ready |

## 3. GPT Proレビュー反映

GPT Proレビューの判断:

- P0: なし
- 1名テスト継続: GO
- 2名目への拡張: まだ保留
- P1: docsの未共有表現修正、1名参加後read-only DB確認、non-admin導線確認、1名テスト結果docs作成
- P2: `/world` の `Season` 表記、`/create` の `出題可能` 表現、参加人数表示の微調整

今回対応:

- docsのCurrent Statusを「信頼できる1名への個別共有開始済み」に更新
- 2名目、10人テスト候補全員、SNS/公開ページへの共有は未実施として維持
- 1名参加後のread-only DB確認を実施
- admin API保護とadmin導線の実装条件を確認
- 1名テスト結果の記録場所としてこのdocsを作成

## 4. read-only DB確認

対象project:

| 項目 | 内容 |
| --- | --- |
| Supabase project | `quiz-world-preview` |
| project ref | `ogfuohrvzfjmgvdewvcl` |

確認はread-only SQLで実施した。DB変更、cleanup、reset、invite code発行は行っていない。

件数:

| 対象 | 件数 |
| --- | ---: |
| `auth.users` | 2 |
| `profiles` | 2 |
| `world_members` | 2 |
| `waitlist` | 0 |
| `invites` | 2 |
| `questions` | 1 |
| `blocks` | 0 |
| `quiz_launches` | 1 |
| `quiz_recipients` | 1 |
| `answers` | 1 |
| `question_ratings` | 1 |
| `reports` | 0 |
| `rank_events` | 3 |
| `admin_audit_logs` | 1 |

内訳:

| 対象 | 結果 |
| --- | --- |
| `profiles` role / status | admin active 1, user active 1 |
| `world_members` role / status | member active 2 |
| `invites` | active 1件、used 1件 |
| `admin_audit_logs` | `invite_created` 1件 |
| `questions` | active 1件 |
| `quiz_launches` | scheduled 1件 |
| `quiz_recipients` | in_app_ready 1件 |
| `answers` | correct 1件 |
| `question_ratings` | good 1件 |
| `rank_events` | `answer_correct` 1件、`answer_correct_rank_bonus` 1件、`question_rating` 1件 |

初期world / invite:

| 項目 | 結果 |
| --- | --- |
| 初期world `クイズワールド` | activeで存在 |
| world id | `00000000-0000-4000-8000-000000000001` |
| `member_limit` | 10 |
| `current_season` | 0 |
| Preview invite code `SEASON0-PREVIEW-001` | activeで存在 |
| local invite code `SEASON0-TEST-001` | Preview DBには存在しない |

`/api/world`:

| field | value |
| --- | --- |
| `ok` | `true` |
| `activeMemberCount` | `2` |
| `memberLimit` | `10` |
| `remainingSeats` | `8` |
| `currentSeason` | `0` |

解釈:

- `activeMemberCount=2` は、owner/admin確認用ユーザー1名と信頼できる参加者1名で想定通り
- 2名目を追加すると `activeMemberCount=3` になる想定
- Preview DBはseed直後の空状態ではなく、1名テスト開始後の検証データがある状態
- 参加者別invite code実値とemail実値は記録していない

## 5. admin / non-admin導線確認

コード確認:

- headerの`/admin`導線は `profiles.role = admin` かつ `profiles.status = active` の場合だけ表示される
- `/admin` pageと `/api/admin/*` は `getAdminContext()` を通り、active adminのみ許可する
- `/api/admin/invites` などのadmin APIは、未ログイン時に `ログインが必要です。` を返す
- `/invite` は参加者向けの招待コード / waitlist画面であり、adminのinvite code発行画面ではない
- admin向けinvite code発行は `/admin` 内と `/api/admin/invites` で保護されている

Preview確認:

| 対象 | 結果 |
| --- | --- |
| `/api/admin/reports` 未ログイン | `ログインが必要です。` |
| `/api/admin/invites` 未ログイン | `ログインが必要です。` |
| `/api/admin/users` 未ログイン | `ログインが必要です。` |
| `/admin` 未ログイン | `ログインが必要です` を表示 |
| `/invite` 未ログイン | 参加者向け `招待コードとwaitlist` を表示 |

未実施:

- ログイン済みnon-admin本人のブラウザでheaderにAdmin導線が出ないことのライブ確認

理由:

- Codex側では参加者の認証情報を扱わないため

次の扱い:

- 1名テスト継続はGO
- 2名目へ進む前に、参加者本人または通常user相当で、headerにAdmin導線が出ないことを追加確認する
- `/invite` は参加者向け画面として残してよいが、admin用invite発行画面ではないことをadmin ops checklist上で明確にする

## 6. P0 / P1 / P2

P0:

- なし

P1:

- `/profile` で通常ユーザーにraw `role` / `status` が表示されないようにする
- `/profile` から保存できない表示名・通知設定フォームを削除する
- `/profile` から「次Phase」などの内部向け文言を削除する
- 2名目へ進む前に、ログイン済みnon-admin視点でAdmin導線が表示されないことを確認する
- 1名テストの不具合報告、分かりにくかった点、主要ループ進行状況を継続記録する

P2:

- 表示名編集を実装する場合は `/account` 側で保存処理とあわせて扱う
- 通知設定保存、通知モード、quiet hours、1日の通知上限は後続課題として扱う
- `/world` の `Season` 表記を日本語UIへ寄せるか検討する
- `/create` の `出題可能` 表現を参加者反応を見て調整する
- `/world` の参加人数表示を `2 / 10` 形式へまとめるか検討する

## 7. GO / NO-GO

1名テスト継続:

- GO

2名目への拡張:

- まだ保留

2名目へ進む条件:

- 1名テストでP0がない
- `/profile` のP1整理を検証し、通常ユーザーにraw `role` / `status` や保存できないフォームが出ないことを確認する
- ログイン済みnon-admin視点でAdmin導線が出ないことを確認する
- 参加者の不具合報告を確認し、P1があれば修正または既知制約化する
- 2名目用の参加者別invite codeを発行する場合も、実値をdocsに書かない
- 10人テスト候補全員への共有、SNS/公開ページ共有は引き続き行わない

## 8. git / secret確認

- `.env.local` と `.vercel` はcommit対象にしない
- `docs/quiz-world/quiz-world-ios-roadmap.md` は別件の未trackedファイルとして今回対象外
- secret実値、初期admin email実値、Supabase keys、Vercel token、bypass secret、参加者別invite code実値はdocs/repoに書かない

## 9. GPT Proレビュー後の `/profile` P1整理

実施日: 2026-06-06 JST

ユーザーからのスクリーンショットと質問をもとに、GPT Proレビューで `/profile` の表示を確認した。

質問:

- 通常ユーザーに `role` / `status` を見せる必要があるか
- 表示名や通知設定を入力できるが保存ボタンがない項目は何か

GPT Proレビューの判断:

- P0: なし
- 1名テスト継続: GO
- 2名目への拡張: `/profile` P1整理の検証後まで保留
- 通常ユーザーにraw `role` / `status` を見せる必要はない
- 保存できない表示名・通知設定フォームは、参加者に誤解を与えるため削除する
- 「通知設定の保存処理は次Phaseで実装します。」のような内部向け文言は参加者向けUIから削除する

今回の整理方針:

- `/profile` はスコア、ランク、最近の履歴、最小限のプロフィール表示に絞る
- 通常ユーザーにはraw `role` / `status` を表示しない
- admin activeユーザーにだけ、最小の管理者表示を出す
- 保存できない表示名・通知設定フォームを削除する
- 表示名編集、通知設定保存、通知モード、quiet hours、1日の通知上限は後続課題として扱う
- logoutとpassword変更は `/account` に置いたままにする

2名目へ進む前の確認:

- `/profile` にraw `role` / `status` が表示されない
- `/profile` に保存できない表示名・通知設定フォームが表示されない
- `/profile` に「次Phase」などの内部向け文言が表示されない
- 最近の履歴の `event.reason` が内部値ではなく自然な日本語で表示される
- non-adminのadmin導線と `/admin` / `/api/admin/*` 保護が維持されている

補足:

- Phase 6 migration上のrank event reasonは、`正解`、`正解者順位ボーナス`、`難問正解ボーナス`、`良問評価`、`微妙評価`、`答えが曖昧`、`不適切` などの日本語で記録される
- そのため現時点ではreason表示の追加実装修正は不要
- Preview反映後に、実際の `/profile` 最近の履歴で内部値が表示されていないことを確認する

Preview URL、参加者別invite code、email実値、Supabase keys、Vercel token、bypass secretはdocs/repoに書かない。

## 10. `/profile` P1整理 Preview反映

実施日: 2026-06-06 JST

GPT Proレビュー後の `/profile` P1整理commitを `origin/main` へpushし、`preview` branchも同じcommitへ更新した。

対象commit:

- `38b67b5 fix: simplify phase 10 profile participant UI`

Preview deployment:

| 項目 | 値 |
| --- | --- |
| URL | `https://quiz-world-preview-3lkn9dbs8-chop0522s-projects.vercel.app` |
| deployment id | `dpl_Qsoen9DGZBGAvTgmmc3W4k46KobB` |
| target | Preview |
| branch / commit | `preview` / `38b67b5` |
| status | Ready |
| framework | Next.js |

確認結果:

- `origin/main` と `origin/preview` は `38b67b5` を指している
- Vercel deployment targetはPreviewである
- build outputに `/profile`、`/account`、`/account/password`、`/admin` などのroute artifactが含まれている
- `main` push由来のdeploymentはCanceledのPreview扱いであり、Production deploymentは追加作成されていない
- Production env、Production custom domainは未設定のまま
- secret実値、初期admin email実値、Supabase keys、Vercel token、bypass secret、参加者別invite code実値はdocs/repoに書いていない

未実施:

- `/profile` のログイン済み実画面確認
- 通常ユーザーにraw `role` / `status` や保存できないフォームが出ないことのPreview画面確認
- 最近の履歴の `event.reason` が自然な日本語で表示されることのPreview画面確認
- ログイン済みnon-admin視点でAdmin導線が出ないことのライブ確認

判断:

- `/profile` P1整理のPreview反映は完了
- 1名テスト継続はGO
- 2名目への拡張は、Preview反映後の `/profile` 実画面確認とnon-admin導線確認後まで保留

## 11. `/profile` P1整理 Preview反映後確認

実施日: 2026-06-06 JST

対象Preview deployment:

| 項目 | 値 |
| --- | --- |
| URL | `https://quiz-world-preview-3lkn9dbs8-chop0522s-projects.vercel.app` |
| deployment id | `dpl_Qsoen9DGZBGAvTgmmc3W4k46KobB` |
| branch / commit | `preview` / `38b67b5` |
| status | Ready |

確認方法:

- Vercel CLIのDeployment Protection bypassで `/profile`、`/admin`、`/api/admin/users` を確認
- source確認で `/profile` の表示条件と `/admin` / `/api/admin/*` のserver-side protectionを確認
- Chromeの既存ログイン済みタブ確認も試行したが、別の拡張UIが開いていたため自動読み取りはブロックされた

確認結果:

| 項目 | 結果 |
| --- | --- |
| `/profile` route到達 | pass。`プロフィール | Quiz World` のHTMLを返す |
| `/profile` 未ログイン時 | pass。headerはログイン / 登録導線で、ログイン状態確認中の表示になる |
| `/profile` ページ文言 | pass。見出しは `ランクと履歴`、説明は `スコア、ランク、最近の履歴を確認できます。` |
| `/profile` source確認 | pass。通常表示はスコア、ランク、プロフィール表示名、最近の履歴に絞られている |
| raw `role` / `status` 表示 | source上、admin activeの場合だけ `管理者アカウント` badgeを表示し、通常ユーザー向けにraw `role` / `status` を表示しない |
| 保存できない表示名フォーム | pass。`/profile` から入力フォーム、通知モード、quiet hours、1日の通知上限のフォームを削除済み |
| 内部向け「次Phase」文言 | pass。`/profile` から削除済み |
| 最近の履歴reason | source / migration確認では `正解`、`正解者順位ボーナス`、`難問正解ボーナス` など日本語reasonを表示する |
| `/admin` 未ログイン保護 | pass。`アクセスできません`、`401`、`ログインが必要です。` を返す |
| `/api/admin/users` 未ログイン保護 | pass。401で `ログインが必要です。` を返す |
| Production deployment | pass。追加Production deploymentなし |
| Production env / custom domain | pass。未設定のまま |
| secret実値 | pass。docs/repoに記録していない |

未完了:

- 最新Preview上のログイン済み通常ユーザー実画面で、raw `role` / `status` と保存できないフォームが出ないことの目視確認
- ログイン済みnon-admin視点でAdmin導線が出ないことの目視確認

補足:

- `/account` には現在も最小プロフィール情報として `status` 表示が残っている。今回のP1対象は `/profile` だったため変更していないが、参加者向けUIからraw状態表示をさらに減らすなら、次の軽微なUI整理候補にする。
- `/admin` の未ログイン画面にはadmin判定条件の説明が残っている。admin向けrouteのためP1扱いにはしていないが、参加者が直接アクセスした場合の表示をさらに自然にするなら後続候補にする。

判断:

- `/profile` P1整理のPreview反映後確認は、CLI / sourceで確認できる範囲はpass
- Chromeログイン済み実画面確認は未完了
- 1名テスト継続はGO
- 2名目への拡張は、通常ユーザー本人またはownerの手動確認で `/profile` とAdmin導線の実画面確認を終えるまで保留

## 12. 通常ユーザー実画面確認

実施日: 2026-06-06 JST

通常ユーザーとしてログインした状態で、最新Preview deploymentの `/profile` と `/admin` 直接アクセスを確認した。

対象:

- Preview deployment URL: `https://quiz-world-preview-3lkn9dbs8-chop0522s-projects.vercel.app`
- branch / commit: `preview` / `38b67b5`

確認結果:

| 項目 | 結果 |
| --- | --- |
| `/profile` 表示 | pass。`ランクと履歴`、回答ランク、出題ランク、回答スコア、出題スコア、プロフィール、最近の履歴が表示される |
| raw `role` 表示 | pass。通常ユーザー画面に表示されない |
| raw `status` 表示 | pass。通常ユーザー画面に表示されない |
| admin badge | pass。通常ユーザー画面に `管理者アカウント` は表示されない |
| 保存できない表示名フォーム | pass。入力フォームは表示されない |
| 通知設定フォーム | pass。通知モード、quiet hours、1日の通知上限、深夜通知許可などは表示されない |
| 内部向け「次Phase」文言 | pass。表示されない |
| 最近の履歴 | pass。`クイズ評価` / `良問評価` のような自然な日本語で表示される |
| headerのAdmin導線 | pass。通常ユーザーには表示されない |
| `/admin` 直接アクセス | pass。403で `activeなadmin権限が必要です。` と表示される |
| Production deployment | pass。追加Production deploymentなし |

判断:

- `/profile` P1整理の通常ユーザー実画面確認はpass
- non-adminのAdmin導線非表示と `/admin` 直接アクセス拒否もpass
- 1名テスト継続はGO
- 2名目への限定共有はGO候補

ただし、2名目への共有実行はまだ行っていない。2名目へ進む場合も、参加者別invite code実値はdocs/repoに書かず、個別DMでのみ共有する。10人テスト候補全員への共有、SNS/公開ページ共有、Production deploy、Production env設定、Production custom domain設定、Stripe、Web Push、Realtimeは引き続き行わない。

## 13. GPT Pro追加レビュー後の `/account` / `/admin` 小P1整理

実施日: 2026-06-07 JST

GPT Proへ、通常ユーザーの `/profile` 確認結果、`/account` のstatus表示、`/admin` 非許可画面の内部説明、forgot password / username変更 / avatar設定の優先度をレビュー依頼した。

判断:

- 1名テスト継続はGO
- 2名目への限定共有はまだ保留
- 2名目へ進む前に、`/account` のraw `status` 表示と `/admin` 非許可画面の内部説明を小P1として整理する
- forgot passwordはPhase 10の1〜2名テストではP2とし、まずはownerへの個別DMサポートで運用する
- username変更はP2。実装する場合は `/account` に保存ボタンと保存APIをセットで置く
- avatar設定はP3。Web Previewの1〜2名テストでは不要

今回の小P1整理:

- `/account` から raw `status` / `active` 表示を削除する
- `/admin` 非許可画面から `profiles.role` / `profiles.status` / `Phase 7 admin` などの内部説明を削除する
- `/admin` 非許可画面は「管理者専用ページです」「このページを利用する権限がありません」などの自然な文言にする
- `/admin` page と `/api/admin/*` のserver-side protectionは維持する

2名目へ進む前の追加確認:

- `/account` にraw `status` / `active` が表示されない
- non-adminまたは未ログインで `/admin` を開いたとき、内部DB条件が表示されない
- non-adminのheaderにAdmin導線が出ない
- `/admin` 直接アクセスと `/api/admin/*` は引き続き拒否される
- Production deploy、Production env、Production custom domain、Stripe、Web Push、Realtimeは引き続き行わない
- 参加者別invite code実値、初期admin email実値、secret実値はdocs/repoに書かない

local実装・検証結果:

- `/account` は表示名、パスワード変更、ログアウトに絞り、raw `status` / `active` 表示を削除した
- `/admin` 非許可画面は `管理者だけが利用できるページです。` と `このページを利用する権限がありません。` を表示する
- `/admin` page と `/api/admin/*` のserver-side protectionは `profiles.role` / `profiles.status` ベースで維持する
- `npm run typecheck`: pass
- `npm run lint`: pass
- `npm run test`: pass、7 files / 43 tests
- `npm run build`: pass
- secret実値、初期admin email実値、参加者別invite code実値はdiffに含めていない

次の確認:

- Preview deploymentへ反映する
- Preview上の `/account` と `/admin` 非許可画面を確認する
- 2名目への限定共有はPreview確認後に再判断する
