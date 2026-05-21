create table if not exists public.blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create index if not exists blocks_blocker_idx
on public.blocks(blocker_id, created_at desc);

create index if not exists blocks_blocked_idx
on public.blocks(blocked_id, created_at desc);

create table if not exists public.quiz_launches (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete restrict,
  author_id uuid not null references public.profiles(id) on delete cascade,
  world_id uuid not null references public.worlds(id) on delete cascade,
  recipient_count integer not null default 0 check (recipient_count >= 0),
  requested_recipient_count integer check (
    requested_recipient_count is null
    or requested_recipient_count >= 0
  ),
  start_at timestamptz not null,
  end_at timestamptz not null,
  status text not null default 'scheduled' check (
    status in ('scheduled', 'open', 'closed', 'cancelled')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (start_at < end_at)
);

create index if not exists quiz_launches_author_created_idx
on public.quiz_launches(author_id, created_at desc);

create index if not exists quiz_launches_world_created_idx
on public.quiz_launches(world_id, created_at desc);

create index if not exists quiz_launches_question_idx
on public.quiz_launches(question_id);

create index if not exists quiz_launches_status_start_idx
on public.quiz_launches(status, start_at);

drop trigger if exists quiz_launches_set_updated_at on public.quiz_launches;
create trigger quiz_launches_set_updated_at
before update on public.quiz_launches
for each row execute function public.set_updated_at();

create table if not exists public.quiz_recipients (
  id uuid primary key default gen_random_uuid(),
  launch_id uuid not null references public.quiz_launches(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  notification_status text not null default 'in_app_ready' check (
    notification_status in ('pending', 'in_app_ready', 'skipped', 'failed')
  ),
  notified_at timestamptz,
  opened_at timestamptz,
  created_at timestamptz not null default now(),
  unique (launch_id, user_id)
);

create index if not exists quiz_recipients_user_created_idx
on public.quiz_recipients(user_id, created_at desc);

create index if not exists quiz_recipients_launch_idx
on public.quiz_recipients(launch_id);

create index if not exists quiz_recipients_user_status_idx
on public.quiz_recipients(user_id, notification_status, created_at desc);

alter table public.blocks enable row level security;
alter table public.quiz_launches enable row level security;
alter table public.quiz_recipients enable row level security;

drop policy if exists blocks_select_own_or_admin on public.blocks;
create policy blocks_select_own_or_admin
on public.blocks
for select
to authenticated
using (
  blocker_id = auth.uid()
  or blocked_id = auth.uid()
  or exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and status = 'active'
  )
);

drop policy if exists blocks_insert_self on public.blocks;
create policy blocks_insert_self
on public.blocks
for insert
to authenticated
with check (
  blocker_id = auth.uid()
  and exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and status = 'active'
  )
);

drop policy if exists blocks_delete_self_or_admin on public.blocks;
create policy blocks_delete_self_or_admin
on public.blocks
for delete
to authenticated
using (
  blocker_id = auth.uid()
  or exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and status = 'active'
  )
);

drop policy if exists quiz_launches_select_related on public.quiz_launches;
create policy quiz_launches_select_related
on public.quiz_launches
for select
to authenticated
using (
  author_id = auth.uid()
  or exists (
    select 1
    from public.quiz_recipients
    where launch_id = quiz_launches.id
      and user_id = auth.uid()
  )
  or exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and status = 'active'
  )
);

drop policy if exists quiz_recipients_select_related on public.quiz_recipients;
create policy quiz_recipients_select_related
on public.quiz_recipients
for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.quiz_launches
    where id = quiz_recipients.launch_id
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
