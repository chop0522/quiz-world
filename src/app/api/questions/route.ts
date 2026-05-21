import { NextResponse } from "next/server";
import {
  getQuestionAuthorAccess,
  questionInsertFromPayload,
  toQuestionListResponse,
  toQuestionResponse,
  type QuestionRow
} from "@/lib/phase2-data";
import { validateQuestionPayload } from "@/lib/phase2-validation";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function accessErrorMessage(reason: string): string {
  const messages: Record<string, string> = {
    profile_missing: "profileが未作成です。",
    user_suspended: "停止中のユーザーは問題を作成できません。",
    world_member_inactive: "activeなworld参加状態が必要です。"
  };

  return messages[reason] ?? "問題作成権限がありません。";
}

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

export async function GET() {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, errors: ["ログインが必要です。"] },
        { status: 401 }
      );
    }

    const admin = getSupabaseAdminClient();
    const access = await getQuestionAuthorAccess(admin, user.id);

    if (!access.ok) {
      return NextResponse.json(
        { ok: false, errors: [accessErrorMessage(access.reason)] },
        { status: 403 }
      );
    }

    const { data, error } = await admin
      .from("questions")
      .select("*")
      .eq("author_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      ok: true,
      questions: (data as QuestionRow[]).map(toQuestionListResponse)
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        errors: [
          error instanceof Error ? error.message : "問題一覧の取得に失敗しました。"
        ]
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, errors: ["ログインが必要です。"] },
        { status: 401 }
      );
    }

    const parsed = validateQuestionPayload(await request.json());

    if (!parsed.ok) {
      return NextResponse.json(
        { ok: false, errors: parsed.errors },
        { status: 422 }
      );
    }

    const admin = getSupabaseAdminClient();
    const access = await getQuestionAuthorAccess(admin, user.id);

    if (!access.ok) {
      return NextResponse.json(
        { ok: false, errors: [accessErrorMessage(access.reason)] },
        { status: 403 }
      );
    }

    const { data, error } = await admin
      .from("questions")
      .insert(questionInsertFromPayload(user.id, parsed.data))
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(
      {
        ok: true,
        question: toQuestionResponse(data as QuestionRow)
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        errors: [
          error instanceof Error ? error.message : "問題作成に失敗しました。"
        ]
      },
      { status: 500 }
    );
  }
}
