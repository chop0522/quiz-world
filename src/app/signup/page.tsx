import { ButtonLink, PageHeader, Surface } from "@/components/ui";
import { SignupForm } from "@/app/signup/signup-form";

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
        <SignupForm />
      </Surface>
    </>
  );
}
