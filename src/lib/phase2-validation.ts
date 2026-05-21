import type { ValidationResult } from "@/lib/phase1-validation";

export const questionCategories = [
  "雑学",
  "歴史",
  "地理",
  "科学",
  "エンタメ",
  "スポーツ",
  "言葉",
  "謎解き",
  "その他"
] as const;

export const questionStatuses = ["draft", "active"] as const;
export const allQuestionStatuses = ["draft", "active", "suspended"] as const;

export const questionLimits = {
  bodyMaxLength: 300,
  choiceTextMaxLength: 80,
  choicesCount: 4,
  categoryNoteMaxLength: 80,
  difficultyMin: 1,
  difficultyMax: 5
} as const;

export type QuestionCategory = typeof questionCategories[number];
export type UserQuestionStatus = typeof questionStatuses[number];
export type QuestionStatus = typeof allQuestionStatuses[number];

export type QuestionChoice = {
  id: string;
  text: string;
};

export type QuestionPayload = {
  body: string;
  choices: QuestionChoice[];
  correctChoiceId: string;
  difficulty: number;
  category: QuestionCategory;
  categoryNote: string | null;
  status: UserQuestionStatus;
};

function asRecord(input: unknown): Record<string, unknown> {
  return typeof input === "object" && input !== null
    ? input as Record<string, unknown>
    : {};
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown): number {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    return Number(value);
  }

  return Number.NaN;
}

export function isQuestionCategory(value: string): value is QuestionCategory {
  return questionCategories.includes(value as QuestionCategory);
}

export function isUserQuestionStatus(value: string): value is UserQuestionStatus {
  return questionStatuses.includes(value as UserQuestionStatus);
}

export function normalizeCategoryNote(
  category: QuestionCategory,
  rawNote: unknown
): string | null {
  if (category !== "その他") {
    return null;
  }

  const note = asString(rawNote);
  return note.length > 0 ? note : null;
}

function parseChoices(rawChoices: unknown, errors: string[]): QuestionChoice[] {
  if (!Array.isArray(rawChoices)) {
    errors.push("選択肢は4つ必要です。");
    return [];
  }

  if (rawChoices.length !== questionLimits.choicesCount) {
    errors.push("選択肢は4つ固定です。");
  }

  const choices = rawChoices.map((rawChoice, index) => {
    const choice = asRecord(rawChoice);
    const id = asString(choice.id) || `choice_${index + 1}`;
    const text = asString(choice.text);
    return { id, text };
  });

  const ids = new Set<string>();
  const texts = new Set<string>();

  for (const choice of choices) {
    if (!choice.id) {
      errors.push("選択肢IDが不正です。");
    }

    if (ids.has(choice.id)) {
      errors.push("選択肢IDが重複しています。");
    }

    ids.add(choice.id);

    if (!choice.text) {
      errors.push("空の選択肢は使えません。");
    }

    if (choice.text.length > questionLimits.choiceTextMaxLength) {
      errors.push("選択肢は各80文字以内にしてください。");
    }

    if (texts.has(choice.text)) {
      errors.push("同じ選択肢を重複して使うことはできません。");
    }

    texts.add(choice.text);
  }

  return choices;
}

export function validateQuestionPayload(input: unknown): ValidationResult<QuestionPayload> {
  const body = asRecord(input);
  const questionBody = asString(body.body);
  const errors: string[] = [];
  const choices = parseChoices(body.choices, errors);
  const correctChoiceId = asString(body.correctChoiceId ?? body.correct_choice_id);
  const difficulty = asNumber(body.difficulty);
  const categoryValue = asString(body.category);
  const statusValue = asString(body.status || "draft");

  if (!questionBody) {
    errors.push("問題文は必須です。");
  }

  if (questionBody.length > questionLimits.bodyMaxLength) {
    errors.push("問題文は300文字以内にしてください。");
  }

  if (!correctChoiceId || !choices.some((choice) => choice.id === correctChoiceId)) {
    errors.push("正解選択肢が不正です。");
  }

  if (!Number.isInteger(difficulty)
    || difficulty < questionLimits.difficultyMin
    || difficulty > questionLimits.difficultyMax) {
    errors.push("難易度は1〜5で指定してください。");
  }

  if (!isQuestionCategory(categoryValue)) {
    errors.push("カテゴリが不正です。");
  }

  if (!isUserQuestionStatus(statusValue)) {
    errors.push("ユーザーが設定できるstatusはdraftまたはactiveのみです。");
  }

  const category = isQuestionCategory(categoryValue) ? categoryValue : "雑学";
  const categoryNote = normalizeCategoryNote(category, body.categoryNote ?? body.category_note);

  if (categoryNote && categoryNote.length > questionLimits.categoryNoteMaxLength) {
    errors.push("カテゴリ補足は80文字以内にしてください。");
  }

  if (errors.length > 0) {
    return { ok: false, errors: [...new Set(errors)] };
  }

  return {
    ok: true,
    data: {
      body: questionBody,
      choices,
      correctChoiceId,
      difficulty,
      category,
      categoryNote,
      status: statusValue as UserQuestionStatus
    }
  };
}
