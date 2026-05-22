import { NextResponse } from "next/server";
import {
  adminContextErrorResponse,
  adminMutationResponse,
  getAdminContext,
  type AdminRpcResponse
} from "@/lib/phase7-admin";
import { validateAdminWaitlistStatusPayload } from "@/lib/phase7-validation";

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
    const parsed = validateAdminWaitlistStatusPayload(rawBody);

    if (!parsed.ok) {
      return NextResponse.json(
        { ok: false, errors: parsed.errors },
        { status: rawBody === null ? 400 : 422 }
      );
    }

    const { data, error } = await adminContext.admin.rpc(
      "admin_update_waitlist_status",
      {
        p_admin_user_id: adminContext.userId,
        p_waitlist_id: id,
        p_status: parsed.data.status,
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
          error instanceof Error ? error.message : "waitlist更新に失敗しました。"
        ]
      },
      { status: 500 }
    );
  }
}
