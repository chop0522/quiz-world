import { NextResponse } from "next/server";
import { getAdminEmails } from "@/lib/env";
import { getInviteAvailability } from "@/lib/phase1-data";
import {
  isAdminEmail,
  validateSignupPayload
} from "@/lib/phase1-validation";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type CompleteSignupResult = {
  status: "joined" | "waitlist_required" | "invalid_invite" | "world_unavailable" | "profile_exists" | "validation_error";
  worldId?: string;
  role?: "user" | "admin";
  memberLimit?: number;
  activeMemberCount?: number;
};

async function deleteAuthUser(userId: string) {
  const admin = getSupabaseAdminClient();
  await admin.auth.admin.deleteUser(userId);
}

export async function POST(request: Request) {
  let createdUserId: string | null = null;

  try {
    const parsed = validateSignupPayload(await request.json());

    if (!parsed.ok) {
      return NextResponse.json(
        { ok: false, errors: parsed.errors },
        { status: 422 }
      );
    }

    const admin = getSupabaseAdminClient();
    const inviteAvailability = await getInviteAvailability(
      admin,
      parsed.data.inviteCode
    );

    if (!inviteAvailability.valid) {
      return NextResponse.json(
        {
          ok: false,
          status:
            inviteAvailability.reason === "full"
              ? "waitlist_required"
              : "invalid_invite",
          reason: inviteAvailability.reason,
          errors:
            inviteAvailability.reason === "full"
              ? ["参加枠が満員です。waitlistに登録してください。"]
              : ["招待コードが無効です。"],
          world: inviteAvailability.world ?? null,
          activeMemberCount: inviteAvailability.activeMemberCount ?? null,
          remainingSeats: inviteAvailability.remainingSeats ?? null
        },
        { status: inviteAvailability.reason === "full" ? 409 : 422 }
      );
    }

    const { data: createdUser, error: createUserError } =
      await admin.auth.admin.createUser({
        email: parsed.data.email,
        password: parsed.data.password,
        email_confirm: true,
        user_metadata: {
          display_name: parsed.data.displayName
        }
      });

    if (createUserError || !createdUser.user) {
      return NextResponse.json(
        {
          ok: false,
          errors: [
            createUserError?.message ?? "Authユーザー作成に失敗しました。"
          ]
        },
        { status: createUserError?.status === 422 ? 409 : 400 }
      );
    }

    createdUserId = createdUser.user.id;

    const { data: completeData, error: completeError } = await admin.rpc(
      "complete_signup",
      {
        p_user_id: createdUserId,
        p_email: parsed.data.email,
        p_display_name: parsed.data.displayName,
        p_invite_code: parsed.data.inviteCode,
        p_is_admin: isAdminEmail(parsed.data.email, getAdminEmails()),
        p_age_confirmed: parsed.data.ageConfirmed,
        p_terms_accepted: parsed.data.termsAccepted,
        p_privacy_accepted: parsed.data.privacyAccepted
      }
    );

    if (completeError) {
      await deleteAuthUser(createdUserId);
      createdUserId = null;
      throw completeError;
    }

    const complete = completeData as CompleteSignupResult;

    if (complete.status !== "joined") {
      await deleteAuthUser(createdUserId);
      createdUserId = null;

      return NextResponse.json(
        {
          ok: false,
          status: complete.status,
          errors:
            complete.status === "waitlist_required"
              ? ["参加枠が満員です。waitlistに登録してください。"]
              : ["登録条件を満たしていません。"],
          worldId: complete.worldId,
          memberLimit: complete.memberLimit,
          activeMemberCount: complete.activeMemberCount
        },
        { status: complete.status === "waitlist_required" ? 409 : 422 }
      );
    }

    let signedIn = false;

    try {
      const server = await getSupabaseServerClient();
      const { error: signInError } = await server.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password
      });
      signedIn = !signInError;
    } catch {
      signedIn = false;
    }

    return NextResponse.json(
      {
        ok: true,
        signedIn,
        profile: {
          id: createdUserId,
          email: parsed.data.email,
          displayName: parsed.data.displayName,
          role: complete.role
        },
        world: {
          id: complete.worldId,
          memberLimit: complete.memberLimit,
          activeMemberCount: complete.activeMemberCount
        }
      },
      { status: 201 }
    );
  } catch (error) {
    if (createdUserId) {
      await deleteAuthUser(createdUserId);
    }

    return NextResponse.json(
      {
        ok: false,
        errors: [
          error instanceof Error ? error.message : "signupに失敗しました。"
        ]
      },
      { status: 500 }
    );
  }
}
