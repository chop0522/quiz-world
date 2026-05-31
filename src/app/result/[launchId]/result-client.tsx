"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Flag,
  Star,
  Trophy
} from "lucide-react";
import {
  Badge,
  ButtonLink,
  Field,
  Metric,
  Section,
  SelectInput,
  Surface
} from "@/components/ui";
import type { QuestionChoice } from "@/lib/phase2-validation";
import type { LaunchStatus } from "@/lib/phase3-validation";
import type { AnswerResponse } from "@/lib/phase4-data";
import {
  ratingReasonTags,
  ratingValues,
  reportReasonTags,
  type RatingReasonTag,
  type RatingValue,
  type ReportReasonTag
} from "@/lib/phase5-validation";

type ResultAnswerItem = {
  userId: string;
  displayName: string;
  choiceId: string;
  choiceText: string;
  isCorrect: boolean;
  answerReceivedAt: string;
  answerRank: number;
  correctRank: number | null;
};

type ResultUnansweredItem = {
  userId: string;
  displayName: string;
};

type LaunchResult = {
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
  viewerRole: "author" | "recipient";
  question: {
    id: string;
    body: string;
    choices: QuestionChoice[];
    correctChoiceId: string;
    correctChoiceText: string;
  };
  viewerAnswer: AnswerResponse | null;
  answers: ResultAnswerItem[];
  unansweredRecipients: ResultUnansweredItem[];
  stats: {
    answeredCount: number;
    unansweredCount: number;
    correctCount: number;
  };
  state: {
    hasStarted: boolean;
    hasEnded: boolean;
    hasAnswered: boolean;
  };
};

type ResultApiResponse = {
  ok?: boolean;
  errors?: string[];
  result?: LaunchResult;
};

type MutationResponse = {
  ok?: boolean;
  errors?: string[];
};

