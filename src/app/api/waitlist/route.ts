import { NextResponse } from "next/server";
import { validateWaitlistPayload } from "@/lib/phase1-validation";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type WaitlistRow = {
  id: string;
  email: string;
  display_name: string;
  status: string;
};

export async function POST(request: Request) {
  try {
    const parsed = validateWaitlistPayload(await request.json());

    if (!parsed.ok) {
      return NextResponse.json(
        { ok: false, errors: parsed.errors },
        { status: 422 }
      );
    }

    const admin = getSupabaseAdminClient();
    const { data, error } = await admin
      .from("waitlist")
      .insert({
        email: parsed.data.email,
        display_name: parsed.data.displayName,
        status: "waiting"
      })
      .select("id,email,display_name,status")
      .single();

    if (!error) {
      const row = data as WaitlistRow;
      return NextResponse.json(
        {
          ok: true,
          status: "created",
          waitlist: {
            id: row.id,
            email: row.email,
            displayName: row.display_name,
            status: row.status
          }
        },
        { status: 201 }
      );
    }

    if (error.code === "23505") {
      const { data: existing, error: existingError } = await admin
        .from("waitlist")
        .select("id,email,display_name,status")
        .eq("email", parsed.data.email)
        .single();

      if (existingError) {
        throw existingError;
      }

      const row = existing as WaitlistRow;
      return NextResponse.json({
        ok: true,
        status: "already_exists",
        waitlist: {
          id: row.id,
          email: row.email,
          displayName: row.display_name,
          status: row.status
        }
      });
    }

    throw error;
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        errors: [
          error instanceof Error
            ? error.message
            : "waitlist登録に失敗しました。"
        ]
      },
      { status: 500 }
    );
  }
}
