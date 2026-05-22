import { NextResponse } from "next/server";
import {
  answerStatusHttpStatus,
  answerStatusMessage,
  isSubmitAnswerStatus,
  validateAnswerPayload
} from "@/lib/phase4-validation";
import type { SubmitAnswerRpcResponse } from "@/lib/phase4-data";
import type { ApplyRankEventsRpcResponse } from "@/lib/phase6-data";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

async function getAuthenticatedUser() {
  const server = await getSupabaseServerClient();
  const {
    data: { user },
    error
  } = await server.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

async function readJsonBody(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, errors: ["ログインが必要です。"] },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const rawBody = await readJsonBody(request);
    const parsed = validateAnswerPayload(rawBody);

    if (!parsed.ok) {
      return NextResponse.json(
        { ok: false, errors: parsed.errors },
        { status: rawBody === null ? 400 : 422 }
      );
    }

    const server = await getSupabaseServerClient();
    const { data, error } = await server.rpc("submit_quiz_answer", {
      p_launch_id: id,
      p_choice_id: parsed.data.choiceId
    });

    if (error) {
      throw error;
    }

    const result = data as SubmitAnswerRpcResponse | null;
    const statusValue = typeof result?.status === "string" ? result.status : "";

    if (!isSubmitAnswerStatus(statusValue)) {
      throw new Error("回答処理の結果が不正です。");
    }

    const httpStatus = answerStatusHttpStatus(statusValue);

    if (statusValue !== "answered") {
      return NextResponse.json(
        {
          ok: false,
          status: statusValue,
          errors: [answerStatusMessage(statusValue)]
        },
        { status: httpStatus }
      );
    }

    if (!result?.answer) {
      throw new Error("回答結果を取得できませんでした。");
    }

    const { data: rankEventData, error: rankEventError } = await server.rpc(
      "apply_answer_rank_events",
      {
        p_answer_id: result.answer.id
      }
    );

    if (rankEventError) {
      throw rankEventError;
    }

    return NextResponse.json(
      {
        ok: true,
        status: statusValue,
        answer: result.answer,
        rankEvents: rankEventData as ApplyRankEventsRpcResponse | null
      },
      { status: httpStatus }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        errors: [
          error instanceof Error ? error.message : "回答送信に失敗しました。"
        ]
      },
      { status: 500 }
    );
  }
}
