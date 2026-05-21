import type { SupabaseClient } from "@supabase/supabase-js";
import type { QuestionCategory } from "@/lib/phase2-validation";
import {
  getComputedLaunchStatus,
  getDailyLaunchLimitForQuestionerRank,
  getLaunchTimes,
  getRecipientLimitForQuestionerRank,
  getUtcDayRange,
  type LaunchStatus,
  type NotificationStatus
} from "@/lib/phase3-validation";

export type LaunchAccess =
  | {
      ok: true;
      profile: {
        id: string;
        display_name: string;
        role: "user" | "admin";
        status: "active";
        questioner_rank: number;
      };
      worldMember: {
        id: string;
        world_id: string;
        status: "active";
      };
    }
  | {
      ok: false;
      reason: "profile_missing" | "user_suspended" | "world_member_inactive";
    };

export type LaunchableQuestionResult =
  | {
      ok: true;
      question: {
        id: string;
        author_id: string;
        difficulty: number;
        category: QuestionCategory;
        status: "active";
      };
    }
  | {
      ok: false;
      reason: "not_found" | "not_active";
      status?: string;
    };

export type RecipientCandidate = {
  userId: string;
  displayName: string;
};

export type QuizLaunchRow = {
  id: string;
  question_id: string;
  author_id: string;
  world_id: string;
  recipient_count: number;
  requested_recipient_count: number | null;
  start_at: string;
  end_at: string;
  status: LaunchStatus;
  created_at: string;
  updated_at: string;
};

export type QuizRecipientRow = {
  id: string;
  launch_id: string;
  user_id: string;
  notification_status: NotificationStatus;
  notified_at: string | null;
  opened_at: string | null;
  created_at: string;
};

export type LaunchQuestionMeta = {
  id: string;
  category: QuestionCategory;
  difficulty: number;
};

export type LaunchAuthorMeta = {
  id: string;
  display_name: string;
};

export type LaunchListResponse = {
  id: string;
  questionId: string;
  authorId: string;
  worldId: string;
  authorDisplayName: string;
  category: QuestionCategory;
  difficulty: number;
  startAt: string;
  endAt: string;
  status: LaunchStatus;
  recipientCount: number;
  notificationStatus?: NotificationStatus;
};

export type LaunchDetailResponse = LaunchListResponse & {
  viewerRole: "author" | "recipient" | "admin";
};

type ProfileRow = {
  id: string;
  display_name: string;
  role: "user" | "admin";
  status: string;
  questioner_rank: number;
};

type WorldMemberRow = {
  id: string;
  world_id: string;
  status: string;
};

export function launchAccessErrorMessage(reason: LaunchAccess extends infer T
  ? T extends { ok: false; reason: infer R } ? R : never
  : never): string {
  const messages: Record<string, string> = {
    profile_missing: "profileが未作成です。",
    user_suspended: "停止中のユーザーは出題できません。",
    world_member_inactive: "activeなworld参加状態が必要です。"
  };

  return messages[String(reason)] ?? "出題権限がありません。";
}

