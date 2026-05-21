"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FileQuestion, Pencil, RotateCcw, Save } from "lucide-react";
import {
  Badge,
  Field,
  SelectInput,
  Surface,
  TextArea,
  TextInput
} from "@/components/ui";
import {
  questionCategories,
  questionLimits,
  type QuestionCategory,
  type UserQuestionStatus
} from "@/lib/phase2-validation";

type QuestionChoice = {
  id: string;
  text: string;
};

type QuestionListItem = {
  id: string;
  bodyPreview: string;
  difficulty: number;
  category: QuestionCategory;
  categoryNote: string | null;
  status: "draft" | "active" | "suspended";
  createdAt: string;
  updatedAt: string;
};

type QuestionDetail = {
  id: string;
  body: string;
  choices: QuestionChoice[];
  correctChoiceId: string;
  difficulty: number;
  category: QuestionCategory;
  categoryNote: string | null;
  status: "draft" | "active" | "suspended";
};

type ApiResult = {
  ok?: boolean;
  errors?: string[];
  question?: QuestionDetail;
  questions?: QuestionListItem[];
};

const emptyChoices = (): QuestionChoice[] => [
  { id: "choice_1", text: "" },
  { id: "choice_2", text: "" },
  { id: "choice_3", text: "" },
  { id: "choice_4", text: "" }
];

function statusTone(status: QuestionListItem["status"]) {
  if (status === "active") {
    return "green";
  }

  if (status === "suspended") {
    return "red";
  }

  return "neutral";
}

async function readJson(response: Response): Promise<ApiResult> {
  return await response.json() as ApiResult;
}

