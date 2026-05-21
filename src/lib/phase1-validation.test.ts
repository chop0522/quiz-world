import { describe, expect, it } from "vitest";
import {
  isAdminEmail,
  normalizeEmail,
  normalizeInviteCode,
  parseAdminEmails,
  validateSignupPayload,
  validateWaitlistPayload
} from "@/lib/phase1-validation";

describe("phase1 validation", () => {
  it("normalizes email and invite code", () => {
    expect(normalizeEmail(" Admin@Example.COM ")).toBe("admin@example.com");
    expect(normalizeInviteCode(" season0-test-001 ")).toBe("SEASON0-TEST-001");
  });

  it("detects admin email from ADMIN_EMAILS-style values", () => {
    const adminEmails = parseAdminEmails("admin@example.com, owner@example.com");

    expect(isAdminEmail("ADMIN@example.com", adminEmails)).toBe(true);
    expect(isAdminEmail("user@example.com", adminEmails)).toBe(false);
  });

  it("rejects signup without age and legal consent", () => {
    const result = validateSignupPayload({
      email: "user@example.com",
      password: "password123",
      displayName: "user",
      inviteCode: "SEASON0-TEST-001",
      ageConfirmed: false,
      termsAccepted: false,
      privacyAccepted: false
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain("18歳以上確認が必要です。");
      expect(result.errors).toContain("利用規約への同意が必要です。");
      expect(result.errors).toContain("プライバシーポリシーへの同意が必要です。");
    }
  });

  it("accepts a valid signup payload", () => {
    const result = validateSignupPayload({
      email: "user@example.com",
      password: "password123",
      displayName: "user",
      inviteCode: "season0-test-001",
      ageConfirmed: true,
      termsAccepted: true,
      privacyAccepted: true
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.inviteCode).toBe("SEASON0-TEST-001");
    }
  });

  it("deduplicates waitlist emails by normalized value", () => {
    const result = validateWaitlistPayload({
      email: " Wait@Example.COM ",
      displayName: "wait_user"
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.email).toBe("wait@example.com");
    }
  });
});
