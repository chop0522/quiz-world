import { KeyRound } from "lucide-react";
import { ButtonLink, PageHeader, Surface } from "@/components/ui";
import { AccountLogoutButton } from "@/app/account/account-logout-button";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = {
  title: "アカウント"
};

export default async function AccountPage() {
  const server = await getSupabaseServerClient();
  const {
    data: { user }
  } = await server.auth.getUser();

  if (!user) {
    return (
      <>
        <PageHeader
          description="アカウント設定を使うにはログインが必要です。"
          eyebrow="Account"
          title="アカウント設定"
        />
        <Surface className="max-w-xl">
          <p className="text-sm leading-6 text-[color:var(--muted)]">
            ログインすると、パスワード変更とログアウトを行えます。
          </p>
          <div className="mt-4">
            <ButtonLink href="/login">ログインへ</ButtonLink>
          </div>
        </Surface>
      </>
    );
  }

  const admin = getSupabaseAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("display_name,status")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <>
      <PageHeader
        description="ログアウトとパスワード変更をここにまとめています。"
        eyebrow="Account"
        title="アカウント設定"
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Surface>
          <h2 className="font-semibold">ログイン中</h2>
          <dl className="mt-3 grid gap-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-[color:var(--muted)]">表示名</dt>
              <dd className="font-medium">
                {profile?.display_name ?? "未設定"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[color:var(--muted)]">status</dt>
              <dd className="font-medium">{profile?.status ?? "-"}</dd>
            </div>
          </dl>
        </Surface>

        <aside className="grid gap-3 self-start">
          <Surface>
            <KeyRound aria-hidden className="mb-3 size-5 text-[color:var(--accent)]" />
            <h2 className="font-semibold">パスワード</h2>
            <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
              現在ログインしているアカウントのパスワードを変更します。
            </p>
            <div className="mt-4">
              <ButtonLink href="/account/password" icon={KeyRound} variant="secondary">
                パスワード変更
              </ButtonLink>
            </div>
          </Surface>

          <Surface>
            <h2 className="font-semibold">ログアウト</h2>
            <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
              この端末のログイン状態を終了します。
            </p>
            <div className="mt-4">
              <AccountLogoutButton />
            </div>
          </Surface>
        </aside>
      </div>
    </>
  );
}
