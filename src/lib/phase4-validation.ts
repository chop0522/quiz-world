import type { ValidationResult } from "@/lib/phase1-validation";

export type AnswerPayload = {
  choiceId: string;
};

export const submitAnswerStatuses = [
  "answered",
  "auth_required",
  "validation_error",
  "launch_not_found",
  "not_recipient",
  "author_cannot_answer",
  "user_suspended",
  "world_member_inactive",
  "question_not_active",
  "launch_unavailable",
  "not_started",
  "closed",
  "invalid_choice",
  "already_answered"
] as const;

export type SubmitAnswerStatus = typeof submitAnswerStatuses[number];

function asRecord(input: unknown): Record<string, unknown> {
  return typeof input === "object" && input !== null
    ? input as Record<string, unknown>
    : {};
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function validateAnswerPayload(input: unknown): ValidationResult<AnswerPayload> {
  const body = asRecord(input);
  const choiceId = asString(body.choiceId ?? body.choice_id);
  const errors: string[] = [];

  if (!choiceId) {
    errors.push("choiceIdは必須です。");
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: { choiceId }
  };
}

export function isSubmitAnswerStatus(value: string): value is SubmitAnswerStatus {
  return submitAnswerStatuses.includes(value as SubmitAnswerStatus);
}

export function answerStatusMessage(status: SubmitAnswerStatus): string {
  const messages: Record<SubmitAnswerStatus, string> = {
    answered: "回答しました。",
    auth_required: "ログインが必要です。",
    validation_error: "回答内容が不正です。",
    launch_not_found: "launchが見つかりません。",
    not_recipient: "自分に届いたクイズではありません。",
    author_cannot_answer: "出題者本人は回答できません。",
    user_suspended: "停止中のユーザーは回答できません。",
    world_member_inactive: "activeなworld参加状態が必要です。",
    question_not_active: "回答できる問題ではありません。",
    launch_unavailable: "このlaunchは回答できません。",
    not_started: "まだ回答受付前です。",
    closed: "回答受付は終了しました。",
    invalid_choice: "選択肢が不正です。",
    already_answered: "このクイズには回答済みです。"
  };

  return messages[status];
}

export function answerStatusHttpStatus(status: SubmitAnswerStatus): number {
  if (status === "answered") {
    return 201;
  }

  if (status === "auth_required") {
    return 401;
  }

  if (status === "launch_not_found") {
    return 404;
  }

  if (status === "already_answered") {
    return 409;
  }

  if (
    status === "not_recipient"
    || status === "author_cannot_answer"
    || status === "user_suspended"
    || status === "world_member_inactive"
  ) {
    return 403;
  }

  return 422;
}

export function shouldExposeQuestionForAnswer({
  viewerRole,
  hasStarted
}: {
  viewerRole: "author" | "recipient" | "admin";
  hasStarted: boolean;
}): boolean {
  return viewerRole === "recipient" && hasStarted;
}
