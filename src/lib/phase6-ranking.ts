export type AnswerRankEventType =
  | "answer_correct"
  | "answer_correct_rank_bonus"
  | "answer_difficulty_bonus";

export type QuestionerRankEventType =
  | "question_rating"
  | "question_reason_penalty";

export type RankEventType = AnswerRankEventType | QuestionerRankEventType;

export type RankEventCandidate = {
  type: RankEventType;
  points: number;
};

export function answerRankFromScore(score: number): number {
  const normalized = Math.max(0, Math.trunc(score));

  if (normalized >= 200) {
    return 4;
  }

  if (normalized >= 100) {
    return 3;
  }

  if (normalized >= 50) {
    return 2;
  }

  if (normalized >= 20) {
    return 1;
  }

  return 0;
}

export function questionerRankFromScore(score: number): number {
  const normalized = Math.max(0, Math.trunc(score));

  if (normalized >= 150) {
    return 4;
  }

  if (normalized >= 70) {
    return 3;
  }

  if (normalized >= 30) {
    return 2;
  }

  if (normalized >= 10) {
    return 1;
  }

  return 0;
}

export function clampScore(score: number): number {
  return Math.max(0, Math.trunc(score));
}

export function answerRankEventCandidates({
  isCorrect,
  correctRank,
  difficulty
}: {
  isCorrect: boolean;
  correctRank: number | null;
  difficulty: number;
}): RankEventCandidate[] {
  if (!isCorrect) {
    return [];
  }

  const events: RankEventCandidate[] = [
    {
      type: "answer_correct",
      points: 3
    }
  ];

  if (correctRank === 1) {
    events.push({
      type: "answer_correct_rank_bonus",
      points: 3
    });
  } else if (correctRank === 2) {
    events.push({
      type: "answer_correct_rank_bonus",
      points: 2
    });
  } else if (correctRank === 3) {
    events.push({
      type: "answer_correct_rank_bonus",
      points: 1
    });
  }

  if (difficulty >= 4) {
    events.push({
      type: "answer_difficulty_bonus",
      points: 2
    });
  }

  return events.filter((event) => event.points !== 0);
}

export function ratingRankEventCandidates({
  rating,
  reason
}: {
  rating: "good" | "normal" | "weak";
  reason: string;
}): RankEventCandidate[] {
  const events: RankEventCandidate[] = [];

  if (rating === "good") {
    events.push({
      type: "question_rating",
      points: 2
    });
  } else if (rating === "weak") {
    events.push({
      type: "question_rating",
      points: -1
    });
  }

  if (reason === "答えが曖昧") {
    events.push({
      type: "question_reason_penalty",
      points: -3
    });
  } else if (reason === "不適切") {
    events.push({
      type: "question_reason_penalty",
      points: -5
    });
  }

  return events.filter((event) => event.points !== 0);
}