export async function getLaunchAccess(
  client: SupabaseClient,
  userId: string
): Promise<LaunchAccess> {
  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("id,display_name,role,status,questioner_rank")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  if (!profile) {
    return { ok: false, reason: "profile_missing" };
  }

  const typedProfile = profile as ProfileRow;

  if (typedProfile.status !== "active") {
    return { ok: false, reason: "user_suspended" };
  }

  const { data: worldMember, error: memberError } = await client
    .from("world_members")
    .select("id,world_id,status")
    .eq("user_id", userId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (memberError) {
    throw memberError;
  }

  if (!worldMember) {
    return { ok: false, reason: "world_member_inactive" };
  }

  return {
    ok: true,
    profile: {
      id: typedProfile.id,
      display_name: typedProfile.display_name,
      role: typedProfile.role,
      status: "active",
      questioner_rank: typedProfile.questioner_rank
    },
    worldMember: worldMember as WorldMemberRow & { status: "active" }
  };
}

export async function getLaunchableQuestion(
  client: SupabaseClient,
  questionId: string,
  authorId: string
): Promise<LaunchableQuestionResult> {
  const { data, error } = await client
    .from("questions")
    .select("id,author_id,difficulty,category,status")
    .eq("id", questionId)
    .eq("author_id", authorId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return { ok: false, reason: "not_found" };
  }

  const question = data as {
    id: string;
    author_id: string;
    difficulty: number;
    category: QuestionCategory;
    status: string;
  };

  if (question.status !== "active") {
    return { ok: false, reason: "not_active", status: question.status };
  }

  return {
    ok: true,
    question: {
      ...question,
      status: "active"
    }
  };
}

export async function getDailyLaunchCount(
  client: SupabaseClient,
  authorId: string,
  now: Date
): Promise<number> {
  const { start, end } = getUtcDayRange(now);
  const { count, error } = await client
    .from("quiz_launches")
    .select("id", { count: "exact", head: true })
    .eq("author_id", authorId)
    .neq("status", "cancelled")
    .gte("created_at", start.toISOString())
    .lt("created_at", end.toISOString());

  if (error) {
    throw error;
  }

  return count ?? 0;
}

export async function getRecipientCandidates(
  client: SupabaseClient,
  worldId: string,
  authorId: string
): Promise<RecipientCandidate[]> {
  const { data: members, error: membersError } = await client
    .from("world_members")
    .select("user_id")
    .eq("world_id", worldId)
    .eq("status", "active")
    .neq("user_id", authorId);

  if (membersError) {
    throw membersError;
  }

  const memberIds = [...new Set(
    (members as { user_id: string }[] | null ?? []).map((member) => member.user_id)
  )];

  if (memberIds.length === 0) {
    return [];
  }

  const { data: profiles, error: profilesError } = await client
    .from("profiles")
    .select("id,display_name")
    .in("id", memberIds)
    .eq("status", "active");

  if (profilesError) {
    throw profilesError;
  }

  const activeProfiles = (profiles as { id: string; display_name: string }[] | null) ?? [];
  const activeIds = activeProfiles.map((profile) => profile.id);

  if (activeIds.length === 0) {
    return [];
  }

  const { data: blocksFromAuthor, error: blocksFromAuthorError } = await client
    .from("blocks")
    .select("blocked_id")
    .eq("blocker_id", authorId)
    .in("blocked_id", activeIds);

  if (blocksFromAuthorError) {
    throw blocksFromAuthorError;
  }

  const { data: blocksToAuthor, error: blocksToAuthorError } = await client
    .from("blocks")
    .select("blocker_id")
    .eq("blocked_id", authorId)
    .in("blocker_id", activeIds);

  if (blocksToAuthorError) {
    throw blocksToAuthorError;
  }

  const blockedIds = new Set<string>([
    ...((blocksFromAuthor as { blocked_id: string }[] | null) ?? [])
      .map((block) => block.blocked_id),
    ...((blocksToAuthor as { blocker_id: string }[] | null) ?? [])
      .map((block) => block.blocker_id)
  ]);

  return activeProfiles
    .filter((profile) => !blockedIds.has(profile.id))
    .map((profile) => ({
      userId: profile.id,
      displayName: profile.display_name
    }));
}

export function selectRecipients(
  candidates: RecipientCandidate[],
  limit: number,
  random: () => number = Math.random
): RecipientCandidate[] {
  const shuffled = [...candidates];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled.slice(0, Math.min(limit, shuffled.length));
}

export function getLaunchLimits(rank: number) {
  return {
    recipientLimit: getRecipientLimitForQuestionerRank(rank),
    dailyLaunchLimit: getDailyLaunchLimitForQuestionerRank(rank)
  };
}

export function createLaunchInsert({
  questionId,
  authorId,
  worldId,
  recipientCount,
  now
}: {
  questionId: string;
  authorId: string;
  worldId: string;
  recipientCount: number;
  now: Date;
}) {
  const { startAt, endAt } = getLaunchTimes(now);

  return {
    question_id: questionId,
    author_id: authorId,
    world_id: worldId,
    recipient_count: recipientCount,
    requested_recipient_count: null,
    start_at: startAt.toISOString(),
    end_at: endAt.toISOString(),
    status: "scheduled" as const
  };
}

export function toLaunchListResponse({
  launch,
  question,
  author,
  notificationStatus,
  now = new Date()
}: {
  launch: QuizLaunchRow;
  question: LaunchQuestionMeta;
  author: LaunchAuthorMeta;
  notificationStatus?: NotificationStatus;
  now?: Date;
}): LaunchListResponse {
  return {
    id: launch.id,
    questionId: launch.question_id,
    authorId: launch.author_id,
    worldId: launch.world_id,
    authorDisplayName: author.display_name,
    category: question.category,
    difficulty: question.difficulty,
    startAt: launch.start_at,
    endAt: launch.end_at,
    status: getComputedLaunchStatus({
      status: launch.status,
      startAt: launch.start_at,
      endAt: launch.end_at,
      now
    }),
    recipientCount: launch.recipient_count,
    ...(notificationStatus ? { notificationStatus } : {})
  };
}

export function toLaunchDetailResponse(
  response: LaunchListResponse,
  viewerRole: LaunchDetailResponse["viewerRole"]
): LaunchDetailResponse {
  return {
    ...response,
    viewerRole
  };
}
