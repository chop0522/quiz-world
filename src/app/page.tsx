import { Bell, KeyRound, LogIn, UserRoundPlus } from "lucide-react";
import { ButtonLink, Metric, PageHeader, Section, Surface } from "@/components/ui";
import { phaseBadges, worldSnapshot } from "@/lib/quiz-world";

export default function LandingPage() {
  return (
    <>
      <PageHeader
        actions={
          <>
            <ButtonLink href="/signup" icon={UserRoundPlus}>
              招待コードで登録
            </ButtonLink>
            <ButtonLink href="/login" icon={LogIn} variant="secondary">
              ログイン
            </ButtonLink>
          </>
        }
        description="24時間365日、いつ届くかわからないクイズに少人数で早押し回答するMVPです。Season 0は管理者発行の招待コード制で、最初の参加枠は10人です。"
        eyebrow="Season 0 local scaffold"
        title="通知が始まるまで、問題は見えない。"
      />

      <section className="grid gap-4 md:grid-cols-3">
        <Metric
          helper={`${worldSnapshot.nextLimit}人への解放条件を検証`}
          label="参加枠"
          value={`${worldSnapshot.members}/${worldSnapshot.memberLimit}`}
        />
        <Metric
          helper="Phase 1は画面内通知"
          label="通知"
          value="15秒ポーリング"
        />
        <Metric helper="保護者同意があってもMVPでは不可" label="年齢" value="18+" />
      </section>

      <Section
        description="Phase 0ではDB接続やAPI処理を作らず、ローカルで画面遷移とMVP方針を確認できる土台に留めています。"
        title="MVPの固定方針"
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {phaseBadges.map((item) => {
            const Icon = item.icon;

            return (
              <Surface className="flex items-start gap-3" key={`${item.label}-${item.value}`}>
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-[color:var(--accent-strong)]">
                  <Icon aria-hidden className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p className="mt-1 text-sm text-[color:var(--muted)]">{item.value}</p>
                </div>
              </Surface>
            );
          })}
        </div>
      </Section>

      <Section title="Season 0の流れ">
        <div className="grid gap-4 md:grid-cols-3">
          <Surface>
            <KeyRound aria-hidden className="mb-3 size-5 text-[color:var(--accent)]" />
            <h2 className="font-semibold">管理者招待</h2>
            <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
              一般ユーザーによる招待はMVPでは不可。参加枠が埋まった場合はwaitlistへ誘導します。
            </p>
          </Surface>
          <Surface>
            <Bell aria-hidden className="mb-3 size-5 text-[color:var(--accent)]" />
            <h2 className="font-semibold">届いたクイズ</h2>
            <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
              出題対象抽選はサーバー側で行う想定。出題者本人とブロック関係は除外します。
            </p>
          </Surface>
          <Surface>
            <span className="mb-3 inline-flex size-5 items-center justify-center rounded-full border border-[color:var(--accent)] text-xs font-bold text-[color:var(--accent)]">
              1
            </span>
            <h2 className="font-semibold">順位はサーバー受信順</h2>
            <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
              端末時刻は順位に使いません。start_atは通知作成から15秒後、end_atは60秒後です。
            </p>
          </Surface>
        </div>
      </Section>
    </>
  );
}
