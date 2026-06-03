import { PageHeader } from "@/components/ui";
import { QuestionAuthoringClient } from "@/app/create/question-authoring-client";

export const metadata = {
  title: "クイズ作成"
};

export default function CreatePage() {
  return (
    <>
      <PageHeader
        description="四択クイズを作成できます。作成したクイズは一覧から出題できます。"
        eyebrow="Create"
        title="四択クイズを作成"
      />
      <QuestionAuthoringClient />
    </>
  );
}
