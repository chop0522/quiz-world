# Phase 8 Manual UI Rehearsal Plan

## 1. 目的

Phase 8 manual UI rehearsalでは、自動smokeでは確認しきれない「人間がブラウザで操作したときの導線・表示・分かりやすさ」を確認する。

対象はSupabase local上のQuiz Worldのみとする。Supabase cloud project、Vercel project、Stripe、production deploy、Web Push、Realtimeには進まない。Smart Buzzerには触れない。

このrehearsalは機能追加ではなく、10人テスト前のUI/運用確認である。実装変更が必要な問題を見つけた場合は、その場で大きく直さず、結果として記録して次の作業判断に回す。

## 2. 前提

- Phase 1〜7 local実装は完了・push・tag済み。
- Phase 8 local smoke / ops rehearsal results はcommit・push・tag済み。
- Tag: `v0.9.0-phase8-local-smoke`
- Phase 8 API / UI / DB smoke は89 checks pass。
- Smoke後に `npx supabase db reset` でseed状態へ戻し済み。
- 今回はSupabase localのみで確認する。

## 3. 確認対象画面

| 画面 | 目的 |
| --- | --- |
| `/signup` | 18歳以上確認、規約同意、privacy同意、invite code入力、満員時waitlist誘導。 |
| `/login` | email/password loginの分かりやすさ。 |
| `/home` | 届いたクイズ、状態、15秒ポーリング表現。 |
| `/create` | 四択クイズ作成、active/draft、出題導線。 |
| `/quiz/[launchId]` | start_at前、回答受付中、回答済み、締切済み。 |
| `/result/[launchId]` | 正誤、answer_rank、correct_rank、全回答者、未回答者、rating/report。 |
| `/profile` | score、rank、rank_events、状態表示。 |
| `/admin` | reports、questions、users、waitlist、invites、audit logs、危険操作の確認。 |
| `/world` | 参加人数、参加枠、シーズン、world状態。 |
| `/invite` | invite code、waitlist、Season 0の招待制説明。 |
| `/legal/terms` | MVP草案としての利用規約表示。 |
| `/legal/privacy` | MVP草案としてのprivacy表示。 |

## 4. 事前準備

### 4.1 local環境

```bash
git status --short --branch
npx supabase start
npx supabase db reset
npm run typecheck
npm run lint
npm run test
npm run build
npm run dev -- --hostname 127.0.0.1
```

確認URL:

- `http://127.0.0.1:3000`
- `http://localhost:3000`

### 4.2 テストユーザー

| Alias | 用途 |
| --- | --- |
| admin | `.env.local` の `ADMIN_EMAILS[0]`。invite発行、report確認、moderation確認。 |
| userA | question作成者、launch実行者。 |
| userB | recipient、正解回答、rating。 |
| userC | recipient、不正解回答、report。 |
| waitlistUser | 参加枠満員時のwaitlist確認。 |

メールアドレスはlocal専用の一意な値にする。例:

- `manual-admin@example.com`
- `manual-user-a@example.com`
- `manual-user-b@example.com`
- `manual-user-c@example.com`
- `manual-waitlist@example.com`

### 4.3 確認用クイズ

人間が迷わず正解/不正解を作れる問題を使う。

例:

- 問題文: `2 + 2 はどれですか？`
- 選択肢:
  - `4`
  - `3`
  - `5`
  - `22`
- 正解: `4`
- difficulty: `4`
- category: `雑学`
- status: `active`

## 5. 手順

### 5.1 signup / login

1. `/signup` を開く。
2. 18歳以上確認、利用規約同意、プライバシーポリシー同意、invite code入力を確認する。
3. admin / userA / userB / userC を登録する。
4. `/login` でそれぞれログインできることを確認する。
5. `/profile` でrole/status/world member状態を確認する。

見る観点:

- 18歳未満は使えないことが明確か。
- 保護者同意があってもMVPでは不可であることが伝わるか。
- 利用規約とprivacyへのリンクが見つけやすいか。
- invite codeが必須であることが分かるか。
- 登録後に次に何をすればよいか分かるか。

### 5.2 waitlist

1. 参加枠10人に到達する状態を作る。
2. `waitlistUser` でsignupを試す。
3. 満員時の表示とwaitlist導線を確認する。
4. `/invite` でもwaitlist状態や招待制の説明を確認する。

見る観点:

