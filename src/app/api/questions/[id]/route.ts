import { NextResponse } from "next/server";
import {
  getQuestionAuthorAccess,
  questionInsertFromPayload,
  toQuestionResponse,
  type QuestionRow
} from "@/lib/phase2-data";
import { validateQuestionPayload } from "@/lib/phase2-validation";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function accessErrorMessage(reason: string): string {
  const messages: Record<string, string> = {
    profile_missing: "profileが未作成です。",
    user_suspended: "停止中のユーザーは問題を編集できません。",
    world_member_inactive: "activeなworld参加状態が必要です。"
  };

  return messages[reason] ?? "問題編集権限がありません。";
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
      .eq("id", id)
      .eq("author_id", user.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return NextResponse.json(
        { ok: false, errors: ["問題が見つかりません。"] },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      question: toQuestionResponse(data as QuestionRow)
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        errors: [
          error instanceof Error ? error.message : "問題詳細の取得に失敗しました。"
        ]
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, errors: ["ログインが必要です。"] },
        { status: 401 }
      );
    }

    const { id } = await context.params;
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

    const { data: existing, error: existingError } = await admin
      .from("questions")
      .select("id,status")
      .eq("id", id)
      .eq("author_id", user.id)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (!existing) {
      return NextResponse.json(
        { ok: false, errors: ["問題が見つかりません。"] },
        { status: 404 }
      );
    }

    if (!["draft", "active"].includes(existing.status as string)) {
      return NextResponse.json(
        {
          ok: false,
          errors: ["レビュー中または停止中の問題はユーザーAPIから編集できません。"]
        },
        { status: 403 }
      );
    }

    const update = questionInsertFromPayload(user.id, parsed.data);
    const { data, error } = await admin
      .from("questions")
      .update({
        body: update.body,
        choices: update.choices,
        correct_choice_id: update.correct_choice_id,
        correct_answer: update.correct_answer,
        answer_aliases: update.answer_aliases,
        difficulty: update.difficulty,
        category: update.category,
        category_note: update.category_note,
        status: update.status
      })
      .eq("id", id)
      .eq("author_id", user.id)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      ok: true,
      question: toQuestionResponse(data as QuestionRow)
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        errors: [
          error instanceof Error ? error.message : "問題更新に失敗しました。"
        ]
      },
      { status: 500 }
    );
  }
}
