import { describe, expect, it } from "vitest";
import {
  getComputedLaunchStatus,
  getDailyLaunchLimitForQuestionerRank,
  getLaunchTimes,
  getRecipientLimitForQuestionerRank,
  getUtcDayRange,
  validateQuizLaunchPayload
} from "@/lib/phase3-validation";
import { selectRecipients, type RecipientCandidate } from "@/lib/phase3-data";

describe("phase3 quiz launch validation", () => {
  it("accepts a valid questionId payload", () => {
    const result = validateQuizLaunchPayload({ questionId: "question-1" });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.questionId).toBe("question-1");
    }
  });

  it("rejects missing questionId", () => {
    const result = validateQuizLaunchPayload({});

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain("questionIdは必須です。");
    }
  });

  it("maps questioner_rank to recipient limits", () => {
    expect(getRecipientLimitForQuestionerRank(0)).toBe(3);
    expect(getRecipientLimitForQuestionerRank(1)).toBe(5);
    expect(getRecipientLimitForQuestionerRank(2)).toBe(8);
    expect(getRecipientLimitForQuestionerRank(3)).toBe(12);
    expect(getRecipientLimitForQuestionerRank(4)).toBe(20);
  });

  it("maps questioner_rank to daily launch limits", () => {
    expect(getDailyLaunchLimitForQuestionerRank(0)).toBe(1);
    expect(getDailyLaunchLimitForQuestionerRank(1)).toBe(2);
    expect(getDailyLaunchLimitForQuestionerRank(2)).toBe(3);
    expect(getDailyLaunchLimitForQuestionerRank(3)).toBe(5);
    expect(getDailyLaunchLimitForQuestionerRank(4)).toBe(8);
  });

  it("computes UTC day ranges", () => {
    const { start, end } = getUtcDayRange(new Date("2026-05-21T23:59:59.000Z"));

    expect(start.toISOString()).toBe("2026-05-21T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-05-22T00:00:00.000Z");
  });

  it("computes start_at and end_at from server time", () => {
    const { startAt, endAt } = getLaunchTimes(new Date("2026-05-21T00:00:00.000Z"));

    expect(startAt.toISOString()).toBe("2026-05-21T00:00:15.000Z");
    expect(endAt.toISOString()).toBe("2026-05-21T00:01:15.000Z");
  });

  it("computes display status from start_at and end_at", () => {
    const startAt = "2026-05-21T00:00:15.000Z";
    const endAt = "2026-05-21T00:01:15.000Z";

    expect(getComputedLaunchStatus({
      status: "scheduled",
      startAt,
      endAt,
      now: new Date("2026-05-21T00:00:10.000Z")
    })).toBe("scheduled");
    expect(getComputedLaunchStatus({
      status: "scheduled",
      startAt,
      endAt,
      now: new Date("2026-05-21T00:00:20.000Z")
    })).toBe("open");
    expect(getComputedLaunchStatus({
      status: "scheduled",
      startAt,
      endAt,
      now: new Date("2026-05-21T00:01:20.000Z")
    })).toBe("closed");
    expect(getComputedLaunchStatus({
      status: "cancelled",
      startAt,
      endAt,
      now: new Date("2026-05-21T00:00:20.000Z")
    })).toBe("cancelled");
  });

  it("selects all recipients when candidates are below the limit", () => {
    const candidates: RecipientCandidate[] = [
      { userId: "a", displayName: "A" },
      { userId: "b", displayName: "B" }
    ];

    expect(selectRecipients(candidates, 3, () => 0)).toHaveLength(2);
  });
});
