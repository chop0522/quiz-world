# 通知型早押しクイズワールド Phase 1 signup/auth 実装方針

## 目的

Phase 1では、Quiz Worldに参加できるユーザーを安全に限定するための signup / login / 参加判定の土台を作る。

このドキュメントは実装前の方針整理であり、まだ実装コード、DB migration SQL、Supabase / Vercel / Stripe などのcloud環境作成は行わない。

Phase 0のローカル土台はcommit済みである。
Phase 1では Supabase local を前提に、Smart Buzzer とは完全に分離して進める。

## Phase 1で扱う範囲

Phase 1では、登録時に次の条件をすべて確認する。

- signup。
- login。
- 18歳以上確認。
- 利用規約同意。
- プライバシーポリシー同意。
- 招待コード検証。
- 参加枠確認。
- 満員時のwaitlist誘導。

既存の `quiz-world-implementation-task-breakdown.md` では、認証をPhase 1、invite / waitlistをPhase 2として分けている。
実装時は、ユーザー登録体験として `/signup` に招待コードと参加枠確認が必要になるため、Phase 1で最小限のinvite / waitlist判定まで含める。

## Supabase localの使い方

Phase 1では Supabase local を前提にする。

| 項目 | 方針 |
| --- | --- |
| Supabase | localを推奨する。 |
| cloud project | まだ作らない。 |
| fallback | localが難しい場合のみ、Quiz World専用development projectを検討する。 |
| Production | 10人テスト直前まで作らない。 |
| Smart Buzzer | 既存Supabase projectとは絶対に混ぜない。 |

### Phase 1で必要になるlocal作業

- Supabase CLIのlocal起動。
- Authのemail login確認。
- local DBにMVP最小テーブルを用意する準備。
- seedで初期world、初期invite、初期adminを入れる準備。

ただし、このドキュメント作成時点では migration SQL や seed SQL はまだ作らない。

## 初期admin付与方法

### ADMIN_EMAILS env案

`ADMIN_EMAILS` に初期adminメールアドレスを設定する。

```env
ADMIN_EMAILS=example@example.com
```

Phase 1では、signup完了時またはseed処理時に、認証済みユーザーのemailが `ADMIN_EMAILS` に含まれる場合だけ `profiles.role = admin` を付与できる。

### seed案

Supabase localのseedで、初期world、招待コード、初期admin profileを作成する。

seedはlocal開発の再現性が高く、Phase 1のテストデータを揃えやすい。

### MVP推奨

MVPでは `ADMIN_EMAILS env + seed` を推奨する。

| 項目 | 方針 |
| --- | --- |
| admin許可リスト | `ADMIN_EMAILS` を使う。 |
| local初期化 | seedでadmin profileを作る。 |
| signup時の扱い | emailが `ADMIN_EMAILS` に含まれる場合は `profiles.role = admin` を付与してよい。 |
| 権限判定 | admin画面/APIは `profiles.role = admin` を主判定にする。 |

理由:

- 初期10人テストではadmin数が少なく、envで十分管理できる。
- seedでlocal開発環境を再現しやすい。
- 手動SQLだけに依存すると、環境差分が起きやすい。
- 将来の複数admin運用にも移行しやすい。

## NOTIFICATION_PHASEの扱い

Phase 0〜Phase 1では、通知Phaseの切り替えをenvで運用しない。

MVP初期はコード定数でよい。

```ts
const NOTIFICATION_PHASE = "polling";
```

理由:

- Phase 1では通知方式を切り替える運用がない。
- Phase 1の対象はsignup/authが中心であり、通知実装はまだ本格化しない。
- Phase 1通知は `/home` の15秒ポーリング方針で固定済み。
- RealtimeやWeb Pushを入れる段階でenv化すればよい。

`.env.example` に将来用の値が残る場合でも、Phase 1実装ではコード定数を優先する。

## 必要テーブル

Phase 1で必要になる最小テーブルは次のとおり。

