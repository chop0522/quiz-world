import { LogIn, UserRoundPlus } from "lucide-react";
import { ButtonLink, Field, PageHeader, Surface, TextInput } from "@/components/ui";

export const metadata = {
  title: "ログイン"
};

export default function LoginPage() {
  return (
    <>
      <PageHeader
        actions={
          <ButtonLink href="/signup" icon={UserRoundPlus} variant="secondary">
            登録へ
          </ButtonLink>
        }
        description="Phase 0では静的フォームです。次PhaseでSupabase Authと接続します。"
        eyebrow="Login"
        title="ログイン"
      />
      <Surface className="max-w-xl">
        <form className="grid gap-4">
          <Field label="メールアドレス">
            <TextInput placeholder="you@example.com" type="email" />
          </Field>
          <Field label="パスワード">
            <TextInput placeholder="password" type="password" />
          </Field>
          <button
            className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[color:var(--accent-strong)] px-4 py-2 text-sm font-semibold text-white"
            type="button"
          >
            <LogIn aria-hidden className="size-4" />
            ログインする
          </button>
          <p className="text-sm leading-6 text-[color:var(--muted)]">
            停止中ユーザー、18歳以上確認や規約同意が未完了の既存ユーザーは次Phaseで制限します。
          </p>
        </form>
      </Surface>
    </>
  );
}
