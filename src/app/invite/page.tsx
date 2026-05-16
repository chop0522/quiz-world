import { KeyRound } from "lucide-react";
import { ButtonLink, Field, PageHeader, Surface, TextInput } from "@/components/ui";

export const metadata = {
  title: "招待"
};

export default function InvitePage() {
  return (
    <>
      <PageHeader
        actions={
          <ButtonLink href="/signup" variant="secondary">
            登録画面へ
          </ButtonLink>
        }
        description="Season 0では一般ユーザーによる招待コード発行は不可です。満員時はwaitlistに誘導します。"
        eyebrow="Invite"
        title="招待コードとwaitlist"
      />
      <div className="grid gap-6 md:grid-cols-2">
        <Surface>
          <h2 className="font-semibold">招待コード入力</h2>
          <form className="mt-4 grid gap-4">
            <Field label="招待コード">
              <TextInput placeholder="SEASON0-XXXX" />
            </Field>
            <button
              className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[color:var(--accent-strong)] px-4 py-2 text-sm font-semibold text-white"
              type="button"
            >
              <KeyRound aria-hidden className="size-4" />
              検証する
            </button>
          </form>
        </Surface>
        <Surface>
          <h2 className="font-semibold">waitlist登録</h2>
          <form className="mt-4 grid gap-4">
            <Field label="メールアドレス">
              <TextInput placeholder="you@example.com" type="email" />
            </Field>
            <Field label="希望表示名">
              <TextInput placeholder="quiz_player" />
            </Field>
            <button
              className="focus-ring min-h-11 rounded-md border border-[color:var(--line)] bg-white px-4 py-2 text-sm font-semibold"
              type="button"
            >
              waitlistに入る
            </button>
          </form>
        </Surface>
      </div>
    </>
  );
}
