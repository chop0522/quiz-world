# 通知型早押しクイズワールド MVPテスト計画

## 目的

MVPの主要仕様が実装時に壊れないよう、unit / integration / E2E / RLS / admin / 10人運用テストの観点を整理する。

このドキュメントはテスト計画であり、テストコードはまだ作成しない。

## テスト種別

| 種別 | 目的 |
| --- | --- |
| unit test | ランク計算、日時判定、バリデーションなど小さなロジックを確認。 |
| integration test | APIとDBの連携、権限、重複制約、server-side判定を確認。 |
| E2E test | signupから出題、回答、結果、admin対応まで画面で確認。 |
| RLS policy test | ユーザーが見てはいけないデータを読めないことを確認。 |
| admin操作テスト | adminのみ操作可能、操作ログが残ることを確認。 |
| 10人運用テスト | 実際の小規模運用で通知疲れ、順位納得感、安全導線を確認。 |

## unit test候補

- 招待コード形式チェック。
- 18歳以上確認/規約同意の必須判定。
- start_at = created_at + 15秒。
- end_at = start_at + 60秒。
- answer_rank計算。
- correct_rank計算。
- 出題者スコア計算。
- 回答者スコア計算。
- quiet hours判定。
- 通知上限判定。
- カテゴリ許可判定。
- 理由タグ許可判定。

## integration test候補

- `POST /api/signup`
- `POST /api/invites/validate`
- `POST /api/waitlist`
- `POST /api/questions`
- `POST /api/quiz-launches`
- `POST /api/quiz-launches/[id]/answer`
- `GET /api/quiz-launches/[id]/result`
- `POST /api/quiz-launches/[id]/rating`
- `POST /api/reports`
- `POST /api/blocks`
- admin API

## E2E test候補

1. adminが招待コードを発行する。
2. ユーザーが招待コードでsignupする。
3. 10人まで参加できる。
4. 11人目はwaitlistへ誘導される。
5. ユーザーが四択クイズを作成する。
6. 出題すると対象者に `/home` で届く。
7. start_at前は問題が見えない。
8. start_at後に回答できる。
9. 回答後に結果が見える。
10. 評価と通報ができる。
11. adminが通報を確認し、クイズを停止する。

## RLS policy test

| ケース | 期待結果 |
| --- | --- |
| 他人のprofile詳細を読む | 必要最小限以外は不可。 |
| 他人の通知設定を読む | 不可。 |
| 未参加worldの詳細を読む | 不可。 |
| 他人のwaitlistを見る | 不可。 |
| invites一覧を見る | admin以外不可。 |
| start_at前にquestion bodyを読む | recipientでも不可。 |
| 配信対象外launchを読む | 不可。 |
| 他人宛quiz_recipientsを見る | 不可。 |
| 回答前に他人のanswersを見る | 不可。 |
| rank_eventsを他人が見る | 不可。 |
| admin_audit_logsを見る | admin以外不可。 |

## admin操作テスト

- admin以外は `/admin` に入れない。
- admin以外はadmin APIが403。
- adminは通報一覧を見られる。
- adminはquestion.statusをsuspendedにできる。
- adminはuser/profile.statusをsuspendedにできる。
- adminはmember_limitを変更できる。
- member_limitを現在参加人数より小さくできない。
- admin操作はadmin_audit_logsに残る。
- 操作ログ記録失敗時の扱いを確認する。

## 重要なテストケース

| ケース | 期待結果 |
| --- | --- |
| 18歳以上確認なしでsignup | 不可。 |
| 規約同意なしでsignup | 不可。 |
| プライバシーポリシー同意なしでsignup | 不可。 |
| 招待コードなしで参加 | 不可。 |
| 無効な招待コード | 不可。 |
| 参加枠10人超過 | waitlistへ。 |
| 出題者本人への配信 | されない。 |
| ブロック相手への配信 | されない。 |
| quiet hours中のユーザー | 配信されない。 |
| 通知上限到達ユーザー | 配信されない。 |
| start_at前 | 問題が見えない。 |
| end_at後 | 回答不可。 |
| 同一launch重複回答 | 不可。 |
| 回答前の結果閲覧 | 不可。 |
| 回答後の結果閲覧 | 可。 |
| 評価 | 回答者のみ可能。 |
| 通報 | 対象ユーザーのみ可能。 |
| admin API | adminのみ可能。 |
| suspended user | 出題/回答不可。 |

## 10人運用テスト

確認する指標。

- 7日間継続できるか。
- 半数以上が3日以上参加するか。
- 1日平均5問以上出題されるか。
- 通知が不快すぎないか。
- 回答順位が納得できるか。
- 評価/通報導線が使われるか。
- ランク上昇が理解されるか。
- もう少し続けたい反応があるか。

## テストで意図的に確認しないこと

- Stripe課金。
- Web Pushの本格送信。
- ギルド。
- DM、コメント、タイムライン。
- 本番cloud負荷試験。

## Phase 0で決めること

- テストランナー。
- E2Eで使うseedデータ。
- adminユーザーの作り方。
- RLS policy testをどの環境で実行するか。
- Phase 1.5 Realtime testは `/home` の本人宛 quiz_recipients 新着に限定する。
