create table if not exists public.answers (
  id uuid primary key default gen_random_uuid(),
  launch_id uuid not null references public.quiz_launches(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  answer_text text,
  normalized_answer text,
  choice_id text not null,
  is_correct boolean not null,
  answer_received_at timestamptz not null,
  answer_rank integer not null check (answer_rank > 0),
  correct_rank integer check (correct_rank is null or correct_rank > 0),
  created_at timestamptz not null default now(),
  unique (launch_id, user_id)
);

create index if not exists answers_launch_received_idx
on public.answers(launch_id, answer_received_at, id);

create index if not exists answers_launch_answer_rank_idx
on public.answers(launch_id, answer_rank);

create index if not exists answers_launch_correct_rank_idx
on public.answers(launch_id, correct_rank);

create index if not exists answers_user_created_idx
on public.answers(user_id, created_at desc);

alter table public.answers enable row level security;

drop policy if exists answers_select_own on public.answers;
create policy answers_select_own
on public.answers
for select
to authenticated
using (user_id = auth.uid());

create or replace function public.submit_quiz_answer(
  p_launch_id uuid,
  p_choice_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_launch public.quiz_launches%rowtype;
  v_profile public.profiles%rowtype;
  v_world_member public.world_members%rowtype;
  v_question public.questions%rowtype;
  v_choice_id text;
  v_choice_exists boolean;
  v_is_correct boolean;
  v_answer_rank integer;
  v_correct_rank integer;
  v_received_at timestamptz;
  v_answer public.answers%rowtype;
begin
  v_user_id := auth.uid();
  v_choice_id := btrim(coalesce(p_choice_id, ''));

  if v_user_id is null then
    return jsonb_build_object('status', 'auth_required');
  end if;

  if p_launch_id is null or v_choice_id = '' then
    return jsonb_build_object('status', 'validation_error');
  end if;

  select *
  into v_launch
  from public.quiz_launches
  where id = p_launch_id
  for update;

  if not found then
    return jsonb_build_object('status', 'launch_not_found');
  end if;

  if v_launch.author_id = v_user_id then
    return jsonb_build_object('status', 'author_cannot_answer');
  end if;

  if not exists (
    select 1
    from public.quiz_recipients
    where launch_id = v_launch.id
      and user_id = v_user_id
  ) then
    return jsonb_build_object('status', 'not_recipient');
  end if;

  select *
  into v_profile
  from public.profiles
  where id = v_user_id;

  if not found or v_profile.status <> 'active' then
    return jsonb_build_object('status', 'user_suspended');
  end if;

  select *
  into v_world_member
  from public.world_members
  where world_id = v_launch.world_id
    and user_id = v_user_id
  limit 1;

  if not found or v_world_member.status <> 'active' then
    return jsonb_build_object('status', 'world_member_inactive');
  end if;

  select *
  into v_question
  from public.questions
  where id = v_launch.question_id;

  if not found or v_question.status <> 'active' then
    return jsonb_build_object('status', 'question_not_active');
  end if;

  if v_launch.status = 'cancelled' then
    return jsonb_build_object('status', 'launch_unavailable');
  end if;

  v_received_at := clock_timestamp();

  if v_received_at < v_launch.start_at then
    return jsonb_build_object('status', 'not_started');
  end if;

  if v_received_at >= v_launch.end_at then
    return jsonb_build_object('status', 'closed');
  end if;

  if exists (
    select 1
    from public.answers
    where launch_id = v_launch.id
      and user_id = v_user_id
  ) then
    return jsonb_build_object('status', 'already_answered');
  end if;

  select exists (
    select 1
    from jsonb_array_elements(v_question.choices) as choice
    where choice ->> 'id' = v_choice_id
  )
  into v_choice_exists;

  if not v_choice_exists then
    return jsonb_build_object('status', 'invalid_choice');
  end if;

  v_is_correct := v_choice_id = v_question.correct_choice_id;

  select count(*)::integer + 1
  into v_answer_rank
  from public.answers
  where launch_id = v_launch.id;

  if v_is_correct then
    select count(*)::integer + 1
    into v_correct_rank
    from public.answers
    where launch_id = v_launch.id
      and is_correct = true;
  else
    v_correct_rank := null;
  end if;

  insert into public.answers (
    launch_id,
    user_id,
    answer_text,
    normalized_answer,
    choice_id,
    is_correct,
    answer_received_at,
    answer_rank,
    correct_rank
  )
  values (
    v_launch.id,
    v_user_id,
    null,
    null,
    v_choice_id,
    v_is_correct,
    v_received_at,
    v_answer_rank,
    v_correct_rank
  )
  returning *
  into v_answer;

  return jsonb_build_object(
    'status', 'answered',
    'answer', jsonb_build_object(
      'id', v_answer.id,
      'launchId', v_answer.launch_id,
      'userId', v_answer.user_id,
      'choiceId', v_answer.choice_id,
      'isCorrect', v_answer.is_correct,
      'answerReceivedAt', v_answer.answer_received_at,
      'answerRank', v_answer.answer_rank,
      'correctRank', v_answer.correct_rank
    )
  );
exception
  when unique_violation then
    return jsonb_build_object('status', 'already_answered');
end;
$$;

revoke execute on function public.submit_quiz_answer(uuid, text) from public;
revoke execute on function public.submit_quiz_answer(uuid, text) from anon;
grant execute on function public.submit_quiz_answer(uuid, text) to authenticated;
