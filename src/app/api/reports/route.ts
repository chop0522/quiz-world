import { NextResponse } from "next/server";
import {
  getResultAccessContext,
  resultAccessErrorMessage,
  resultVisibilityErrorMessage,
  type ReportRow
} from "@/lib/phase5-data";
import { validateReportPayload } from "@/lib/phase5-validation";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

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

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, errors: ["ログインが必要です。"] },
        { status: 401 }
      );
    }

    const rawBody = await readJsonBody(request);
    const parsed = validateReportPayload(rawBody);

    if (!parsed.ok) {
      return NextResponse.json(
        { ok: false, errors: parsed.errors },
        { status: rawBody === null ? 400 : 422 }
      );
    }

    const admin = getSupabaseAdminClient();
    const access = await getResultAccessContext(admin, user.id, parsed.data.launchId);

    if (!access.ok) {
      return NextResponse.json(
        { ok: false, errors: [resultAccessErrorMessage(access.reason)] },
        { status: access.reason === "not_found" ? 404 : 403 }
      );
    }

    if (access.question.id !== parsed.data.questionId) {
      return NextResponse.json(
        { ok: false, errors: ["questionIdとlaunchIdが一致しません。"] },
        { status: 422 }
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

    const { data: existing, error: existingError } = await admin
      .from("reports")
      .select("id")
      .eq("question_id", access.question.id)
      .eq("launch_id", access.launch.id)
      .eq("reporter_id", user.id)
      .eq("reason", parsed.data.reason)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existing) {
      return NextResponse.json(
        { ok: false, errors: ["同じ通報は送信済みです。"] },
        { status: 409 }
      );
    }

    const { data: reportData, error: insertError } = await admin
      .from("reports")
      .insert({
        question_id: access.question.id,
        launch_id: access.launch.id,
        reporter_id: user.id,
        reason: parsed.data.reason,
        status: "open"
      })
      .select("*")
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json(
          { ok: false, errors: ["同じ通報は送信済みです。"] },
          { status: 409 }
        );
      }

      throw insertError;
    }

    const report = reportData as ReportRow;

    return NextResponse.json(
      {
        ok: true,
        report: {
          id: report.id,
          questionId: report.question_id,
          launchId: report.launch_id,
          reporterId: report.reporter_id,
          reason: report.reason,
          status: report.status,
          createdAt: report.created_at
        }
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        errors: [
          error instanceof Error ? error.message : "通報の保存に失敗しました。"
        ]
      },
      { status: 500 }
    );
  }
}
