import { PageHeader } from "@/components/ui";
import { QuestionAuthoringClient } from "@/app/create/question-authoring-client";

export const metadata = {
  title: "クイズ作成"
};

export default function CreatePage() {
  return (
    <>
      <PageHeader
        description="四択クイズを作成し、activeな問題は出題できます。配信、回答、結果、評価、通報、rank events、admin moderationまでlocalで確認済みです。"
        eyebrow="Create"
        title="四択クイズを作成"
      />
      <QuestionAuthoringClient />
    </>
  );
}
