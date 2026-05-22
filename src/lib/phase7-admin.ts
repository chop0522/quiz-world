import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type AdminProfile = {
  id: string;
  display_name: string;
  role: "admin";
  status: "active";
};

export type AdminContext =
  | {
      ok: true;
      userId: string;
      profile: AdminProfile;
      admin: SupabaseClient;
    }
  | {
      ok: false;
      status: number;
      error: string;
    };

export type AdminRpcResponse = {
  status?: string;
  [key: string]: unknown;
};

export async function getAdminContext(): Promise<AdminContext> {
  const server = await getSupabaseServerClient();
  const {
    data: { user },
    error
  } = await server.auth.getUser();

  if (error || !user) {
    return {
      ok: false,
      status: 401,
      error: "ログインが必要です。"
    };
  }

  const admin = getSupabaseAdminClient();
  const { data: profileData, error: profileError } = await admin
    .from("profiles")
    .select("id,display_name,role,status")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  const profile = profileData as {
    id: string;
    display_name: string;
    role: string;
    status: string;
  } | null;

  if (!profile || profile.role !== "admin" || profile.status !== "active") {
    return {
      ok: false,
      status: 403,
      error: "activeなadmin権限が必要です。"
    };
  }

  return {
    ok: true,
    userId: user.id,
    profile: profile as AdminProfile,
    admin
  };
}

export function adminContextErrorResponse(context: Extract<AdminContext, { ok: false }>) {
  return NextResponse.json(
    { ok: false, errors: [context.error] },
    { status: context.status }
  );
}

export function adminRpcHttpStatus(status: string): number {
  const statuses: Record<string, number> = {
    created: 201,
    updated: 200,
    validation_error: 422,
    not_found: 404,
    world_not_found: 404,
    admin_forbidden: 403,
    self_suspend_forbidden: 403,
    conflict: 409,
    code_conflict: 409
  };

  return statuses[status] ?? 500;
}

export function adminRpcMessage(status: string): string {
  const messages: Record<string, string> = {
    validation_error: "入力内容が不正です。",
    not_found: "対象が見つかりません。",
    world_not_found: "activeなworldが見つかりません。",
    admin_forbidden: "activeなadmin権限が必要です。",
    self_suspend_forbidden: "自分自身の停止はできません。",
    conflict: "現在の状態と同じため更新できません。",
    code_conflict: "同じinvite codeが既に存在します。"
  };

  return messages[status] ?? "admin操作に失敗しました。";
}

export function adminMutationResponse(result: AdminRpcResponse | null) {
  const statusValue = typeof result?.status === "string" ? result.status : "";
  const httpStatus = adminRpcHttpStatus(statusValue);

  if (statusValue === "updated" || statusValue === "created") {
    return NextResponse.json({ ok: true, result }, { status: httpStatus });
  }

  return NextResponse.json(
    {
      ok: false,
      status: statusValue || "unknown",
      errors: [adminRpcMessage(statusValue)]
    },
    { status: httpStatus }
  );
}

export function toNumber(value: unknown, fallback: number): number {
  const parsed = typeof value === "string" ? Number(value) : value;
  return typeof parsed === "number" && Number.isFinite(parsed) ? parsed : fallback;
}
