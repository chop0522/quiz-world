"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { Field, Surface, TextInput } from "@/components/ui";
import { initialInviteCode } from "@/lib/phase1-validation";

type ApiResult = {
  ok?: boolean;
  valid?: boolean;
  status?: string;
  reason?: string;
  errors?: string[];
  remainingSeats?: number | null;
  world?: {
    name?: string;
    memberLimit?: number;
  } | null;
};

export function InviteClient() {
  const [inviteCode, setInviteCode] = useState(initialInviteCode);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  async function readJson(response: Response): Promise<ApiResult> {
    return await response.json() as ApiResult;
  }

  async function validateInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors([]);
    setMessage(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/invites/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode })
      });
      const result = await readJson(response);

      if (!response.ok || !result.valid) {
        setErrors(result.errors ?? [`招待コードは利用できません: ${result.reason ?? "unknown"}`]);
        return;
      }

      setMessage(`招待コードは有効です。残り枠: ${result.remainingSeats ?? "-"}人`);
    } finally {
      setSubmitting(false);
    }
  }

  async function submitWaitlist(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors([]);
    setMessage(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, displayName })
      });
      const result = await readJson(response);

      if (!response.ok || !result.ok) {
        setErrors(result.errors ?? ["waitlist登録に失敗しました。"]);
        return;
      }

      setMessage(
        result.status === "already_exists"
          ? "このメールアドレスはすでにwaitlistに登録済みです。"
          : "waitlistに登録しました。"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Surface>
        <h2 className="font-semibold">招待コード入力</h2>
        <form className="mt-4 grid gap-4" onSubmit={validateInvite}>
          <Field label="招待コード">
            <TextInput
              onChange={(event) => setInviteCode(event.target.value)}
              placeholder={initialInviteCode}
              required
              value={inviteCode}
            />
          </Field>
          <button
            className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[color:var(--accent-strong)] px-4 py-2 text-sm font-semibold text-white disabled:bg-stone-400"
            disabled={submitting}
            type="submit"
          >
            <KeyRound aria-hidden className="size-4" />
            検証する
          </button>
        </form>
      </Surface>
      <Surface>
        <h2 className="font-semibold">waitlist登録</h2>
        <form className="mt-4 grid gap-4" onSubmit={submitWaitlist}>
          <Field label="メールアドレス">
            <TextInput
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
              type="email"
              value={email}
            />
          </Field>
          <Field label="希望表示名">
            <TextInput
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="quiz_player"
              required
              value={displayName}
            />
          </Field>
          <button
            className="focus-ring min-h-11 rounded-md border border-[color:var(--line)] bg-white px-4 py-2 text-sm font-semibold disabled:bg-stone-100"
            disabled={submitting}
            type="submit"
          >
            waitlistに入る
          </button>
        </form>
      </Surface>

      {errors.length > 0 ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 md:col-span-2">
          <ul className="list-disc pl-5">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {message ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 md:col-span-2">
          {message}
        </p>
      ) : null}
    </div>
  );
}
