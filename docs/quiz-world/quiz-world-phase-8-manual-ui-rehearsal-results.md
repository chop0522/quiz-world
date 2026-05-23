# Phase 8 Manual UI Rehearsal Results

## 実行概要

| 項目 | 結果 |
| --- | --- |
| 実行日時 | 2026-05-23 00:01:55 JST |
| 対象 | Supabase local上のQuiz World |
| 実行範囲 | Phase 8 manual UI rehearsal planに基づく主要画面の人間操作相当確認 |
| cloud環境 | 作成していない |
| production deploy | 実行していない |
| Smart Buzzer | 触っていない |
| 実装変更 | 行っていない |
| DB migration SQL追加 | 行っていない |

## 実行コマンド

```bash
git status --short --branch
git status --short | rg "\.env|env\.local" || true
git diff | rg -n "(sb_secret_|sb_publishable_|sk_live_|sk_test_|SUPABASE_SERVICE_ROLE_KEY=|NEXT_PUBLIC_SUPABASE_ANON_KEY=)" || true
npx supabase start
npx supabase db reset
npm run typecheck
npm run lint
npm run test
npm run build
npm run dev -- --hostname 127.0.0.1
```

補助確認として、local API、local Postgres、ブラウザDOM snapshotを使った。
waitlist満員状態はlocal DBの `worlds.member_limit` を一時的に現在参加人数へ合わせて確認し、rehearsal後に `npx supabase db reset` でseed状態へ戻した。

## 品質確認

| コマンド | 結果 |
| --- | --- |
| `npm run typecheck` | pass |
| `npm run lint` | pass |
| `npm run test` | pass。7 files / 43 tests passed |
| `npm run build` | pass |
| `npx supabase db reset` | pass |

## 使用ユーザー

| Alias | 用途 | 結果 |
| --- | --- | --- |
| `ManualAdmin` / `admin@example.com` | UI signup、admin画面確認 | pass |
| `ManualUserA` / `manual-user-a@example.com` | question author、recipient確認 | pass |
| `ManualUserB` / `manual-user-b@example.com` | recipient、正解回答、rating/report、profile確認 | pass |
| `ManualUserC` / `manual-user-c@example.com` | 不正解回答、user suspension対象 | pass |
| `ManualWaitlist` / `manual-waitlist@example.com` | 満員時waitlist確認 | pass |
| `ManualAdminApi` / `manual-admin-api@example.com` | admin API操作確認用 | pass |

## UI確認結果

| ID | 確認項目 | 対象 | 結果 | メモ |
| --- | --- | --- | --- | --- |
| UI-01 | 18歳以上確認が分かりやすい | `/signup` | pass | 「私は18歳以上です。MVPでは生年月日は保存しません。」が明確。 |
| UI-02 | 利用規約同意が分かりやすい | `/signup` | pass | link付きcheckboxで確認しやすい。 |
| UI-03 | privacy同意が分かりやすい | `/signup` | pass | link付きcheckboxで確認しやすい。 |
| UI-04 | invite code入力が分かりやすい | `/signup` | pass | `SEASON0-TEST-001` placeholder、確認ボタン、Season 0説明あり。 |
| UI-05 | 満員時waitlist導線が分かりやすい | `/signup`, `/invite` | pass | signup APIで満員時 `waitlist_required` を確認。`/invite` にwaitlist登録フォームあり。 |
| UI-06 | login導線が分かりやすい | `/login` | pass | email/password入力と登録導線は明確。 |
| UI-07 | 届いたクイズが分かりやすい | `/home` | pass | 届いた数、受付中、polling、開始前、カード表示を確認。 |
| UI-08 | start_at前に問題が見えない理由が分かる | `/home`, `/quiz/[launchId]` | pass | `/home` は「問題文と選択肢は開始後」と表示。`/quiz` は「start_atまで待機中」を表示。 |
| UI-09 | 選択肢が押しやすい | `/quiz/[launchId]` | pass | 四択ボタンは十分な高さで押しやすい。 |
| UI-10 | 回答済み状態が分かる | `/quiz/[launchId]` | pass | 回答後、選択肢disabled、正誤、answer_rank、correct_rank、結果リンクを確認。 |
| UI-11 | answer_rankが分かる | `/result/[launchId]` | pass | 「全回答者内」と併記され、全回答者一覧でも順位確認可能。 |
| UI-12 | correct_rankが分かる | `/result/[launchId]` | pass | 「正解者内」と併記され、不正解者は `-` 表示。 |
| UI-13 | ratingが迷わず使える | `/result/[launchId]` | needs_improvement | 3段階と理由タグは明確。送信後もフォームが残るため、評価済み状態の明示が弱い。 |
| UI-14 | reportが迷わず使える | `/result/[launchId]` | needs_improvement | 通報理由と送信導線は明確。送信後もボタンが残るため、通報済み状態の明示が弱い。 |
| UI-15 | score / rank / rank_eventsが理解できる | `/profile` | needs_improvement | score、rank、直近eventsは見える。rank閾値や次ランクまでの説明はない。 |
| UI-16 | admin reportsが確認しやすい | `/admin` | pass | reports一覧、detail、report count、review候補説明を確認。 |
| UI-17 | admin危険操作が安全に見える | `/admin` | needs_improvement | 削除ではなく停止方針は明示。危険操作はnative prompt/confirm中心で、操作前の差分確認UIは弱い。 |
| UI-18 | admin reason入力が十分 | `/admin` | needs_improvement | reason必須/推奨は機能する。native promptのため、入力内容を画面内で見直しにくい。 |
| UI-19 | worldの参加枠/シーズンが分かる | `/world` | pass | 参加人数、参加枠、残り枠、Season表示を確認。 |
| UI-20 | legal pagesがsignup前提と矛盾しない | `/legal/terms`, `/legal/privacy` | pass | 18歳以上限定、18歳未満不可、生年月日非保存、MVP草案の位置づけはsignup前提と整合。 |

