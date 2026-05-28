# Phase 10 10-User Test Plan

## 1. Phase 10の目的

Phase 10の目的は、Phase 9で用意したQuiz World Preview環境を使い、10人未満から最大10人までの限定テストを安全に始められる状態にすることである。

これは一般公開ではない。Production環境でもない。Preview環境で、owner/adminが管理できる範囲に絞ってMVP主要ループの使い勝手、運用手順、不具合報告、moderation対応を確認する。

Phase 10で確認すること:

- signup / login / invite code / waitlist が実ユーザーに伝わるか
- question作成、launch、answer、result、rating、reportの流れが通るか
- `/profile` のscore / rank / recent rank_eventsが最低限理解できるか
- `/admin` でreport、question、user、waitlist、invite、audit logsを確認・操作できるか
- 10人以下の限定運用で、問い合わせ、通報、cleanupを回せるか

Phase 10ではProduction deploy、Stripe、Web Push、Realtimeは扱わない。Smart Buzzerにも触らない。

## 2. テスト参加者方針

参加者は段階的に増やす。

| 段階 | 対象 | 目的 | 共有範囲 |
| --- | --- | --- | --- |
| Step 1 | owner/adminのみ | Preview seed状態からsignup、admin role、admin画面を再確認する | 非公開 |
| Step 2 | 信頼できる1〜2名 | 初回説明文、signup、回答導線、不具合報告の伝わり方を確認する | 個別共有 |
| Step 3 | 最大10名 | MVP主要ループ、通報、moderation、cleanupまで確認する | 限定共有 |

固定方針:

- SNSや公開ページにはPreview URLを出さない
- 10人テスト候補全員への一括共有は、owner/admin確認後に行う
- 参加者にはPreviewテストであることを明示する
- テストデータは削除される可能性があることを明示する
- 18歳以上であることを参加条件にする

## 3. 招待コード方針

候補は2つある。

### A. 共通Preview invite codeを使う

`SEASON0-PREVIEW-001` を参加者に共有する。

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

### 推奨

最初はowner/admin確認で `SEASON0-PREVIEW-001` を使う。

信頼できる1〜2名へ広げる段階から、参加者別invite codeをadmin画面で発行する方針を推奨する。最大10名に広げる場合も、参加者別invite codeを基本にする。

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

案内文にはPreview URL、invite code、問い合わせ先を追記して使う。ただし、SNSや公開ページには掲載しない。

## 5. テスト手順

参加者向けの基本手順:

1. Preview URLを開く
2. `/signup` でemail/password登録する
3. 18歳以上確認、terms同意、privacy同意を行う
4. invite codeを入力する
5. `/login` でログインできることを確認する
6. `/home` を確認する
7. `/create` で四択クイズを作成する
8. active questionをlaunchする
9. 他参加者の `/home` に届いたクイズが表示されることを確認する
10. start_at前に問題本文・選択肢が見えないことを確認する
11. start_at後に `/quiz/[launchId]` で回答する
12. `/result/[launchId]` で結果を見る
13. ratingを作成する
14. reportを作成する
15. `/profile` でscore / rank / recent rank_eventsを見る

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
- profileのrank説明は最小表示で、詳細なヘルプはまだない
- `/world` の補助指標は最小表示で、詳細な運用指標はまだない
- Production env、Production custom domain、Production deployは未実施
- Stripeは未実施

## 8. 不具合報告方法

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

報告窓口はPhase 10開始前に決める。候補はownerへのDM、専用Slack/Discord/LINEグループ、または共有メモである。

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
- 参加者向け案内文が用意済み
- 不具合報告窓口が決定済み
- Preview URL共有範囲が決定済み
- Production deploy、Production env、Production custom domainに進まない方針が維持されている
- Smart Buzzerと混ざらないことを確認済み

## 11. NO-GO条件

以下のいずれかがあれば、10人テスト候補への共有は行わない。

- Preview DBにStep G smokeデータが残っている
- signupできない
- loginできない
- invite codeが使えない
- 初期adminがadminにならない
- `/admin` に入れない
- report / admin moderationが動かない
- Preview URL共有範囲が未定
- 不具合報告窓口が未定
- 参加者向け案内文が未準備
- Production envやProduction custom domainが誤って設定されている
- Smart BuzzerのVercel / Supabase / envと混同している

## 12. Phase 10完了条件

Phase 10の完了条件:

- owner/adminのみの確認が完了する
- 信頼できる1〜2名の限定テストを実施する
- 必要なら最大10名まで広げる
- signupからadmin moderationまでの主要ループをPreviewで確認する
- P0がない
- P1を修正するか既知制約として明文化する
- 10人テスト後のcleanup方針と実行結果を記録する
- 次に進むか、修正Phaseを挟むか判断する
