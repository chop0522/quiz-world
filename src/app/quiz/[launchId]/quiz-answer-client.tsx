"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Radio,
  Send,
  ShieldAlert,
  XCircle
} from "lucide-react";
import { Badge, ButtonLink, Surface } from "@/components/ui";
import type { QuestionChoice } from "@/lib/phase2-validation";
import type { LaunchStatus, NotificationStatus } from "@/lib/phase3-validation";
import type { AnswerResponse } from "@/lib/phase4-data";

type LaunchDetail = {
  id: string;
  questionId: string;
  authorId: string;
  worldId: string;
  authorDisplayName: string;
  category: string;
  difficulty: number;
  startAt: string;
  endAt: string;
  status: LaunchStatus;
  recipientCount: number;
  viewerRole: "author" | "recipient" | "admin";
  notificationStatus?: NotificationStatus;
};

type AnswerQuestion = {
  id: string;
  body: string;
  choices: QuestionChoice[];
};

type AnswerState = {
  isRecipient: boolean;
  hasStarted: boolean;
  hasEnded: boolean;
  hasAnswered: boolean;
  canAnswer: boolean;
};

type LaunchDetailResult = {
  ok?: boolean;
  errors?: string[];
  launch?: LaunchDetail;
  question?: AnswerQuestion | null;
  answer?: AnswerResponse | null;
  state?: AnswerState;
};

type SubmitAnswerResult = {
  ok?: boolean;
  errors?: string[];
  answer?: AnswerResponse;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date(value));
}

function secondsUntil(value: string, now: number) {
  return Math.ceil((new Date(value).getTime() - now) / 1000);
}

function statusTone(status: LaunchStatus) {
  if (status === "open") {
    return "green";
  }

  if (status === "scheduled") {
    return "amber";
  }

  if (status === "cancelled") {
    return "red";
  }

  return "neutral";
}

function statusLabel(status: LaunchStatus) {
  const labels: Record<LaunchStatus, string> = {
    scheduled: "開始前",
    open: "受付中",
    closed: "締切済み",
    cancelled: "停止"
  };

  return labels[status];
}

async function readJson<T>(response: Response): Promise<T> {
  return await response.json() as T;
}

