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
        description="あなたに届いたクイズが表示されます。開始時間になると回答できます。"
        eyebrow="Home"
        title="届いたクイズ"
      />
      <HomeLaunchesClient />
    </>
  );
}
