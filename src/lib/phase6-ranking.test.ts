import { describe, expect, it } from "vitest";
import {
  answerRankEventCandidates,
  answerRankFromScore,
  clampScore,
  questionerRankFromScore,
  ratingRankEventCandidates
} from "@/lib/phase6-ranking";

describe("phase6 ranking rules", () => {
  it("calculates answer rank from score thresholds", () => {
    expect(answerRankFromScore(0)).toBe(0);
    expect(answerRankFromScore(19)).toBe(0);
    expect(answerRankFromScore(20)).toBe(1);
    expect(answerRankFromScore(49)).toBe(1);
    expect(answerRankFromScore(50)).toBe(2);
    expect(answerRankFromScore(99)).toBe(2);
    expect(answerRankFromScore(100)).toBe(3);
    expect(answerRankFromScore(199)).toBe(3);
    expect(answerRankFromScore(200)).toBe(4);
  });

  it("calculates questioner rank from score thresholds", () => {
    expect(questionerRankFromScore(0)).toBe(0);
    expect(questionerRankFromScore(9)).toBe(0);
    expect(questionerRankFromScore(10)).toBe(1);
    expect(questionerRankFromScore(29)).toBe(1);
    expect(questionerRankFromScore(30)).toBe(2);
    expect(questionerRankFromScore(69)).toBe(2);
    expect(questionerRankFromScore(70)).toBe(3);
    expect(questionerRankFromScore(149)).toBe(3);
    expect(questionerRankFromScore(150)).toBe(4);
  });

  it("clamps score at zero", () => {
    expect(clampScore(-5)).toBe(0);
    expect(clampScore(0)).toBe(0);
    expect(clampScore(12.8)).toBe(12);
  });

  it("creates answer events only for correct answers", () => {
    expect(answerRankEventCandidates({
      isCorrect: false,
      correctRank: null,
      difficulty: 5
    })).toEqual([]);

    expect(answerRankEventCandidates({
      isCorrect: true,
      correctRank: 1,
      difficulty: 4
    })).toEqual([
      { type: "answer_correct", points: 3 },
      { type: "answer_correct_rank_bonus", points: 3 },
      { type: "answer_difficulty_bonus", points: 2 }
    ]);

    expect(answerRankEventCandidates({
      isCorrect: true,
      correctRank: 3,
      difficulty: 2
    })).toEqual([
      { type: "answer_correct", points: 3 },
      { type: "answer_correct_rank_bonus", points: 1 }
    ]);
  });

  it("does not create zero point rating events", () => {
    expect(ratingRankEventCandidates({
      rating: "normal",
      reason: "面白い"
    })).toEqual([]);

    expect(ratingRankEventCandidates({
      rating: "good",
      reason: "面白い"
    })).toEqual([
      { type: "question_rating", points: 2 }
    ]);

    expect(ratingRankEventCandidates({
      rating: "weak",
      reason: "不適切"
    })).toEqual([
      { type: "question_rating", points: -1 },
      { type: "question_reason_penalty", points: -5 }
    ]);
  });
});
