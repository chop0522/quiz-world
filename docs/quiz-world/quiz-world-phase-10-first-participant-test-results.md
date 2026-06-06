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
