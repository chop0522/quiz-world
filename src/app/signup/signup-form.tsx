"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, UserRoundPlus } from "lucide-react";
import { Field, TextInput } from "@/components/ui";
import { initialInviteCode } from "@/lib/phase1-validation";

type ApiResult = {
  ok?: boolean;
  signedIn?: boolean;
  status?: string;
  errors?: string[];
  valid?: boolean;
  reason?: string;
  world?: {
    name?: string;
    memberLimit?: number;
    activeMemberCount?: number;
    remainingSeats?: number;
  } | null;
  remainingSeats?: number | null;
};

export function SignupForm() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState(initialInviteCode);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [waitlistRequired, setWaitlistRequired] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function readJson(response: Response): Promise<ApiResult> {
    return await response.json() as ApiResult;
  }

  async function validateInvite() {
    setMessage(null);
    setErrors([]);
    const response = await fetch("/api/invites/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteCode })
    });
    const result = await readJson(response);

    if (!response.ok || !result.valid) {
      setErrors(result.errors ?? ["招待コードを確認できませんでした。"]);
      return;
    }

    setMessage(`招待コードは有効です。残り枠: ${result.remainingSeats ?? "-"}人`);
  }

  async function submitWaitlist() {
    setSubmitting(true);
    setErrors([]);
    setMessage(null);

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

      setMessage("waitlistに登録しました。参加枠が空いたら運営が確認します。");
      setWaitlistRequired(false);
    } finally {
      setSubmitting(false);
    }
  }

  async function submitSignup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrors([]);
    setMessage(null);
    setWaitlistRequired(false);

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          displayName,
          inviteCode,
          ageConfirmed,
          termsAccepted,
          privacyAccepted
        })
      });
      const result = await readJson(response);

      if (!response.ok || !result.ok) {
        setErrors(result.errors ?? ["登録に失敗しました。"]);
        setWaitlistRequired(result.status === "waitlist_required");
        return;
      }

      if (result.signedIn) {
        router.push("/home");
        router.refresh();
        return;
      }

      setMessage("登録は完了しました。ログイン画面からログインしてください。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={submitSignup}>
      <Field label="表示名">
        <TextInput
          autoComplete="nickname"
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder="quiz_player"
          required
          value={displayName}
        />
      </Field>
      <Field label="メールアドレス">
        <TextInput
          autoComplete="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          required
          type="email"
          value={email}
        />
      </Field>
      <Field label="パスワード" hint="8文字以上。MVP初期はemail/password方式で開始します。">
        <TextInput
          autoComplete="new-password"
          minLength={8}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="password"
          required
          type="password"
          value={password}
        />
      </Field>
      <Field label="招待コード" hint="Season 0は管理者発行コードが必須です。">
        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <TextInput
            onChange={(event) => setInviteCode(event.target.value)}
            placeholder={initialInviteCode}
            required
            value={inviteCode}
          />
          <button
            className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[color:var(--line)] bg-white px-4 py-2 text-sm font-semibold"
            onClick={validateInvite}
            type="button"
          >
            <KeyRound aria-hidden className="size-4" />
            確認
          </button>
        </div>
      </Field>
      <label className="flex gap-3 rounded-md border border-[color:var(--line)] bg-white p-3 text-sm">
        <input
          checked={ageConfirmed}
          className="mt-1"
          onChange={(event) => setAgeConfirmed(event.target.checked)}
          type="checkbox"
        />
        <span>私は18歳以上です。MVPでは生年月日は保存しません。</span>
      </label>
      <label className="flex gap-3 rounded-md border border-[color:var(--line)] bg-white p-3 text-sm">
        <input
          checked={termsAccepted}
          className="mt-1"
          onChange={(event) => setTermsAccepted(event.target.checked)}
          type="checkbox"
        />
        <span>
          <Link className="underline" href="/legal/terms">
            利用規約
          </Link>
          に同意します。
        </span>
      </label>
      <label className="flex gap-3 rounded-md border border-[color:var(--line)] bg-white p-3 text-sm">
        <input
          checked={privacyAccepted}
          className="mt-1"
          onChange={(event) => setPrivacyAccepted(event.target.checked)}
          type="checkbox"
        />
        <span>
          <Link className="underline" href="/legal/privacy">
            プライバシーポリシー
          </Link>
          に同意します。
        </span>
      </label>

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

      <button
        className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[color:var(--accent-strong)] px-4 py-2 text-sm font-semibold text-white disabled:bg-stone-400"
        disabled={submitting}
        type="submit"
      >
        <UserRoundPlus aria-hidden className="size-4" />
        {submitting ? "処理中..." : "登録する"}
      </button>

      {waitlistRequired ? (
        <button
          className="focus-ring min-h-11 rounded-md border border-[color:var(--line)] bg-white px-4 py-2 text-sm font-semibold"
          disabled={submitting}
          onClick={submitWaitlist}
          type="button"
        >
          waitlistに登録する
        </button>
      ) : null}
    </form>
  );
}
