import Link from "next/link";
import { UserRoundPlus } from "lucide-react";
import { ButtonLink, Field, PageHeader, Surface, TextInput } from "@/components/ui";

export const metadata = {
  title: "登録"
};

export default function SignupPage() {
  return (
    <>
      <PageHeader
        actions={
          <ButtonLink href="/invite" variant="secondary">
            waitlistへ
          </ButtonLink>
        }
        description="Season 0は管理者発行の招待コード制です。MVPでは18歳未満は保護者同意があっても利用できません。"
        eyebrow="Signup"
        title="18歳以上確認と招待コード"
      />
      <Surface className="max-w-2xl">
        <form className="grid gap-4">
          <Field label="表示名">
            <TextInput placeholder="quiz_player" />
          </Field>
          <Field label="メールアドレス">
            <TextInput placeholder="you@example.com" type="email" />
          </Field>
          <Field label="招待コード" hint="検証は次Phaseでサーバー側に実装します。">
            <TextInput placeholder="SEASON0-XXXX" />
          </Field>
          <label className="flex gap-3 rounded-md border border-[color:var(--line)] bg-white p-3 text-sm">
            <input className="mt-1" type="checkbox" />
            <span>私は18歳以上です。MVPでは生年月日は保存しません。</span>
          </label>
          <label className="flex gap-3 rounded-md border border-[color:var(--line)] bg-white p-3 text-sm">
            <input className="mt-1" type="checkbox" />
            <span>
              <Link className="underline" href="/legal/terms">
                利用規約
              </Link>
              に同意します。
            </span>
          </label>
          <label className="flex gap-3 rounded-md border border-[color:var(--line)] bg-white p-3 text-sm">
            <input className="mt-1" type="checkbox" />
            <span>
              <Link className="underline" href="/legal/privacy">
                プライバシーポリシー
              </Link>
              に同意します。
            </span>
          </label>
          <button
            className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[color:var(--accent-strong)] px-4 py-2 text-sm font-semibold text-white"
            type="button"
          >
            <UserRoundPlus aria-hidden className="size-4" />
            登録する
          </button>
        </form>
      </Surface>
    </>
  );
}
