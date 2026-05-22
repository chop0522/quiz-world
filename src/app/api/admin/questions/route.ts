import { NextResponse } from "next/server";
import {
  adminContextErrorResponse,
  getAdminContext,
  toNumber
} from "@/lib/phase7-admin";
import { allQuestionStatuses } from "@/lib/phase2-validation";

type QuestionRow = {
  id: string;
  author_id: string;
  body: string;
  category: string;
  difficulty: number;
  status: string;
  created_at: string;
  updated_at: string;
};

type ProfileRow = {
  id: string;
  display_name: string;
  role: string;
  status: string;
};

function preview(value: string, maxLength = 100): string {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

function countByQuestion(rows: { question_id: string }[]): Map<string, number> {
  const counts = new Map<string, number>();

  for (const row of rows) {
    counts.set(row.question_id, (counts.get(row.question_id) ?? 0) + 1);
  }

  return counts;
}

export async function GET(request: Request) {
  try {
    const adminContext = await getAdminContext();

    if (!adminContext.ok) {
      return adminContextErrorResponse(adminContext);
    }

    const url = new URL(request.url);
    const statusParam = url.searchParams.get("status") ?? "";
    const reportedOnly = url.searchParams.get("reportedOnly") === "true";
    const limit = Math.min(Math.max(toNumber(url.searchParams.get("limit"), 50), 1), 100);
    let query = adminContext.admin
      .from("questions")
      .select("id,author_id,body,category,difficulty,status,created_at,updated_at")
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (allQuestionStatuses.includes(statusParam as typeof allQuestionStatuses[number])) {
      query = query.eq("status", statusParam);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    let questions = (data as QuestionRow[] | null) ?? [];
    const questionIds = questions.map((question) => question.id);
    const authorIds = [...new Set(questions.map((question) => question.author_id))];
    const profiles = new Map<string, ProfileRow>();
    let reportCounts = new Map<string, number>();
    let launchCounts = new Map<string, number>();
    const answerCounts = new Map<string, number>();

    if (questionIds.length > 0) {
      const [
        { data: reportData, error: reportError },
        { data: launchData, error: launchError },
        { data: answerLaunchData, error: answerLaunchError }
      ] = await Promise.all([
        adminContext.admin
          .from("reports")
          .select("question_id")
          .in("question_id", questionIds),
        adminContext.admin
          .from("quiz_launches")
          .select("id,question_id")
          .in("question_id", questionIds),
        adminContext.admin
          .from("quiz_launches")
          .select("id,question_id,answers(id)")
          .in("question_id", questionIds)
      ]);

      if (reportError) {
        throw reportError;
      }

      if (launchError) {
        throw launchError;
      }

      if (answerLaunchError) {
        throw answerLaunchError;
      }

      reportCounts = countByQuestion((reportData as { question_id: string }[] | null) ?? []);
      launchCounts = countByQuestion((launchData as { question_id: string }[] | null) ?? []);

      for (const launch of (answerLaunchData as {
        question_id: string;
        answers?: { id: string }[];
      }[] | null) ?? []) {
        answerCounts.set(
          launch.question_id,
          (answerCounts.get(launch.question_id) ?? 0) + (launch.answers?.length ?? 0)
        );
      }

      if (reportedOnly) {
        questions = questions.filter((question) => (reportCounts.get(question.id) ?? 0) > 0);
      }
    }

    if (authorIds.length > 0) {
      const { data: profileData, error: profileError } = await adminContext.admin
        .from("profiles")
        .select("id,display_name,role,status")
        .in("id", authorIds);

      if (profileError) {
        throw profileError;
      }

      for (const profile of (profileData as ProfileRow[] | null) ?? []) {
        profiles.set(profile.id, profile);
      }
    }

    return NextResponse.json({
      ok: true,
      questions: questions.map((question) => {
        const reportCount = reportCounts.get(question.id) ?? 0;

        return {
          id: question.id,
          authorId: question.author_id,
          authorDisplayName: profiles.get(question.author_id)?.display_name ?? "Unknown",
          bodyPreview: preview(question.body),
          category: question.category,
          difficulty: question.difficulty,
          status: question.status,
          createdAt: question.created_at,
          updatedAt: question.updated_at,
          counts: {
            reports: reportCount,
            launches: launchCounts.get(question.id) ?? 0,
            answers: answerCounts.get(question.id) ?? 0
          },
          reviewRequiredCandidate: reportCount >= 2 && question.status === "active"
        };
      })
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        errors: [
          error instanceof Error ? error.message : "question一覧の取得に失敗しました。"
        ]
      },
      { status: 500 }
    );
  }
}
