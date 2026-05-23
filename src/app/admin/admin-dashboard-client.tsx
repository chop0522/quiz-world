"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  FileQuestion,
  KeyRound,
  ListChecks,
  RotateCcw,
  ShieldCheck,
  UserX
} from "lucide-react";
import {
  Badge,
  Field,
  Metric,
  Section,
  Surface,
  TextInput
} from "@/components/ui";
import {
  adminReportStatuses,
  adminWaitlistStatuses,
  type AdminQuestionModerationStatus,
  type AdminReportStatus,
  type AdminWaitlistStatus
} from "@/lib/phase7-validation";

type AdminTab =
  | "overview"
  | "reports"
  | "questions"
  | "users"
  | "waitlist"
  | "invites"
  | "audit";

type ReportItem = {
  id: string;
  questionId: string;
  launchId: string;
  reporterId: string;
  reporterDisplayName: string;
  reason: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  sameQuestionReportCount: number;
  reviewRequiredCandidate: boolean;
  question: {
    id: string;
    authorId: string;
    authorDisplayName: string;
    bodyPreview: string;
    status: string;
    category: string;
    difficulty: number;
  } | null;
};

type ReportDetail = {
  id: string;
  questionId: string;
  launchId: string;
  reporterDisplayName: string;
  reason: string;
  status: string;
  sameQuestionReportCount: number;
  reviewRequiredCandidate: boolean;
};

type QuestionDetail = {
  id: string;
  authorId: string;
  authorDisplayName: string;
  body: string;
  category: string;
  difficulty: number;
  status: string;
};

type QuestionItem = {
  id: string;
  authorDisplayName: string;
  bodyPreview: string;
  category: string;
  difficulty: number;
  status: string;
  counts: {
    reports: number;
    launches: number;
    answers: number;
  };
  reviewRequiredCandidate: boolean;
};

type UserItem = {
  id: string;
  displayName: string;
  role: string;
  status: string;
  answerRank: number;
  answerScore: number;
  questionerRank: number;
  questionerScore: number;
  worldMembers: {
    worldId: string;
    role: string;
    status: string;
  }[];
  counts: {
    questions: number;
    answers: number;
    reports: number;
  };
};

type WaitlistItem = {
  id: string;
  email: string;
  displayName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type InviteItem = {
  id: string;
  code: string;
  status: string;
  maxUses: number;
  useCount: number;
  expiresAt: string | null;
  createdAt: string;
};

type AuditLogItem = {
  id: string;
  adminDisplayName: string;
  action: string;
  targetType: string;
  targetId: string;
  reason: string;
  createdAt: string;
};

type AdminData = {
  reports: ReportItem[];
  questions: QuestionItem[];
  users: UserItem[];
  waitlist: WaitlistItem[];
  invites: InviteItem[];
  auditLogs: AuditLogItem[];
};

type PendingAdminAction = {
  title: string;
  description: string;
  targetLabel: string;
  actionLabel: string;
  reasonPlaceholder: string;
  danger?: boolean;
  reasonRequired?: boolean;
  onConfirm: (reason: string) => Promise<boolean>;
};

type ApiResult = {
  ok?: boolean;
  errors?: string[];
  reports?: ReportItem[];
  report?: ReportDetail;
  question?: QuestionDetail | null;
  questions?: QuestionItem[];
  users?: UserItem[];
  waitlist?: WaitlistItem[];
  invites?: InviteItem[];
  auditLogs?: AuditLogItem[];
  result?: unknown;
};

const tabs: { id: AdminTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "reports", label: "Reports" },
  { id: "questions", label: "Questions" },
  { id: "users", label: "Users" },
  { id: "waitlist", label: "Waitlist" },
  { id: "invites", label: "Invites" },
  { id: "audit", label: "Audit Logs" }
];

const initialData: AdminData = {
  reports: [],
  questions: [],
  users: [],
  waitlist: [],
  invites: [],
  auditLogs: []
};

