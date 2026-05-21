import { ClipboardList } from "lucide-react";
import { ButtonLink, PageHeader } from "@/components/ui";
import { HomeLaunchesClient } from "@/app/home/home-launches-client";

export const metadata = {
  title: "ホーム"
};

export default function HomePage() {
  return (
    <>
      <PageHeader
        actions={
          <ButtonLink href="/create" icon={ClipboardList}>
            出題する
          </ButtonLink>
        }
        description="15秒ポーリングで本人宛のquiz_recipientsを確認します。start_at前は問題本文と選択肢を表示しません。"
        eyebrow="Home"
        title="届いたクイズ"
      />
      <HomeLaunchesClient />
    </>
  );
}
