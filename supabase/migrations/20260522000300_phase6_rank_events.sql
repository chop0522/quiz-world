create table if not exists public.rank_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (
    type in (
      'answer_correct',
      'answer_correct_rank_bonus',
      'answer_difficulty_bonus',
      'question_rating',
      'question_reason_penalty',
      'question_quality_bonus',
      'question_participation_bonus',
      'moderation_adjustment'
    )
  ),
  points integer not null check (points <> 0),
  reason text not null,
  source_type text not null check (
    source_type in ('answer', 'rating', 'launch_summary', 'moderation')
  ),
  source_id uuid not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, type, source_type, source_id)
);

create index if not exists rank_events_user_created_idx
on public.rank_events(user_id, created_at desc);

create index if not exists rank_events_source_idx
on public.rank_events(source_type, source_id);

create index if not exists rank_events_type_created_idx
on public.rank_events(type, created_at desc);

create index if not exists profiles_answer_rank_score_idx
on public.profiles(answer_rank, answer_score);

create index if not exists profiles_questioner_rank_score_idx
on public.profiles(questioner_rank, questioner_score);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_answer_score_nonnegative'
  ) then
    alter table public.profiles
    add constraint profiles_answer_score_nonnegative
    check (answer_score >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_questioner_score_nonnegative'
  ) then
    alter table public.profiles
    add constraint profiles_questioner_score_nonnegative
    check (questioner_score >= 0);
  end if;
end;
$$;

create or replace function public.answer_rank_from_score(p_score integer)
returns integer
language sql
immutable
as $$
  select case
    when greatest(coalesce(p_score, 0), 0) >= 200 then 4
    when greatest(coalesce(p_score, 0), 0) >= 100 then 3
    when greatest(coalesce(p_score, 0), 0) >= 50 then 2
    when greatest(coalesce(p_score, 0), 0) >= 20 then 1
    else 0
  end;
$$;

create or replace function public.questioner_rank_from_score(p_score integer)
returns integer
language sql
immutable
as $$
  select case
    when greatest(coalesce(p_score, 0), 0) >= 150 then 4
    when greatest(coalesce(p_score, 0), 0) >= 70 then 3
    when greatest(coalesce(p_score, 0), 0) >= 30 then 2
    when greatest(coalesce(p_score, 0), 0) >= 10 then 1
    else 0
  end;
$$;

