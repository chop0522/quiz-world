# Phase 8 10-user Local Smoke / Ops Rehearsal Results

## 実行日時

- JST: 2026-05-22 20:49:30
- Smoke executedAt: 2026-05-22T11:46:04.723Z

## 実行環境

- Repository: Quiz World専用リポジトリ
- Runtime: local development only
- App URL: `http://127.0.0.1:3000`
- Supabase: local
- Cloud: 未作成
- Vercel: 未作成
- Stripe: 未使用
- Web Push / Realtime: 未実装
- Production deploy: 未実施

Smart Buzzer の production / Stripe / Vercel / Supabase / env / legal page / cleanup / live key には触れていない。

## 実行コマンド

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

追加で、local dev serverに対してPhase 8 API / UI / DB smokeを実行した。

## 品質チェック結果

| Check | Result |
| --- | --- |
| `git status --short --branch` | pass |
| `.env.local` tracked / stagedなし | pass |
| secret実値がgit diffに含まれない | pass |
| `npx supabase start` | pass |
| `npx supabase db reset` before smoke | pass |
| `npm run typecheck` | pass |
| `npm run lint` | pass |
| `npm run test` | pass: 7 files / 43 tests |
| `npm run build` | pass |
| Phase 8 API / UI / DB smoke | pass: 89 checks |
| `npx supabase db reset` after smoke | pass |

## 確認したユーザー

| Alias | 用途 |
| --- | --- |
| `admin` | `.env.local` の `ADMIN_EMAILS[0]`。実値は結果docsに記録しない。 |
| `userA` | `phase8-user-a-50340929@example.com`。question author / launch author。 |
| `userB` | `phase8-user-b-50340929@example.com`。recipient / 正解回答 / rating確認。 |
| `userC` | `phase8-user-c-50340929@example.com`。recipient / 不正解回答 / report / suspension確認。 |
| `extra1`〜`extra6` | 参加枠10人到達確認。 |
| `waitlistUser` | `phase8-extra-7-50340929@example.com`。満員時waitlist確認。 |

## Smoke Scenario結果

| No. | Scenario | Result |
| --- | --- | --- |
| 1 | admin user を用意する | pass |
| 2 | userA / userB / userC を用意する | pass |
| 3 | admin が invite code を発行する | pass |
| 4 | user が signup する | pass |
| 5 | 参加枠 / waitlist を確認する | pass |
| 6 | userA が question を作成する | pass |
| 7 | userA が active question を launch する | pass |
| 8 | userB / userC に届く | pass |
| 9 | `/home` の15秒ポーリング相当の一覧APIで届いたクイズが見える | pass |
| 10 | start_at 前は問題本文・選択肢が見えない | pass |
| 11 | start_at 後に `/quiz/[launchId]` 用APIで回答できる | pass |
| 12 | userB が正解する | pass |
| 13 | userC が不正解する | pass |
| 14 | `/result/[launchId]` で結果を見る | pass |
| 15 | rating を作成する | pass |
| 16 | report を作成する | pass |
| 17 | rank_events が作られる | pass |
| 18 | `/profile` で score / rank が見える | pass |
| 19 | `/admin` で report を確認する | pass |
| 20 | admin が question を review_required / suspended にする | pass |
| 21 | admin が user を suspended にする | pass |
| 22 | admin_audit_logs が残ることを確認する | pass |

## API / 権限確認結果

