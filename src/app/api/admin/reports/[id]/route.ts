import { NextResponse } from "next/server";
import {
  adminContextErrorResponse,
  adminMutationResponse,
  getAdminContext,
  type AdminRpcResponse
} from "@/lib/phase7-admin";
import { validateAdminReportStatusPayload } from "@/lib/phase7-validation";

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

export async function GET(_request: Request, context: RouteContext) {
  try {
    const adminContext = await getAdminContext();

    if (!adminContext.ok) {
      return adminContextErrorResponse(adminContext);
    }

    const { id } = await context.params;
    const { data: reportData, error: reportError } = await adminContext.admin
      .from("reports")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (reportError) {
      throw reportError;
    }

    if (!reportData) {
      return NextResponse.json(
        { ok: false, errors: ["reportが見つかりません。"] },
        { status: 404 }
      );
    }

    const report = reportData as {
      id: string;
      question_id: string;
      launch_id: string;
      reporter_id: string;
      reason: string;
      status: string;
      created_at: string;
      updated_at: string;
    };

    const [{ data: questionData, error: questionError }, { data: launchData, error: launchError }] =
      await Promise.all([
        adminContext.admin
          .from("questions")
          .select("id,author_id,body,category,difficulty,status,created_at,updated_at")
          .eq("id", report.question_id)
          .maybeSingle(),
        adminContext.admin
          .from("quiz_launches")
          .select("id,start_at,end_at,status,recipient_count,created_at")
          .eq("id", report.launch_id)
          .maybeSingle()
      ]);

    if (questionError) {
      throw questionError;
    }

    if (launchError) {
      throw launchError;
    }

    const question = questionData as {
      id: string;
      author_id: string;
      body: string;
      category: string;
      difficulty: number;
      status: string;
      created_at: string;
      updated_at: string;
    } | null;

    const profileIds = [
      report.reporter_id,
      ...(question?.author_id ? [question.author_id] : [])
    ];

    const { data: profileData, error: profileError } = await adminContext.admin
      .from("profiles")
      .select("id,display_name,role,status")
      .in("id", [...new Set(profileIds)]);

    if (profileError) {
      throw profileError;
    }

    const profiles = new Map(
      ((profileData as {
        id: string;
        display_name: string;
        role: string;
        status: string;
      }[] | null) ?? []).map((profile) => [profile.id, profile])
    );

    const { count: reportCount, error: reportCountError } = await adminContext.admin
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("question_id", report.question_id);

    if (reportCountError) {
      throw reportCountError;
    }

    return NextResponse.json({
      ok: true,
      report: {
        id: report.id,
        questionId: report.question_id,
        launchId: report.launch_id,
        reporterId: report.reporter_id,
        reporterDisplayName: profiles.get(report.reporter_id)?.display_name ?? "Unknown",
        reason: report.reason,
        status: report.status,
        createdAt: report.created_at,
        updatedAt: report.updated_at,
        sameQuestionReportCount: reportCount ?? 0,
        reviewRequiredCandidate: (reportCount ?? 0) >= 2
      },
      question: question
        ? {
            id: question.id,
            authorId: question.author_id,
            authorDisplayName: profiles.get(question.author_id)?.display_name ?? "Unknown",
            body: question.body,
            category: question.category,
            difficulty: question.difficulty,
            status: question.status,
            createdAt: question.created_at,
            updatedAt: question.updated_at
          }
        : null,
      launch: launchData
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        errors: [
          error instanceof Error ? error.message : "report詳細の取得に失敗しました。"
        ]
      },
      { status: 500 }
    );
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
    const parsed = validateAdminReportStatusPayload(rawBody);

    if (!parsed.ok) {
      return NextResponse.json(
        { ok: false, errors: parsed.errors },
        { status: rawBody === null ? 400 : 422 }
      );
    }

    const { data, error } = await adminContext.admin.rpc(
      "admin_update_report_status",
      {
        p_admin_user_id: adminContext.userId,
        p_report_id: id,
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
          error instanceof Error ? error.message : "report更新に失敗しました。"
        ]
      },
      { status: 500 }
    );
  }
}
