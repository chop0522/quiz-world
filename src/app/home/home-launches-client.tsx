"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, Clock, Radio } from "lucide-react";
import {
  Badge,
  ButtonLink,
  Metric,
  Section,
  Surface
} from "@/components/ui";
import type {
  LaunchStatus,
  NotificationStatus
} from "@/lib/phase3-validation";

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
  recipientCount: number;
  notificationStatus?: NotificationStatus;
};

type LaunchListResult = {
  ok?: boolean;
  errors?: string[];
  launches?: LaunchListItem[];
};

function statusLabel(status: LaunchStatus) {
  const labels: Record<LaunchStatus, string> = {
    scheduled: "開始前",
    open: "受付中",
    closed: "締切済み",
    cancelled: "停止"
  };

  return labels[status];
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
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date(value));
}

function relativeSeconds(target: string, now: number) {
  const seconds = Math.ceil((new Date(target).getTime() - now) / 1000);

  if (seconds > 0) {
    return `${seconds}秒後`;
  }

  return `${Math.abs(seconds)}秒前`;
}

async function readJson(response: Response): Promise<LaunchListResult> {
  return await response.json() as LaunchListResult;
}

export function HomeLaunchesClient() {
  const [launches, setLaunches] = useState<LaunchListItem[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [now, setNow] = useState(() => Date.now());

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
      setLastUpdatedAt(new Date());
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

    const pollingId = window.setInterval(() => {
      void loadLaunches({ silent: true });
    }, 15_000);
    const clockId = window.setInterval(() => {
      setNow(Date.now());
    }, 1_000);

    return () => {
      active = false;
      window.clearInterval(pollingId);
      window.clearInterval(clockId);
    };
  }, [loadLaunches]);

  const metrics = useMemo(() => {
    const openCount = launches.filter((launch) => launch.status === "open").length;
    const scheduledCount = launches.filter((launch) => launch.status === "scheduled").length;
    return { openCount, scheduledCount };
  }, [launches]);

  return (
    <>
      <section className="grid gap-4 md:grid-cols-4">
        <Metric helper="本人宛recipientのみ" label="届いたクイズ" value={launches.length} />
        <Metric helper="start_at到達後" label="受付中" value={metrics.openCount} />
        <Metric helper="15秒ごとに確認" label="画面内通知" value="polling" />
        <Metric helper={lastUpdatedAt ? `最終更新 ${formatDateTime(lastUpdatedAt.toISOString())}` : "未取得"} label="開始前" value={metrics.scheduledCount} />
      </section>

      <Section
        description="Phase 3では/homeが15秒ごとに本人宛のquiz_recipientsを確認します。start_at前は問題本文と選択肢を表示しません。"
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
                <p className="mt-2 flex items-center gap-2 text-sm text-[color:var(--muted)]">
                  <Bell aria-hidden className="size-4" />
                  問題文と選択肢は開始後の回答画面で表示します。
                </p>
                <div className="mt-3 grid gap-1 text-sm text-[color:var(--muted)] sm:grid-cols-2">
                  <span className="inline-flex items-center gap-2">
                    <Clock aria-hidden className="size-4" />
                    開始 {formatDateTime(launch.startAt)} ({relativeSeconds(launch.startAt, now)})
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Radio aria-hidden className="size-4" />
                    締切 {formatDateTime(launch.endAt)} ({relativeSeconds(launch.endAt, now)})
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
