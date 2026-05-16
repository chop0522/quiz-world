import { ShieldCheck } from "lucide-react";
import { Badge, Metric, PageHeader, Section, Surface } from "@/components/ui";
import { adminActions } from "@/lib/quiz-world";

export const metadata = {
  title: "Admin"
};

export default function AdminPage() {
  return (
    <>
      <PageHeader
        description="MVPの簡易admin画面です。Phase 0では静的表示のみで、admin APIやservice role操作は実装しません。"
        eyebrow="Admin"
        title="10人テスト運用"
      />
      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="未対応通報" value={2} />
        <Metric label="waitlist" value={5} />
        <Metric label="参加枠" value="10" />
        <Metric label="停止候補" value={1} />
      </section>
      <Section
        description="ユーザー停止、クイズ停止、参加枠変更、招待コード発行、通報対応、waitlist操作はaudit log必須です。"
        title="管理操作"
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {adminActions.map((action) => (
            <Surface key={action}>
              <div className="flex items-start gap-3">
                <ShieldCheck aria-hidden className="size-5 text-[color:var(--accent)]" />
                <div>
                  <h2 className="font-semibold">{action}</h2>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                    操作とadmin_audit_logs記録は同一transaction扱い。ログ失敗時は操作全体を失敗扱いにします。
                  </p>
                </div>
              </div>
            </Surface>
          ))}
        </div>
      </Section>
      <Section title="通報対応基準">
        <Surface>
          <div className="grid gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>1件目</Badge>
              <span className="text-sm">report作成、admin確認待ち</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="amber">2件以上</Badge>
              <span className="text-sm">question.status = review_required</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="red">admin判断</Badge>
              <span className="text-sm">question.status = suspended</span>
            </div>
          </div>
        </Surface>
      </Section>
    </>
  );
}
