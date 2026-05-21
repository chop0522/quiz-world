import { PageHeader } from "@/components/ui";
import { QuizAnswerClient } from "@/app/quiz/[launchId]/quiz-answer-client";

export const metadata = {
  title: "クイズ回答"
};

export default async function QuizPage({
  params
}: {
  params: Promise<{ launchId: string }>;
}) {
  const { launchId } = await params;

  return (
    <>
      <PageHeader
        description="start_at到達後に問題文と選択肢を表示します。順位は回答者の端末時刻ではなく、サーバー受信順で決まります。"
        eyebrow={`Launch ${launchId}`}
        title="クイズ回答"
      />
      <QuizAnswerClient launchId={launchId} />
    </>
  );
}
