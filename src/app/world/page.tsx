import { PageHeader } from "@/components/ui";
import { WorldStatus } from "@/app/world/world-status";

export const metadata = {
  title: "ワールド"
};

export default function WorldPage() {
  return (
    <>
      <PageHeader
        description="このワールドの参加状況を確認できます。"
        eyebrow="World"
        title="Quiz World Season 0"
      />
      <WorldStatus />
    </>
  );
}