export function QuizAnswerClient({ launchId }: { launchId: string }) {
  const [launch, setLaunch] = useState<LaunchDetail | null>(null);
  const [question, setQuestion] = useState<AnswerQuestion | null>(null);
  const [answer, setAnswer] = useState<AnswerResponse | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState | null>(null);
  const [selectedChoiceId, setSelectedChoiceId] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const loadDetail = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const response = await fetch(`/api/quiz-launches/${launchId}`, {
        cache: "no-store"
      });
      const result = await readJson<LaunchDetailResult>(response);

      if (!response.ok || !result.ok || !result.launch || !result.state) {
        setErrors(result.errors ?? ["クイズを取得できませんでした。"]);
        setLaunch(null);
        setQuestion(null);
        setAnswerState(null);
        return;
      }

      setErrors([]);
      setLaunch(result.launch);
      setQuestion(result.question ?? null);
      setAnswer(result.answer ?? null);
      setAnswerState(result.state);

      if (result.answer) {
        setSelectedChoiceId(result.answer.choiceId);
      }
    } finally {
      setLoading(false);
    }
  }, [launchId]);

  useEffect(() => {
    let active = true;

    queueMicrotask(() => {
      if (active) {
        void loadDetail();
      }
    });

    const clockId = window.setInterval(() => {
      setNow(Date.now());
    }, 1_000);
    const refreshId = window.setInterval(() => {
      void loadDetail({ silent: true });
    }, 5_000);

    return () => {
      active = false;
      window.clearInterval(clockId);
      window.clearInterval(refreshId);
    };
  }, [loadDetail]);

  const selectedChoice = useMemo(() => {
    if (!question || !selectedChoiceId) {
      return null;
    }

    return question.choices.find((choice) => choice.id === selectedChoiceId) ?? null;
  }, [question, selectedChoiceId]);

  async function submitAnswer() {
    if (!selectedChoiceId) {
      setErrors(["選択肢を1つ選んでください。"]);
      return;
    }

    setSubmitting(true);
    setErrors([]);
    setMessage(null);

    try {
      const response = await fetch(`/api/quiz-launches/${launchId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ choiceId: selectedChoiceId })
      });
      const result = await readJson<SubmitAnswerResult>(response);

      if (!response.ok || !result.ok || !result.answer) {
        setErrors(result.errors ?? ["回答を送信できませんでした。"]);
        return;
      }

      setAnswer(result.answer);
      setMessage("回答しました。");
      await loadDetail({ silent: true });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading && !launch) {
    return (
      <Surface>
        <p className="text-sm text-[color:var(--muted)]">読み込み中...</p>
      </Surface>
    );
  }

  if (errors.length > 0 && !launch) {
    return (
      <Surface>
        <div className="flex items-start gap-3 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          <ShieldAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          <ul className="list-disc pl-4">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      </Surface>
    );
  }

  if (!launch || !answerState) {
    return null;
  }

  const startSeconds = secondsUntil(launch.startAt, now);
  const endSeconds = secondsUntil(launch.endAt, now);
  const canSubmit = answerState.canAnswer
    && Boolean(question)
    && Boolean(selectedChoiceId)
    && !submitting;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Surface className="grid min-h-80 content-start gap-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={statusTone(launch.status)}>{statusLabel(launch.status)}</Badge>
          <Badge>{launch.category}</Badge>
          <Badge>難易度 {launch.difficulty}</Badge>
        </div>

        {!answerState.isRecipient ? (
          <div className="grid place-items-center py-16 text-center">
            <ShieldAlert aria-hidden className="mb-4 size-10 text-rose-500" />
            <h2 className="text-xl font-semibold">回答対象外</h2>
            <p className="mt-2 text-sm text-[color:var(--muted)]">
              自分に届いたクイズではありません。
            </p>
          </div>
        ) : null}

        {answerState.isRecipient && !answerState.hasStarted ? (
          <div className="grid place-items-center py-16 text-center">
            <Clock aria-hidden className="mb-4 size-12 text-[color:var(--accent)]" />
            <p className="text-5xl font-semibold">{Math.max(startSeconds, 0)}</p>
            <p className="mt-3 text-sm text-[color:var(--muted)]">
              start_atまで待機中
            </p>
          </div>
        ) : null}

        {answerState.isRecipient && answerState.hasStarted && question ? (
          <div className="grid gap-4">
            <h2 className="text-xl font-semibold leading-8">{question.body}</h2>
            <div className="grid gap-2">
              {question.choices.map((choice, index) => {
                const selected = selectedChoiceId === choice.id;
                return (
                  <button
                    className={`focus-ring min-h-12 rounded-md border px-3 text-left text-sm font-medium transition ${
                      selected
                        ? "border-[color:var(--accent-strong)] bg-emerald-50 text-emerald-900"
                        : "border-[color:var(--line)] bg-white"
                    } disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-500`}
                    disabled={!answerState.canAnswer || Boolean(answer)}
                    key={choice.id}
                    onClick={() => setSelectedChoiceId(choice.id)}
                    type="button"
                  >
                    {index + 1}. {choice.text}
                  </button>
                );
              })}
            </div>
            {answer ? (
              <div className={`rounded-md border p-4 text-sm ${
                answer.isCorrect
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "border-rose-200 bg-rose-50 text-rose-900"
              }`}
              >
                <div className="flex items-center gap-2 font-semibold">
                  {answer.isCorrect ? (
                    <CheckCircle2 aria-hidden className="size-4" />
                  ) : (
                    <XCircle aria-hidden className="size-4" />
                  )}
                  {answer.isCorrect ? "正解" : "不正解"}
                </div>
                <dl className="mt-3 grid gap-2 sm:grid-cols-3">
                  <div>
                    <dt className="text-xs opacity-75">選択</dt>
                    <dd className="font-semibold">{selectedChoice?.text ?? answer.choiceId}</dd>
                  </div>
                  <div>
                    <dt className="text-xs opacity-75">回答順位</dt>
                    <dd className="font-semibold">{answer.answerRank}位</dd>
                  </div>
                  <div>
                    <dt className="text-xs opacity-75">正解者順位</dt>
                    <dd className="font-semibold">
                      {answer.correctRank ? `${answer.correctRank}位` : "-"}
                    </dd>
                  </div>
                </dl>
              </div>
            ) : null}
          </div>
        ) : null}

        {answerState.isRecipient && answerState.hasStarted && !question ? (
          <p className="text-sm text-[color:var(--muted)]">
            問題を表示できませんでした。
          </p>
        ) : null}

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

        {answerState.isRecipient && !answer ? (
          <button
            className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[color:var(--accent-strong)] px-4 py-2 text-sm font-semibold text-white disabled:bg-stone-400"
            disabled={!canSubmit}
            onClick={() => void submitAnswer()}
            type="button"
          >
            <Send aria-hidden className="size-4" />
            {submitting ? "送信中..." : "回答送信"}
          </button>
        ) : null}
      </Surface>

      <aside className="grid gap-3 self-start">
        <Surface>
          <p className="text-sm font-semibold">出題者</p>
          <p className="mt-2 text-lg font-semibold">{launch.authorDisplayName}</p>
        </Surface>
        <Surface>
          <Radio aria-hidden className="mb-3 size-5 text-[color:var(--accent)]" />
          <div className="grid gap-2 text-sm text-[color:var(--muted)]">
            <p>開始 {formatDateTime(launch.startAt)}</p>
            <p>締切 {formatDateTime(launch.endAt)}</p>
            {answerState.hasStarted && !answerState.hasEnded ? (
              <p>残り {Math.max(endSeconds, 0)}秒</p>
            ) : null}
            {answerState.hasEnded && !answer ? (
              <p className="font-semibold text-rose-700">締切済み</p>
            ) : null}
          </div>
        </Surface>
        <ButtonLink href="/home" variant="secondary">
          ホームへ戻る
        </ButtonLink>
      </aside>
    </div>
  );
}
