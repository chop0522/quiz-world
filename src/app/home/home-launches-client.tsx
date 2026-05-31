"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Clock } from "lucide-react";
import {
  Badge,
  ButtonLink,
  Metric,
  Section,
  Surface
} from "@/components/ui";
import type { LaunchStatus } from "@/lib/phase3-validation";

type LaunchListItem = {
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
};

type LaunchListResult = {
  ok?: boolean;
  errors?: string[];
  launches?: LaunchListItem[];
};

function statusLabel(status: LaunchStatus) {
  const labels: Record<LaunchStatus, string> = {
    scheduled: "開始前",
    open: "回答受付中",
    closed: "回答期間は終了しました",
    cancelled: "停止中"
  };

  return labels[status];
}

function statusMessage(status: LaunchStatus) {
  const messages: Record<LaunchStatus, string> = {
    scheduled: "開始時間になると回答できます。",
    open: "今すぐ回答できます。",
    closed: "回答期間は終了しました。",
    cancelled: "このクイズは停止されています。"
  };

  return messages[status];
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

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

async function readJson(response: Response): Promise<LaunchListResult> {
  return await response.json() as LaunchListResult;
}

export function HomeLaunchesClient() {
  const [launches, setLaunches] = useState<LaunchListItem[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLaunches = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const response = await fetch("/api/quiz-launches?scope=received", {
        cache: "no-store"
      });
      const result = await readJson(response);

      if (!response.ok || !result.ok) {
        setErrors(result.errors ?? ["届いたクイズを取得できませんでした。"]);
        setLaunches([]);
        return;
      }

      setErrors([]);
      setLaunches(result.launches ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    queueMicrotask(() => {
      if (active) {
        void loadLaunches();
      }
    });

    const refreshId = window.setInterval(() => {
      void loadLaunches({ silent: true });
    }, 15_000);

    return () => {
      active = false;
      window.clearInterval(refreshId);
    };
  }, [loadLaunches]);

  const metrics = useMemo(() => {
    const openCount = launches.filter((launch) => launch.status === "open").length;
    const scheduledCount = launches.filter((launch) => launch.status === "scheduled").length;
    return { openCount, scheduledCount };
  }, [launches]);

  return (
    <>
      <section className="grid gap-4 md:grid-cols-3">
        <Metric label="届いたクイズ" value={launches.length} />
        <Metric label="回答受付中" value={metrics.openCount} />
        <Metric label="開始待ち" value={metrics.scheduledCount} />
      </section>

      <Section
        description="新しく届いたクイズと受付状況を確認できます。"
        title="届いたクイズ一覧"
      >
        <div className="grid gap-3">
          {loading ? (
            <Surface>
              <p className="text-sm text-[color:var(--muted)]">読み込み中...</p>
            </Surface>
          ) : null}

          {errors.length > 0 ? (
            <Surface>
              <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                <ul className="list-disc pl-5">
                  {errors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            </Surface>
          ) : null}

          {!loading && errors.length === 0 && launches.length === 0 ? (
            <Surface>
              <p className="text-sm text-[color:var(--muted)]">
                まだ届いたクイズはありません。
              </p>
            </Surface>
          ) : null}

          {launches.map((launch) => (
            <Surface className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center" key={launch.id}>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={statusTone(launch.status)}>
                    {statusLabel(launch.status)}
                  </Badge>
                  <Badge>{launch.category}</Badge>
                  <Badge>難易度 {launch.difficulty}</Badge>
                </div>
                <h2 className="mt-3 text-base font-semibold">
                  {launch.authorDisplayName} から届いたクイズ
                </h2>
                <p className="mt-2 text-sm text-[color:var(--muted)]">
                  {statusMessage(launch.status)}
                </p>
                <div className="mt-3 grid gap-1 text-sm text-[color:var(--muted)] sm:grid-cols-2">
                  <span className="inline-flex items-center gap-2">
                    <Clock aria-hidden className="size-4" />
                    開始 {formatDateTime(launch.startAt)}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Clock aria-hidden className="size-4" />
                    締切 {formatDateTime(launch.endAt)}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <ButtonLink href={`/quiz/${launch.id}`} variant="secondary">
                  開く
                </ButtonLink>
              </div>
            </Surface>
          ))}
        </div>
      </Section>
    </>
  );
}
