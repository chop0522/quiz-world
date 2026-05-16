import { Clock, Send } from "lucide-react";
import { Badge, PageHeader, Surface } from "@/components/ui";

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
        description="start_at到達前は問題文と選択肢を表示しません。順位は回答者の端末時刻ではなく、サーバー受信順で決まります。"
        eyebrow={`Launch ${launchId}`}
        title="カウントダウン"
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Surface className="grid min-h-80 place-items-center text-center">
          <div>
            <Clock aria-hidden className="mx-auto size-12 text-[color:var(--accent)]" />
            <p className="mt-4 text-5xl font-semibold">15</p>
            <p className="mt-3 text-sm text-[color:var(--muted)]">
              start_atまで待機中。問題はまだ表示しません。
            </p>
          </div>
        </Surface>
        <aside className="grid gap-3 self-start">
          <Surface>
            <Badge tone="green">配信対象</Badge>
            <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
              quiz_recipientsに含まれるユーザーだけが回答できます。出題者本人は回答対象外です。
            </p>
          </Surface>
          <Surface>
            <p className="text-sm font-semibold">回答UIの予定</p>
            <div className="mt-3 grid gap-2">
              {["A", "B", "C", "D"].map((choice) => (
                <button
                  className="min-h-11 rounded-md border border-[color:var(--line)] bg-white px-3 text-left text-sm text-[color:var(--muted)]"
                  disabled
                  key={choice}
                  type="button"
                >
                  {choice}. start_at後に表示
                </button>
              ))}
            </div>
            <button
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-stone-200 px-4 py-2 text-sm font-semibold text-stone-500"
              disabled
              type="button"
            >
              <Send aria-hidden className="size-4" />
              回答送信
            </button>
          </Surface>
        </aside>
      </div>
    </>
  );
}