## 主要シナリオ結果

| シナリオ | 結果 | メモ |
| --- | --- | --- |
| admin signup | pass | ブラウザで `/signup` からadmin登録し、`/home` 到達を確認。 |
| user signup | pass | userA/userB/userCをlocal APIで作成。 |
| waitlist | pass | 満員時signupは `waitlist_required`。`POST /api/waitlist` で登録成功。 |
| question作成 | pass | userAがactive四択questionを作成。 |
| launch作成 | pass | userAがlaunch作成。recipient 3件。 |
| `/home` polling表示 | pass | userBで届いたクイズ1件を確認。 |
| start_at前表示 | pass | `/home` と別launchの `/quiz/[launchId]` で問題本文・選択肢非表示を確認。 |
| 回答 | pass | userB正解、userC不正解。answer_rank/correct_rankを確認。 |
| result | pass | 自分の正誤、全回答者、未回答者、正解選択肢を確認。 |
| rating | pass | userBで `good` / `面白い` 相当の評価を作成。 |
| report | pass | userBで `不適切` reportを作成。 |
| rank_events | pass | userB profileで正解、正解者順位、難問正解eventを確認。 |
| admin reports | pass | `/admin` reports、detail、report countを確認。 |
| admin moderation | pass | admin APIでreport reviewing、question review_required/suspended、user suspended、waitlist rejected、invite createdを確認。 |
| audit logs | pass | `/admin` Audit Logsで6件のadmin_audit_logsを確認。 |
| non-admin admin拒否 | pass | userBで `/admin` を開き、403相当表示を確認。 |
| suspended制御 | pass | suspended questionの再launchは422。suspended userはprofile/world_memberともsuspended。 |

## DB確認

reset前のlocal確認用データ:

| テーブル | 件数 |
| --- | ---: |
| `profiles` | 5 |
| `world_members` | 5 |
| `questions` | 4 |
| `quiz_launches` | 3 |
| `answers` | 2 |
| `question_ratings` | 1 |
| `reports` | 1 |
| `rank_events` | 4 |
| `admin_audit_logs` | 6 |
| `waitlist` | 1 |

実行後のreset結果:

| 確認 | 結果 |
| --- | --- |
| `npx supabase db reset` | pass |
| `worlds` | 1件 |
| `invites` | 1件 |
| `profiles` | 0件 |
| `questions` | 0件 |
| `quiz_launches` | 0件 |
| `admin_audit_logs` | 0件 |
| `world.member_limit` | 10 |
| seed invite code | `SEASON0-TEST-001` |

## 改善候補

### P0

なし。

### P1

| 項目 | 内容 | 推奨対応 |
| --- | --- | --- |
| 古いPhase文言 | global footerに「Phase 4はSupabase localの回答送信実装」と出る。`/create` には「配信、通知、回答、結果表示はまだ実装しません」「Phase 3では...回答、順位、結果表示はまだ行いません」という古い文言が残っている。 | 10人テスト前にMVP現在状態の説明へ更新する。 |
| admin危険操作UI | 停止・moderationのreason入力がnative prompt中心。実行前に対象、操作、reasonを画面内で見直すUIではない。 | 10人テスト前に直すか、admin運用上の既知制約として明記する。 |

