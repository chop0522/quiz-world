import type { SupabaseClient } from "@supabase/supabase-js";
import { getQuizWorldId } from "@/lib/env";
import { normalizeInviteCode } from "@/lib/phase1-validation";

export type WorldRow = {
  id: string;
  name: string;
  member_limit: number;
  current_season: number;
  status: string;
};

export type InviteRow = {
  id: string;
  world_id: string;
  code: string;
  status: string;
  max_uses: number;
  use_count: number;
  expires_at: string | null;
};

export type InviteAvailability =
  | {
      valid: true;
      invite: InviteRow;
      world: WorldRow;
      activeMemberCount: number;
      remainingSeats: number;
    }
  | {
      valid: false;
      reason: "missing" | "inactive" | "expired" | "used" | "world_unavailable" | "full";
      world?: WorldRow;
      activeMemberCount?: number;
      remainingSeats?: number;
    };

export async function getActiveWorld(client: SupabaseClient): Promise<{
  world: WorldRow | null;
  activeMemberCount: number;
}> {
  const configuredWorldId = getQuizWorldId();
  let query = client
    .from("worlds")
    .select("id,name,member_limit,current_season,status")
    .eq("status", "active")
    .limit(1);

  if (configuredWorldId) {
    query = query.eq("id", configuredWorldId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw error;
  }

  const world = data as WorldRow | null;

  if (!world) {
    return { world: null, activeMemberCount: 0 };
  }

  const { count, error: countError } = await client
    .from("world_members")
    .select("id", { count: "exact", head: true })
    .eq("world_id", world.id)
    .eq("status", "active");

  if (countError) {
    throw countError;
  }

  return {
    world,
    activeMemberCount: count ?? 0
  };
}

export async function getInviteAvailability(
  client: SupabaseClient,
  code: string
): Promise<InviteAvailability> {
  const normalizedCode = normalizeInviteCode(code);

  if (!normalizedCode) {
    return { valid: false, reason: "missing" };
  }

  const { data: inviteData, error: inviteError } = await client
    .from("invites")
    .select("id,world_id,code,status,max_uses,use_count,expires_at")
    .eq("code", normalizedCode)
    .maybeSingle();

  if (inviteError) {
    throw inviteError;
  }

  const invite = inviteData as InviteRow | null;

  if (!invite) {
    return { valid: false, reason: "missing" };
  }

  if (invite.status !== "active") {
    return { valid: false, reason: "inactive" };
  }

  if (invite.expires_at && new Date(invite.expires_at).getTime() <= Date.now()) {
    return { valid: false, reason: "expired" };
  }

  if (invite.use_count >= invite.max_uses) {
    return { valid: false, reason: "used" };
  }

  const { data: worldData, error: worldError } = await client
    .from("worlds")
    .select("id,name,member_limit,current_season,status")
    .eq("id", invite.world_id)
    .maybeSingle();

  if (worldError) {
    throw worldError;
  }

  const world = worldData as WorldRow | null;

  if (!world || world.status !== "active") {
    return { valid: false, reason: "world_unavailable" };
  }

  const { count, error: countError } = await client
    .from("world_members")
    .select("id", { count: "exact", head: true })
    .eq("world_id", world.id)
    .eq("status", "active");

  if (countError) {
    throw countError;
  }

  const activeMemberCount = count ?? 0;
  const remainingSeats = Math.max(world.member_limit - activeMemberCount, 0);

  if (activeMemberCount >= world.member_limit) {
    return {
      valid: false,
      reason: "full",
      world,
      activeMemberCount,
      remainingSeats
    };
  }

  return {
    valid: true,
    invite,
    world,
    activeMemberCount,
    remainingSeats
  };
}
