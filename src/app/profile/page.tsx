import { PageHeader } from "@/components/ui";
import { ProfileSession } from "@/app/profile/profile-session";

export const metadata = {
  title: "プロフィール"
};

export default function ProfilePage() {
  return (
    <>
      <PageHeader
        description="スコア、ランク、最近の履歴を確認できます。"
        eyebrow="プロフィール"
        title="ランクと履歴"
      />

      <ProfileSession />
    </>
  );
}
