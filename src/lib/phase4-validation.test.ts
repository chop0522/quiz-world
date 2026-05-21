import { describe, expect, it } from "vitest";
import {
  answerStatusHttpStatus,
  answerStatusMessage,
  shouldExposeQuestionForAnswer,
  validateAnswerPayload
} from "@/lib/phase4-validation";

describe("phase4 answer validation", () => {
  it("accepts a valid choiceId payload", () => {
    const result = validateAnswerPayload({ choiceId: "choice_1" });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.choiceId).toBe("choice_1");
    }
  });

  it("accepts snake_case choice_id payloads", () => {
    const result = validateAnswerPayload({ choice_id: "choice_2" });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.choiceId).toBe("choice_2");
    }
  });

  it("rejects missing choiceId", () => {
    const result = validateAnswerPayload({});

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain("choiceIdは必須です。");
    }
  });

  it("maps submit answer statuses to HTTP status codes", () => {
    expect(answerStatusHttpStatus("answered")).toBe(201);
    expect(answerStatusHttpStatus("auth_required")).toBe(401);
    expect(answerStatusHttpStatus("not_recipient")).toBe(403);
    expect(answerStatusHttpStatus("launch_not_found")).toBe(404);
    expect(answerStatusHttpStatus("already_answered")).toBe(409);
    expect(answerStatusHttpStatus("not_started")).toBe(422);
    expect(answerStatusHttpStatus("closed")).toBe(422);
    expect(answerStatusHttpStatus("invalid_choice")).toBe(422);
  });

  it("keeps RPC messages user-facing", () => {
    expect(answerStatusMessage("already_answered")).toBe("このクイズには回答済みです。");
    expect(answerStatusMessage("author_cannot_answer")).toBe("出題者本人は回答できません。");
  });

  it("exposes question only to recipients after start_at", () => {
    expect(shouldExposeQuestionForAnswer({
      viewerRole: "recipient",
      hasStarted: true
    })).toBe(true);
    expect(shouldExposeQuestionForAnswer({
      viewerRole: "recipient",
      hasStarted: false
    })).toBe(false);
    expect(shouldExposeQuestionForAnswer({
      viewerRole: "author",
      hasStarted: true
    })).toBe(false);
    expect(shouldExposeQuestionForAnswer({
      viewerRole: "admin",
      hasStarted: true
    })).toBe(false);
  });
});
