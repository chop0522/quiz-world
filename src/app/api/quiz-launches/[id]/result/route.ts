import { NextResponse } from "next/server";
import {
  buildLaunchResultResponse,
  getResultAccessContext,
  resultAccessErrorMessage,
  resultVisibilityErrorMessage
} from "@/lib/phase5-data";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

async function getAuthenticatedUser() {
  const server = await getSupabaseServerClient();
  const {
    data: { user },
    error
  } = await server.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, errors: ["ログインが必要です。"] },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const admin = getSupabaseAdminClient();
    const access = await getResultAccessContext(admin, user.id, id);

    if (!access.ok) {
      return NextResponse.json(
        { ok: false, errors: [resultAccessErrorMessage(access.reason)] },
        { status: access.reason === "not_found" ? 404 : 403 }
      );
    }

    if (!access.canView) {
      return NextResponse.json(
        {
          ok: false,
          errors: [
            resultVisibilityErrorMessage({
              hasStarted: access.hasStarted,
              hasEnded: access.hasEnded,
              hasAnswered: access.hasAnswered,
              viewerRole: access.viewerRole
            })
          ]
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      ok: true,
      result: await buildLaunchResultResponse(admin, access)
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        errors: [
          error instanceof Error ? error.message : "resultの取得に失敗しました。"
        ]
      },
      { status: 500 }
    );
  }
}
