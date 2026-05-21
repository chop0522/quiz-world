import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  QuestionCategory,
  QuestionChoice,
  QuestionPayload,
  QuestionStatus
} from "@/lib/phase2-validation";

export type QuestionRow = {
  id: string;
  author_id: string;
  type: "multiple_choice";
  body: string;
  choices: QuestionChoice[];
  correct_choice_id: string;
  correct_answer: string | null;
  answer_aliases: unknown | null;
  difficulty: number;
  category: QuestionCategory;
  category_note: string | null;
  status: QuestionStatus;
  created_at: string;
  updated_at: string;
};

export type QuestionAuthorAccess =
  | {
      ok: true;
      profile: {
        id: string;
        display_name: string;
        role: "user" | "admin";
        status: "active";
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

type ActiveProfileRow = {
  id: string;
  display_name: string;
  role: "user" | "admin";
  status: "active";
};

type ActiveWorldMemberRow = {
  id: string;
  world_id: string;
  status: "active";
};

export function toQuestionResponse(question: QuestionRow) {
  return {
    id: question.id,
    body: question.body,
    choices: question.choices,
    correctChoiceId: question.correct_choice_id,
    difficulty: question.difficulty,
    category: question.category,
    categoryNote: question.category_note,
    status: question.status,
    createdAt: question.created_at,
    updatedAt: question.updated_at
  };
}

export function toQuestionListResponse(question: QuestionRow) {
  return {
    id: question.id,
    bodyPreview: question.body.length > 80
      ? `${question.body.slice(0, 80)}...`
      : question.body,
    difficulty: question.difficulty,
    category: question.category,
    categoryNote: question.category_note,
    status: question.status,
    createdAt: question.created_at,
    updatedAt: question.updated_at
  };
}

export async function getQuestionAuthorAccess(
  client: SupabaseClient,
  userId: string
): Promise<QuestionAuthorAccess> {
  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("id,display_name,role,status")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  if (!profile) {
    return { ok: false, reason: "profile_missing" };
  }

  if (profile.status !== "active") {
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
    profile: profile as ActiveProfileRow,
    worldMember: worldMember as ActiveWorldMemberRow
  };
}

export function questionInsertFromPayload(userId: string, payload: QuestionPayload) {
  return {
    author_id: userId,
    type: "multiple_choice",
    body: payload.body,
    choices: payload.choices,
    correct_choice_id: payload.correctChoiceId,
    correct_answer: null,
    answer_aliases: null,
    difficulty: payload.difficulty,
    category: payload.category,
    category_note: payload.categoryNote,
    status: payload.status
  };
}
