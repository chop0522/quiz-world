import { Globe2 } from "lucide-react";
import { Metric, PageHeader, ProgressBar, Section, Surface } from "@/components/ui";
import { worldSnapshot } from "@/lib/quiz-world";

export const metadata = {
  title: "ワールド"
};

export default function WorldPage() {
  const memberPercent = Math.round((worldSnapshot.members / worldSnapshot.memberLimit) * 100);

  return (
    <>
      <PageHeader
        description="最初は1ワールド制です。参加枠はワールド全体の活動と品質により10人から15人、20人、30人、50人へ増えます。"
        eyebrow="World"
        title={worldSnapshot.name}
      />
      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="現在の参加人数" value={worldSnapshot.members} />
        <Metric label="参加枠" value={worldSnapshot.memberLimit} />
        <Metric label="累計出題" value={worldSnapshot.questions} />
        <Metric label="累計回答" value={worldSnapshot.answers} />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Surface>
          <Globe2 aria-hidden className="mb-4 size-6 text-[color:var(--accent)]" />
          <ProgressBar label="Season 0参加枠" value={memberPercent} />
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <Surface className="shadow-none">
              <p className="text-sm text-[color:var(--muted)]">次の解放</p>
              <p className="mt-2 text-xl font-semibold">{worldSnapshot.nextLimit}人枠</p>
            </Surface>
            <Surface className="shadow-none">
              <p className="text-sm text-[color:var(--muted)]">平均評価</p>
              <p className="mt-2 text-xl font-semibold">{worldSnapshot.averageRating}</p>
            </Surface>
          </div>
        </Surface>
        <Section title="解放条件">
          <Surface>
            <ul className="grid gap-2 text-sm text-[color:var(--muted)]">
              <li>累計出題数</li>
              <li>累計回答数</li>
              <li>平均クイズ評価</li>
              <li>通報率 {worldSnapshot.reportRate}</li>
              <li>上位出題者/回答者数</li>
            </ul>
          </Surface>
        </Section>
      </div>
    </>
  );
}