const ratingLabels: Record<RatingValue, string> = {
  good: "良問",
  normal: "普通",
  weak: "微妙"
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

export function ResultClient({ launchId }: { launchId: string }) {
  const [result, setResult] = useState<LaunchResult | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [rating, setRating] = useState<RatingValue>("good");
  const [ratingReason, setRatingReason] = useState<RatingReasonTag>("面白い");
  const [reportReason, setReportReason] = useState<ReportReasonTag>("不適切");

  const loadResult = useCallback(async () => {
    setLoading(true);
    setErrors([]);

    try {
      const response = await fetch(`/api/quiz-launches/${launchId}/result`, {
        cache: "no-store"
      });
      const data = await readJson<ResultApiResponse>(response);

      if (!response.ok || !data.ok || !data.result) {
        setResult(null);
        setErrors(data.errors ?? ["結果を取得できませんでした。"]);
        return;
      }

      setResult(data.result);
    } finally {
      setLoading(false);
    }
  }, [launchId]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadResult();
    });
  }, [loadResult]);

  const viewerAnswerItem = useMemo(() => {
    if (!result?.viewerAnswer) {
      return null;
    }

    return result.answers.find((answer) => (
      answer.userId === result.viewerAnswer?.userId
    )) ?? null;
  }, [result]);

  async function submitRating() {
    if (!result) {
      return;
    }

    setSubmittingRating(true);
    setErrors([]);
    setMessage(null);

    try {
      const response = await fetch(`/api/quiz-launches/${launchId}/rating`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, reason: ratingReason })
      });
      const data = await readJson<MutationResponse>(response);

      if (!response.ok || !data.ok) {
        setErrors(data.errors ?? ["評価を保存できませんでした。"]);
        return;
      }

      setMessage("評価を保存しました。");
      setRatingSubmitted(true);
    } finally {
      setSubmittingRating(false);
    }
  }

  async function submitReport() {
    if (!result) {
      return;
    }

    setSubmittingReport(true);
    setErrors([]);
    setMessage(null);

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          launchId: result.id,
          questionId: result.questionId,
          reason: reportReason
        })
      });
      const data = await readJson<MutationResponse>(response);

      if (!response.ok || !data.ok) {
        setErrors(data.errors ?? ["通報を保存できませんでした。"]);
        return;
      }

      setMessage("通報を送信しました。");
      setReportSubmitted(true);
    } finally {
      setSubmittingReport(false);
    }
  }

  if (loading) {
    return (
      <Surface>
        <p className="text-sm text-[color:var(--muted)]">読み込み中...</p>
      </Surface>
    );
  }

  if (errors.length > 0 && !result) {
    return (
      <Surface>
        <div className="flex items-start gap-3 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />
          <ul className="list-disc pl-4">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      </Surface>
    );
  }

  if (!result) {
    return null;
  }

  const ratingLocked = submittingRating || ratingSubmitted;
  const reportLocked = submittingReport || reportSubmitted;

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-4">
        <Metric
          helper={viewerAnswerItem?.choiceText ?? "未回答"}
          label="あなたの正誤"
          value={
            result.viewerAnswer
              ? result.viewerAnswer.isCorrect ? "正解" : "不正解"
              : result.viewerRole === "author" ? "出題者" : "未回答"
          }
        />
        <Metric
          helper="全回答者内"
          label="answer_rank"
          value={result.viewerAnswer?.answerRank ? `${result.viewerAnswer.answerRank}位` : "-"}
        />
        <Metric
          helper="正解者内"
          label="correct_rank"
          value={result.viewerAnswer?.correctRank ? `${result.viewerAnswer.correctRank}位` : "-"}
        />
        <Metric
          helper={`未回答 ${result.stats.unansweredCount}人`}
          label="回答数"
          value={`${result.stats.answeredCount}/${result.recipientCount}`}
        />
      </section>

      <Surface className="grid gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={statusTone(result.status)}>{statusLabel(result.status)}</Badge>
          <Badge>{result.category}</Badge>
          <Badge>難易度 {result.difficulty}</Badge>
          <Badge>{result.viewerRole === "author" ? "出題者表示" : "回答者表示"}</Badge>
        </div>
        <div>
          <p className="text-sm text-[color:var(--muted)]">出題者</p>
          <h2 className="mt-1 text-xl font-semibold">{result.authorDisplayName}</h2>
        </div>
        <div className="rounded-md border border-[color:var(--line)] bg-white p-4">
          <p className="text-lg font-semibold leading-8">{result.question.body}</p>
          <div className="mt-4 grid gap-2">
            {result.question.choices.map((choice, index) => {
              const correct = choice.id === result.question.correctChoiceId;
              return (
                <div
                  className={`rounded-md border p-3 text-sm ${
                    correct
                      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                      : "border-[color:var(--line)] bg-white"
                  }`}
                  key={choice.id}
                >
                  <span className="font-semibold">{index + 1}. </span>
                  {choice.text}
                  {correct ? (
                    <span className="ml-2 text-xs font-semibold">正解</span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
        <div className="grid gap-1 text-sm text-[color:var(--muted)] sm:grid-cols-2">
          <span>開始 {formatDateTime(result.startAt)}</span>
          <span>締切 {formatDateTime(result.endAt)}</span>
        </div>
      </Surface>

      <Section title="全回答者">
        <Surface>
          {result.answers.length === 0 ? (
            <p className="text-sm text-[color:var(--muted)]">まだ回答はありません。</p>
          ) : (
            <div className="grid gap-3">
              {result.answers.map((answer) => (
                <div
                  className="grid gap-2 rounded-md border border-[color:var(--line)] bg-white p-3 md:grid-cols-[1fr_92px_92px_92px] md:items-center"
                  key={answer.userId}
                >
                  <div>
                    <p className="font-medium">{answer.displayName}</p>
                    <p className="mt-1 text-xs text-[color:var(--muted)]">
                      {answer.choiceText}
                    </p>
                  </div>
                  <p className="text-sm text-[color:var(--muted)]">
                    {answer.answerRank}位
                  </p>
                  <p className="text-sm text-[color:var(--muted)]">
                    {answer.correctRank ? `${answer.correctRank}位` : "-"}
                  </p>
                  <Badge tone={answer.isCorrect ? "green" : "red"}>
                    {answer.isCorrect ? "正解" : "不正解"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Surface>
      </Section>

      <Section title="未回答者">
        <Surface>
          {result.unansweredRecipients.length === 0 ? (
            <p className="text-sm text-[color:var(--muted)]">未回答者はいません。</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {result.unansweredRecipients.map((recipient) => (
                <Badge key={recipient.userId}>{recipient.displayName}</Badge>
              ))}
            </div>
          )}
        </Surface>
      </Section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Section title="クイズ評価">
          <Surface className="grid gap-4">
            {result.viewerRole === "author" ? (
              <p className="text-sm text-[color:var(--muted)]">
                出題者本人は自分の問題を評価できません。
              </p>
            ) : (
              <>
                {ratingSubmitted ? (
                  <p className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                    評価済みです。現在は評価の変更はできません。
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  {ratingValues.map((value) => (
                    <button
                      className={`focus-ring inline-flex min-h-10 items-center gap-2 rounded-md border px-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60 ${
                        rating === value
                          ? "border-[color:var(--accent-strong)] bg-emerald-50 text-emerald-900"
                          : "border-[color:var(--line)] bg-white"
                      }`}
                      disabled={ratingLocked}
                      key={value}
                      onClick={() => setRating(value)}
                      type="button"
                    >
                      <Star aria-hidden className="size-4" />
                      {ratingLabels[value]}
                    </button>
                  ))}
                </div>
                <Field label="理由タグ">
                  <SelectInput
                    disabled={ratingLocked}
                    onChange={(event) => setRatingReason(event.target.value as RatingReasonTag)}
                    value={ratingReason}
                  >
                    {ratingReasonTags.map((reason) => (
                      <option key={reason} value={reason}>{reason}</option>
                    ))}
                  </SelectInput>
                </Field>
                <button
                  className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[color:var(--accent-strong)] px-4 py-2 text-sm font-semibold text-white disabled:bg-stone-400"
                  disabled={ratingLocked}
                  onClick={() => void submitRating()}
                  type="button"
                >
                  <Trophy aria-hidden className="size-4" />
                  {ratingSubmitted ? "評価済み" : submittingRating ? "保存中..." : "評価を送信"}
                </button>
              </>
            )}
          </Surface>
        </Section>

        <Section title="通報">
          <Surface className="grid gap-4">
            {reportSubmitted ? (
              <p className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                通報済みです。同じ内容の重複通報はできません。
              </p>
            ) : null}
            <Field label="通報理由">
              <SelectInput
                disabled={reportLocked}
                onChange={(event) => setReportReason(event.target.value as ReportReasonTag)}
                value={reportReason}
              >
                {reportReasonTags.map((reason) => (
                  <option key={reason} value={reason}>{reason}</option>
                ))}
              </SelectInput>
            </Field>
            <button
              className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-800 disabled:bg-stone-100 disabled:text-stone-500"
              disabled={reportLocked}
              onClick={() => void submitReport()}
              type="button"
            >
              <Flag aria-hidden className="size-4" />
              {reportSubmitted ? "通報済み" : submittingReport ? "送信中..." : "通報する"}
            </button>
          </Surface>
        </Section>
      </section>

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
        <ButtonLink href={`/quiz/${launchId}`} variant="secondary">
          回答画面
        </ButtonLink>
        <ButtonLink href="/home" variant="secondary">
          ホーム
        </ButtonLink>
      </div>
    </div>
  );
}
