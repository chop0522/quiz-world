export const initialInviteCode = "SEASON0-TEST-001";
export const notificationPhase = "polling" as const;

export type SignupPayload = {
  email: string;
  password: string;
  displayName: string;
  inviteCode: string;
  ageConfirmed: boolean;
  termsAccepted: boolean;
  privacyAccepted: boolean;
};

export type WaitlistPayload = {
  email: string;
  displayName: string;
};

export type ValidationResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      errors: string[];
    };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asBoolean(value: unknown): boolean {
  return value === true;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeInviteCode(code: string): string {
  return code.trim().toUpperCase();
}

export function parseAdminEmails(raw: string | undefined): string[] {
  if (!raw) {
    return [];
  }

  return raw
    .split(",")
    .map((email) => normalizeEmail(email))
    .filter(Boolean);
}

export function isAdminEmail(email: string, adminEmails: string[]): boolean {
  return adminEmails.includes(normalizeEmail(email));
}

export function validateSignupPayload(input: unknown): ValidationResult<SignupPayload> {
  const body = typeof input === "object" && input !== null ? input as Record<string, unknown> : {};
  const email = normalizeEmail(asString(body.email));
  const password = asString(body.password);
  const displayName = asString(body.displayName);
  const inviteCode = normalizeInviteCode(asString(body.inviteCode));
  const ageConfirmed = asBoolean(body.ageConfirmed);
  const termsAccepted = asBoolean(body.termsAccepted);
  const privacyAccepted = asBoolean(body.privacyAccepted);
  const errors: string[] = [];

  if (!emailPattern.test(email)) {
    errors.push("メールアドレスの形式が正しくありません。");
  }

  if (password.length < 8) {
    errors.push("パスワードは8文字以上にしてください。");
  }

  if (displayName.length < 1 || displayName.length > 40) {
    errors.push("表示名は1〜40文字で入力してください。");
  }

  if (!inviteCode) {
    errors.push("招待コードは必須です。");
  }

  if (!ageConfirmed) {
    errors.push("18歳以上確認が必要です。");
  }

  if (!termsAccepted) {
    errors.push("利用規約への同意が必要です。");
  }

  if (!privacyAccepted) {
    errors.push("プライバシーポリシーへの同意が必要です。");
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      email,
      password,
      displayName,
      inviteCode,
      ageConfirmed,
      termsAccepted,
      privacyAccepted
    }
  };
}

export function validateWaitlistPayload(input: unknown): ValidationResult<WaitlistPayload> {
  const body = typeof input === "object" && input !== null ? input as Record<string, unknown> : {};
  const email = normalizeEmail(asString(body.email));
  const displayName = asString(body.displayName);
  const errors: string[] = [];

  if (!emailPattern.test(email)) {
    errors.push("メールアドレスの形式が正しくありません。");
  }

  if (displayName.length < 1 || displayName.length > 40) {
    errors.push("表示名は1〜40文字で入力してください。");
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      email,
      displayName
    }
  };
}
