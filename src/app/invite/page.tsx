import { ButtonLink, PageHeader } from "@/components/ui";
import { InviteClient } from "@/app/invite/invite-client";

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
      <InviteClient />
    </>
  );
}
