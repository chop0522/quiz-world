import { PageHeader, Section, Surface } from "@/components/ui";

export const metadata = {
  title: "プライバシーポリシー草案"
};

const privacyItems = [
  ["メールアドレス", "認証、連絡、waitlist、招待。"],
  ["表示名", "ゲーム内表示、結果表示。"],
  ["年齢確認日時", "18歳以上確認の記録。生年月日は保存しません。"],
  ["同意日時", "利用規約とプライバシーポリシーへの同意管理。"],
  ["クイズ作成履歴", "出題、評価、ランク、通報対応。"],
  ["回答履歴", "結果表示、順位、回答ランク。"],
  ["評価・通報・ブロック", "安全運用、モデレーション、通知対象除外。"],
  ["通知ログ", "通知状態確認、通知疲れ対策、将来のPush改善。"],
  ["操作ログ", "admin操作の監査、誤操作対応。"]
] as const;

export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        description="これは法務完成版ではなく、Previewテスト向けの草案です。第三者サービスは実際の利用確定後に更新します。"
        eyebrow="Legal draft"
        title="プライバシーポリシー草案"
      />
      <Section title="扱う情報">
        <Surface>
          <div className="grid gap-3">
            {privacyItems.map(([label, body]) => (
              <div
                className="grid gap-1 rounded-md border border-[color:var(--line)] bg-white p-3 md:grid-cols-[180px_1fr]"
                key={label}
              >
                <p className="font-medium">{label}</p>
                <p className="text-sm leading-6 text-[color:var(--muted)]">{body}</p>
              </div>
            ))}
          </div>
        </Surface>
      </Section>
      <Section title="第三者サービス">
        <Surface>
          <p className="text-sm leading-6 text-[color:var(--muted)]">
            SupabaseとVercelを使ったPreview環境で確認します。Push通知サービスはまだ使わず、10人テスト前に利用内容を確定します。
          </p>
        </Surface>
      </Section>
    </>
  );
}
