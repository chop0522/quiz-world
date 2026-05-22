import { NextResponse } from "next/server";
import {
  adminContextErrorResponse,
  adminMutationResponse,
  getAdminContext,
  toNumber,
  type AdminRpcResponse
} from "@/lib/phase7-admin";
import { validateAdminInvitePayload } from "@/lib/phase7-validation";

type InviteRow = {
  id: string;
  world_id: string;
  invited_by: string | null;
  code: string;
  status: string;
  max_uses: number;
  use_count: number;
  used_by: string | null;
  used_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

async function readJsonBody(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const adminContext = await getAdminContext();

    if (!adminContext.ok) {
      return adminContextErrorResponse(adminContext);
    }

    const url = new URL(request.url);
    const limit = Math.min(Math.max(toNumber(url.searchParams.get("limit"), 50), 1), 100);
    const { data, error } = await adminContext.admin
      .from("invites")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      ok: true,
      invites: ((data as InviteRow[] | null) ?? []).map((invite) => ({
        id: invite.id,
        worldId: invite.world_id,
        invitedBy: invite.invited_by,
        code: invite.code,
        status: invite.status,
        maxUses: invite.max_uses,
        useCount: invite.use_count,
        usedBy: invite.used_by,
        usedAt: invite.used_at,
        expiresAt: invite.expires_at,
        createdAt: invite.created_at,
        updatedAt: invite.updated_at
      }))
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        errors: [
          error instanceof Error ? error.message : "invite一覧の取得に失敗しました。"
        ]
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const adminContext = await getAdminContext();

    if (!adminContext.ok) {
      return adminContextErrorResponse(adminContext);
    }

    const rawBody = await readJsonBody(request);
    const parsed = validateAdminInvitePayload(rawBody);

    if (!parsed.ok) {
      return NextResponse.json(
        { ok: false, errors: parsed.errors },
        { status: rawBody === null ? 400 : 422 }
      );
    }

    const { data, error } = await adminContext.admin.rpc("admin_create_invite", {
      p_admin_user_id: adminContext.userId,
      p_world_id: parsed.data.worldId,
      p_code: parsed.data.code,
      p_max_uses: parsed.data.maxUses,
      p_expires_at: parsed.data.expiresAt,
      p_reason: parsed.data.reason
    });

    if (error) {
      throw error;
    }

    return adminMutationResponse(data as AdminRpcResponse | null);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        errors: [
          error instanceof Error ? error.message : "invite作成に失敗しました。"
        ]
      },
      { status: 500 }
    );
  }
}
