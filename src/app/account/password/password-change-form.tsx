"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { Field, TextInput } from "@/components/ui";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

const minPasswordLength = 8;

export function PasswordChangeForm() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submitPasswordChange(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors([]);
    setMessage(null);

    const nextErrors: string[] = [];

    if (!newPassword) {
      nextErrors.push("新しいパスワードを入力してください。");
    }

    if (!confirmPassword) {
      nextErrors.push("確認用パスワードを入力してください。");
    }

    if (newPassword && newPassword.length < minPasswordLength) {
      nextErrors.push(`パスワードは${minPasswordLength}文字以上にしてください。`);
    }

    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      nextErrors.push("確認用パスワードが一致しません。");
    }

    if (nextErrors.length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        setErrors([error.message || "パスワードを更新できませんでした。"]);
        return;
      }

      setNewPassword("");
      setConfirmPassword("");
      setMessage("パスワードを更新しました。ログイン状態は維持されています。");
    } catch {
      setErrors(["パスワードを更新できませんでした。時間を置いてもう一度お試しください。"]);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={submitPasswordChange}>
      <Field label="新しいパスワード" hint={`${minPasswordLength}文字以上`}>
        <TextInput
          autoComplete="new-password"
          onChange={(event) => setNewPassword(event.target.value)}
          placeholder="new password"
          required
          type="password"
          value={newPassword}
        />
      </Field>
      <Field label="新しいパスワード（確認）">
        <TextInput
          autoComplete="new-password"
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="confirm password"
          required
          type="password"
          value={confirmPassword}
        />
      </Field>

      {errors.length > 0 ? (
        <div
          className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
          role="alert"
        >
          <ul className="list-disc pl-5">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {message ? (
        <div
          className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
          role="status"
        >
          {message}
        </div>
      ) : null}

      <button
        className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[color:var(--accent-strong)] px-4 py-2 text-sm font-semibold text-white disabled:bg-stone-400"
        disabled={submitting}
        type="submit"
      >
        <KeyRound aria-hidden className="size-4" />
        {submitting ? "更新中..." : "パスワードを更新"}
      </button>
    </form>
  );
}
