import { ShieldAlert } from "lucide-react";
import { Badge, PageHeader, Surface } from "@/components/ui";
import { getAdminContext } from "@/lib/phase7-admin";
import { AdminDashboardClient } from "@/app/admin/admin-dashboard-client";

export const metadata = {
  title: "Admin"
};

function adminAccessLabel(status: number) {
  return status === 401 ? "ログインが必要" : "権限なし";
}

export default async function AdminPage() {
  const adminContext = await getAdminContext();

  if (!adminContext.ok) {
    return (
      <>
        <PageHeader
          description="管理者だけが利用できるページです。"
          eyebrow="Admin"
          title="管理画面"
        />
        <Surface>
          <div className="flex items-start gap-3">
            <ShieldAlert aria-hidden className="mt-1 size-5 text-rose-700" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold">アクセスできません</h2>
                <Badge tone="red">{adminAccessLabel(adminContext.status)}</Badge>
              </div>
              <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                {adminContext.error}
              </p>
            </div>
          </div>
        </Surface>
      </>
    );
  }

  return (
    <>
      <PageHeader
        description="10人テストを安全に運用するための管理画面です。削除ではなく停止を優先し、管理操作は操作ログに残します。"
        eyebrow="Admin"
        title="運用とモデレーション"
      />
      <AdminDashboardClient adminName={adminContext.profile.display_name} />
    </>
  );
}
