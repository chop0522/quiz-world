"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export function AccountLogoutButton() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function signOut() {
    setSubmitting(true);
    setError(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        setError("ログアウトに失敗しました。時間を置いてもう一度お試しください。");
        return;
      }

      router.push("/login");
      router.refresh();
    } catch {
      setError("ログアウトに失敗しました。時間を置いてもう一度お試しください。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-3">
      <button
        className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-800 disabled:bg-stone-100 disabled:text-stone-500"
        disabled={submitting}
        onClick={signOut}
        type="button"
      >
        <LogOut aria-hidden className="size-4" />
        {submitting ? "ログアウト中..." : "ログアウト"}
      </button>
      {error ? (
        <p className="text-sm text-rose-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
