import { NextResponse } from "next/server";
import {
  adminContextErrorResponse,
  adminMutationResponse,
  getAdminContext,
  type AdminRpcResponse
} from "@/lib/phase7-admin";
import { validateAdminUserSuspendPayload } from "@/lib/phase7-validation";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

async function readJsonBody(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const adminContext = await getAdminContext();

    if (!adminContext.ok) {
      return adminContextErrorResponse(adminContext);
    }

    const { id } = await context.params;
    const rawBody = await readJsonBody(request);
    const parsed = validateAdminUserSuspendPayload(rawBody);

    if (!parsed.ok) {
      return NextResponse.json(
        { ok: false, errors: parsed.errors },
        { status: rawBody === null ? 400 : 422 }
      );
    }

    const { data, error } = await adminContext.admin.rpc(
      "admin_suspend_user",
      {
        p_admin_user_id: adminContext.userId,
        p_target_user_id: id,
        p_reason: parsed.data.reason
      }
    );

    if (error) {
      throw error;
    }

    return adminMutationResponse(data as AdminRpcResponse | null);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        errors: [
          error instanceof Error ? error.message : "user停止に失敗しました。"
        ]
      },
      { status: 500 }
    );
  }
}