- 満員理由が分かるか。
- waitlistに登録する意味が分かるか。
- 登録済みなのか、まだ待機中なのかが分かるか。

### 5.3 question作成 / launch

1. userAで `/create` を開く。
2. 四択クイズを作成する。
3. active questionとして保存する。
4. 作成済み問題一覧から「出題する」導線を確認する。
5. launch成功後、何が起きたか分かるか確認する。

見る観点:

- 問題文、選択肢、正解選択、difficulty、categoryが迷わず入力できるか。
- 選択肢が4つ固定であることが自然に分かるか。
- draft / active の意味が分かるか。
- 不適切内容への注意が見えるか。
- 出題後に `/home` や出題済み状態へ自然に進めるか。

### 5.4 `/home` の届いたクイズ

1. userB / userCで `/home` を開く。
2. 15秒ポーリングで届いたクイズが見えることを確認する。
3. start_at前、受付中、締切済みの表示を確認する。

見る観点:

- 届いたクイズが一目で分かるか。
- 出題者名、カテゴリ、難易度、開始時刻、締切時刻が分かるか。
- start_at前に問題本文と選択肢が見えない理由が伝わるか。
- 「開く」導線が分かりやすいか。

### 5.5 `/quiz/[launchId]` の回答

1. userBで `/quiz/[launchId]` をstart_at前に開く。
2. 問題本文・選択肢が見えない状態を確認する。
3. start_at後に問題本文と選択肢が表示されることを確認する。
4. userBは正解、userCは不正解で回答する。
5. 回答済み状態を確認する。
6. end_at後は回答できないことを確認する。

見る観点:

- カウントダウンが分かりやすいか。
- 「まだ問題が見えない理由」が分かるか。
- 選択肢が押しやすいか。
- 選択済み状態が分かるか。
- 送信ボタンが見つけやすいか。
- 回答後に再回答できないことが分かるか。
- 次にresultを見る流れが自然か。

### 5.6 `/result/[launchId]`

1. userB / userCで `/result/[launchId]` を開く。
2. 自分の正誤を確認する。
3. `answer_rank` と `correct_rank` を確認する。
4. 全回答者一覧、未回答者一覧を確認する。
5. ratingを作成する。
6. reportを作成する。

見る観点:

- `answer_rank` が「全回答者内の回答順位」だと分かるか。
- `correct_rank` が「正解者だけの順位」だと分かるか。
- 不正解の場合に `correct_rank` がない理由が分かるか。
- 正解選択肢が分かりやすいか。
- ratingの3段階が自然か。
- 理由タグが1つだけで迷わないか。
- report導線が目立ちすぎず、必要なときに見つかるか。

### 5.7 `/profile`

1. userBで `/profile` を開く。
2. answer_score / answer_rank を確認する。
3. userAで `/profile` を開く。
4. questioner_score / questioner_rank を確認する。
5. rank_eventsの表示を確認する。

見る観点:

- 回答ランクと出題ランクの違いが分かるか。
- scoreとrankの関係が理解できるか。
- rank_eventsが何の履歴か分かるか。
- 減点イベントがあった場合に不安を与えすぎないか。

### 5.8 `/admin`

1. adminで `/admin` を開く。
2. non-adminで `/admin` を開き、利用できないことを確認する。
3. reports一覧とreport詳細を確認する。
4. report status更新を確認する。
5. questionを `review_required` にする。
6. questionを `suspended` にする。
7. userを `suspended` にする。
8. waitlist status更新を確認する。
9. invite code発行を確認する。
10. audit logsを確認する。

見る観点:

- admin画面で危険操作が目立ちすぎず、埋もれすぎていないか。
- question/user停止操作の確認ダイアログが十分か。
- reason入力が必須/推奨であることが分かるか。
- 操作後に何が変わったか分かるか。
- audit logsで操作履歴を追えるか。
- 完全削除ではなく停止であることが伝わるか。

### 5.9 `/world` / `/invite` / legal pages

1. `/world` を開く。
2. 参加人数、参加枠、シーズンを確認する。
3. `/invite` を開く。
4. Season 0の招待制とwaitlist導線を確認する。
5. `/legal/terms` と `/legal/privacy` を開く。

見る観点:

- ワールド、参加枠、シーズンの意味が分かるか。
- 10人制限が制約ではなく世界観として伝わるか。
- legal pagesがMVP草案として不足なく見えるか。
- signupからlegalへ移動して戻る流れで迷わないか。

