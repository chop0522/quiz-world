import { Flag, Star } from "lucide-react";
import { Badge, PageHeader, Section, Surface } from "@/components/ui";
import { rankingRows } from "@/lib/quiz-world";

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
        description="回答後または終了後に、正誤、answer_rank、correct_rank、全体結果を表示します。category_noteはMVPの結果画面には出しません。"
        eyebrow={`Result ${launchId}`}
        title="回答結果"
      />
      <section className="grid gap-4 md:grid-cols-3">
        <Surface>
          <p className="text-sm text-[color:var(--muted)]">あなたの正誤</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-700">正解</p>
        </Surface>
        <Surface>
          <p className="text-sm text-[color:var(--muted)]">answer_rank</p>
          <p className="mt-2 text-2xl font-semibold">3位</p>
        </Surface>
        <Surface>
          <p className="text-sm text-[color:var(--muted)]">correct_rank</p>
          <p className="mt-2 text-2xl font-semibold">2位</p>
        </Surface>
      </section>

      <Section title="全回答者">
        <Surface>
          <div className="grid gap-3">
            {rankingRows.map((row) => (
              <div
                className="grid gap-2 rounded-md border border-[color:var(--line)] bg-white p-3 md:grid-cols-[1fr_96px_96px_96px] md:items-center"
                key={row.name}
              >
                <p className="font-medium">{row.name}</p>
                <p className="text-sm text-[color:var(--muted)]">{row.answerRank}</p>
                <p className="text-sm text-[color:var(--muted)]">{row.correctRank}</p>
                <Badge tone={row.result === "正解" ? "green" : row.result === "不正解" ? "red" : "neutral"}>
                  {row.result}
                </Badge>
              </div>
            ))}
          </div>
        </Surface>
      </Section>

      <Section title="クイズ評価">
        <Surface>
          <div className="flex flex-wrap gap-2">
            {["良問", "普通", "微妙"].map((rating) => (
              <button
                className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-md border border-[color:var(--line)] bg-white px-3 text-sm font-medium"
                key={rating}
                type="button"
              >
                <Star aria-hidden className="size-4" />
                {rating}
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {["面白い", "難易度がちょうどいい", "答えが曖昧", "不適切"].map((reason) => (
              <Badge key={reason}>{reason}</Badge>
            ))}
          </div>
          <button
            className="focus-ring mt-5 inline-flex min-h-11 items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-800"
            type="button"
          >
            <Flag aria-hidden className="size-4" />
            通報する
          </button>
        </Surface>
      </Section>
    </>
  );
}
