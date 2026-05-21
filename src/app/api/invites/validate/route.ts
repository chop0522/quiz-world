import { NextResponse } from "next/server";
import { getInviteAvailability } from "@/lib/phase1-data";
import { normalizeInviteCode } from "@/lib/phase1-validation";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const inviteCode = normalizeInviteCode(
      typeof body?.inviteCode === "string" ? body.inviteCode : ""
    );

    if (!inviteCode) {
      return NextResponse.json(
        { valid: false, errors: ["招待コードは必須です。"] },
        { status: 422 }
      );
    }

    const availability = await getInviteAvailability(
      getSupabaseAdminClient(),
      inviteCode
    );

    if (!availability.valid) {
      return NextResponse.json(
        {
          valid: false,
          reason: availability.reason,
          world: availability.world ?? null,
          activeMemberCount: availability.activeMemberCount ?? null,
          remainingSeats: availability.remainingSeats ?? null
        },
        { status: availability.reason === "full" ? 409 : 404 }
      );
    }

    return NextResponse.json({
      valid: true,
      world: {
        id: availability.world.id,
        name: availability.world.name,
        memberLimit: availability.world.member_limit,
        currentSeason: availability.world.current_season
      },
      activeMemberCount: availability.activeMemberCount,
      remainingSeats: availability.remainingSeats
    });
  } catch (error) {
    return NextResponse.json(
      {
        valid: false,
        errors: [
          error instanceof Error
            ? error.message
            : "招待コード検証に失敗しました。"
        ]
      },
      { status: 500 }
    );
  }
}
