import { ShieldAlert } from "lucide-react";
import { Badge, PageHeader, Surface } from "@/components/ui";
import { getAdminContext } from "@/lib/phase7-admin";
import { AdminDashboardClient } from "@/app/admin/admin-dashboard-client";

export const metadata = {
  title: "Admin"
};

export default async function AdminPage() {
  const adminContext = await getAdminContext();

  if (!adminContext.ok) {
    return (
      <>
        <PageHeader
          description="Phase 7 adminはprofiles.role=adminかつprofiles.status=activeのユーザーだけが利用できます。"
          eyebrow="Admin"
          title="管理画面"
        />
        <Surface>
          <div className="flex items-start gap-3">
            <ShieldAlert aria-hidden className="mt-1 size-5 text-rose-700" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold">アクセスできません</h2>
                <Badge tone="red">{adminContext.status}</Badge>
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
        description="10人テストを安全に運用するための簡易adminです。削除ではなく停止を優先し、すべての管理操作をadmin_audit_logsに残します。"
        eyebrow="Admin"
        title="運用とモデレーション"
      />
      <AdminDashboardClient adminName={adminContext.profile.display_name} />
    </>
  );
}
