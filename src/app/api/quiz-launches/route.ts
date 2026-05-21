import { NextResponse } from "next/server";
import {
  createLaunchInsert,
  getDailyLaunchCount,
  getLaunchAccess,
  getLaunchableQuestion,
  getLaunchLimits,
  getRecipientCandidates,
  launchAccessErrorMessage,
  selectRecipients,
  toLaunchListResponse,
  type LaunchAuthorMeta,
  type LaunchQuestionMeta,
  type QuizLaunchRow,
  type QuizRecipientRow
} from "@/lib/phase3-data";
import { validateQuizLaunchPayload } from "@/lib/phase3-validation";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

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

async function buildLaunchResponses({
  launches,
  recipientsByLaunchId = new Map(),
  now = new Date()
}: {
  launches: QuizLaunchRow[];
  recipientsByLaunchId?: Map<string, QuizRecipientRow>;
  now?: Date;
}) {
  if (launches.length === 0) {
    return [];
  }

  const admin = getSupabaseAdminClient();
  const questionIds = [...new Set(launches.map((launch) => launch.question_id))];
  const authorIds = [...new Set(launches.map((launch) => launch.author_id))];

  const { data: questionData, error: questionError } = await admin
    .from("questions")
    .select("id,category,difficulty")
    .in("id", questionIds);

  if (questionError) {
    throw questionError;
  }

  const { data: authorData, error: authorError } = await admin
    .from("profiles")
    .select("id,display_name")
    .in("id", authorIds);

  if (authorError) {
    throw authorError;
  }

  const questions = new Map(
    ((questionData as LaunchQuestionMeta[] | null) ?? [])
      .map((question) => [question.id, question])
  );
  const authors = new Map(
    ((authorData as LaunchAuthorMeta[] | null) ?? [])
      .map((author) => [author.id, author])
  );

  return launches
    .map((launch) => {
      const question = questions.get(launch.question_id);
      const author = authors.get(launch.author_id);

      if (!question || !author) {
        return null;
      }

      return toLaunchListResponse({
        launch,
        question,
        author,
        notificationStatus: recipientsByLaunchId.get(launch.id)?.notification_status,
        now
      });
    })
    .filter((launch): launch is NonNullable<typeof launch> => launch !== null);
}

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, errors: ["ログインが必要です。"] },
        { status: 401 }
      );
    }

    const admin = getSupabaseAdminClient();
    const access = await getLaunchAccess(admin, user.id);

    if (!access.ok) {
      return NextResponse.json(
        { ok: false, errors: [launchAccessErrorMessage(access.reason)] },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const scope = url.searchParams.get("scope") === "authored"
      ? "authored"
      : "received";

    if (scope === "authored") {
      const { data, error } = await admin
        .from("quiz_launches")
        .select("*")
        .eq("author_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        throw error;
      }

      return NextResponse.json({
        ok: true,
        scope,
        launches: await buildLaunchResponses({
          launches: (data as QuizLaunchRow[] | null) ?? []
        })
      });
    }

    const { data: recipientData, error: recipientError } = await admin
      .from("quiz_recipients")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (recipientError) {
      throw recipientError;
    }

    const recipients = (recipientData as QuizRecipientRow[] | null) ?? [];

    if (recipients.length === 0) {
      return NextResponse.json({ ok: true, scope, launches: [] });
    }

    const launchIds = recipients.map((recipient) => recipient.launch_id);
    const { data: launchData, error: launchError } = await admin
      .from("quiz_launches")
      .select("*")
      .in("id", launchIds)
      .order("created_at", { ascending: false });

    if (launchError) {
      throw launchError;
    }

    const recipientsByLaunchId = new Map(
      recipients.map((recipient) => [recipient.launch_id, recipient])
    );

    return NextResponse.json({
      ok: true,
      scope,
      launches: await buildLaunchResponses({
        launches: (launchData as QuizLaunchRow[] | null) ?? [],
        recipientsByLaunchId
      })
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        errors: [
          error instanceof Error ? error.message : "launch一覧の取得に失敗しました。"
        ]
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, errors: ["ログインが必要です。"] },
        { status: 401 }
      );
    }

    const rawBody = await readJsonBody(request);
    const parsed = validateQuizLaunchPayload(rawBody);

    if (!parsed.ok) {
      return NextResponse.json(
        { ok: false, errors: parsed.errors },
        { status: rawBody === null ? 400 : 422 }
      );
    }

    const admin = getSupabaseAdminClient();
    const access = await getLaunchAccess(admin, user.id);

    if (!access.ok) {
      return NextResponse.json(
        { ok: false, errors: [launchAccessErrorMessage(access.reason)] },
        { status: 403 }
      );
    }

    const questionResult = await getLaunchableQuestion(
      admin,
      parsed.data.questionId,
      user.id
    );

    if (!questionResult.ok) {
      if (questionResult.reason === "not_found") {
        return NextResponse.json(
          { ok: false, errors: ["出題できる問題が見つかりません。"] },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { ok: false, errors: ["activeな問題だけ出題できます。"] },
        { status: 422 }
      );
    }

    const now = new Date();
    const limits = getLaunchLimits(access.profile.questioner_rank);
    const dailyLaunchCount = await getDailyLaunchCount(admin, user.id, now);

    if (dailyLaunchCount >= limits.dailyLaunchLimit) {
      return NextResponse.json(
        {
          ok: false,
          errors: ["今日の出題回数上限に達しています。"],
          dailyLaunchLimit: limits.dailyLaunchLimit,
          dailyLaunchCount
        },
        { status: 422 }
      );
    }

    const candidates = await getRecipientCandidates(
      admin,
      access.worldMember.world_id,
      user.id
    );

    if (candidates.length === 0) {
      return NextResponse.json(
        { ok: false, errors: ["配信対象者がいません。"] },
        { status: 409 }
      );
    }

    const recipients = selectRecipients(candidates, limits.recipientLimit);
    const launchInsert = createLaunchInsert({
      questionId: questionResult.question.id,
      authorId: user.id,
      worldId: access.worldMember.world_id,
      recipientCount: recipients.length,
      now
    });

    const { data: launchData, error: launchError } = await admin
      .from("quiz_launches")
      .insert(launchInsert)
      .select("*")
      .single();

    if (launchError || !launchData) {
      throw launchError ?? new Error("launch作成に失敗しました。");
    }

    const launch = launchData as QuizLaunchRow;
    const recipientRows = recipients.map((recipient) => ({
      launch_id: launch.id,
      user_id: recipient.userId,
      notification_status: "in_app_ready",
      notified_at: now.toISOString()
    }));

    const { data: createdRecipients, error: recipientsError } = await admin
      .from("quiz_recipients")
      .insert(recipientRows)
      .select("*");

    if (recipientsError) {
      await admin.from("quiz_launches").delete().eq("id", launch.id);
      throw recipientsError;
    }

    return NextResponse.json(
      {
        ok: true,
        launch: {
          id: launch.id,
          questionId: launch.question_id,
          authorId: launch.author_id,
          worldId: launch.world_id,
          recipientCount: launch.recipient_count,
          startAt: launch.start_at,
          endAt: launch.end_at,
          status: launch.status
        },
        recipients: ((createdRecipients as QuizRecipientRow[] | null) ?? [])
          .map((recipient) => ({
            userId: recipient.user_id,
            notificationStatus: recipient.notification_status
          }))
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        errors: [
          error instanceof Error ? error.message : "launch作成に失敗しました。"
        ]
      },
      { status: 500 }
    );
  }
}