| 確認項目 | Result |
| --- | --- |
| admin role assigned from `ADMIN_EMAILS` | pass |
| non-admin が admin API を使えない | pass |
| active question の launch | pass |
| 出題者本人がrecipientにならない | pass |
| userB / userC がrecipientになる | pass |
| `/home` 用一覧で本人宛launchだけ返る | pass |
| `/home` 用一覧で本文・選択肢が返らない | pass |
| start_at前の回答POSTが `not_started` で拒否される | pass |
| start_at後に本文・選択肢が返る | pass |
| `/quiz/[launchId]` で `correctChoiceId` / `categoryNote` が漏れない | pass |
| 正解回答で `answer_rank = 1` / `correct_rank = 1` | pass |
| 不正解回答で `correct_rank = null` | pass |
| 不正解ではrank eventを作らない | pass |
| resultでは `correctChoiceId` を返す | pass |
| resultで `category_note` / email が返らない | pass |
| duplicate rating が409 | pass |
| duplicate report が409 | pass |
| report status更新で audit log が残る | pass |
| `review_required` question は新規launch不可 | pass |
| `suspended` question は新規launch不可 | pass |
| 参加枠10人到達後のsignupが `waitlist_required` | pass |
| waitlist登録 / admin status更新 | pass |
| suspended user は question作成不可 | pass |
| suspended user は answer不可 | pass |
| non-admin が audit logs を読めない | pass |

## UI確認結果

認証済みcookieを使ったlocal HTTP確認で、以下の画面が200を返すことを確認した。

| Page | Status |
| --- | --- |
| `/` | 200 |
| `/home` | 200 |
| `/profile` | 200 |
| `/world` | 200 |
| `/create` | 200 |
| `/quiz/[launchId]` | 200 |
| `/result/[launchId]` | 200 |
| `/admin` | 200 |

補足:

- Codex in-app browserでは `http://localhost:3000/login` の到達と title `ログイン | Quiz World` を確認した。
- ただし、この環境ではブラウザ自動入力が `Browser Use virtual clipboard is not installed` / `Node does not have a layout object` で完了できなかったため、認証後画面の確認はcookie付きHTTPで実施した。
- これはアプリ側の失敗ではなく、ブラウザ自動操作環境の入力制約として扱う。

## DB確認結果

Smoke中のDB確認結果:

| Table / Metric | Count |
| --- | ---: |
| `profiles` | 10 |
| active `world_members` | 9 |
| suspended `world_members` | 1 |
| `questions` | 1 |
| `quiz_launches` | 1 |
| `quiz_recipients` | 3 |
| `answers` | 2 |
| `question_ratings` | 2 |
| `reports` | 1 |
| `rank_events` | 6 |
| `admin_audit_logs` | 6 |
| rejected `waitlist` | 1 |

確認したadmin audit actions:

- `invite_created`
- `report_reviewed`
- `question_review_required`
- `question_suspended`
- `waitlist_status_updated`
- `user_suspended`

## 実行後DB reset状況

Smoke完了後に `npx supabase db reset` を実行し、seed状態へ戻した。

Reset後の確認:

| Item | Result |
| --- | --- |
| world | `クイズワールド`, `member_limit = 10`, `status = active` |
| initial invite | `SEASON0-TEST-001`, `status = active`, `max_uses = 100`, `use_count = 0` |
| `profiles` | 0 |
| `world_members` | 0 |
| `questions` | 0 |
| `quiz_launches` | 0 |
| `quiz_recipients` | 0 |
| `answers` | 0 |
| `question_ratings` | 0 |
| `reports` | 0 |
| `rank_events` | 0 |
| `admin_audit_logs` | 0 |
| `waitlist` | 0 |

## Pass / Fail

- Overall: pass
- Failed items: none
- 修正が必要な項目: none

## 10人テスト前に残る課題

- Supabase cloud projectをいつ作るか。
- Vercel Preview projectをいつ作るか。
- Production環境を10人テスト直前に作るか。
- MVP利用規約・プライバシーポリシー草案の専門家確認。
- 10人テストの招待対象、連絡方法、問い合わせ導線。
- Web Pushなしの画面内通知だけで10人テストに進むか。
- RealtimeをPreview前に入れるか、10人テスト後に回すか。
- ブラウザ自動操作ではなく、人間操作での最終UI rehearsalを別途実施するか。

## git status

実行開始時点:

```text
## main...origin/main
```

結果記録後:

```text
## main...origin/main
 M README.md
 M docs/quiz-world/README.md
?? docs/quiz-world/quiz-world-phase-8-local-smoke-results.md
```

commitはまだ作成していない。
