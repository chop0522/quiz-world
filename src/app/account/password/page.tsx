import { ArrowLeft } from "lucide-react";
import { ButtonLink, PageHeader, Surface } from "@/components/ui";
import { PasswordChangeForm } from "@/app/account/password/password-change-form";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = {
  title: "パスワード変更"
};

export default async function AccountPasswordPage() {
  const server = await getSupabaseServerClient();
  const {
    data: { user }
  } = await server.auth.getUser();

  if (!user) {
    return (
      <>
        <PageHeader
          description="パスワードを変更するにはログインが必要です。"
          eyebrow="Account"
          title="パスワード変更"
        />
        <Surface className="max-w-xl">
          <p className="text-sm leading-6 text-[color:var(--muted)]">
            ログイン後にアカウント設定からパスワードを変更できます。
          </p>
          <div className="mt-4">
            <ButtonLink href="/login">ログインへ</ButtonLink>
          </div>
        </Surface>
      </>
    );
  }

  return (
    <>
      <PageHeader
        actions={
          <ButtonLink href="/account" icon={ArrowLeft} variant="secondary">
            アカウントへ
          </ButtonLink>
        }
        description="現在ログインしているアカウントのパスワードを変更します。"
        eyebrow="Account"
        title="パスワード変更"
      />
      <Surface className="max-w-xl">
        <PasswordChangeForm />
      </Surface>
    </>
  );
}
