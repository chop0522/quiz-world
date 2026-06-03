# Phase 10 Admin Ops Checklist

## 1. 目的

このチェックリストは、Quiz World Preview環境で10人未満〜10人の限定テストを始める前に、owner/adminが安全に運用できることを確認するためのものである。

Phase 10は一般公開ではない。Production環境でもない。Preview URL共有範囲はowner/adminから開始し、まず信頼できる1名、問題がなければ2名目、さらに条件を満たした場合だけ最大10名へ段階的に広げる。

Phase 10ではProduction deploy、Production env、Production custom domain、Stripe、Web Push、Realtimeは扱わない。Smart Buzzerにも触らない。

## 2. Owner/Adminのみで最初に確認する項目

最初にowner/adminだけで確認する。

- [ ] Preview URLをowner/adminだけが把握している
- [ ] Preview URLをSNSや公開ページに出していない
- [ ] Preview DBがseed状態である
- [ ] 初期world `クイズワールド` が存在する
- [ ] world id が `00000000-0000-4000-8000-000000000001` である
- [ ] `member_limit=10` である
- [ ] Preview invite code `SEASON0-PREVIEW-001` がactiveである
- [ ] `SEASON0-TEST-001` をPreview向けに使っていない
- [ ] Production envは未設定である
- [ ] Production custom domainは未設定である
- [ ] 追加Production deployが発生していない
- [ ] Smart BuzzerのSupabase / Vercel / envと混ざっていない

## 3. Preview DB seed状態確認

seed状態として期待するもの:

- 初期worldが1件存在する
- Preview invite code `SEASON0-PREVIEW-001` がactive
- smoke由来のquestions / launches / answers / ratings / reports / rank_events / admin_audit_logsが残っていない
- Auth usersが0、または意図した検証ユーザーのみ

確認対象:

- `worlds`
- `invites`
- `profiles`
- `world_members`
- `questions`
- `quiz_launches`
- `quiz_recipients`
- `answers`
- `question_ratings`
- `reports`
- `rank_events`
- `admin_audit_logs`
- `auth.users`

secret実値、service role key、anon key、DB password、初期admin email実値はdocsに書かない。

## 4. Admin Signup / Login確認

初期admin確認:

- [ ] ADMIN_EMAILSに設定済みのadmin emailでsignupする
- [ ] 18歳以上確認、terms同意、privacy同意を行う
- [ ] Preview invite codeを入力する
- [ ] signup後、`profiles.role = admin` になっていることを確認する
- [ ] `/login` でloginできる
- [ ] `/admin` に入れる
- [ ] login後のheaderにログインボタンが出ない
- [ ] login後のheaderにアカウント導線が出る
- [ ] headerにログアウトボタンが出ない
- [ ] `/account` にログアウトボタンがある
- [ ] `/account/password` でパスワード変更UIが表示される

注意:

- admin email実値はdocsに書かない
- signup後にadmin roleが付かない場合、10人テスト候補へ共有しない
- suspended状態のadminでadmin APIを使えないことは既存仕様として維持する

## 5. /admin 確認

`/admin` で確認する画面:

- [ ] Overview
- [ ] Reports
- [ ] Report Detail
- [ ] Questions
- [ ] Users
- [ ] Waitlist
- [ ] Invites
- [ ] Audit Logs

確認すること:

- [ ] admin以外では入れない
- [ ] admin導線は `profiles.role = admin` かつ `profiles.status = active` のユーザーだけに表示される
- [ ] non-adminにはheaderのadmin導線が表示されない
- [ ] report一覧を取得できる
- [ ] question一覧を取得できる
- [ ] user一覧を取得できる
- [ ] waitlist一覧を取得できる
- [ ] invite一覧を取得できる
- [ ] audit logsを取得できる
- [ ] 危険操作前に対象、操作、reasonを画面内で確認できる

## 6. Invite発行手順

owner/admin確認では `SEASON0-PREVIEW-001` を使う。

信頼できる1〜2名へ広げる段階から、参加者別invite codeをadmin画面で発行する。共通Preview invite code `SEASON0-PREVIEW-001` はowner/admin確認用または予備として扱う。

invite発行チェック:

