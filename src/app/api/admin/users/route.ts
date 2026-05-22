import { NextResponse } from "next/server";
import {
  adminContextErrorResponse,
  getAdminContext,
  toNumber
} from "@/lib/phase7-admin";

type ProfileRow = {
  id: string;
  display_name: string;
  role: string;
  status: string;
  answer_rank: number;
  answer_score: number;
  questioner_rank: number;
  questioner_score: number;
  created_at: string;
  updated_at: string;
};

type WorldMemberRow = {
  user_id: string;
  world_id: string;
  role: string;
  status: string;
  joined_at: string;
};

function countByUser(rows: { user_id: string }[]): Map<string, number> {
  const counts = new Map<string, number>();

  for (const row of rows) {
    counts.set(row.user_id, (counts.get(row.user_id) ?? 0) + 1);
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
    const limit = Math.min(Math.max(toNumber(url.searchParams.get("limit"), 50), 1), 100);
    const { data: profileData, error: profileError } = await adminContext.admin
      .from("profiles")
      .select("id,display_name,role,status,answer_rank,answer_score,questioner_rank,questioner_score,created_at,updated_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (profileError) {
      throw profileError;
    }

    const profiles = (profileData as ProfileRow[] | null) ?? [];
    const userIds = profiles.map((profile) => profile.id);
    const worldMembers = new Map<string, WorldMemberRow[]>();
    let questionCounts = new Map<string, number>();
    let answerCounts = new Map<string, number>();
    let reportCounts = new Map<string, number>();

    if (userIds.length > 0) {
      const [
        { data: worldMemberData, error: worldMemberError },
        { data: questionData, error: questionError },
        { data: answerData, error: answerError },
        { data: reportData, error: reportError }
      ] = await Promise.all([
        adminContext.admin
          .from("world_members")
          .select("user_id,world_id,role,status,joined_at")
          .in("user_id", userIds),
        adminContext.admin
          .from("questions")
          .select("author_id")
          .in("author_id", userIds),
        adminContext.admin
          .from("answers")
          .select("user_id")
          .in("user_id", userIds),
        adminContext.admin
          .from("reports")
          .select("reporter_id")
          .in("reporter_id", userIds)
      ]);

      if (worldMemberError) {
        throw worldMemberError;
      }

      if (questionError) {
        throw questionError;
      }

      if (answerError) {
        throw answerError;
      }

      if (reportError) {
        throw reportError;
      }

      for (const member of (worldMemberData as WorldMemberRow[] | null) ?? []) {
        worldMembers.set(member.user_id, [
          ...(worldMembers.get(member.user_id) ?? []),
          member
        ]);
      }

      questionCounts = countByUser(
        ((questionData as { author_id: string }[] | null) ?? [])
          .map((question) => ({ user_id: question.author_id }))
      );
      answerCounts = countByUser((answerData as { user_id: string }[] | null) ?? []);
      reportCounts = countByUser(
        ((reportData as { reporter_id: string }[] | null) ?? [])
          .map((report) => ({ user_id: report.reporter_id }))
      );
    }

    return NextResponse.json({
      ok: true,
      users: profiles.map((profile) => ({
        id: profile.id,
        displayName: profile.display_name,
        role: profile.role,
        status: profile.status,
        answerRank: profile.answer_rank,
        answerScore: profile.answer_score,
        questionerRank: profile.questioner_rank,
        questionerScore: profile.questioner_score,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
        worldMembers: (worldMembers.get(profile.id) ?? []).map((member) => ({
          worldId: member.world_id,
          role: member.role,
          status: member.status,
          joinedAt: member.joined_at
        })),
        counts: {
          questions: questionCounts.get(profile.id) ?? 0,
          answers: answerCounts.get(profile.id) ?? 0,
          reports: reportCounts.get(profile.id) ?? 0
        }
      }))
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        errors: [
          error instanceof Error ? error.message : "user一覧の取得に失敗しました。"
        ]
      },
      { status: 500 }
    );
  }
}
