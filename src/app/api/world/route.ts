import { NextResponse } from "next/server";
import { getActiveWorld } from "@/lib/phase1-data";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const { world, activeMemberCount } = await getActiveWorld(
      getSupabaseAdminClient()
    );

    if (!world) {
      return NextResponse.json(
        { ok: false, errors: ["active worldが見つかりません。"] },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      world: {
        id: world.id,
        name: world.name,
        memberLimit: world.member_limit,
        currentSeason: world.current_season,
        status: world.status,
        activeMemberCount,
        remainingSeats: Math.max(world.member_limit - activeMemberCount, 0)
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        errors: [
          error instanceof Error ? error.message : "world取得に失敗しました。"
        ]
      },
      { status: 500 }
    );
  }
}
