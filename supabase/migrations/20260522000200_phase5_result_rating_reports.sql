create table if not exists public.question_ratings (
  id uuid primary key default gen_random_uuid(),
  launch_id uuid not null references public.quiz_launches(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  rater_id uuid not null references public.profiles(id) on delete cascade,
  rating text not null check (rating in ('good', 'normal', 'weak')),
  reason text not null check (
    reason in (
      '面白い',
      '難易度がちょうどいい',
      '答えが曖昧',
      '難しすぎる',
      '簡単すぎる',
      '不適切'
    )
  ),
  created_at timestamptz not null default now(),
  unique (launch_id, rater_id)
);

create index if not exists question_ratings_question_created_idx
on public.question_ratings(question_id, created_at desc);

create index if not exists question_ratings_rater_created_idx
on public.question_ratings(rater_id, created_at desc);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  launch_id uuid not null references public.quiz_launches(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (reason in ('答えが曖昧', '不適切', 'スパム', 'その他')),
  status text not null default 'open' check (
    status in ('open', 'reviewing', 'resolved', 'dismissed')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (question_id, launch_id, reporter_id, reason)
);

create index if not exists reports_status_created_idx
on public.reports(status, created_at desc);

create index if not exists reports_question_created_idx
on public.reports(question_id, created_at desc);

create index if not exists reports_reporter_created_idx
on public.reports(reporter_id, created_at desc);

drop trigger if exists reports_set_updated_at on public.reports;
create trigger reports_set_updated_at
before update on public.reports
for each row execute function public.set_updated_at();

alter table public.question_ratings enable row level security;
alter table public.reports enable row level security;

drop policy if exists question_ratings_select_related on public.question_ratings;
create policy question_ratings_select_related
on public.question_ratings
for select
to authenticated
using (
  rater_id = auth.uid()
  or exists (
    select 1
    from public.quiz_launches
    where id = question_ratings.launch_id
      and author_id = auth.uid()
  )
  or exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and status = 'active'
  )
);

drop policy if exists question_ratings_insert_recipient on public.question_ratings;
create policy question_ratings_insert_recipient
on public.question_ratings
for insert
to authenticated
with check (
  rater_id = auth.uid()
  and exists (
    select 1
    from public.quiz_recipients
    where launch_id = question_ratings.launch_id
      and user_id = auth.uid()
  )
  and not exists (
    select 1
    from public.quiz_launches
    where id = question_ratings.launch_id
      and author_id = auth.uid()
  )
);

drop policy if exists reports_select_own_or_admin on public.reports;
create policy reports_select_own_or_admin
on public.reports
for select
to authenticated
using (
  reporter_id = auth.uid()
  or exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and status = 'active'
  )
);

drop policy if exists reports_insert_related_user on public.reports;
create policy reports_insert_related_user
on public.reports
for insert
to authenticated
with check (
  reporter_id = auth.uid()
  and exists (
    select 1
    from public.quiz_launches
    where id = reports.launch_id
      and question_id = reports.question_id
      and (
        author_id = auth.uid()
        or exists (
          select 1
          from public.quiz_recipients
          where launch_id = reports.launch_id
            and user_id = auth.uid()
        )
      )
  )
);
