import { PageHeader, Section, Surface } from "@/components/ui";

export const metadata = {
  title: "利用規約草案"
};

const terms = [
  {
    title: "年齢制限",
    body: "本サービスは18歳以上の方のみ利用できます。18歳未満の方は、保護者の同意がある場合でも、MVP期間中は本サービスを利用できません。"
  },
  {
    title: "ユーザー投稿コンテンツ",
    body: "ユーザーはクイズ、選択肢、回答、評価、通報内容などを投稿することがあります。投稿内容についてはユーザー本人が責任を負います。"
  },
  {
    title: "禁止事項",
    body: "不適切コンテンツ、個人情報、嫌がらせ、権利侵害、正解が意図的に曖昧な問題、スパム的な出題は禁止します。"
  },
  {
    title: "通知と順位",
    body: "MVP初期は画面内通知です。start_atはサーバー側で決定し、順位はサーバー受信順で判定します。通知到達や通信環境による遅延は保証できません。"
  },
  {
    title: "停止措置",
    body: "運営は通報内容を確認し、必要に応じてクイズ配信停止、アカウント停止、その他の制限を行うことがあります。MVPでは削除より停止を優先します。"
  }
];

export default function TermsPage() {
  return (
    <>
      <PageHeader
        description="これは法務完成版ではなく、MVP実装開始前の草案です。10人テスト前に専門家確認を行う前提です。"
        eyebrow="Legal draft"
        title="利用規約草案"
      />
      <Section title="主な項目">
        <div className="grid gap-3">
          {terms.map((item) => (
            <Surface key={item.title}>
              <h2 className="font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                {item.body}
              </p>
            </Surface>
          ))}
        </div>
      </Section>
    </>
  );
}
