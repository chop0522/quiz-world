import Link from "next/link";
import type { ReactNode } from "react";
import { Bell, ShieldCheck } from "lucide-react";
import {
  appName,
  legalRoutes,
  mainRoutes,
  publicRoutes
} from "@/lib/quiz-world";

export function AppShell({ children }: { children: ReactNode }) {
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
            <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
              <ShieldCheck aria-hidden className="size-4" />
              MVPは18歳以上限定
            </div>
          </div>
          <nav aria-label="Primary navigation">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {[...publicRoutes, ...mainRoutes].map((route) => {
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
              Quiz World local scaffold
            </p>
            <p className="mt-1">
              Phase 2はSupabase localの四択クイズ作成実装。cloud環境、Stripe、production deployは未作成です。
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