export function QuestionAuthoringClient() {
  const [body, setBody] = useState("");
  const [choices, setChoices] = useState<QuestionChoice[]>(emptyChoices);
  const [correctChoiceId, setCorrectChoiceId] = useState("choice_1");
  const [difficulty, setDifficulty] = useState(3);
  const [category, setCategory] = useState<QuestionCategory>("雑学");
  const [categoryNote, setCategoryNote] = useState("");
  const [status, setStatus] = useState<UserQuestionStatus>("draft");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuestionListItem[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const categoryNoteEnabled = category === "その他";
  const bodyCount = useMemo(() => body.trim().length, [body]);

  const loadQuestions = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/questions");
      const result = await readJson(response);

      if (!response.ok || !result.ok) {
        setErrors(result.errors ?? ["作成済み問題を取得できませんでした。"]);
        setQuestions([]);
        return;
      }

      setQuestions(result.questions ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    queueMicrotask(() => {
      if (active) {
        void loadQuestions();
      }
    });

    return () => {
      active = false;
    };
  }, [loadQuestions]);

  function setChoiceText(index: number, text: string) {
    setChoices((current) =>
      current.map((choice, choiceIndex) =>
        choiceIndex === index ? { ...choice, text } : choice
      )
    );
  }

  function resetForm() {
    setBody("");
    setChoices(emptyChoices());
    setCorrectChoiceId("choice_1");
    setDifficulty(3);
    setCategory("雑学");
    setCategoryNote("");
    setStatus("draft");
    setEditingId(null);
    setErrors([]);
    setMessage(null);
  }

  async function startEdit(id: string) {
    setErrors([]);
    setMessage(null);
    const response = await fetch(`/api/questions/${id}`);
    const result = await readJson(response);

    if (!response.ok || !result.ok || !result.question) {
      setErrors(result.errors ?? ["問題詳細を取得できませんでした。"]);
      return;
    }

    const question = result.question;
    setEditingId(question.id);
    setBody(question.body);
    setChoices(question.choices);
    setCorrectChoiceId(question.correctChoiceId);
    setDifficulty(question.difficulty);
    setCategory(question.category);
    setCategoryNote(question.categoryNote ?? "");
    setStatus(question.status === "active" ? "active" : "draft");
  }

  async function submitQuestion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrors([]);
    setMessage(null);

    try {
      const payload = {
        body,
        choices,
        correctChoiceId,
        difficulty,
        category,
        categoryNote: categoryNoteEnabled ? categoryNote : null,
        status
      };
      const response = await fetch(
        editingId ? `/api/questions/${editingId}` : "/api/questions",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );
      const result = await readJson(response);

      if (!response.ok || !result.ok) {
        setErrors(result.errors ?? ["問題を保存できませんでした。"]);
        return;
      }

      const successMessage = editingId ? "問題を更新しました。" : "問題を保存しました。";
      resetForm();
      setMessage(successMessage);
      await loadQuestions();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <Surface>
        <form className="grid gap-4" onSubmit={submitQuestion}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">
                {editingId ? "問題を編集" : "四択クイズを作成"}
              </h2>
              <p className="mt-1 text-sm text-[color:var(--muted)]">
                Phase 2では保存まで。配信、通知、回答はまだ行いません。
              </p>
            </div>
            {editingId ? <Badge tone="amber">編集中</Badge> : <Badge>新規</Badge>}
          </div>

          <Field
            hint={`${bodyCount}/${questionLimits.bodyMaxLength}文字`}
            label="問題文"
          >
            <TextArea
              maxLength={questionLimits.bodyMaxLength}
              onChange={(event) => setBody(event.target.value)}
              placeholder="問題文を入力"
              required
              value={body}
            />
          </Field>

          <div className="grid gap-3 md:grid-cols-2">
            {choices.map((choice, index) => (
              <Field
                hint={`${choice.text.trim().length}/${questionLimits.choiceTextMaxLength}文字`}
                key={choice.id}
                label={`選択肢 ${index + 1}`}
              >
                <TextInput
                  maxLength={questionLimits.choiceTextMaxLength}
                  onChange={(event) => setChoiceText(index, event.target.value)}
                  placeholder={`選択肢 ${index + 1}`}
                  required
                  value={choice.text}
                />
              </Field>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Field label="正解">
              <SelectInput
                onChange={(event) => setCorrectChoiceId(event.target.value)}
                value={correctChoiceId}
              >
                {choices.map((choice, index) => (
                  <option key={choice.id} value={choice.id}>
                    選択肢 {index + 1}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="難易度">
              <SelectInput
                onChange={(event) => setDifficulty(Number(event.target.value))}
                value={difficulty}
              >
                {[1, 2, 3, 4, 5].map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="状態">
              <SelectInput
                onChange={(event) => setStatus(event.target.value as UserQuestionStatus)}
                value={status}
              >
                <option value="draft">draft</option>
                <option value="active">active</option>
              </SelectInput>
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="カテゴリ">
              <SelectInput
                onChange={(event) => {
                  const value = event.target.value as QuestionCategory;
                  setCategory(value);

                  if (value !== "その他") {
                    setCategoryNote("");
                  }
                }}
                value={category}
              >
                {questionCategories.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field
              hint="その他の場合だけ保存します。回答者向けAPIには返しません。"
              label="カテゴリ補足"
            >
              <TextInput
                disabled={!categoryNoteEnabled}
                maxLength={questionLimits.categoryNoteMaxLength}
                onChange={(event) => setCategoryNote(event.target.value)}
                placeholder="例: ローカル文化、ボードゲームなど"
                value={categoryNote}
              />
            </Field>
          </div>

          {errors.length > 0 ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
              <ul className="list-disc pl-5">
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {message ? (
            <p className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              {message}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[color:var(--accent-strong)] px-4 py-2 text-sm font-semibold text-white disabled:bg-stone-400"
              disabled={submitting}
              type="submit"
            >
              <Save aria-hidden className="size-4" />
              {submitting ? "保存中..." : "保存する"}
            </button>
            <button
              className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[color:var(--line)] bg-white px-4 py-2 text-sm font-semibold"
              onClick={resetForm}
              type="button"
            >
              <RotateCcw aria-hidden className="size-4" />
              新規に戻す
            </button>
          </div>
        </form>
      </Surface>

      <aside className="grid gap-3 self-start">
        <Surface>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">作成済み問題</h2>
            <Badge>{questions.length}件</Badge>
          </div>
          <div className="mt-4 grid gap-3">
            {loading ? (
              <p className="text-sm text-[color:var(--muted)]">読み込み中...</p>
            ) : null}
            {!loading && questions.length === 0 ? (
              <p className="text-sm text-[color:var(--muted)]">
                まだ作成した問題はありません。
              </p>
            ) : null}
            {questions.map((question) => (
              <div
                className="rounded-md border border-[color:var(--line)] bg-white p-3"
                key={question.id}
              >
                <div className="flex items-start justify-between gap-2">
                  <FileQuestion aria-hidden className="mt-1 size-4 shrink-0 text-[color:var(--accent)]" />
                  <Badge tone={statusTone(question.status)}>
                    {question.status}
                  </Badge>
                </div>
                <p className="mt-2 text-sm font-medium leading-6">
                  {question.bodyPreview}
                </p>
                <p className="mt-2 text-xs text-[color:var(--muted)]">
                  {question.category} / 難易度 {question.difficulty}
                </p>
                {question.categoryNote ? (
                  <p className="mt-1 text-xs text-[color:var(--muted)]">
                    補足: {question.categoryNote}
                  </p>
                ) : null}
                <button
                  className="focus-ring mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-[color:var(--line)] bg-white px-3 text-sm font-semibold"
                  onClick={() => void startEdit(question.id)}
                  type="button"
                >
                  <Pencil aria-hidden className="size-4" />
                  詳細/編集
                </button>
              </div>
            ))}
          </div>
        </Surface>
      </aside>
    </div>
  );
}
