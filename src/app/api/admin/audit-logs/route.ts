import { NextResponse } from "next/server";
import {
  adminContextErrorResponse,
  getAdminContext,
  toNumber
} from "@/lib/phase7-admin";

type AuditLogRow = {
  id: string;
  admin_user_id: string;
  action: string;
  target_type: string;
  target_id: string;
  reason: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

type ProfileRow = {
  id: string;
  display_name: string;
};

export async function GET(request: Request) {
  try {
    const adminContext = await getAdminContext();

    if (!adminContext.ok) {
      return adminContextErrorResponse(adminContext);
    }

    const url = new URL(request.url);
    const limit = Math.min(Math.max(toNumber(url.searchParams.get("limit"), 50), 1), 100);
    const { data, error } = await adminContext.admin
      .from("admin_audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    const logs = (data as AuditLogRow[] | null) ?? [];
    const adminIds = [...new Set(logs.map((log) => log.admin_user_id))];
    const profiles = new Map<string, ProfileRow>();

    if (adminIds.length > 0) {
      const { data: profileData, error: profileError } = await adminContext.admin
        .from("profiles")
        .select("id,display_name")
        .in("id", adminIds);

      if (profileError) {
        throw profileError;
      }

      for (const profile of (profileData as ProfileRow[] | null) ?? []) {
        profiles.set(profile.id, profile);
      }
    }

    return NextResponse.json({
      ok: true,
      auditLogs: logs.map((log) => ({
        id: log.id,
        adminUserId: log.admin_user_id,
        adminDisplayName: profiles.get(log.admin_user_id)?.display_name ?? "Unknown",
        action: log.action,
        targetType: log.target_type,
        targetId: log.target_id,
        reason: log.reason,
        metadata: log.metadata,
        createdAt: log.created_at
      }))
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        errors: [
          error instanceof Error ? error.message : "audit log一覧の取得に失敗しました。"
        ]
      },
      { status: 500 }
    );
  }
}