P1対応状況:

- 2026-05-23にglobal footerと `/create` の古いPhase文言を現在のMVP local状態へ更新した。
- 2026-05-23にadmin危険操作UIをnative prompt/confirm中心から、対象、操作、reasonを画面内で見直してから実行する簡易確認UIへ最小改善した。
- 完全なadmin UX改善ではなく、10人テスト前の誤操作リスクを下げるためのMVP最小改善として扱う。

P1再確認結果:

| 項目 | 結果 | メモ |
| --- | --- | --- |
| 実行日時 | pass | 2026-05-23 16:19:40 JST |
| 実行環境 | pass | Supabase localのみ。cloud環境、production deploy、Vercel、Stripeは未作成。 |
| `npm run typecheck` | pass | `tsc --noEmit` 通過。 |
| `npm run lint` | pass | `eslint .` 通過。 |
| `npm run test` | pass | 7 files / 43 tests passed。 |
| `npm run build` | pass | Next.js build 通過。 |
| global footer | pass | 「Phase 4はSupabase localの回答送信実装」は残っていない。現在状態の文言を表示。 |
| `/create` header | pass | 「配信、通知、回答、結果表示はまだ実装しません」は残っていない。 |
| `/create` form説明 | pass | 「Phase 3では...回答、順位、結果表示はまだ行いません」は残っていない。 |
| admin確認UI | pass | user停止前に対象、操作、reason、実行、キャンセルを画面内で確認できる。 |
| native prompt / confirm依存 | pass | P1確認対象のuser停止ではnative prompt/confirmに依存しない。 |
| admin操作 | pass | `P1Target` を `suspended` に更新でき、既存admin操作は壊れていない。 |
| admin_audit_logs | pass | `user_suspended` / `user` のaudit logが作成され、reasonも保存された。 |
| 実行後DB reset | pass | P1再確認後に `npx supabase db reset` でseed状態へ戻した。 |

### P2

| 項目 | 内容 | 推奨対応 |
| --- | --- | --- |
| rating/report送信後状態 | 成功メッセージは出るが、送信済みフォームやボタンが残る。重複時はAPIで止まるが、UI上は再送できそうに見える。 | 送信済み表示、disabled化、または「MVPでは更新不可」の明示を追加する。 |
| profileのrank説明 | score/rank/eventsは見えるが、次のrankまでの条件や閾値は表示されない。 | 10人テストのフィードバック次第でrank説明を追加する。 |
| `/world` の補助指標 | 参加人数/参加枠は実データだが、平均評価や進捗の一部はサンプル的に見える。 | 実データ化するまで「MVP参考値」などを明示する。 |
| legal文言 | termsに「Phase 1は画面内通知」とある。signup前提とは矛盾しないが、現在Phaseとはずれる。 | 「MVP初期は画面内通知」などに言い換える。 |

P2対応状況:

- 2026-05-23にrating送信後の「評価済み」表示、rating UIのdisabled化、「MVPでは評価の変更はできません」の明示を追加した。
- 2026-05-23にreport送信後の「通報済み」表示、report UIのdisabled化、重複通報できない旨の明示を追加した。
- 2026-05-23に利用規約草案の「Phase 1は画面内通知」を「MVP初期は画面内通知」に修正した。
- `profile` のrank説明と `/world` の補助指標は、10人テスト前の既知制約として残す。

## 10人テスト前に必須修正する項目

P0はない。

P1は2026-05-23に最小修正済み。

10人テスト前には、必要に応じてP1修正後の限定的なmanual UI再確認を行う。
P2のうちrating/report送信後状態とlegal文言は2026-05-23に最小修正済み。
`profile` のrank説明と `/world` の補助指標は、10人テスト前の既知制約として扱う。

## Phase 9 Preview環境へ進めるか

現時点では、機能の主要ループ自体はlocalで通っている。

P1は最小修正済みのため、Phase 9 Preview環境へ進む前に以下を確認する。

1. 古いPhase文言が残っていないことを確認する。
2. admin危険操作の画面内確認UIで対象、操作、reasonを見直せることを確認する。
3. P2を10人テスト前に直すか、既知制約として扱うか判断する。

推奨は、P1修正後の限定確認を通してからPhase 9 Preview環境検討へ進むこと。

## git status

rehearsal開始時:

```text
## main...origin/main
```

結果docs作成後は、このファイルが未commit差分として残る。

## commit

まだcommitしていない。
