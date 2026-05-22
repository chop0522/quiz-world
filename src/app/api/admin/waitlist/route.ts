import { NextResponse } from "next/server";
import {
  adminContextErrorResponse,
  getAdminContext,
  toNumber
} from "@/lib/phase7-admin";
import { isAdminWaitlistStatus } from "@/lib/phase7-validation";

type WaitlistRow = {
  id: string;
  email: string;
  display_name: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export async function GET(request: Request) {
  try {
    const adminContext = await getAdminContext();

    if (!adminContext.ok) {
      return adminContextErrorResponse(adminContext);
    }

    const url = new URL(request.url);
    const statusParam = url.searchParams.get("status") ?? "";
    const limit = Math.min(Math.max(toNumber(url.searchParams.get("limit"), 50), 1), 100);
    let query = adminContext.admin
      .from("waitlist")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (isAdminWaitlistStatus(statusParam)) {
      query = query.eq("status", statusParam);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      ok: true,
      waitlist: ((data as WaitlistRow[] | null) ?? []).map((item) => ({
        id: item.id,
        email: item.email,
        displayName: item.display_name,
        status: item.status,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }))
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        errors: [
          error instanceof Error ? error.message : "waitlist一覧の取得に失敗しました。"
        ]
      },
      { status: 500 }
    );
  }
}
