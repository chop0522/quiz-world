import { BellOff, ShieldCheck } from "lucide-react";
import {
  Badge,
  Field,
  PageHeader,
  SelectInput,
  Surface,
  TextInput
} from "@/components/ui";
import { userSummary } from "@/lib/quiz-world";
import { ProfileSession } from "@/app/profile/profile-session";

export const metadata = {
  title: "プロフィール"
};

export default function ProfilePage() {
  return (
    <>
      <PageHeader
        description="ログイン中のscore/rank、直近rank_events、通知設定、同意状態を確認します。通知設定の保存処理は次Phaseで実装します。"
        eyebrow="Profile"
        title="ランクと通知設定"
      />

      <ProfileSession />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Surface>
          <form className="grid gap-4">
            <Field label="表示名">
              <TextInput placeholder={userSummary.displayName} />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="通知モード">
                <SelectInput>
                  <option>通常モード</option>
                  <option>集中モード</option>
                  <option>休憩モード</option>
                  <option>深夜勢モード</option>
                </SelectInput>
              </Field>
              <Field label="1日の通知上限">
                <TextInput placeholder="5" type="number" />
              </Field>
              <Field label="quiet hours start">
                <TextInput placeholder="22:00" />
              </Field>
              <Field label="quiet hours end">
                <TextInput placeholder="08:00" />
              </Field>
            </div>
            <label className="flex gap-3 rounded-md border border-[color:var(--line)] bg-white p-3 text-sm">
              <input className="mt-1" type="checkbox" />
              <span>深夜通知を明示的に許可する</span>
            </label>
          </form>
        </Surface>
        <aside className="grid gap-3 self-start">
          <Surface>
            <ShieldCheck aria-hidden className="mb-3 size-5 text-[color:var(--accent)]" />
            <h2 className="font-semibold">同意状態</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone="green">18歳以上確認済み</Badge>
              <Badge tone="green">規約同意済み</Badge>
              <Badge tone="green">プライバシー同意済み</Badge>
            </div>
          </Surface>
          <Surface>
            <BellOff aria-hidden className="mb-3 size-5 text-[color:var(--accent)]" />
            <h2 className="font-semibold">ブロック一覧</h2>
            <p className="mt-2 text-sm text-[color:var(--muted)]">
              ブロック関係にある相手は通知対象抽選から除外します。
            </p>
          </Surface>
        </aside>
      </div>
    </>
  );
}
