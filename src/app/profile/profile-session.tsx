"use client";

import { useEffect, useState } from "react";
import { Badge, Surface } from "@/components/ui";

type ProfileResponse = {
  ok: boolean;
  user?: {
    email?: string;
  };
  profile?: {
    displayName: string;
    role: string;
    status: string;
    ageConfirmedAt: string;
    termsAcceptedAt: string;
    privacyAcceptedAt: string;
  };
  worldMember?: {
    role: string;
    status: string;
    joinedAt: string;
  } | null;
  errors?: string[];
};

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
    <Surface>
      <h2 className="font-semibold">Phase 1 profile</h2>
      <dl className="mt-3 grid gap-2 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-[color:var(--muted)]">表示名</dt>
          <dd className="font-medium">{data.profile.displayName}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-[color:var(--muted)]">メール</dt>
          <dd className="font-medium">{data.user?.email}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-[color:var(--muted)]">role</dt>
          <dd>
            <Badge tone={data.profile.role === "admin" ? "green" : "neutral"}>
              {data.profile.role}
            </Badge>
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-[color:var(--muted)]">status</dt>
          <dd>
            <Badge tone={data.profile.status === "active" ? "green" : "red"}>
              {data.profile.status}
            </Badge>
          </dd>
        </div>
      </dl>
    </Surface>
  );
}
