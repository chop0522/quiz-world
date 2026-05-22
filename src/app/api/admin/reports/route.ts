import { NextResponse } from "next/server";
import {
  adminContextErrorResponse,
  getAdminContext,
  toNumber
} from "@/lib/phase7-admin";
import { isAdminReportStatus } from "@/lib/phase7-validation";

type ReportRow = {
  id: string;
  question_id: string;
  launch_id: string;
  reporter_id: string;
  reason: string;
  status: string;
  created_at: string;
  updated_at: string;
};

type QuestionRow = {
  id: string;
  author_id: string;
  body: string;
  status: string;
  category: string;
  difficulty: number;
};

type ProfileRow = {
  id: string;
  display_name: string;
  role: string;
  status: string;
};

function preview(value: string, maxLength = 80): string {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

export async function GET(request: Request) {
  try {
    const adminContext = await getAdminContext();

    if (!adminContext.ok) {
      return adminContextErrorResponse(adminContext);
    }

    const url = new URL(request.url);
    const statusParam = url.searchParams.get("status") ?? "";
    const limit = Math.min(Math.max(toNumber(url.searchParams.get("limit"), 50), 1), 100);
    let query = adminContext.admin
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (isAdminReportStatus(statusParam) || statusParam === "open") {
      query = query.eq("status", statusParam);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const reports = (data as ReportRow[] | null) ?? [];
    const questionIds = [...new Set(reports.map((report) => report.question_id))];
    const reporterIds = [...new Set(reports.map((report) => report.reporter_id))];
    const questions = new Map<string, QuestionRow>();
    const profiles = new Map<string, ProfileRow>();
    const reportCounts = new Map<string, number>();

    if (questionIds.length > 0) {
      const { data: questionData, error: questionError } = await adminContext.admin
        .from("questions")
        .select("id,author_id,body,status,category,difficulty")
        .in("id", questionIds);

      if (questionError) {
        throw questionError;
      }

      for (const question of (questionData as QuestionRow[] | null) ?? []) {
        questions.set(question.id, question);
      }

      const { data: countData, error: countError } = await adminContext.admin
        .from("reports")
        .select("id,question_id")
        .in("question_id", questionIds);

      if (countError) {
        throw countError;
      }

      for (const report of (countData as { question_id: string }[] | null) ?? []) {
        reportCounts.set(report.question_id, (reportCounts.get(report.question_id) ?? 0) + 1);
      }
    }

    const authorIds = [...new Set(
      [...questions.values()].map((question) => question.author_id)
    )];
    const profileIds = [...new Set([...reporterIds, ...authorIds])];

    if (profileIds.length > 0) {
      const { data: profileData, error: profileError } = await adminContext.admin
        .from("profiles")
        .select("id,display_name,role,status")
        .in("id", profileIds);

      if (profileError) {
        throw profileError;
      }

      for (const profile of (profileData as ProfileRow[] | null) ?? []) {
        profiles.set(profile.id, profile);
      }
    }

    return NextResponse.json({
      ok: true,
      reports: reports.map((report) => {
        const question = questions.get(report.question_id);
        const sameQuestionReportCount = reportCounts.get(report.question_id) ?? 0;

        return {
          id: report.id,
          questionId: report.question_id,
          launchId: report.launch_id,
          reporterId: report.reporter_id,
          reporterDisplayName: profiles.get(report.reporter_id)?.display_name ?? "Unknown",
          reason: report.reason,
          status: report.status,
          createdAt: report.created_at,
          updatedAt: report.updated_at,
          question: question
            ? {
                id: question.id,
                authorId: question.author_id,
                authorDisplayName: profiles.get(question.author_id)?.display_name ?? "Unknown",
                bodyPreview: preview(question.body),
                status: question.status,
                category: question.category,
                difficulty: question.difficulty
              }
            : null,
          sameQuestionReportCount,
          reviewRequiredCandidate: sameQuestionReportCount >= 2
        };
      })
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        errors: [
          error instanceof Error ? error.message : "reports一覧の取得に失敗しました。"
        ]
      },
      { status: 500 }
    );
  }
}
