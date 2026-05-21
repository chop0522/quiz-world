import Link from "next/link";
import type { InputHTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions
}: PageHeaderProps) {
  return (
    <header className="grid gap-5 border-b border-[color:var(--line)] pb-6 md:grid-cols-[1fr_auto] md:items-end">
      <div className="max-w-3xl">
        {eyebrow ? (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--accent-strong)]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-3xl font-semibold tracking-normal text-[color:var(--foreground)] md:text-4xl">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-6 text-[color:var(--muted)] md:text-base">
          {description}
        </p>
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}

export function Section({
  title,
  description,
  children
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-4">
      <div>
        <h2 className="text-xl font-semibold tracking-normal">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-[color:var(--muted)]">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function Surface({
  children,
  className = ""
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] p-4 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral"
}: {
  children: ReactNode;
  tone?: "neutral" | "green" | "amber" | "red";
}) {
  const tones = {
    neutral: "border-stone-300 bg-stone-100 text-stone-700",
    green: "border-emerald-200 bg-emerald-50 text-emerald-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    red: "border-rose-200 bg-rose-50 text-rose-800"
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
  icon: Icon
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
  icon?: LucideIcon;
}) {
  const variants = {
    primary:
      "bg-[color:var(--accent-strong)] text-white hover:bg-[color:var(--accent)]",
    secondary:
      "border border-[color:var(--line)] bg-[color:var(--surface)] text-[color:var(--foreground)] hover:border-[color:var(--accent)]"
  };

  return (
    <Link
      className={`focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition ${variants[variant]}`}
      href={href}
    >
      {Icon ? <Icon aria-hidden className="size-4" /> : null}
      {children}
    </Link>
  );
}

export function Metric({
  label,
  value,
  helper
}: {
  label: string;
  value: string | number;
  helper?: string;
}) {
  return (
    <Surface>
      <p className="text-xs font-medium uppercase tracking-[0.08em] text-[color:var(--muted)]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      {helper ? (
        <p className="mt-1 text-sm text-[color:var(--muted)]">{helper}</p>
      ) : null}
    </Surface>
  );
}

export function Field({
  label,
  children,
  hint
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      <span>{label}</span>
      {children}
      {hint ? <span className="text-xs text-[color:var(--muted)]">{hint}</span> : null}
    </label>
  );
}

export function TextInput({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`focus-ring min-h-11 rounded-md border border-[color:var(--line)] bg-white px-3 text-sm disabled:bg-stone-100 disabled:text-stone-500 ${className}`}
      {...props}
    />
  );
}

export function SelectInput({ children }: { children: ReactNode }) {
  return (
    <select className="focus-ring min-h-11 rounded-md border border-[color:var(--line)] bg-white px-3 text-sm">
      {children}
    </select>
  );
}

export function TextArea({ placeholder }: { placeholder?: string }) {
  return (
    <textarea
      className="focus-ring min-h-28 rounded-md border border-[color:var(--line)] bg-white px-3 py-3 text-sm"
      placeholder={placeholder}
    />
  );
}

export function ProgressBar({
  value,
  label
}: {
  value: number;
  label: string;
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between text-xs text-[color:var(--muted)]">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-stone-200">
        <div
          className="h-2 rounded-full bg-[color:var(--accent)]"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