| テーブル | Phase 1での用途 |
| --- | --- |
| `profiles` | ユーザーの表示名、role、status、同意日時、通知初期設定を持つ。 |
| `worlds` | Season 0の1ワールド、参加枠 `member_limit = 10` を持つ。 |
| `world_members` | ワールド参加状態を持つ。 |
| `invites` | 管理者発行の招待コードを検証する。 |
| `waitlist` | 参加枠超過時や参加保留者を登録する。 |

### profiles

Phase 1で最低限必要な項目:

- `id`
- `display_name`
- `role`
- `status`
- `age_confirmed_at`
- `terms_accepted_at`
- `privacy_accepted_at`
- `created_at`
- `updated_at`

方針:

- `role` は `user` / `admin`。
- `status` は `active` / `suspended`。
- MVPでは生年月日は保存しない。
- 18歳以上確認は `age_confirmed_at` として保存する。

### worlds

Phase 1で最低限必要な項目:

- `id`
- `name`
- `member_limit`
- `current_season`
- `status`
- `created_at`
- `updated_at`

方針:

- MVPでは1件だけ作る。
- 初期値は `member_limit = 10`。
- `status = active` のworldだけsignup対象にする。

### world_members

Phase 1で最低限必要な項目:

- `id`
- `world_id`
- `user_id`
- `role`
- `status`
- `joined_at`

方針:

- `role` は `member` / `world_admin`。
- MVPのadmin画面判定は `profiles.role = admin` を使う。
- `world_members.role` は将来の複数ワールド向けに残す。
- `status = active` の人数を参加枠カウントに使う。

### invites

Phase 1で最低限必要な項目:

- `id`
- `world_id`
- `invited_by`
- `code`
- `status`
- `expires_at`
- `created_at`

方針:

- Season 0は管理者発行の招待コード制。
- 一般ユーザーによる招待は不可。
- `code` はunique。
- `status` は `active` / `used` / `expired` / `revoked` を想定する。

### waitlist

Phase 1で最低限必要な項目:

- `id`
- `email`
- `display_name`
- `status`
- `created_at`

方針:

- 参加枠が満員の場合は `waitlist` へ誘導する。
- `email` の重複登録を防ぐ。
- `status` は `waiting` / `invited` / `joined` / `rejected` を想定する。

## 必要API

Phase 1で必要なAPIは次のとおり。

| API | 目的 |
| --- | --- |
| `POST /api/signup` | signup、同意確認、招待コード検証、参加枠確認、profile/world_member作成を行う。 |
| `POST /api/invites/validate` | 招待コードが有効か確認する。 |
| `POST /api/waitlist` | 満員時や参加保留時にwaitlist登録する。 |
| `GET /api/world` | 現在のworld、参加人数、参加枠、Seasonを返す。 |
| `GET /api/profile` | 自分のprofileと参加状態を返す。 |

### `POST /api/signup`

目的:

- 18歳以上確認、利用規約同意、プライバシーポリシー同意、招待コード、参加枠をサーバー側で検証する。
- 条件を満たす場合だけ `profiles` と `world_members` を作成する。

必ずサーバー側で行う判定:

- 18歳以上チェックがtrueか。
- terms同意がtrueか。
- privacy同意がtrueか。
- 招待コードが有効か。
- worldがactiveか。
- `world_members.status = active` の人数が `world.member_limit` 未満か。
- 同一ユーザーのprofileが重複作成されないか。
- `ADMIN_EMAILS` に含まれるemailなら `profiles.role = admin` にするか。

満員時:

- `world_members` は作成しない。
- waitlist導線に必要な状態を返す。
- 必要に応じて `POST /api/waitlist` を呼ばせる。

### `POST /api/invites/validate`

目的:

- signup前に招待コードの有効性を確認する。

必ずサーバー側で行う判定:

- codeが存在するか。
- `status = active` か。
- `expires_at` を過ぎていないか。
- 対象worldがactiveか。

返却方針:

- 有効/無効の結果を返す。
- 未使用コードの詳細情報を過度に返さない。

### `POST /api/waitlist`

目的:

