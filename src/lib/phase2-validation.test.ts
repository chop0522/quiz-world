import { describe, expect, it } from "vitest";
import {
  normalizeCategoryNote,
  questionLimits,
  validateQuestionPayload
} from "@/lib/phase2-validation";

const validPayload = {
  body: "日本で一番高い山は？",
  choices: [
    { id: "choice_1", text: "富士山" },
    { id: "choice_2", text: "北岳" },
    { id: "choice_3", text: "奥穂高岳" },
    { id: "choice_4", text: "槍ヶ岳" }
  ],
  correctChoiceId: "choice_1",
  difficulty: 2,
  category: "地理",
  categoryNote: "回答者には返さない補足",
  status: "draft"
};

describe("phase2 question validation", () => {
  it("accepts a valid multiple choice payload and clears non-other category_note", () => {
    const result = validateQuestionPayload(validPayload);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.categoryNote).toBeNull();
      expect(result.data.choices).toHaveLength(questionLimits.choicesCount);
    }
  });

  it("keeps category_note only for その他", () => {
    expect(normalizeCategoryNote("雑学", "メモ")).toBeNull();
    expect(normalizeCategoryNote("その他", " メモ ")).toBe("メモ");
  });

  it("rejects missing body and invalid choice counts", () => {
    const result = validateQuestionPayload({
      ...validPayload,
      body: "",
      choices: validPayload.choices.slice(0, 3)
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain("問題文は必須です。");
      expect(result.errors).toContain("選択肢は4つ固定です。");
    }
  });

  it("rejects empty, too long, or duplicate choice text", () => {
    const result = validateQuestionPayload({
      ...validPayload,
      choices: [
        { id: "choice_1", text: "同じ" },
        { id: "choice_2", text: "同じ" },
        { id: "choice_3", text: "" },
        { id: "choice_4", text: "x".repeat(81) }
      ]
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain("同じ選択肢を重複して使うことはできません。");
      expect(result.errors).toContain("空の選択肢は使えません。");
      expect(result.errors).toContain("選択肢は各80文字以内にしてください。");
    }
  });

  it("rejects invalid correct choice, difficulty, category, and suspended status", () => {
    const result = validateQuestionPayload({
      ...validPayload,
      correctChoiceId: "missing",
      difficulty: 6,
      category: "不正カテゴリ",
      status: "suspended"
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain("正解選択肢が不正です。");
      expect(result.errors).toContain("難易度は1〜5で指定してください。");
      expect(result.errors).toContain("カテゴリが不正です。");
      expect(result.errors).toContain("ユーザーが設定できるstatusはdraftまたはactiveのみです。");
    }
  });

  it("enforces text length limits", () => {
    const result = validateQuestionPayload({
      ...validPayload,
      body: "x".repeat(301),
      category: "その他",
      categoryNote: "x".repeat(81)
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain("問題文は300文字以内にしてください。");
      expect(result.errors).toContain("カテゴリ補足は80文字以内にしてください。");
    }
  });
});