## 6. Pass / Fail 表

実行時は以下の表をコピーして結果docに記録する。

| ID | 確認項目 | Page | Result | Notes |
| --- | --- | --- | --- | --- |
| UI-01 | 18歳以上確認が分かりやすい | `/signup` | pending |  |
| UI-02 | 利用規約同意が分かりやすい | `/signup` | pending |  |
| UI-03 | privacy同意が分かりやすい | `/signup` | pending |  |
| UI-04 | invite code入力が分かりやすい | `/signup` | pending |  |
| UI-05 | 満員時waitlist導線が分かりやすい | `/signup`, `/invite` | pending |  |
| UI-06 | login導線が分かりやすい | `/login` | pending |  |
| UI-07 | 届いたクイズが分かりやすい | `/home` | pending |  |
| UI-08 | start_at前に問題が見えない理由が分かる | `/home`, `/quiz/[launchId]` | pending |  |
| UI-09 | 選択肢が押しやすい | `/quiz/[launchId]` | pending |  |
| UI-10 | 回答済み状態が分かる | `/quiz/[launchId]` | pending |  |
| UI-11 | answer_rankが分かる | `/result/[launchId]` | pending |  |
| UI-12 | correct_rankが分かる | `/result/[launchId]` | pending |  |
| UI-13 | ratingが迷わず使える | `/result/[launchId]` | pending |  |
| UI-14 | reportが迷わず使える | `/result/[launchId]` | pending |  |
| UI-15 | score / rank / rank_eventsが理解できる | `/profile` | pending |  |
| UI-16 | admin reportsが確認しやすい | `/admin` | pending |  |
| UI-17 | admin危険操作が安全に見える | `/admin` | pending |  |
| UI-18 | admin reason入力が十分 | `/admin` | pending |  |
| UI-19 | worldの参加枠/シーズンが分かる | `/world` | pending |  |
| UI-20 | legal pagesがsignup前提と矛盾しない | `/legal/terms`, `/legal/privacy` | pending |  |

Resultは `pass` / `fail` / `needs_improvement` / `not_checked` のいずれかにする。

## 7. UI改善候補の記録フォーマット

| Priority | Area | Issue | Suggested Fix | 10人テスト前必須 |
| --- | --- | --- | --- | --- |
| P0 |  |  |  | yes/no |
| P1 |  |  |  | yes/no |
| P2 |  |  |  | yes/no |

Priorityの基準:

- P0: 10人テスト前に直さないと主要ループが成立しない。
- P1: 10人テスト前に直した方がよい。混乱や誤操作が起きやすい。
- P2: 10人テスト後でもよい改善。

## 8. 10人テスト前に直すべき項目の判断基準

以下に該当する場合は、10人テスト前の修正候補にする。

- signupで18歳以上確認、terms/privacy、invite codeの意味が分からない。
- waitlistに入ったのか、失敗したのか判断できない。
- 届いたクイズが `/home` で見つからない。
- start_at前に問題が見えないことをバグだと感じる。
- 回答後に送信できたか分からない。
- resultで自分の正誤や順位が分からない。
- rating/reportが怖すぎる、または見つからない。
- rank_eventsが罰則のように見えすぎる。
- admin停止操作に確認やreasonが足りず、誤操作しそう。
- suspended / review_required の意味がadmin画面で分からない。

## 9. Phase 9 Preview環境へ進む条件

Phase 9 Preview環境検討へ進む条件は次の通り。

- Phase 8 automated smoke resultsがpass済みである。
- Manual UI rehearsalでP0が0件である。
- P1が残る場合、10人テスト前に直すか、既知制約として扱うか判断済みである。
- signup、home、quiz、result、profile、adminの主要導線を人間が説明なしで1周できる。
- admin操作の誤操作リスクが許容範囲に収まっている。
- legal草案がMVP草案としてsignup導線と矛盾しない。
- Supabase cloud / Vercel Previewを作るタイミングを明示的に判断できる。
- Smart Buzzerとは引き続き完全分離されている。

## 10. 今回作らないもの

- 実装変更
- DB migration SQL
- Supabase cloud project
- Vercel project
- Stripe連携
- Web Push
- Realtime
- production deploy
- 本番法務確定
- Smart Buzzer関連作業
