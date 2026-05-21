import type { QuestionCategory, QuestionChoice } from "@/lib/phase2-validation";
import type { LaunchStatus, NotificationStatus } from "@/lib/phase3-validation";
import type { SubmitAnswerStatus } from "@/lib/phase4-validation";

export type AnswerRow = {
  id: string;
  launch_id: string;
  user_id: string;
  answer_text: string | null;
  normalized_answer: string | null;
  choice_id: string;
  is_correct: boolean;
  answer_received_at: string;
  answer_rank: number;
  correct_rank: number | null;
  created_at: string;
};

export type AnswerResponse = {
  id: string;
  launchId: string;
  userId: string;
  choiceId: string;
  isCorrect: boolean;
  answerReceivedAt: string;
  answerRank: number;
  correctRank: number | null;
};

export type SubmitAnswerRpcResponse = {
  status?: SubmitAnswerStatus | string;
  answer?: AnswerResponse;
};

export type LaunchAnswerQuestionMeta = {
  id: string;
  body: string;
  choices: QuestionChoice[];
  category: QuestionCategory;
  difficulty: number;
  status: "draft" | "active" | "suspended";
};

export type LaunchAnswerDetailResponse = {
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
  viewerRole: "author" | "recipient" | "admin";
  notificationStatus?: NotificationStatus;
};

export type LaunchAnswerState = {
  isRecipient: boolean;
  hasStarted: boolean;
  hasEnded: boolean;
  hasAnswered: boolean;
  canAnswer: boolean;
};

export function toAnswerResponse(answer: AnswerRow): AnswerResponse {
  return {
    id: answer.id,
    launchId: answer.launch_id,
    userId: answer.user_id,
    choiceId: answer.choice_id,
    isCorrect: answer.is_correct,
    answerReceivedAt: answer.answer_received_at,
    answerRank: answer.answer_rank,
    correctRank: answer.correct_rank
  };
}
