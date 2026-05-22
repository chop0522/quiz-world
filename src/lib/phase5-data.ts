import type { SupabaseClient } from "@supabase/supabase-js";
import type { QuestionCategory, QuestionChoice } from "@/lib/phase2-validation";
import {
  toLaunchListResponse,
  type LaunchAuthorMeta,
  type LaunchQuestionMeta,
  type QuizLaunchRow,
  type QuizRecipientRow
} from "@/lib/phase3-data";
import type { LaunchStatus } from "@/lib/phase3-validation";
import type { AnswerRow, AnswerResponse } from "@/lib/phase4-data";
import { toAnswerResponse } from "@/lib/phase4-data";
import {
  canViewResult,
  type RatingReasonTag,
  type RatingValue,
  type ReportReasonTag,
  type ResultViewerRole
} from "@/lib/phase5-validation";

export type ResultQuestionRow = {
  id: string;
  body: string;
  choices: QuestionChoice[];
  correct_choice_id: string;
  category: QuestionCategory;
  difficulty: number;
  status: string;
};

export type ResultAccessContext =
  | {
      ok: true;
      launch: QuizLaunchRow;
      question: ResultQuestionRow;
      author: LaunchAuthorMeta;
      recipient: QuizRecipientRow | null;
      viewerRole: ResultViewerRole;
      viewerAnswer: AnswerRow | null;
      hasStarted: boolean;
      hasEnded: boolean;
      hasAnswered: boolean;
      canView: boolean;
    }
  | {
      ok: false;
      reason: "not_found" | "not_related";
    };

export type ResultAnswerItem = {
  userId: string;
  displayName: string;
  choiceId: string;
  choiceText: string;
  isCorrect: boolean;
  answerReceivedAt: string;
  answerRank: number;
  correctRank: number | null;
};

export type ResultUnansweredItem = {
  userId: string;
  displayName: string;
};

export type LaunchResultResponse = {
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
  viewerRole: ResultViewerRole;
  question: {
    id: string;
    body: string;
    choices: QuestionChoice[];
    correctChoiceId: string;
    correctChoiceText: string;
  };
  viewerAnswer: AnswerResponse | null;
  answers: ResultAnswerItem[];
  unansweredRecipients: ResultUnansweredItem[];
  stats: {
    answeredCount: number;
    unansweredCount: number;
    correctCount: number;
  };
  state: {
    hasStarted: boolean;
    hasEnded: boolean;
    hasAnswered: boolean;
  };
};

export type QuestionRatingRow = {
  id: string;
  launch_id: string;
  question_id: string;
  rater_id: string;
  rating: RatingValue;
  reason: RatingReasonTag;
  created_at: string;
};

export type ReportRow = {
  id: string;
  question_id: string;
  launch_id: string;
  reporter_id: string;
  reason: ReportReasonTag;
  status: "open" | "reviewing" | "resolved" | "dismissed";
  created_at: string;
  updated_at: string;
};

type ProfileNameRow = {
  id: string;
  display_name: string;
};

function isQuestionChoiceArray(value: unknown): value is QuestionChoice[] {
  if (!Array.isArray(value)) {
    return false;
  }

  return value.every((choice) => (
    typeof choice === "object"
    && choice !== null
    && typeof (choice as { id?: unknown }).id === "string"
    && typeof (choice as { text?: unknown }).text === "string"
  ));
}

function normalizeQuestion(row: ResultQuestionRow): ResultQuestionRow {
  return {
    ...row,
    choices: isQuestionChoiceArray(row.choices) ? row.choices : []
  };
}

export function resultAccessErrorMessage(reason: ResultAccessContext extends infer T
  ? T extends { ok: false; reason: infer R } ? R : never
  : never): string {
  const messages: Record<string, string> = {
    not_found: "launchが見つかりません。",
    not_related: "このresultを見る権限がありません。"
  };

  return messages[String(reason)] ?? "resultを取得できません。";
}

export function resultVisibilityErrorMessage({
  hasStarted,
  hasEnded,
  hasAnswered,
  viewerRole
}: {
  hasStarted: boolean;
  hasEnded: boolean;
  hasAnswered: boolean;
  viewerRole: ResultViewerRole;
}): string {
  if (!hasStarted) {
    return "start_at前はresultを表示できません。";
  }

  if (viewerRole === "recipient" && !hasAnswered && !hasEnded) {
    return "回答後、または締切後にresultを表示できます。";
  }

  return "resultを表示できません。";
}

