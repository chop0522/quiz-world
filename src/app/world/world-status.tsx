"use client";

import { useEffect, useState } from "react";
import { Metric, Surface } from "@/components/ui";

type WorldResponse = {
  ok: boolean;
  world?: {
    name: string;
    memberLimit: number;
    currentSeason: number;
    activeMemberCount: number;
    remainingSeats: number;
  };
  errors?: string[];
};

export function WorldStatus() {
  const [data, setData] = useState<WorldResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadWorld() {
      try {
        const response = await fetch("/api/world");
        const result = await response.json() as WorldResponse;

        if (mounted) {
          setData(result);
        }
      } catch (error) {
        if (mounted) {
          setData({
            ok: false,
            errors: [
              error instanceof Error ? error.message : "world取得に失敗しました。"
            ]
          });
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadWorld();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="現在の参加人数" value="読み込み中" />
        <Metric label="参加枠" value="-" />
        <Metric label="残り枠" value="-" />
        <Metric label="Season" value="-" />
      </section>
    );
  }

  if (!data?.ok || !data.world) {
    return (
      <Surface>
        <p className="text-sm text-rose-800">
          {data?.errors?.join(" / ") ?? "worldを取得できませんでした。"}
        </p>
      </Surface>
    );
  }

  return (
    <section className="grid gap-4 md:grid-cols-4">
      <Metric label="現在の参加人数" value={data.world.activeMemberCount} />
      <Metric label="参加枠" value={data.world.memberLimit} />
      <Metric label="残り枠" value={data.world.remainingSeats} />
      <Metric label="Season" value={`Season ${data.world.currentSeason}`} />
    </section>
  );
}
