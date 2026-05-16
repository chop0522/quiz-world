import { Bell, ClipboardList } from "lucide-react";
import {
  Badge,
  ButtonLink,
  Metric,
  PageHeader,
  Section,
  Surface
} from "@/components/ui";
import { quizSummaries, userSummary, worldSnapshot } from "@/lib/quiz-world";

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
        description="Phase 1は15秒ポーリングで届いたクイズ一覧を確認します。ここでは静的な状態表示だけを用意しています。"
        eyebrow="Home"
        title="届いたクイズ"
      />

      <section className="grid gap-4 md:grid-cols-4">
        <Metric helper="出題ランクに応じた制限" label="今日の残り出題" value={userSummary.remainingLaunches} />
        <Metric helper="今回の想定配信人数" label="配信人数" value={userSummary.deliverySize} />
        <Metric helper={userSummary.quietHours} label="通知モード" value={userSummary.notificationMode} />
        <Metric helper={`${worldSnapshot.members}/${worldSnapshot.memberLimit}人`} label="World" value={worldSnapshot.season} />
      </section>

      <Section
        description="開始前、回答可能、回答済み、終了済みを分けて表示します。配信対象でないlaunchは表示しません。"
        title="クイズ一覧"
      >
        <div className="grid gap-3">
          {quizSummaries.map((quiz) => (
            <Surface className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center" key={quiz.id}>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">{quiz.title}</h2>
                  <Badge tone={quiz.state === "回答可能" ? "green" : "neutral"}>
                    {quiz.state}
                  </Badge>
                  <Badge>{quiz.category}</Badge>
                </div>
                <p className="mt-2 flex items-center gap-2 text-sm text-[color:var(--muted)]">
                  <Bell aria-hidden className="size-4" />
                  {quiz.startsIn}
                </p>
              </div>
              <div className="flex gap-2">
                <ButtonLink href={`/quiz/${quiz.id}`} variant="secondary">
                  開く
                </ButtonLink>
                <ButtonLink href={quiz.resultHref} variant="secondary">
                  結果
                </ButtonLink>
              </div>
            </Surface>
          ))}
        </div>
      </Section>
    </>
  );
}
