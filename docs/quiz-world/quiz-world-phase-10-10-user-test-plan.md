# Phase 10 10-User Test Plan

## 1. Phase 10の目的

Phase 10の目的は、Phase 9で用意したQuiz World Preview環境を使い、10人未満から最大10人までの限定テストを安全に始められる状態にすることである。

これは一般公開ではない。Production環境でもない。Preview環境で、owner/adminが管理できる範囲に絞ってMVP主要ループの使い勝手、運用手順、不具合報告、moderation対応を確認する。

Phase 10で確認すること:

- signup / login / invite code / waitlist が実ユーザーに伝わるか
- question作成、launch、answer、result、rating、reportの流れが通るか
- `/profile` のscore / rank / recent rank_eventsが最低限理解できるか
- login状態に応じたheader導線、`/account`、logout、password変更導線が分かりやすいか
- `/admin` でreport、question、user、waitlist、invite、audit logsを確認・操作できるか
- 10人以下の限定運用で、問い合わせ、通報、cleanupを回せるか

Phase 10ではProduction deploy、Stripe、Web Push、Realtimeは扱わない。Smart Buzzerにも触らない。

## 2. テスト参加者方針

参加者は段階的に増やす。

| 段階 | 対象 | 目的 | 共有範囲 |
| --- | --- | --- | --- |
| Step 1 | owner/adminのみ | Preview seed状態からsignup、admin role、admin画面を再確認する | 非公開 |
| Step 2a | 信頼できる1名 | 初回説明文、signup、回答導線、不具合報告の伝わり方を最小人数で確認する | 個別DM。開始済み |
| Step 2b | 2名目 | 1名目で大きな問題がなければ、2名目へ拡張して複数人のlaunch / answer導線を確認する | 個別DM |
| Step 3 | 最大10名 | MVP主要ループ、通報、moderation、cleanupまで確認する | 限定共有 |

固定方針:

- SNSや公開ページにはPreview URLを出さない
- 信頼できる1名への個別共有は開始済み
- 1名テストでP0/P1がないことを確認してから2名目へ拡張する
- 最大10名への共有はまだ行わない
- 10人テスト候補全員への一括共有はまだ行わない
- 参加者にはPreviewテストであることを明示する
- テストデータは削除される可能性があることを明示する
- 18歳以上であることを参加条件にする

## 3. 招待コード方針

方針は以下に固定する。

### A. 共通Preview invite codeを使う

`SEASON0-PREVIEW-001` を参加者に共有する案。

メリット:

- 運用が簡単
- Preview seed状態からすぐ始められる
- 参加者が少ない間は管理しやすい

デメリット:

- 誰がどのinvite経由で入ったかを追いにくい
- codeが転送されると意図しない参加が起きる可能性がある

### B. 参加者別invite codeをadmin画面で発行する

adminが参加者ごとにinvite codeを発行する。

メリット:

- 参加者ごとの導線を追いやすい
- code共有範囲を管理しやすい
- 10人テストの運用リハーサルとしてadmin invite機能も確認できる

デメリット:

- admin操作が増える
- 参加者ごとのcode管理が必要になる

### 決定済み方針

最初はowner/admin確認で `SEASON0-PREVIEW-001` を使う。

信頼できる1〜2名へ広げる段階から、参加者別invite codeをadmin画面で発行する。共通Preview invite code `SEASON0-PREVIEW-001` はowner/admin確認用または予備として扱う。

参加者別invite codeの実値はdocsに書かない。共有時はPreview URLと参加者別invite codeを個別DMで渡す。SNSや公開ページには出さない。

2026-06-03時点で、信頼できる1名への個別共有は開始済みである。2026-06-07時点で、2名目共有前のGPT Proレビュー、read-only DB確認、admin保護確認、2名目用invite発行は完了済みである。参加者別invite codeの実値はdocsに書かない。2名目へのPreview URL / invite code共有実行はまだ行っていない。

