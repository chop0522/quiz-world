import Link from "next/link";
import type { ReactNode } from "react";
import { Bell } from "lucide-react";
import {
  appName,
  legalRoutes,
  mainRoutes,
  publicRoutes
} from "@/lib/quiz-world";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type ShellSession = {
  loggedIn: boolean;
  isAdmin: boolean;
};

async function getShellSession(): Promise<ShellSession> {
  try {
    const server = await getSupabaseServerClient();
    const {
      data: { user }
    } = await server.auth.getUser();

    if (!user) {
      return {
        loggedIn: false,
        isAdmin: false
      };
    }

    const admin = getSupabaseAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("role,status")
      .eq("id", user.id)
      .maybeSingle();

    return {
      loggedIn: true,
      isAdmin: profile?.role === "admin" && profile?.status === "active"
    };
  } catch {
    return {
      loggedIn: false,
      isAdmin: false
    };
  }
}

export async function AppShell({ children }: { children: ReactNode }) {
  const session = await getShellSession();
  const visibleRoutes = session.loggedIn
    ? mainRoutes.filter((route) => route.href !== "/admin" || session.isAdmin)
    : publicRoutes;

  return (
    <div className="min-h-screen">
      <header className="border-b border-[color:var(--line)] bg-[color:var(--surface)]/92 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 md:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link
              className="focus-ring flex items-center gap-3 rounded-md"
              href="/"
            >
              <span className="flex size-10 items-center justify-center rounded-md bg-[color:var(--accent-strong)] text-white">
                <Bell aria-hidden className="size-5" />
              </span>
              <span>
                <span className="block text-base font-semibold">{appName}</span>
                <span className="block text-xs text-[color:var(--muted)]">
                  Season 0 / 10人招待制
                </span>
              </span>
            </Link>
          </div>
          <nav aria-label="Primary navigation">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {visibleRoutes.map((route) => {
                const Icon = route.icon;

                return (
                  <Link
                    className="focus-ring inline-flex min-h-10 shrink-0 items-center gap-2 rounded-md border border-[color:var(--line)] bg-white px-3 text-sm font-medium hover:border-[color:var(--accent)]"
                    href={route.href}
                    key={route.href}
                    title={route.description}
                  >
                    <Icon aria-hidden className="size-4" />
                    {route.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </header>
      <main className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:px-6">
        {children}
      </main>
      <footer className="border-t border-[color:var(--line)] bg-[color:var(--surface)]">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-6 text-sm text-[color:var(--muted)] md:grid-cols-[1fr_auto] md:px-6">
          <div>
            <p className="font-medium text-[color:var(--foreground)]">
              Quiz World Preview
            </p>
            <p className="mt-1">
              招待制のPreview環境で主要ループを確認中です。一般公開と課金機能は扱いません。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {legalRoutes.map((route) => (
              <Link
                className="focus-ring rounded-md hover:text-[color:var(--foreground)]"
                href={route.href}
                key={route.href}
              >
                {route.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
