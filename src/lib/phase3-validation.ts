import type { ValidationResult } from "@/lib/phase1-validation";

export const launchTiming = {
  startDelaySeconds: 15,
  answerWindowSeconds: 60
} as const;

export const launchStatuses = [
  "scheduled",
  "open",
  "closed",
  "cancelled"
] as const;

export const notificationStatuses = [
  "pending",
  "in_app_ready",
  "skipped",
  "failed"
] as const;

export type LaunchStatus = typeof launchStatuses[number];
export type ComputedLaunchStatus = LaunchStatus;
export type NotificationStatus = typeof notificationStatuses[number];

export type QuizLaunchPayload = {
  questionId: string;
};

function asRecord(input: unknown): Record<string, unknown> {
  return typeof input === "object" && input !== null
    ? input as Record<string, unknown>
    : {};
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function validateQuizLaunchPayload(
  input: unknown
): ValidationResult<QuizLaunchPayload> {
  const body = asRecord(input);
  const questionId = asString(body.questionId ?? body.question_id);
  const errors: string[] = [];

  if (!questionId) {
    errors.push("questionIdは必須です。");
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: { questionId }
  };
}

export function getRecipientLimitForQuestionerRank(rank: number): number {
  if (rank >= 4) {
    return 20;
  }

  if (rank >= 3) {
    return 12;
  }

  if (rank >= 2) {
    return 8;
  }

  if (rank >= 1) {
    return 5;
  }

  return 3;
}

export function getDailyLaunchLimitForQuestionerRank(rank: number): number {
  if (rank >= 4) {
    return 8;
  }

  if (rank >= 3) {
    return 5;
  }

  if (rank >= 2) {
    return 3;
  }

  if (rank >= 1) {
    return 2;
  }

  return 1;
}

export function getUtcDayRange(now: Date): { start: Date; end: Date } {
  const start = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    0,
    0,
    0,
    0
  ));
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

export function getLaunchTimes(now: Date): { startAt: Date; endAt: Date } {
  const startAt = new Date(now.getTime() + launchTiming.startDelaySeconds * 1000);
  const endAt = new Date(startAt.getTime() + launchTiming.answerWindowSeconds * 1000);
  return { startAt, endAt };
}

export function getComputedLaunchStatus({
  status,
  startAt,
  endAt,
  now = new Date()
}: {
  status: LaunchStatus;
  startAt: string | Date;
  endAt: string | Date;
  now?: Date;
}): ComputedLaunchStatus {
  if (status === "cancelled") {
    return "cancelled";
  }

  const start = startAt instanceof Date ? startAt : new Date(startAt);
  const end = endAt instanceof Date ? endAt : new Date(endAt);

  if (now.getTime() < start.getTime()) {
    return "scheduled";
  }

  if (now.getTime() < end.getTime()) {
    return "open";
  }

  return "closed";
}