create or replace function public.recalculate_profile_rank(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_id uuid;
  v_profile public.profiles%rowtype;
  v_answer_score integer;
  v_questioner_score integer;
  v_answer_rank integer;
  v_questioner_rank integer;
begin
  v_caller_id := auth.uid();

  if p_user_id is null then
    return jsonb_build_object('status', 'validation_error');
  end if;

  if coalesce(auth.role(), '') <> 'service_role' then
    if v_caller_id is null then
      return jsonb_build_object('status', 'auth_required');
    end if;

    if v_caller_id <> p_user_id and not exists (
      select 1
      from public.profiles
      where id = v_caller_id
        and role = 'admin'
        and status = 'active'
    ) then
      return jsonb_build_object('status', 'not_allowed');
    end if;
  end if;

  select *
  into v_profile
  from public.profiles
  where id = p_user_id
  for update;

  if not found then
    return jsonb_build_object('status', 'profile_not_found');
  end if;

  v_answer_score := greatest(v_profile.answer_score, 0);
  v_questioner_score := greatest(v_profile.questioner_score, 0);
  v_answer_rank := public.answer_rank_from_score(v_answer_score);
  v_questioner_rank := public.questioner_rank_from_score(v_questioner_score);

  update public.profiles
  set
    answer_score = v_answer_score,
    questioner_score = v_questioner_score,
    answer_rank = v_answer_rank,
    questioner_rank = v_questioner_rank,
    updated_at = now()
  where id = v_profile.id;

  return jsonb_build_object(
    'status', 'recalculated',
    'answerScore', v_answer_score,
    'answerRank', v_answer_rank,
    'questionerScore', v_questioner_score,
    'questionerRank', v_questioner_rank
  );
end;
$$;

create or replace function public.apply_answer_rank_events(p_answer_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_id uuid;
  v_answer public.answers%rowtype;
  v_launch public.quiz_launches%rowtype;
  v_question public.questions%rowtype;
  v_profile public.profiles%rowtype;
  v_event_ids uuid[] := '{}'::uuid[];
  v_events_created integer := 0;
  v_points integer := 0;
  v_old_score integer := 0;
  v_new_score integer := 0;
  v_old_rank integer := 0;
  v_new_rank integer := 0;
begin
  v_caller_id := auth.uid();

  if p_answer_id is null then
    return jsonb_build_object('status', 'validation_error');
  end if;

  if coalesce(auth.role(), '') <> 'service_role' and v_caller_id is null then
    return jsonb_build_object('status', 'auth_required');
  end if;

  select *
  into v_answer
  from public.answers
  where id = p_answer_id;

  if not found then
    return jsonb_build_object('status', 'answer_not_found');
  end if;

  if coalesce(auth.role(), '') <> 'service_role'
    and v_answer.user_id <> v_caller_id
    and not exists (
      select 1
      from public.profiles
      where id = v_caller_id
        and role = 'admin'
        and status = 'active'
    ) then
    return jsonb_build_object('status', 'not_allowed');
  end if;

  select *
  into v_launch
  from public.quiz_launches
  where id = v_answer.launch_id;

  if not found then
    return jsonb_build_object('status', 'launch_not_found');
  end if;

  select *
  into v_question
  from public.questions
  where id = v_launch.question_id;

  if not found then
    return jsonb_build_object('status', 'question_not_found');
  end if;

  select *
  into v_profile
  from public.profiles
  where id = v_answer.user_id
  for update;

  if not found then
    return jsonb_build_object('status', 'profile_not_found');
  end if;

  if v_profile.status <> 'active' then
    return jsonb_build_object('status', 'profile_inactive');
  end if;

  if not v_answer.is_correct then
    return jsonb_build_object(
      'status', 'no_events',
      'points', 0,
      'eventsCreated', 0,
      'answerScore', greatest(v_profile.answer_score, 0),
      'answerRank', public.answer_rank_from_score(greatest(v_profile.answer_score, 0))
    );
  end if;

  v_old_score := greatest(v_profile.answer_score, 0);
  v_old_rank := public.answer_rank_from_score(v_old_score);

  with event_candidates as (
    select
      'answer_correct'::text as event_type,
      3::integer as event_points,
      '正解'::text as event_reason,
      jsonb_build_object(
        'answerId', v_answer.id,
        'launchId', v_answer.launch_id,
        'questionId', v_question.id,
        'choiceId', v_answer.choice_id,
        'correctRank', v_answer.correct_rank,
        'difficulty', v_question.difficulty
      ) as event_metadata
    union all
    select
      'answer_correct_rank_bonus'::text,
      case v_answer.correct_rank
        when 1 then 3
        when 2 then 2
        when 3 then 1
        else 0
      end,
      '正解者順位ボーナス'::text,
      jsonb_build_object(
        'answerId', v_answer.id,
        'launchId', v_answer.launch_id,
        'questionId', v_question.id,
        'correctRank', v_answer.correct_rank
      )
    where v_answer.correct_rank in (1, 2, 3)
    union all
    select
      'answer_difficulty_bonus'::text,
      2::integer,
      '難問正解ボーナス'::text,
      jsonb_build_object(
        'answerId', v_answer.id,
        'launchId', v_answer.launch_id,
        'questionId', v_question.id,
        'difficulty', v_question.difficulty
      )
    where v_question.difficulty >= 4
  ),
  inserted as (
    insert into public.rank_events (
      user_id,
      type,
      points,
      reason,
      source_type,
      source_id,
      metadata
    )
    select
      v_answer.user_id,
      event_type,
      event_points,
      event_reason,
      'answer',
      v_answer.id,
      event_metadata
    from event_candidates
    where event_points <> 0
    on conflict (user_id, type, source_type, source_id) do nothing
    returning id, points
  )
  select
    coalesce(array_agg(id), '{}'::uuid[]),
    count(*)::integer,
    coalesce(sum(points), 0)::integer
  into v_event_ids, v_events_created, v_points
  from inserted;

  if v_events_created > 0 then
    v_new_score := greatest(0, v_old_score + v_points);
    v_new_rank := public.answer_rank_from_score(v_new_score);

    update public.profiles
    set
      answer_score = v_new_score,
      answer_rank = v_new_rank,
      updated_at = now()
    where id = v_profile.id;

    update public.rank_events
    set metadata = metadata || jsonb_build_object(
      'scoreBefore', v_old_score,
      'scoreAfter', v_new_score,
      'rankBefore', v_old_rank,
      'rankAfter', v_new_rank
    )
    where id = any(v_event_ids);
  else
    v_new_score := v_old_score;
    v_new_rank := v_old_rank;
  end if;

  return jsonb_build_object(
    'status', case when v_events_created = 0 then 'no_events' else 'applied' end,
    'points', v_points,
    'eventsCreated', v_events_created,
    'answerScore', v_new_score,
    'answerRank', v_new_rank
  );
end;
$$;

create or replace function public.apply_rating_rank_events(p_rating_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_id uuid;
  v_rating public.question_ratings%rowtype;
  v_launch public.quiz_launches%rowtype;
  v_question public.questions%rowtype;
  v_profile public.profiles%rowtype;
  v_event_ids uuid[] := '{}'::uuid[];
  v_events_created integer := 0;
  v_points integer := 0;
  v_old_score integer := 0;
  v_new_score integer := 0;
  v_old_rank integer := 0;
  v_new_rank integer := 0;
begin
  v_caller_id := auth.uid();

  if p_rating_id is null then
    return jsonb_build_object('status', 'validation_error');
  end if;

  if coalesce(auth.role(), '') <> 'service_role' and v_caller_id is null then
    return jsonb_build_object('status', 'auth_required');
  end if;

  select *
  into v_rating
  from public.question_ratings
  where id = p_rating_id;

  if not found then
    return jsonb_build_object('status', 'rating_not_found');
  end if;

  if coalesce(auth.role(), '') <> 'service_role'
    and v_rating.rater_id <> v_caller_id
    and not exists (
      select 1
      from public.profiles
      where id = v_caller_id
        and role = 'admin'
        and status = 'active'
    ) then
    return jsonb_build_object('status', 'not_allowed');
  end if;

  select *
  into v_launch
  from public.quiz_launches
  where id = v_rating.launch_id;

  if not found then
    return jsonb_build_object('status', 'launch_not_found');
  end if;

  select *
  into v_question
  from public.questions
  where id = v_rating.question_id;

  if not found or v_question.id <> v_launch.question_id then
    return jsonb_build_object('status', 'question_not_found');
  end if;

  select *
  into v_profile
  from public.profiles
  where id = v_launch.author_id
  for update;

  if not found then
    return jsonb_build_object('status', 'profile_not_found');
  end if;

  if v_profile.status <> 'active' then
    return jsonb_build_object('status', 'profile_inactive');
  end if;

  v_old_score := greatest(v_profile.questioner_score, 0);
  v_old_rank := public.questioner_rank_from_score(v_old_score);

  with event_candidates as (
    select
      'question_rating'::text as event_type,
      case v_rating.rating
        when 'good' then 2
        when 'weak' then -1
        else 0
      end as event_points,
      case v_rating.rating
        when 'good' then '良問評価'
        when 'weak' then '微妙評価'
        else '普通評価'
      end::text as event_reason,
      jsonb_build_object(
        'ratingId', v_rating.id,
        'launchId', v_rating.launch_id,
        'questionId', v_rating.question_id,
        'rating', v_rating.rating,
        'reason', v_rating.reason
      ) as event_metadata
    union all
    select
      'question_reason_penalty'::text,
      case v_rating.reason
        when '答えが曖昧' then -3
        when '不適切' then -5
        else 0
      end,
      case v_rating.reason
        when '答えが曖昧' then '答えが曖昧'
        when '不適切' then '不適切'
        else '理由タグ'
      end::text,
      jsonb_build_object(
        'ratingId', v_rating.id,
        'launchId', v_rating.launch_id,
        'questionId', v_rating.question_id,
        'rating', v_rating.rating,
        'reason', v_rating.reason
      )
  ),
  inserted as (
    insert into public.rank_events (
      user_id,
      type,
      points,
      reason,
      source_type,
      source_id,
      metadata
    )
    select
      v_launch.author_id,
      event_type,
      event_points,
      event_reason,
      'rating',
      v_rating.id,
      event_metadata
    from event_candidates
    where event_points <> 0
    on conflict (user_id, type, source_type, source_id) do nothing
    returning id, points
  )
  select
    coalesce(array_agg(id), '{}'::uuid[]),
    count(*)::integer,
    coalesce(sum(points), 0)::integer
  into v_event_ids, v_events_created, v_points
  from inserted;

  if v_events_created > 0 then
    v_new_score := greatest(0, v_old_score + v_points);
    v_new_rank := public.questioner_rank_from_score(v_new_score);

    update public.profiles
    set
      questioner_score = v_new_score,
      questioner_rank = v_new_rank,
      updated_at = now()
    where id = v_profile.id;

    update public.rank_events
    set metadata = metadata || jsonb_build_object(
      'scoreBefore', v_old_score,
      'scoreAfter', v_new_score,
      'rankBefore', v_old_rank,
      'rankAfter', v_new_rank
    )
    where id = any(v_event_ids);
  else
    v_new_score := v_old_score;
    v_new_rank := v_old_rank;
  end if;

  return jsonb_build_object(
    'status', case when v_events_created = 0 then 'no_events' else 'applied' end,
    'points', v_points,
    'eventsCreated', v_events_created,
    'questionerScore', v_new_score,
    'questionerRank', v_new_rank
  );
end;
$$;

alter table public.rank_events enable row level security;

drop policy if exists rank_events_select_own_or_admin on public.rank_events;
create policy rank_events_select_own_or_admin
on public.rank_events
for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and status = 'active'
  )
);

revoke execute on function public.answer_rank_from_score(integer) from public;
revoke execute on function public.questioner_rank_from_score(integer) from public;
revoke execute on function public.recalculate_profile_rank(uuid) from public;
revoke execute on function public.apply_answer_rank_events(uuid) from public;
revoke execute on function public.apply_rating_rank_events(uuid) from public;

grant execute on function public.answer_rank_from_score(integer) to authenticated, service_role;
grant execute on function public.questioner_rank_from_score(integer) to authenticated, service_role;
grant execute on function public.recalculate_profile_rank(uuid) to authenticated, service_role;
grant execute on function public.apply_answer_rank_events(uuid) to authenticated, service_role;
grant execute on function public.apply_rating_rank_events(uuid) to authenticated, service_role;
