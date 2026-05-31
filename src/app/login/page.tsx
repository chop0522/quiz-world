import { UserRoundPlus } from "lucide-react";
import { ButtonLink, PageHeader, Surface } from "@/components/ui";
import { LoginForm } from "@/app/login/login-form";

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
        description="登録済みのメールアドレスとパスワードでログインします。"
        eyebrow="Login"
        title="ログイン"
      />
      <Surface className="max-w-xl">
        <LoginForm />
      </Surface>
    </>
  );
}
