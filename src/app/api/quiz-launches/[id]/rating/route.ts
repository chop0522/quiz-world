import { NextResponse } from "next/server";
import {
  getResultAccessContext,
  resultAccessErrorMessage,
  resultVisibilityErrorMessage,
  type QuestionRatingRow
} from "@/lib/phase5-data";
import { validateRatingPayload } from "@/lib/phase5-validation";
import type { ApplyRankEventsRpcResponse } from "@/lib/phase6-data";
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

async function readJsonBody(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

async function canCreateUserContent(admin: ReturnType<typeof getSupabaseAdminClient>, userId: string) {
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id,status")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  if (!profile || (profile as { status: string }).status !== "active") {
    return false;
  }

  const { data: member, error: memberError } = await admin
    .from("world_members")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (memberError) {
    throw memberError;
  }

  return member !== null;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, errors: ["ログインが必要です。"] },
        { status: 401 }
      );
    }

    const rawBody = await readJsonBody(request);
    const parsed = validateRatingPayload(rawBody);

    if (!parsed.ok) {
      return NextResponse.json(
        { ok: false, errors: parsed.errors },
        { status: rawBody === null ? 400 : 422 }
      );
    }

    const { id } = await context.params;
    const admin = getSupabaseAdminClient();

    if (!await canCreateUserContent(admin, user.id)) {
      return NextResponse.json(
        { ok: false, errors: ["停止中のユーザーは評価できません。"] },
        { status: 403 }
      );
    }

    const access = await getResultAccessContext(admin, user.id, id);

    if (!access.ok) {
      return NextResponse.json(
        { ok: false, errors: [resultAccessErrorMessage(access.reason)] },
        { status: access.reason === "not_found" ? 404 : 403 }
      );
    }

    if (access.viewerRole !== "recipient") {
      return NextResponse.json(
        { ok: false, errors: ["出題者本人は自分の問題を評価できません。"] },
        { status: 403 }
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

    if (!["active", "review_required"].includes(access.question.status)) {
      return NextResponse.json(
        { ok: false, errors: ["評価できる問題ではありません。"] },
        { status: 422 }
      );
    }

    const { data: existing, error: existingError } = await admin
      .from("question_ratings")
      .select("id")
      .eq("launch_id", access.launch.id)
      .eq("rater_id", user.id)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existing) {
      return NextResponse.json(
        { ok: false, errors: ["このクイズは評価済みです。"] },
        { status: 409 }
      );
    }

    const { data: ratingData, error: insertError } = await admin
      .from("question_ratings")
      .insert({
        launch_id: access.launch.id,
        question_id: access.question.id,
        rater_id: user.id,
        rating: parsed.data.rating,
        reason: parsed.data.reason
      })
      .select("*")
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json(
          { ok: false, errors: ["このクイズは評価済みです。"] },
          { status: 409 }
        );
      }

      throw insertError;
    }

    const rating = ratingData as QuestionRatingRow;
    const { data: rankEventData, error: rankEventError } = await admin.rpc(
      "apply_rating_rank_events",
      {
        p_rating_id: rating.id
      }
    );

    if (rankEventError) {
      throw rankEventError;
    }

    return NextResponse.json(
      {
        ok: true,
        rating: {
          id: rating.id,
          launchId: rating.launch_id,
          questionId: rating.question_id,
          raterId: rating.rater_id,
          rating: rating.rating,
          reason: rating.reason,
          createdAt: rating.created_at
        },
        rankEvents: rankEventData as ApplyRankEventsRpcResponse | null
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        errors: [
          error instanceof Error ? error.message : "評価の保存に失敗しました。"
        ]
      },
      { status: 500 }
    );
  }
}