## 4. 参加者向け案内文

以下をベースに、個別DMや限定共有用の文章として使う。

```text
Quiz WorldのPreviewテストに協力してほしいです。

これは一般公開前のPreview環境です。Productionではありません。
テスト中のデータは、確認後に削除される可能性があります。

参加条件:
- 18歳以上の方のみ利用できます
- 不適切な投稿や迷惑行為は禁止です
- 不具合や分かりにくい点があれば報告してください

試してほしいこと:
1. signup / login
2. 四択クイズの作成
3. 届いたクイズへの回答
4. 結果画面の確認
5. rating / report
6. profileのscore / rank確認

不適切な問題を見つけた場合は、結果画面のreportから通報してください。
報告時は、画面名、操作手順、期待した結果、実際の結果、スクリーンショット有無を教えてください。
```

案内文にはPreview URL、参加者別invite code、不具合報告先を追記して使う。ただし、docsには実値を書かず、SNSや公開ページにも掲載しない。

## 5. テスト手順

参加者向けの基本手順:

1. Preview URLを開く
2. `/signup` でemail/password登録する
3. 18歳以上確認、terms同意、privacy同意を行う
4. invite codeを入力する
5. `/login` でログインできることを確認する
6. login後にheaderからログインボタンが消え、アカウント導線が出ることを確認する
7. `/account` のログアウト導線と `/account/password` のパスワード変更導線を確認する
8. `/home` を確認する
9. `/create` で四択クイズを作成する
10. active questionをlaunchする
11. 他参加者の `/home` に届いたクイズが表示されることを確認する
12. start_at前に問題本文・選択肢が見えないことを確認する
13. start_at後に `/quiz/[launchId]` で回答する
14. `/result/[launchId]` で結果を見る
15. ratingを作成する
16. reportを作成する
17. `/profile` でscore / rank / recent rank_eventsを見る

テスト時の観点:

- 迷わず次の画面へ進めるか
- エラー文言が理解できるか
- 何を待てばよいか分かるか
- rating / reportを重複送信できそうに見えないか
- start_at前に問題が見えない理由が分かるか

## 6. 管理者手順

adminは以下を確認する。

1. `/admin` に入れることを確認する
2. invite codeを発行する
3. waitlistを確認する
4. report一覧を確認する
5. report詳細を確認する
6. questionを `review_required` にできることを確認する
7. questionを `suspended` にできることを確認する
8. userを `suspended` にできることを確認する
9. admin操作ごとにreasonを入力する
10. `admin_audit_logs` が残ることを確認する

admin操作の注意:

- 完全削除は行わない
- user停止は慎重に行う
- 自分自身を停止しない
- reasonには、後から見て理由が分かる内容を書く
- admin操作後は、対象、操作、reason、audit logを確認する

## 7. 既知制約

Phase 10開始時点の既知制約:

- Web Pushは未実装
- Realtimeは未実装
- 通知は画面内表示と `/home` のポーリング中心
- `NEXT_PUBLIC_APP_URL` は未設定だが、現時点ではbuild / runtime blockerではない
- Preview URLはDeployment Protection配下
- Preview URL共有範囲はowner/adminから段階的に広げる
- `/profile` はスコア、ランク、最近の履歴の確認に絞る
- 表示名編集や通知設定保存は後続課題
- `/world` の補助指標は最小表示で、詳細な運用指標はまだない
- Production env、Production custom domain、Production deployは未実施
- Stripeは未実施

## 8. 不具合報告方法

不具合報告先は、まずownerへの個別DMにする。専用Slack / Discord / LINEグループは、2名以上に広げる段階で再検討する。

不具合報告は以下のテンプレートで集める。

```text
画面名:
操作手順:
期待した結果:
実際の結果:
エラー文:
スクリーンショット:
発生日時:
使った端末/ブラウザ:
補足:
```

分類:

