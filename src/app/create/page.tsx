import { PageHeader } from "@/components/ui";
import { QuestionAuthoringClient } from "@/app/create/question-authoring-client";

export const metadata = {
  title: "クイズ作成"
};

export default function CreatePage() {
  return (
    <>
      <PageHeader
        description="Phase 2では四択クイズの作成、保存、編集までを扱います。配信、通知、回答、結果表示はまだ実装しません。"
        eyebrow="Create"
        title="四択クイズを作成"
      />
      <QuestionAuthoringClient />
    </>
  );
}