export async function getResultAccessContext(
  client: SupabaseClient,
  userId: string,
  launchId: string,
  now = new Date()
): Promise<ResultAccessContext> {
  const { data: launchData, error: launchError } = await client
    .from("quiz_launches")
    .select("*")
    .eq("id", launchId)
    .maybeSingle();

  if (launchError) {
    throw launchError;
  }

  if (!launchData) {
    return { ok: false, reason: "not_found" };
  }

  const launch = launchData as QuizLaunchRow;
  let viewerRole: ResultViewerRole | null = null;
  let recipient: QuizRecipientRow | null = null;

  if (launch.author_id === userId) {
    viewerRole = "author";
  } else {
    const { data: recipientData, error: recipientError } = await client
      .from("quiz_recipients")
      .select("*")
      .eq("launch_id", launch.id)
      .eq("user_id", userId)
      .maybeSingle();

    if (recipientError) {
      throw recipientError;
    }

    if (recipientData) {
      recipient = recipientData as QuizRecipientRow;
      viewerRole = "recipient";
    }
  }

  if (!viewerRole) {
    return { ok: false, reason: "not_related" };
  }

  const { data: questionData, error: questionError } = await client
    .from("questions")
    .select("id,body,choices,correct_choice_id,category,difficulty,status")
    .eq("id", launch.question_id)
    .maybeSingle();

  if (questionError) {
    throw questionError;
  }

  if (!questionData) {
    return { ok: false, reason: "not_found" };
  }

  const { data: authorData, error: authorError } = await client
    .from("profiles")
    .select("id,display_name")
    .eq("id", launch.author_id)
    .maybeSingle();

  if (authorError) {
    throw authorError;
  }

  if (!authorData) {
    return { ok: false, reason: "not_found" };
  }

  const { data: answerData, error: answerError } = await client
    .from("answers")
    .select("*")
    .eq("launch_id", launch.id)
    .eq("user_id", userId)
    .maybeSingle();

  if (answerError) {
    throw answerError;
  }

  const startAt = new Date(launch.start_at);
  const endAt = new Date(launch.end_at);
  const hasStarted = now.getTime() >= startAt.getTime();
  const hasEnded = now.getTime() >= endAt.getTime();
  const viewerAnswer = answerData as AnswerRow | null;
  const hasAnswered = viewerAnswer !== null;

  return {
    ok: true,
    launch,
    question: normalizeQuestion(questionData as ResultQuestionRow),
    author: authorData as LaunchAuthorMeta,
    recipient,
    viewerRole,
    viewerAnswer,
    hasStarted,
    hasEnded,
    hasAnswered,
    canView: canViewResult({
      viewerRole,
      hasStarted,
      hasEnded,
      hasAnswered
    })
  };
}

export async function buildLaunchResultResponse(
  client: SupabaseClient,
  context: Extract<ResultAccessContext, { ok: true }>,
  now = new Date()
): Promise<LaunchResultResponse> {
  const { launch, question, author } = context;
  const { data: recipientData, error: recipientError } = await client
    .from("quiz_recipients")
    .select("*")
    .eq("launch_id", launch.id)
    .order("created_at", { ascending: true });

  if (recipientError) {
    throw recipientError;
  }

  const recipients = (recipientData as QuizRecipientRow[] | null) ?? [];
  const recipientIds = recipients.map((recipient) => recipient.user_id);

  const { data: answerData, error: answerError } = await client
    .from("answers")
    .select("*")
    .eq("launch_id", launch.id)
    .order("answer_rank", { ascending: true });

  if (answerError) {
    throw answerError;
  }

  const answers = (answerData as AnswerRow[] | null) ?? [];
  const profileIds = [...new Set([
    ...recipientIds,
    ...answers.map((answer) => answer.user_id)
  ])];
  const profiles = new Map<string, ProfileNameRow>();

  if (profileIds.length > 0) {
    const { data: profileData, error: profileError } = await client
      .from("profiles")
      .select("id,display_name")
      .in("id", profileIds);

    if (profileError) {
      throw profileError;
    }

    for (const profile of (profileData as ProfileNameRow[] | null) ?? []) {
      profiles.set(profile.id, profile);
    }
  }

  const choices = new Map(question.choices.map((choice) => [choice.id, choice]));
  const answeredIds = new Set(answers.map((answer) => answer.user_id));
  const responseLaunch = toLaunchListResponse({
    launch,
    question: {
      id: question.id,
      category: question.category,
      difficulty: question.difficulty
    } as LaunchQuestionMeta,
    author,
    notificationStatus: context.recipient?.notification_status,
    now
  });
  const correctChoice = choices.get(question.correct_choice_id);

  return {
    ...responseLaunch,
    viewerRole: context.viewerRole,
    question: {
      id: question.id,
      body: question.body,
      choices: question.choices,
      correctChoiceId: question.correct_choice_id,
      correctChoiceText: correctChoice?.text ?? question.correct_choice_id
    },
    viewerAnswer: context.viewerAnswer
      ? toAnswerResponse(context.viewerAnswer)
      : null,
    answers: answers.map((answer) => ({
      userId: answer.user_id,
      displayName: profiles.get(answer.user_id)?.display_name ?? "Unknown",
      choiceId: answer.choice_id,
      choiceText: choices.get(answer.choice_id)?.text ?? answer.choice_id,
      isCorrect: answer.is_correct,
      answerReceivedAt: answer.answer_received_at,
      answerRank: answer.answer_rank,
      correctRank: answer.correct_rank
    })),
    unansweredRecipients: recipients
      .filter((recipientRow) => !answeredIds.has(recipientRow.user_id))
      .map((recipientRow) => ({
        userId: recipientRow.user_id,
        displayName: profiles.get(recipientRow.user_id)?.display_name ?? "Unknown"
      })),
    stats: {
      answeredCount: answers.length,
      unansweredCount: recipients.filter((recipientRow) => !answeredIds.has(recipientRow.user_id)).length,
      correctCount: answers.filter((answer) => answer.is_correct).length
    },
    state: {
      hasStarted: context.hasStarted,
      hasEnded: context.hasEnded,
      hasAnswered: context.hasAnswered
    }
  };
}
