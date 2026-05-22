import { describe, expect, it } from "vitest";
import {
  canViewResult,
  validateRatingPayload,
  validateReportPayload
} from "@/lib/phase5-validation";

describe("phase5 result rating report validation", () => {
  it("accepts a valid rating payload with one reason tag", () => {
    const result = validateRatingPayload({
      rating: "good",
      reason: "面白い"
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.rating).toBe("good");
      expect(result.data.reason).toBe("面白い");
    }
  });

  it("rejects invalid rating values and invalid reason tags", () => {
    const result = validateRatingPayload({
      rating: "great",
      reason: "複数タグ"
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain("ratingはgood/normal/weakのいずれかです。");
      expect(result.errors).toContain("reasonは固定理由タグから1つ選んでください。");
    }
  });

  it("accepts a valid report payload", () => {
    const result = validateReportPayload({
      launchId: "launch-id",
      questionId: "question-id",
      reason: "不適切"
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.launchId).toBe("launch-id");
      expect(result.data.questionId).toBe("question-id");
      expect(result.data.reason).toBe("不適切");
    }
  });

  it("accepts snake_case report ids", () => {
    const result = validateReportPayload({
      launch_id: "launch-id",
      question_id: "question-id",
      reason: "答えが曖昧"
    });

    expect(result.ok).toBe(true);
  });

  it("rejects invalid report payloads", () => {
    const result = validateReportPayload({
      reason: "その他ではない理由"
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain("launchIdは必須です。");
      expect(result.errors).toContain("questionIdは必須です。");
      expect(result.errors).toContain("reasonは固定通報理由から1つ選んでください。");
    }
  });

  it("allows recipients to view results only after answer or after end_at", () => {
    expect(canViewResult({
      viewerRole: "recipient",
      hasStarted: false,
      hasEnded: false,
      hasAnswered: true
    })).toBe(false);
    expect(canViewResult({
      viewerRole: "recipient",
      hasStarted: true,
      hasEnded: false,
      hasAnswered: false
    })).toBe(false);
    expect(canViewResult({
      viewerRole: "recipient",
      hasStarted: true,
      hasEnded: false,
      hasAnswered: true
    })).toBe(true);
    expect(canViewResult({
      viewerRole: "recipient",
      hasStarted: true,
      hasEnded: true,
      hasAnswered: false
    })).toBe(true);
  });

  it("allows authors to view results after start_at", () => {
    expect(canViewResult({
      viewerRole: "author",
      hasStarted: false,
      hasEnded: false,
      hasAnswered: false
    })).toBe(false);
    expect(canViewResult({
      viewerRole: "author",
      hasStarted: true,
      hasEnded: false,
      hasAnswered: false
    })).toBe(true);
  });
});
