import type { ValidationResult } from "@/lib/phase1-validation";

export const ratingValues = ["good", "normal", "weak"] as const;

export const ratingReasonTags = [
  "面白い",
  "難易度がちょうどいい",
  "答えが曖昧",
  "難しすぎる",
  "簡単すぎる",
  "不適切"
] as const;

export const reportReasonTags = [
  "答えが曖昧",
  "不適切",
  "スパム",
  "その他"
] as const;

export type RatingValue = typeof ratingValues[number];
export type RatingReasonTag = typeof ratingReasonTags[number];
export type ReportReasonTag = typeof reportReasonTags[number];

export type RatingPayload = {
  rating: RatingValue;
  reason: RatingReasonTag;
};

export type ReportPayload = {
  launchId: string;
  questionId: string;
  reason: ReportReasonTag;
};

export type ResultViewerRole = "author" | "recipient";

function asRecord(input: unknown): Record<string, unknown> {
  return typeof input === "object" && input !== null
    ? input as Record<string, unknown>
    : {};
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function isRatingValue(value: string): value is RatingValue {
  return ratingValues.includes(value as RatingValue);
}

export function isRatingReasonTag(value: string): value is RatingReasonTag {
  return ratingReasonTags.includes(value as RatingReasonTag);
}

export function isReportReasonTag(value: string): value is ReportReasonTag {
  return reportReasonTags.includes(value as ReportReasonTag);
}

export function validateRatingPayload(input: unknown): ValidationResult<RatingPayload> {
  const body = asRecord(input);
  const rating = asString(body.rating);
  const reason = asString(body.reason);
  const errors: string[] = [];

  if (!isRatingValue(rating)) {
    errors.push("ratingはgood/normal/weakのいずれかです。");
  }

  if (!isRatingReasonTag(reason)) {
    errors.push("reasonは固定理由タグから1つ選んでください。");
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      rating: rating as RatingValue,
      reason: reason as RatingReasonTag
    }
  };
}

export function validateReportPayload(input: unknown): ValidationResult<ReportPayload> {
  const body = asRecord(input);
  const launchId = asString(body.launchId ?? body.launch_id);
  const questionId = asString(body.questionId ?? body.question_id);
  const reason = asString(body.reason);
  const errors: string[] = [];

  if (!launchId) {
    errors.push("launchIdは必須です。");
  }

  if (!questionId) {
    errors.push("questionIdは必須です。");
  }

  if (!isReportReasonTag(reason)) {
    errors.push("reasonは固定通報理由から1つ選んでください。");
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      launchId,
      questionId,
      reason: reason as ReportReasonTag
    }
  };
}

export function canViewResult({
  viewerRole,
  hasStarted,
  hasEnded,
  hasAnswered
}: {
  viewerRole: ResultViewerRole;
  hasStarted: boolean;
  hasEnded: boolean;
  hasAnswered: boolean;
}): boolean {
  if (!hasStarted) {
    return false;
  }

  if (viewerRole === "author") {
    return true;
  }

  return hasAnswered || hasEnded;
}
