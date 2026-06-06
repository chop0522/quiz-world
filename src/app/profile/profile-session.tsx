"use client";

import { useEffect, useState } from "react";
import { Badge, Metric, Surface } from "@/components/ui";

type ProfileResponse = {
  ok: boolean;
  profile?: {
    displayName: string;
    role: string;
    status: string;
    answerRank: number;
    answerScore: number;
    questionerRank: number;
    questionerScore: number;
    ageConfirmedAt: string;
    termsAcceptedAt: string;
    privacyAcceptedAt: string;
  };
  worldMember?: {
    role: string;
    status: string;
    joinedAt: string;
  } | null;
  rankEvents?: {
    id: string;
    type: string;
    points: number;
    reason: string;
    sourceType: string;
    sourceId: string;
    createdAt: string;
  }[];
  errors?: string[];
};

const rankEventLabels: Record<string, string> = {
  answer_correct: "正解",
  answer_correct_rank_bonus: "正解者順位",
  answer_difficulty_bonus: "難問正解",
  question_rating: "クイズ評価",
  question_reason_penalty: "評価理由"
};

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export function ProfileSession() {
  const [data, setData] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        const response = await fetch("/api/profile");
        const result = await response.json() as ProfileResponse;

        if (mounted) {
          setData(result);
        }
      } catch (error) {
        if (mounted) {
          setData({
            ok: false,
            errors: [
              error instanceof Error ? error.message : "profile取得に失敗しました。"
            ]
          });
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <Surface>
        <p className="text-sm text-[color:var(--muted)]">ログイン状態を確認中...</p>
      </Surface>
    );
  }

  if (!data?.ok || !data.profile) {
    return (
      <Surface>
        <h2 className="font-semibold">ログイン状態</h2>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          {data?.errors?.join(" / ") ?? "未ログインです。"}
        </p>
      </Surface>
    );
  }

  return (
    <div className="grid gap-4">
      <section className="grid gap-4 md:grid-cols-4">
        <Metric
          helper={`${data.profile.answerScore} pt`}
          label="回答ランク"
          value={`Lv.${data.profile.answerRank}`}
        />
        <Metric
          helper={`${data.profile.questionerScore} pt`}
          label="出題ランク"
          value={`Lv.${data.profile.questionerRank}`}
        />
        <Metric
          helper="現在"
          label="回答スコア"
          value={data.profile.answerScore}
        />
        <Metric
          helper="現在"
          label="出題スコア"
          value={data.profile.questionerScore}
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
        <Surface>
          <h2 className="font-semibold">プロフィール</h2>
          <dl className="mt-3 grid gap-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-[color:var(--muted)]">表示名</dt>
              <dd className="font-medium">{data.profile.displayName}</dd>
            </div>
            {data.profile.role === "admin" && data.profile.status === "active" ? (
              <div className="flex justify-between gap-3">
                <dt className="text-[color:var(--muted)]">管理</dt>
                <dd>
                  <Badge tone="green">管理者アカウント</Badge>
                </dd>
              </div>
            ) : null}
          </dl>
        </Surface>

        <Surface>
          <h2 className="font-semibold">最近の履歴</h2>
          {!data.rankEvents || data.rankEvents.length === 0 ? (
            <p className="mt-3 text-sm text-[color:var(--muted)]">
              まだスコア変動はありません。
            </p>
          ) : (
            <ul className="mt-3 grid gap-2">
              {data.rankEvents.map((event) => (
                <li
                  className="rounded-md border border-[color:var(--line)] bg-white p-3"
                  key={event.id}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">
                      {rankEventLabels[event.type] ?? event.type}
                    </p>
                    <Badge tone={event.points > 0 ? "green" : "red"}>
                      {event.points > 0 ? `+${event.points}` : event.points}
                    </Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[color:var(--muted)]">
                    <span>{event.reason}</span>
                    <span>{formatDateTime(event.createdAt)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Surface>
      </div>
    </div>
  );
}
