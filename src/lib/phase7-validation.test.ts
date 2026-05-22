import { describe, expect, it } from "vitest";
import {
  normalizeInviteCode,
  validateAdminInvitePayload,
  validateAdminQuestionModerationPayload,
  validateAdminReportStatusPayload,
  validateAdminUserSuspendPayload,
  validateAdminWaitlistStatusPayload
} from "@/lib/phase7-validation";

describe("phase7 admin validation", () => {
  it("normalizes invite codes to uppercase", () => {
    expect(normalizeInviteCode(" season0-test ")).toBe("SEASON0-TEST");
    expect(normalizeInviteCode(" ")).toBeNull();
  });

  it("validates report status updates with a required reason", () => {
    const valid = validateAdminReportStatusPayload({
      status: "reviewing",
      reason: "確認を開始"
    });

    expect(valid.ok).toBe(true);

    const invalid = validateAdminReportStatusPayload({
      status: "open",
      reason: ""
    });

    expect(invalid.ok).toBe(false);
    if (!invalid.ok) {
      expect(invalid.errors).toContain(
        "report statusはreviewing/resolved/dismissedのいずれかです。"
      );
      expect(invalid.errors).toContain("reasonは必須です。");
    }
  });

  it("allows only review_required or suspended question moderation", () => {
    expect(validateAdminQuestionModerationPayload({
      status: "review_required",
      reason: "通報2件",
      reportId: "report-id"
    }).ok).toBe(true);

    const invalid = validateAdminQuestionModerationPayload({
      status: "active",
      reason: "戻す"
    });

    expect(invalid.ok).toBe(false);
  });

  it("requires a reason for user suspension", () => {
    expect(validateAdminUserSuspendPayload({ reason: "不適切投稿が多い" }).ok)
      .toBe(true);
    expect(validateAdminUserSuspendPayload({ reason: "" }).ok).toBe(false);
  });

  it("requires reason only for rejected waitlist status", () => {
    expect(validateAdminWaitlistStatusPayload({
      status: "invited",
      reason: ""
    }).ok).toBe(true);

    const rejected = validateAdminWaitlistStatusPayload({
      status: "rejected",
      reason: ""
    });

    expect(rejected.ok).toBe(false);
    if (!rejected.ok) {
      expect(rejected.errors).toContain("reasonは必須です。");
    }
  });

  it("validates invite payload and keeps optional code", () => {
    const valid = validateAdminInvitePayload({
      code: " season0-abc123 ",
      maxUses: "2",
      reason: "10人テスト招待"
    });

    expect(valid.ok).toBe(true);
    if (valid.ok) {
      expect(valid.data.code).toBe("SEASON0-ABC123");
      expect(valid.data.maxUses).toBe(2);
    }

    const generated = validateAdminInvitePayload({
      maxUses: 1,
      reason: "server生成"
    });

    expect(generated.ok).toBe(true);
    if (generated.ok) {
      expect(generated.data.code).toBeNull();
    }
  });
});