| 優先度 | 内容 | 対応方針 |
| --- | --- | --- |
| P0 | signup不可、login不可、回答不可、admin不可、データ破壊の疑い | 10人テスト停止。修正優先 |
| P1 | 主要ループは通るが、参加者が迷う、危険操作が分かりにくい | 10人テスト前または途中で修正判断 |
| P2 | 表示改善、説明追加、軽微な操作感 | 既知制約として記録し、次Phaseで整理 |

報告窓口はownerへの個別DMに決定済みである。participant guideの不具合報告テンプレートを使う。

## 9. テスト終了後のcleanup

10人テスト後はPreview DBをcleanupする。

基本方針:

- Preview DB resetを行う
- migrationを再適用する
- `supabase/seed.preview.sql` を再投入する
- Auth users件数を確認する
- Auth usersが残る場合は、Dashboardまたは管理APIでテストユーザーを整理する
- cleanup結果をdocsに記録する

残す初期データ:

- 初期world `クイズワールド`
- world id `00000000-0000-4000-8000-000000000001`
- `member_limit=10`
- Preview invite code `SEASON0-PREVIEW-001`

cleanup前に残すべき運用メモ:

- 参加者数
- 作成されたquestion数
- launch数
- answer数
- report数
- admin操作数
- 重大不具合
- 次Phaseで直す項目

## 10. GO条件

Phase 10開始のGO条件:

- `v0.10.0-phase9-preview-ready` tagが作成・push済み
- Preview DBがseed状態
- 初期worldが存在する
- Preview invite code `SEASON0-PREVIEW-001` がactive
- owner/adminがPreview URLへ到達できる
- owner/adminがsignup / login / `/admin` を確認できる
- `/account` と `/account/password` の導線をowner/adminで確認できる
- headerにlogoutを出さず、logoutは `/account` に置く方針が反映されている
- 参加者向け案内文が用意済み
- 不具合報告窓口が決定済み
- Preview URL共有範囲が決定済み
- まず信頼できる1名から開始し、問題がなければ2名目へ拡張する方針が決定済み
- 信頼できる1名への個別共有を開始済みである
- 1〜2名共有では参加者別invite codeをadmin画面で発行する方針が決定済み
- 共通Preview invite code `SEASON0-PREVIEW-001` はowner/admin確認用または予備として扱う
- 1〜2名共有前の再cleanupは行わず、共有前にread-onlyでPreview DB件数だけ確認する方針が決定済み
- Production deploy、Production env、Production custom domainに進まない方針が維持されている
- Smart Buzzerと混ざらないことを確認済み

## 11. NO-GO条件

以下のいずれかがあれば、10人テスト候補への共有は行わない。

- Preview DBにStep G smokeデータが残っている
- signupできない
- loginできない
- login後もheaderにログインボタンが出続ける
- logoutがheaderに出ている
- `/account` または `/account/password` が使えない
- invite codeが使えない
- 初期adminがadminにならない
- `/admin` に入れない
- report / admin moderationが動かない
- Preview URL共有範囲が未定
- 不具合報告窓口が未定
- 参加者別invite code発行方針が未定
- 1名テスト結果の記録がないまま2名目へ進もうとしている
- non-admin導線確認が未整理のまま2名目へ進もうとしている
- 参加者向け案内文が未準備
- Production envやProduction custom domainが誤って設定されている
- Smart BuzzerのVercel / Supabase / envと混同している

## 12. Phase 10完了条件

Phase 10の完了条件:

- owner/adminのみの確認が完了する
- 信頼できる1名の限定テストを実施し、結果を記録する
- 問題がなければ2名目の限定テストを実施する
- 必要なら最大10名まで広げる
- signupからadmin moderationまでの主要ループをPreviewで確認する
- P0がない
- P1を修正するか既知制約として明文化する
- 10人テスト後のcleanup方針と実行結果を記録する
- 次に進むか、修正Phaseを挟むか判断する
