import { NextResponse } from "next/server";
import {
  getLaunchAccess,
  launchAccessErrorMessage,
  toLaunchDetailResponse,
  toLaunchListResponse,
  type LaunchAuthorMeta,
  type LaunchQuestionMeta,
  type QuizLaunchRow,
  type QuizRecipientRow
} from "@/lib/phase3-data";
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
    const access = await getLaunchAccess(admin, user.id);

    if (!access.ok) {
      return NextResponse.json(
        { ok: false, errors: [launchAccessErrorMessage(access.reason)] },
        { status: 403 }
      );
    }

    const { data: launchData, error: launchError } = await admin
      .from("quiz_launches")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (launchError) {
      throw launchError;
    }

    if (!launchData) {
      return NextResponse.json(
        { ok: false, errors: ["launchが見つかりません。"] },
        { status: 404 }
      );
    }

    const launch = launchData as QuizLaunchRow;
    let viewerRole: "author" | "recipient" | "admin" | null = null;
    let recipient: QuizRecipientRow | null = null;

    if (launch.author_id === user.id) {
      viewerRole = "author";
    } else {
      const { data: recipientData, error: recipientError } = await admin
        .from("quiz_recipients")
        .select("*")
        .eq("launch_id", launch.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (recipientError) {
        throw recipientError;
      }

      if (recipientData) {
        recipient = recipientData as QuizRecipientRow;
        viewerRole = "recipient";
      } else if (access.profile.role === "admin") {
        viewerRole = "admin";
      }
    }

    if (!viewerRole) {
      return NextResponse.json(
        { ok: false, errors: ["launchが見つかりません。"] },
        { status: 404 }
      );
    }

    const { data: questionData, error: questionError } = await admin
      .from("questions")
      .select("id,category,difficulty")
      .eq("id", launch.question_id)
      .single();

    if (questionError) {
      throw questionError;
    }

    const { data: authorData, error: authorError } = await admin
      .from("profiles")
      .select("id,display_name")
      .eq("id", launch.author_id)
      .single();

    if (authorError) {
      throw authorError;
    }

    const base = toLaunchListResponse({
      launch,
      question: questionData as LaunchQuestionMeta,
      author: authorData as LaunchAuthorMeta,
      notificationStatus: recipient?.notification_status
    });

    return NextResponse.json({
      ok: true,
      launch: toLaunchDetailResponse(base, viewerRole)
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        errors: [
          error instanceof Error ? error.message : "launch詳細の取得に失敗しました。"
        ]
      },
      { status: 500 }
    );
  }
}
