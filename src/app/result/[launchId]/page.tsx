import { PageHeader } from "@/components/ui";
import { ResultClient } from "./result-client";

export const metadata = {
  title: "結果"
};

export default async function ResultPage({
  params
}: {
  params: Promise<{ launchId: string }>;
}) {
  const { launchId } = await params;

  return (
    <>
      <PageHeader
        description="回答後または締切後に、正誤、answer_rank、correct_rank、全体結果、評価、通報を確認します。"
        eyebrow={`Result ${launchId}`}
        title="回答結果"
      />
      <ResultClient launchId={launchId} />
    </>
  );
}
