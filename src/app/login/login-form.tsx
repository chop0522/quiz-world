"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { Field, TextInput } from "@/components/ui";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  async function submitLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrors([]);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        setErrors([error.message]);
        return;
      }

      const profileResponse = await fetch("/api/profile");

      if (profileResponse.status === 404) {
        setErrors(["profileが未作成です。登録画面から参加条件を完了してください。"]);
        return;
      }

      if (!profileResponse.ok) {
        setErrors(["profile確認に失敗しました。"]);
        return;
      }

      router.push("/home");
      router.refresh();
    } catch (error) {
      setErrors([
        error instanceof Error ? error.message : "ログインに失敗しました。"
      ]);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={submitLogin}>
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
      <Field label="パスワード">
        <TextInput
          autoComplete="current-password"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="password"
          required
          type="password"
          value={password}
        />
      </Field>

      {errors.length > 0 ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          <ul className="list-disc pl-5">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <button
        className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[color:var(--accent-strong)] px-4 py-2 text-sm font-semibold text-white disabled:bg-stone-400"
        disabled={submitting}
        type="submit"
      >
        <LogIn aria-hidden className="size-4" />
        {submitting ? "ログイン中..." : "ログインする"}
      </button>
    </form>
  );
}