- 参加枠が満員、または招待前の希望者をwaitlistに登録する。

必ずサーバー側で行う判定:

- email形式。
- display_nameの長さ。
- 重複email。
- status初期値。

### `GET /api/world`

目的:

- `/world` と `/signup` で現在の参加人数、参加枠、Seasonを表示する。

返却方針:

- world名。
- current_season。
- member_limit。
- active member count。
- waitlist導線に必要な満員状態。

### `GET /api/profile`

目的:

- ログイン中ユーザーのprofile、role、status、world参加状態を取得する。

必ずサーバー側で行う判定:

- 認証済みユーザー本人か。
- `profiles.status = suspended` ではないか。
- world参加状態。

## バリデーション

Phase 1では、クライアント側の表示だけでなくAPI側でも必ず検証する。

| 項目 | 方針 |
| --- | --- |
| 18歳以上チェック | 必須。未確認ならsignup不可。 |
| terms同意 | 必須。未同意ならsignup不可。 |
| privacy同意 | 必須。未同意ならsignup不可。 |
| 招待コード | 必須。有効な管理者発行コードのみ許可。 |
| 参加枠 | active member countがmember_limit以上なら参加不可。 |
| waitlist | 満員時はwaitlistへ誘導する。 |
| 生年月日 | MVPでは保存しない。 |
| admin role | `ADMIN_EMAILS` とseedに基づき付与する。 |

## signup成功時の状態遷移

1. ユーザーがemail/password等で認証する。
2. `/api/signup` に同意チェック、表示名、招待コードを送る。
3. APIが招待コードを検証する。
4. APIがworldの参加枠を確認する。
5. 参加枠に空きがあれば `profiles` を作成する。
6. emailが `ADMIN_EMAILS` に含まれる場合は `profiles.role = admin` にする。
7. `world_members` を `status = active` で作成する。
8. 招待コードを使用済みにする。
9. `/home` へ遷移する。

## 満員時の状態遷移

1. ユーザーがsignupを試みる。
2. APIが招待コードを検証する。
3. APIがworldの参加枠を確認する。
4. active member countがmember_limit以上なら参加作成を止める。
5. レスポンスで `waitlistRequired` を返す。
6. 画面はwaitlist登録へ誘導する。
7. `POST /api/waitlist` でwaitlist登録する。

## テスト方針

Phase 1では次のケースを必ず確認する。

| テストケース | 期待結果 |
| --- | --- |
| 18歳以上未確認でsignup | 失敗する。 |
| terms未同意でsignup | 失敗する。 |
| privacy未同意でsignup | 失敗する。 |
| 招待コードなしでsignup | 失敗する。 |
| 無効招待コードでsignup | 失敗する。 |
| 期限切れ招待コードでsignup | 失敗する。 |
| 使用済み招待コードでsignup | 失敗する。 |
| 有効招待コード、参加枠あり | profileとworld_memberが作成される。 |
| `ADMIN_EMAILS` 対象emailでsignup | `profiles.role = admin` になる。 |
| `ADMIN_EMAILS` 非対象emailでsignup | `profiles.role = user` になる。 |
| active member 10人到達後のsignup | world_memberは作らずwaitlistへ誘導する。 |
| waitlist重複email | 重複作成しない。 |
| suspended user | login後も出題/回答などの本体操作へ進めない。 |

## Phase 1でやらないこと

- Supabase cloud project作成。
- Vercel project作成。
- Stripe連携。
- DB migration SQL作成。
- production deploy。
- Web Push。
- Realtime化。
- ギルド。
- 課金。
- 本格RLS policy test。
- クイズ作成以降の本格API実装。

## Phase 1実装前チェック

実装に入る直前に次を確認する。

- `ADMIN_EMAILS` に入れる初期adminメールアドレス。
- local seedで作る初期world名。
- local seedで作る初期invite codeの扱い。
- signupで使う認証方式。
- Supabase localを起動できること。
- Phase 1でもSmart BuzzerのSupabase / Vercel / Stripe / envに触れないこと。