function badgeTone(status: string) {
  if (["active", "resolved", "joined", "used"].includes(status)) {
    return "green";
  }

  if (["review_required", "reviewing", "invited", "open"].includes(status)) {
    return "amber";
  }

  if (["suspended", "dismissed", "rejected", "revoked"].includes(status)) {
    return "red";
  }

  return "neutral";
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

async function readJson(response: Response): Promise<ApiResult> {
  return await response.json() as ApiResult;
}

async function fetchJson(path: string): Promise<ApiResult> {
  const response = await fetch(path);
  const result = await readJson(response);

  if (!response.ok || !result.ok) {
    throw new Error(result.errors?.join(" / ") ?? `${path} failed`);
  }

  return result;
}

export function AdminDashboardClient({ adminName }: { adminName: string }) {
  const [tab, setTab] = useState<AdminTab>("overview");
  const [data, setData] = useState<AdminData>(initialData);
  const [selectedReport, setSelectedReport] = useState<{
    report: ReportDetail;
    question: QuestionDetail | null;
  } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [inviteMaxUses, setInviteMaxUses] = useState(1);
  const [inviteReason, setInviteReason] = useState("");
  const [pendingAction, setPendingAction] = useState<PendingAdminAction | null>(null);
  const [pendingReason, setPendingReason] = useState("");

  const reportCandidates = useMemo(
    () => data.reports.filter((report) => report.reviewRequiredCandidate).length,
    [data.reports]
  );
  const suspendedUsers = useMemo(
    () => data.users.filter((user) => user.status === "suspended").length,
    [data.users]
  );

  const loadAll = useCallback(async () => {
    setLoading(true);
    setErrors([]);

    try {
      const [reports, questions, users, waitlist, invites, auditLogs] = await Promise.all([
        fetchJson("/api/admin/reports"),
        fetchJson("/api/admin/questions"),
        fetchJson("/api/admin/users"),
        fetchJson("/api/admin/waitlist"),
        fetchJson("/api/admin/invites"),
        fetchJson("/api/admin/audit-logs")
      ]);

      setData({
        reports: reports.reports ?? [],
        questions: questions.questions ?? [],
        users: users.users ?? [],
        waitlist: waitlist.waitlist ?? [],
        invites: invites.invites ?? [],
        auditLogs: auditLogs.auditLogs ?? []
      });
    } catch (error) {
      setErrors([
        error instanceof Error ? error.message : "admin dataの取得に失敗しました。"
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    queueMicrotask(() => {
      if (active) {
        void loadAll();
      }
    });

    return () => {
      active = false;
    };
  }, [loadAll]);

  async function mutate(
    path: string,
    body: Record<string, unknown>,
    successMessage: string
  ): Promise<boolean> {
    setSubmitting(true);
    setErrors([]);
    setMessage(null);

    try {
      const response = await fetch(path, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const result = await readJson(response);

      if (!response.ok || !result.ok) {
        setErrors(result.errors ?? ["admin操作に失敗しました。"]);
        return false;
      }

      setMessage(successMessage);
      await loadAll();
      return true;
    } catch (error) {
      setErrors([
        error instanceof Error ? error.message : "admin操作に失敗しました。"
      ]);
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  function openAdminAction(action: PendingAdminAction) {
    setErrors([]);
    setMessage(null);
    setPendingReason("");
    setPendingAction(action);
  }

  async function confirmPendingAction(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!pendingAction) {
      return;
    }

    const reason = pendingReason.trim();

    if (pendingAction.reasonRequired !== false && !reason) {
      setErrors(["reasonは必須です。"]);
      return;
    }

    const succeeded = await pendingAction.onConfirm(reason);

    if (succeeded) {
      setPendingAction(null);
      setPendingReason("");
    }
  }

  function cancelPendingAction() {
    setPendingAction(null);
    setPendingReason("");
  }

  async function loadReportDetail(reportId: string) {
    setErrors([]);
    setMessage(null);

    try {
      const result = await fetchJson(`/api/admin/reports/${reportId}`);

      if (result.report) {
        setSelectedReport({
          report: result.report,
          question: result.question ?? null
        });
      }
    } catch (error) {
      setErrors([
        error instanceof Error ? error.message : "report詳細を取得できませんでした。"
      ]);
    }
  }

  function updateReportStatus(report: ReportItem, status: AdminReportStatus) {
    openAdminAction({
      title: "report status更新",
      description: "reportの状態を変更し、admin_audit_logsに記録します。",
      targetLabel: `${report.reason} / ${report.reporterDisplayName}`,
      actionLabel: `report -> ${status}`,
      reasonPlaceholder: `reportを${status}に更新する理由`,
      onConfirm: (reason) => mutate(
        `/api/admin/reports/${report.id}`,
        { status, reason },
        "report statusを更新しました。"
      )
    });
  }

  function moderateQuestion(
    questionId: string,
    status: AdminQuestionModerationStatus,
    reportId?: string,
    targetLabel = "question"
  ) {
    openAdminAction({
      title: "question moderation",
      description: "questionのstatusを変更します。完全削除は行わず、既存ログは監査用に残します。",
      targetLabel,
      actionLabel: `question -> ${status}`,
      reasonPlaceholder: `questionを${status}に変更する理由`,
      danger: status === "suspended",
      onConfirm: (reason) => mutate(
        `/api/admin/questions/${questionId}/moderation`,
        { status, reason, reportId: reportId ?? null },
        "question moderationを実行しました。"
      )
    });
  }

  function suspendUser(user: UserItem) {
    openAdminAction({
      title: "user停止",
      description: "profiles.status と world_members.status を suspended に更新します。復帰APIはPhase 7では作りません。",
      targetLabel: `${user.displayName} / ${user.role}`,
      actionLabel: "user -> suspended",
      reasonPlaceholder: "ユーザー停止の理由",
      danger: true,
      onConfirm: (reason) => mutate(
        `/api/admin/users/${user.id}/suspend`,
        { reason },
        "userを停止しました。"
      )
    });
  }

  function updateWaitlistStatus(item: WaitlistItem, status: AdminWaitlistStatus) {
    openAdminAction({
      title: "waitlist status更新",
      description: "waitlistの状態を更新し、admin_audit_logsに記録します。rejectedのみreason必須です。",
      targetLabel: `${item.displayName} / ${item.email}`,
      actionLabel: `waitlist -> ${status}`,
      reasonPlaceholder: status === "rejected"
        ? "waitlistをrejectedにする理由"
        : "waitlist status更新理由（任意）",
      reasonRequired: status === "rejected",
      onConfirm: (reason) => mutate(
        `/api/admin/waitlist/${item.id}`,
        { status, reason },
        "waitlist statusを更新しました。"
      )
    });
  }

  async function createInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrors([]);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: inviteCode || null,
          maxUses: inviteMaxUses,
          reason: inviteReason
        })
      });
      const result = await readJson(response);

      if (!response.ok || !result.ok) {
        setErrors(result.errors ?? ["invite作成に失敗しました。"]);
        return;
      }

      setInviteCode("");
      setInviteReason("");
      setInviteMaxUses(1);
      setMessage("invite codeを作成しました。");
      await loadAll();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6">
      <Surface>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-[color:var(--muted)]">
              Logged in admin
            </p>
            <p className="mt-1 font-semibold">{adminName}</p>
          </div>
          <button
            className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[color:var(--line)] bg-white px-3 text-sm font-semibold"
            onClick={() => void loadAll()}
            type="button"
          >
            <RotateCcw aria-hidden className="size-4" />
            再読み込み
          </button>
        </div>
      </Surface>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((item) => (
          <button
            className={`focus-ring min-h-10 shrink-0 rounded-md border px-3 text-sm font-semibold ${
              tab === item.id
                ? "border-[color:var(--accent)] bg-[color:var(--accent-strong)] text-white"
                : "border-[color:var(--line)] bg-white"
            }`}
            key={item.id}
            onClick={() => setTab(item.id)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>

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

      {pendingAction ? (
        <Surface
          className={
            pendingAction.danger
              ? "border-rose-200 bg-rose-50"
              : "border-amber-200 bg-amber-50"
          }
        >
          <form className="grid gap-4" onSubmit={confirmPendingAction}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.08em] text-[color:var(--muted)]">
                  Admin confirmation
                </p>
                <h2 className="mt-1 font-semibold">{pendingAction.title}</h2>
                <p className="mt-1 text-sm text-[color:var(--muted)]">
                  {pendingAction.description}
                </p>
              </div>
              <Badge tone={pendingAction.danger ? "red" : "amber"}>
                {pendingAction.actionLabel}
              </Badge>
            </div>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-md border border-white/70 bg-white/70 p-3">
                <dt className="text-xs font-medium uppercase tracking-[0.08em] text-[color:var(--muted)]">
                  対象
                </dt>
                <dd className="mt-1 break-words font-semibold">
                  {pendingAction.targetLabel}
                </dd>
              </div>
              <div className="rounded-md border border-white/70 bg-white/70 p-3">
                <dt className="text-xs font-medium uppercase tracking-[0.08em] text-[color:var(--muted)]">
                  操作
                </dt>
                <dd className="mt-1 font-semibold">{pendingAction.actionLabel}</dd>
              </div>
            </dl>
            <Field
              label={pendingAction.reasonRequired === false ? "reason（任意）" : "reason"}
            >
              <TextInput
                onChange={(event) => setPendingReason(event.target.value)}
                placeholder={pendingAction.reasonPlaceholder}
                required={pendingAction.reasonRequired !== false}
                value={pendingReason}
              />
            </Field>
            <div className="flex flex-wrap gap-2">
              <button
                className={`focus-ring min-h-11 rounded-md px-4 text-sm font-semibold text-white disabled:bg-stone-400 ${
                  pendingAction.danger
                    ? "bg-rose-700 hover:bg-rose-800"
                    : "bg-[color:var(--accent-strong)] hover:bg-[color:var(--accent)]"
                }`}
                disabled={submitting}
                type="submit"
              >
                確認して実行
              </button>
              <button
                className="focus-ring min-h-11 rounded-md border border-[color:var(--line)] bg-white px-4 text-sm font-semibold disabled:opacity-50"
                disabled={submitting}
                onClick={cancelPendingAction}
                type="button"
              >
                キャンセル
              </button>
            </div>
          </form>
        </Surface>
      ) : null}

      {loading ? (
        <Surface>
          <p className="text-sm text-[color:var(--muted)]">admin dataを読み込み中...</p>
        </Surface>
      ) : null}

      {!loading && tab === "overview" ? (
        <section className="grid gap-4 md:grid-cols-4">
          <Metric helper="open/reviewing含む" label="通報" value={data.reports.length} />
          <Metric helper="2件以上通報" label="review候補" value={reportCandidates} />
          <Metric helper="waiting中心" label="waitlist" value={data.waitlist.length} />
          <Metric helper="停止済み" label="suspended users" value={suspendedUsers} />
        </section>
      ) : null}

      {!loading && tab === "reports" ? (
        <Section
          description="2件以上reportがあるquestionはreview_required候補として表示します。自動停止は行いません。"
          title="Reports"
        >
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="grid gap-3">
              {data.reports.map((report) => (
                <Surface key={report.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={badgeTone(report.status)}>{report.status}</Badge>
                        <Badge tone={report.reviewRequiredCandidate ? "amber" : "neutral"}>
                          {report.sameQuestionReportCount} reports
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm font-semibold">
                        {report.question?.bodyPreview ?? "question unavailable"}
                      </p>
                      <p className="mt-1 text-xs text-[color:var(--muted)]">
                        {report.reason} / by {report.reporterDisplayName} / {formatDateTime(report.createdAt)}
                      </p>
                    </div>
                    <button
                      className="focus-ring min-h-10 rounded-md border border-[color:var(--line)] bg-white px-3 text-sm font-semibold"
                      onClick={() => void loadReportDetail(report.id)}
                      type="button"
                    >
                      詳細
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {adminReportStatuses.map((status) => (
                      <button
                        className="focus-ring min-h-10 rounded-md border border-[color:var(--line)] bg-white px-3 text-sm font-semibold disabled:opacity-50"
                        disabled={submitting || report.status === status}
                        key={status}
                        onClick={() => updateReportStatus(report, status)}
                        type="button"
                      >
                        {status}
                      </button>
                    ))}
                    {report.question ? (
                      <>
                        <button
                          className="focus-ring min-h-10 rounded-md border border-amber-200 bg-amber-50 px-3 text-sm font-semibold text-amber-900 disabled:opacity-50"
                          disabled={submitting}
                          onClick={() => void moderateQuestion(
                            report.question!.id,
                            "review_required",
                            report.id,
                            report.question!.bodyPreview
                          )}
                          type="button"
                        >
                          review_required
                        </button>
                        <button
                          className="focus-ring min-h-10 rounded-md border border-rose-200 bg-rose-50 px-3 text-sm font-semibold text-rose-900 disabled:opacity-50"
                          disabled={submitting}
                          onClick={() => void moderateQuestion(
                            report.question!.id,
                            "suspended",
                            report.id,
                            report.question!.bodyPreview
                          )}
                          type="button"
                        >
                          suspended
                        </button>
                      </>
                    ) : null}
                  </div>
                </Surface>
              ))}
              {data.reports.length === 0 ? (
                <Surface>
                  <p className="text-sm text-[color:var(--muted)]">reportはありません。</p>
                </Surface>
              ) : null}
            </div>
            <Surface className="self-start">
              <h3 className="font-semibold">Report Detail</h3>
              {selectedReport ? (
                <div className="mt-3 grid gap-3 text-sm">
                  <p>{selectedReport.question?.body ?? "question unavailable"}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone={badgeTone(selectedReport.report.status)}>
                      {selectedReport.report.status}
                    </Badge>
                    <Badge>{selectedReport.report.reason}</Badge>
                  </div>
                  <p className="text-[color:var(--muted)]">
                    reporter: {selectedReport.report.reporterDisplayName}
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-sm text-[color:var(--muted)]">
                  reportの詳細を選択してください。
                </p>
              )}
            </Surface>
          </div>
        </Section>
      ) : null}

      {!loading && tab === "questions" ? (
        <Section title="Questions">
          <div className="grid gap-3">
            {data.questions.map((question) => (
              <Surface key={question.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge tone={badgeTone(question.status)}>{question.status}</Badge>
                      <Badge>{question.counts.reports} reports</Badge>
                      {question.reviewRequiredCandidate ? (
                        <Badge tone="amber">review候補</Badge>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm font-semibold">{question.bodyPreview}</p>
                    <p className="mt-1 text-xs text-[color:var(--muted)]">
                      {question.authorDisplayName} / {question.category} / 難易度 {question.difficulty}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    className="focus-ring min-h-10 rounded-md border border-amber-200 bg-amber-50 px-3 text-sm font-semibold text-amber-900 disabled:opacity-50"
                    disabled={submitting || question.status === "review_required"}
                    onClick={() => moderateQuestion(question.id, "review_required", undefined, question.bodyPreview)}
                    type="button"
                  >
                    review_required
                  </button>
                  <button
                    className="focus-ring min-h-10 rounded-md border border-rose-200 bg-rose-50 px-3 text-sm font-semibold text-rose-900 disabled:opacity-50"
                    disabled={submitting || question.status === "suspended"}
                    onClick={() => moderateQuestion(question.id, "suspended", undefined, question.bodyPreview)}
                    type="button"
                  >
                    suspended
                  </button>
                </div>
              </Surface>
            ))}
          </div>
        </Section>
      ) : null}

      {!loading && tab === "users" ? (
        <Section title="Users">
          <div className="grid gap-3 md:grid-cols-2">
            {data.users.map((user) => (
              <Surface key={user.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge tone={user.role === "admin" ? "green" : "neutral"}>
                        {user.role}
                      </Badge>
                      <Badge tone={badgeTone(user.status)}>{user.status}</Badge>
                    </div>
                    <p className="mt-2 font-semibold">{user.displayName}</p>
                    <p className="mt-1 text-xs text-[color:var(--muted)]">
                      A Lv.{user.answerRank} / Q Lv.{user.questionerRank}
                    </p>
                  </div>
                  <UserX aria-hidden className="size-5 text-[color:var(--accent)]" />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-[color:var(--muted)]">
                  <span>{user.counts.questions} questions</span>
                  <span>{user.counts.answers} answers</span>
                  <span>{user.counts.reports} reports</span>
                </div>
                <button
                  className="focus-ring mt-3 min-h-10 w-full rounded-md border border-rose-200 bg-rose-50 px-3 text-sm font-semibold text-rose-900 disabled:opacity-50"
                  disabled={submitting || user.status === "suspended"}
                  onClick={() => suspendUser(user)}
                  type="button"
                >
                  user停止
                </button>
              </Surface>
            ))}
          </div>
        </Section>
      ) : null}

      {!loading && tab === "waitlist" ? (
        <Section title="Waitlist">
          <div className="grid gap-3">
            {data.waitlist.map((item) => (
              <Surface key={item.id}>
                <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge tone={badgeTone(item.status)}>{item.status}</Badge>
                      <Badge>{formatDateTime(item.createdAt)}</Badge>
                    </div>
                    <p className="mt-2 font-semibold">{item.displayName}</p>
                    <p className="text-sm text-[color:var(--muted)]">{item.email}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {adminWaitlistStatuses.map((status) => (
                      <button
                        className="focus-ring min-h-10 rounded-md border border-[color:var(--line)] bg-white px-3 text-sm font-semibold disabled:opacity-50"
                        disabled={submitting || item.status === status}
                        key={status}
                        onClick={() => updateWaitlistStatus(item, status)}
                        type="button"
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </Surface>
            ))}
            {data.waitlist.length === 0 ? (
              <Surface>
                <p className="text-sm text-[color:var(--muted)]">waitlistはありません。</p>
              </Surface>
            ) : null}
          </div>
        </Section>
      ) : null}

      {!loading && tab === "invites" ? (
        <Section title="Invites">
          <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
            <Surface className="self-start">
              <form className="grid gap-3" onSubmit={createInvite}>
                <h3 className="font-semibold">invite code発行</h3>
                <Field
                  hint="未入力ならSEASON0-XXXXXX形式でserver生成します。"
                  label="code"
                >
                  <TextInput
                    onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
                    placeholder="SEASON0-ABC123"
                    value={inviteCode}
                  />
                </Field>
                <Field label="max uses">
                  <TextInput
                    min={1}
                    onChange={(event) => setInviteMaxUses(Number(event.target.value))}
                    type="number"
                    value={inviteMaxUses}
                  />
                </Field>
                <Field label="reason">
                  <TextInput
                    onChange={(event) => setInviteReason(event.target.value)}
                    placeholder="招待コード発行理由"
                    required
                    value={inviteReason}
                  />
                </Field>
                <button
                  className="focus-ring min-h-11 rounded-md bg-[color:var(--accent-strong)] px-4 text-sm font-semibold text-white disabled:bg-stone-400"
                  disabled={submitting}
                  type="submit"
                >
                  発行する
                </button>
              </form>
            </Surface>
            <div className="grid gap-3">
              {data.invites.map((invite) => (
                <Surface key={invite.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <Badge tone={badgeTone(invite.status)}>{invite.status}</Badge>
                        <Badge>
                          {invite.useCount}/{invite.maxUses}
                        </Badge>
                      </div>
                      <p className="mt-2 font-mono text-sm font-semibold">{invite.code}</p>
                      <p className="mt-1 text-xs text-[color:var(--muted)]">
                        expires {formatDateTime(invite.expiresAt)} / {formatDateTime(invite.createdAt)}
                      </p>
                    </div>
                    <KeyRound aria-hidden className="size-5 text-[color:var(--accent)]" />
                  </div>
                </Surface>
              ))}
            </div>
          </div>
        </Section>
      ) : null}

      {!loading && tab === "audit" ? (
        <Section title="Audit Logs">
          <div className="grid gap-3">
            {data.auditLogs.map((log) => (
              <Surface key={log.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge>{log.action}</Badge>
                      <Badge tone="neutral">{log.targetType}</Badge>
                    </div>
                    <p className="mt-2 text-sm font-semibold">{log.reason}</p>
                    <p className="mt-1 text-xs text-[color:var(--muted)]">
                      {log.adminDisplayName} / {formatDateTime(log.createdAt)}
                    </p>
                  </div>
                  <ClipboardList aria-hidden className="size-5 text-[color:var(--accent)]" />
                </div>
              </Surface>
            ))}
            {data.auditLogs.length === 0 ? (
              <Surface>
                <p className="text-sm text-[color:var(--muted)]">
                  admin操作ログはまだありません。
                </p>
              </Surface>
            ) : null}
          </div>
        </Section>
      ) : null}

      <section className="grid gap-3 md:grid-cols-3">
        <Surface>
          <ListChecks aria-hidden className="mb-2 size-5 text-[color:var(--accent)]" />
          <h3 className="font-semibold">削除しない</h3>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            Phase 7はstatus変更で停止します。
          </p>
        </Surface>
        <Surface>
          <FileQuestion aria-hidden className="mb-2 size-5 text-[color:var(--accent)]" />
          <h3 className="font-semibold">review候補</h3>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            report 2件以上はadminが明示判断します。
          </p>
        </Surface>
        <Surface>
          <ShieldCheck aria-hidden className="mb-2 size-5 text-[color:var(--accent)]" />
          <h3 className="font-semibold">audit必須</h3>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            操作とログ記録はRPCで同一処理にします。
          </p>
        </Surface>
      </section>
    </div>
  );
}