- [ ] `/admin` のInvitesを開く
- [ ] 発行対象者を決める
- [ ] 必要ならcodeを入力する
- [ ] 未入力ならserver生成を使う
- [ ] reasonを入力する
- [ ] inviteを作成する
- [ ] 作成されたcodeがactiveであることを確認する
- [ ] `admin_audit_logs` に `invite_created` が残ることを確認する

注意:

- invite codeは個別DMなど限定範囲で共有する
- 参加者別invite codeの実値はdocsに書かない
- SNSや公開ページには出さない
- codeを転送しないよう参加者に伝える

## 7. Waitlist確認手順

waitlist確認:

- [ ] `/admin` のWaitlistを開く
- [ ] waiting / invited / joined / rejected の状態を確認する
- [ ] rejectedにする場合はreasonを入力する
- [ ] status更新後、`admin_audit_logs` に `waitlist_status_updated` が残ることを確認する

NO-GO:

- waitlist status更新ができない
- rejectedでreasonなし更新ができてしまう
- audit logが残らない

## 8. Report確認手順

report確認:

- [ ] `/admin` のReportsを開く
- [ ] report一覧を確認する
- [ ] report詳細を開く
- [ ] 対象question、launch、reporter、reasonを確認する
- [ ] statusをreviewing / resolved / dismissedへ更新できる
- [ ] reasonを入力する
- [ ] `admin_audit_logs` に `report_reviewed` が残ることを確認する

NO-GO:

- report一覧が取得できない
- report詳細が見えない
- report status更新でaudit logが残らない

## 9. Question Moderation手順

question moderation:

- [ ] `/admin` のQuestionsを開く
- [ ] 対象questionを確認する
- [ ] `review_required` に変更できる
- [ ] `suspended` に変更できる
- [ ] reasonを入力する
- [ ] `admin_audit_logs` に `question_review_required` または `question_suspended` が残ることを確認する

運用方針:

- `review_required` questionは新規launch不可
- `suspended` questionは新規launch / answer / rating / 通常表示から除外
- 完全削除はしない
- 既存ログやresult用データは監査目的で残す

NO-GO:

- suspended questionが新規launchできてしまう
- audit logなしでmoderationが成立する

## 10. User Suspension手順

user suspension:

- [ ] `/admin` のUsersを開く
- [ ] 対象userを確認する
- [ ] 自分自身ではないことを確認する
- [ ] suspension reasonを入力する
- [ ] userをsuspendedにする
- [ ] `profiles.status = suspended` になることを確認する
- [ ] 対象userの `world_members.status` もsuspendedになることを確認する
- [ ] `admin_audit_logs` に `user_suspended` が残ることを確認する

運用方針:

- 自分自身の停止は禁止
- Phase 10では復帰APIを使わない
- 完全削除はしない

NO-GO:

- 自分自身を停止できてしまう
- `profiles.status` と `world_members.status` がずれる
- audit logが残らない

## 11. Admin Audit Logs確認

admin操作ごとにaudit logを確認する。

対象操作:

- `invite_created`
- `waitlist_status_updated`
- `report_reviewed`
- `question_review_required`
- `question_suspended`
- `user_suspended`

確認すること:

- [ ] admin_user_idが残る
- [ ] actionが正しい
- [ ] target_typeが正しい
- [ ] target_idが正しい
- [ ] reasonが残る
- [ ] metadataが必要に応じて残る
- [ ] created_atが記録される

audit logが残せない場合、管理操作全体を失敗扱いにする。

## 12. 1〜2名に広げる前のGO条件

信頼できる1〜2名へ広げる前のGO条件:

