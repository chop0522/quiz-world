import type { ValidationResult } from "@/lib/phase1-validation";

export const adminReportStatuses = ["reviewing", "resolved", "dismissed"] as const;
export const adminQuestionModerationStatuses = [
  "review_required",
  "suspended"
] as const;
export const adminWaitlistStatuses = [
  "waiting",
  "invited",
  "joined",
  "rejected"
] as const;

export const adminReasonMaxLength = 500;
export const adminInviteCodeMaxLength = 80;

export type AdminReportStatus = typeof adminReportStatuses[number];
export type AdminQuestionModerationStatus =
  typeof adminQuestionModerationStatuses[number];
export type AdminWaitlistStatus = typeof adminWaitlistStatuses[number];

export type AdminReportStatusPayload = {
  status: AdminReportStatus;
  reason: string;
};

export type AdminQuestionModerationPayload = {
  status: AdminQuestionModerationStatus;
  reason: string;
  reportId: string | null;
};

export type AdminUserSuspendPayload = {
  reason: string;
};

export type AdminWaitlistStatusPayload = {
  status: AdminWaitlistStatus;
  reason: string;
};

export type AdminInvitePayload = {
  worldId: string | null;
  code: string | null;
  maxUses: number;
  expiresAt: string | null;
  reason: string;
};

function asRecord(input: unknown): Record<string, unknown> {
  return typeof input === "object" && input !== null
    ? input as Record<string, unknown>
    : {};
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown): number {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    return Number(value);
  }

  return Number.NaN;
}

export function isAdminReportStatus(value: string): value is AdminReportStatus {
  return adminReportStatuses.includes(value as AdminReportStatus);
}

export function isAdminQuestionModerationStatus(
  value: string
): value is AdminQuestionModerationStatus {
  return adminQuestionModerationStatuses.includes(
    value as AdminQuestionModerationStatus
  );
}

export function isAdminWaitlistStatus(value: string): value is AdminWaitlistStatus {
  return adminWaitlistStatuses.includes(value as AdminWaitlistStatus);
}

export function normalizeAdminReason(value: unknown): string {
  return asString(value);
}

export function normalizeInviteCode(value: unknown): string | null {
  const code = asString(value).toUpperCase();
  return code.length > 0 ? code : null;
}

function pushReasonErrors(reason: string, errors: string[]) {
  if (!reason) {
    errors.push("reasonは必須です。");
  }

  if (reason.length > adminReasonMaxLength) {
    errors.push("reasonは500文字以内にしてください。");
  }
}

export function validateAdminReportStatusPayload(
  input: unknown
): ValidationResult<AdminReportStatusPayload> {
  const body = asRecord(input);
  const status = asString(body.status);
  const reason = normalizeAdminReason(body.reason);
  const errors: string[] = [];

  if (!isAdminReportStatus(status)) {
    errors.push("report statusはreviewing/resolved/dismissedのいずれかです。");
  }

  pushReasonErrors(reason, errors);

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      status: status as AdminReportStatus,
      reason
    }
  };
}

export function validateAdminQuestionModerationPayload(
  input: unknown
): ValidationResult<AdminQuestionModerationPayload> {
  const body = asRecord(input);
  const status = asString(body.status);
  const reason = normalizeAdminReason(body.reason);
  const reportId = asString(body.reportId ?? body.report_id);
  const errors: string[] = [];

  if (!isAdminQuestionModerationStatus(status)) {
    errors.push("question statusはreview_requiredまたはsuspendedのみです。");
  }

  pushReasonErrors(reason, errors);

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      status: status as AdminQuestionModerationStatus,
      reason,
      reportId: reportId || null
    }
  };
}

export function validateAdminUserSuspendPayload(
  input: unknown
): ValidationResult<AdminUserSuspendPayload> {
  const reason = normalizeAdminReason(asRecord(input).reason);
  const errors: string[] = [];
  pushReasonErrors(reason, errors);

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: { reason }
  };
}

export function validateAdminWaitlistStatusPayload(
  input: unknown
): ValidationResult<AdminWaitlistStatusPayload> {
  const body = asRecord(input);
  const status = asString(body.status);
  const reason = normalizeAdminReason(body.reason);
  const errors: string[] = [];

  if (!isAdminWaitlistStatus(status)) {
    errors.push("waitlist statusが不正です。");
  }

  if (status === "rejected") {
    pushReasonErrors(reason, errors);
  } else if (reason.length > adminReasonMaxLength) {
    errors.push("reasonは500文字以内にしてください。");
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      status: status as AdminWaitlistStatus,
      reason
    }
  };
}

export function validateAdminInvitePayload(
  input: unknown
): ValidationResult<AdminInvitePayload> {
  const body = asRecord(input);
  const worldId = asString(body.worldId ?? body.world_id);
  const code = normalizeInviteCode(body.code);
  const maxUses = asNumber(body.maxUses ?? body.max_uses ?? 1);
  const expiresAt = asString(body.expiresAt ?? body.expires_at);
  const reason = normalizeAdminReason(body.reason);
  const errors: string[] = [];

  if (code && code.length > adminInviteCodeMaxLength) {
    errors.push("invite codeは80文字以内にしてください。");
  }

  if (!Number.isInteger(maxUses) || maxUses < 1) {
    errors.push("maxUsesは1以上の整数で指定してください。");
  }

  if (expiresAt && Number.isNaN(new Date(expiresAt).getTime())) {
    errors.push("expiresAtが不正です。");
  }

  pushReasonErrors(reason, errors);

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      worldId: worldId || null,
      code,
      maxUses,
      expiresAt: expiresAt || null,
      reason
    }
  };
}
