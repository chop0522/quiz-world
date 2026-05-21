import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type ProfileRow = {
  id: string;
  display_name: string;
  role: string;
  status: string;
  age_confirmed_at: string;
  terms_accepted_at: string;
  privacy_accepted_at: string;
};

type WorldMemberRow = {
  world_id: string;
  role: string;
  status: string;
  joined_at: string;
};

export async function GET() {
  try {
    const server = await getSupabaseServerClient();
    const {
      data: { user },
      error: userError
    } = await server.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { ok: false, errors: ["ログインが必要です。"] },
        { status: 401 }
      );
    }

    const admin = getSupabaseAdminClient();
    const { data: profileData, error: profileError } = await admin
      .from("profiles")
      .select("id,display_name,role,status,age_confirmed_at,terms_accepted_at,privacy_accepted_at")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    const profile = profileData as ProfileRow | null;

    if (!profile) {
      return NextResponse.json(
        { ok: false, errors: ["profileが未作成です。"] },
        { status: 404 }
      );
    }

    const { data: memberData, error: memberError } = await admin
      .from("world_members")
      .select("world_id,role,status,joined_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (memberError) {
      throw memberError;
    }

    const member = memberData as WorldMemberRow | null;

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email
      },
      profile: {
        id: profile.id,
        displayName: profile.display_name,
        role: profile.role,
        status: profile.status,
        ageConfirmedAt: profile.age_confirmed_at,
        termsAcceptedAt: profile.terms_accepted_at,
        privacyAcceptedAt: profile.privacy_accepted_at
      },
      worldMember: member
        ? {
            worldId: member.world_id,
            role: member.role,
            status: member.status,
            joinedAt: member.joined_at
          }
        : null
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        errors: [
          error instanceof Error ? error.message : "profile取得に失敗しました。"
        ]
      },
      { status: 500 }
    );
  }
}