- [ ] owner/adminのsignup / login / `/admin` 確認が通る
- [ ] Preview DBがseed状態から開始できている
- [ ] owner/admin確認用admin userを残したまま開始する方針で問題ない
- [ ] 1〜2名共有前の再cleanupは行わない方針で問題ない
- [ ] 共有前にread-onlyでPreview DB件数だけ軽く確認した
- [ ] Preview invite codeがactive
- [ ] 参加者向け案内文が用意済み
- [ ] 不具合報告窓口はownerへの個別DMに決まっている
- [ ] 専用Slack / Discord / LINEグループは2名以上に広げる段階で再検討する
- [ ] 1名目の参加者別invite codeをadmin画面で発行した
- [ ] 参加者別invite codeの実値をdocsに書いていない
- [ ] Preview URLと参加者別invite codeを個別DMだけで共有する準備ができている
- [ ] report確認手順が通る
- [ ] admin moderation手順が通る
- [ ] admin_audit_logs確認手順が通る
- [ ] header / account / password変更導線をowner/adminで確認した
- [ ] `/home` の参加者向け表示から内部仕様文言が消えている
- [ ] `/create` の参加者向け表示から `active`、`rank events`、`admin moderation`、`local` などの内部説明が消えている
- [ ] `/world` が現在の参加人数、参加枠、残り枠、Seasonの確認に絞られている
- [ ] `/world` に平均評価、良問率、解放条件、累計出題数、累計回答数、通報率、上位出題者/回答者数、次の解放枠が表示されない
- [ ] Preview URLをowner/admin以外へ一括共有していない
- [ ] まず1名から開始し、問題がなければ2名目へ拡張する方針を維持している
- [ ] 最大10名への共有はまだ行わない
- [ ] Production deploy / Production env / Production custom domainに進まない方針が維持されている

## 13. 最大10名に広げる前のGO条件

最大10名へ広げる前のGO条件:

- [ ] 信頼できる1〜2名のsignup / loginが通る
- [ ] 1〜2名でquestion作成、launch、answer、result、rating、reportが通る
- [ ] P0がない
- [ ] P1が修正済み、または既知制約として明文化されている
- [ ] 参加者別invite code運用が可能
- [ ] reportがadminで確認できる
- [ ] user suspensionが必要時に実行できる
- [ ] cleanup手順が確認済み
- [ ] 参加者にPreviewであること、データ削除可能性、不適切投稿禁止を伝えている
- [ ] 1名目で問題がないことを確認してから2名目へ拡張している
- [ ] 10人候補全員への一括共有はまだ行っていない

## 14. テスト終了後cleanup手順

テスト終了後は、Phase 9 cleanup手順を再利用する。

参照:

- `docs/quiz-world/quiz-world-phase-9-preview-cleanup-plan.md`
- `docs/quiz-world/quiz-world-phase-9-preview-cleanup-results.md`
- `supabase/seed.preview.sql`

cleanup方針:

- Preview DB full reset
- migration再適用
- Preview seed再投入
- Auth users件数確認
- Auth usersが残る場合はDashboardまたは管理APIでテストユーザーを整理
- cleanup結果をdocsに記録

cleanup後に残すもの:

- 初期world `クイズワールド`
- world id `00000000-0000-4000-8000-000000000001`
- `member_limit=10`
- Preview invite code `SEASON0-PREVIEW-001`

## 15. NO-GO条件

以下のいずれかがあれば、10人テスト候補へ共有しない。

- Preview DBにStep G smokeデータや意図しない検証データが残っている
- signupできない
- loginできない
- invite codeが使えない
- 参加者別invite codeを発行できない
- 初期adminがadminにならない
- `/admin` に入れない
- invite発行ができない
- report確認ができない
- question moderationができない
- user suspensionができない
- admin_audit_logsが残らない
- 不具合報告窓口が未定
- 最初の1名が未定
- 参加者向け案内文が未準備
- Preview URL共有範囲が未定
- Production envやProduction custom domainが誤って設定されている
- Production deployが追加作成されている
- Smart BuzzerのVercel / Supabase / envと混同している

## 16. Phase 10開始前に人間が決めること

- 最初に共有する信頼できる1名
- 2名目へ広げる判断タイミング
- 参加者別invite codeの命名ルール
- 10人まで広げるタイミング
- テスト終了後cleanupの実行日

決定済み:

- 不具合報告窓口はownerへの個別DM
- 1〜2名共有では参加者別invite codeをadmin画面で発行する
- 共通Preview invite code `SEASON0-PREVIEW-001` はowner/admin確認用または予備
- owner/admin確認用admin userは残したまま開始する
- 1〜2名共有前の再cleanupは行わない
- Preview URL共有は個別DMのみ
- Phase 10の1名テストでは `/world` の平均評価や参加枠解放条件を表示しない
