create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  type text not null default 'multiple_choice' check (type = 'multiple_choice'),
  body text not null check (char_length(btrim(body)) between 1 and 300),
  choices jsonb not null check (
    jsonb_typeof(choices) = 'array'
    and jsonb_array_length(choices) = 4
  ),
  correct_choice_id text not null,
  correct_answer text,
  answer_aliases jsonb,
  difficulty integer not null check (difficulty between 1 and 5),
  category text not null check (
    category in (
      '雑学',
      '歴史',
      '地理',
      '科学',
      'エンタメ',
      'スポーツ',
      '言葉',
      '謎解き',
      'その他'
    )
  ),
  category_note text check (
    (
      category = 'その他'
      and (
        category_note is null
        or char_length(btrim(category_note)) between 1 and 80
      )
    )
    or (
      category <> 'その他'
      and category_note is null
    )
  ),
  status text not null default 'draft' check (status in ('draft', 'active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists questions_author_status_idx
on public.questions(author_id, status, updated_at desc);

create index if not exists questions_status_category_idx
on public.questions(status, category);

create index if not exists questions_created_at_idx
on public.questions(created_at desc);

drop trigger if exists questions_set_updated_at on public.questions;
create trigger questions_set_updated_at
before update on public.questions
for each row execute function public.set_updated_at();

alter table public.questions enable row level security;

drop policy if exists questions_select_author_or_admin on public.questions;
create policy questions_select_author_or_admin
on public.questions
for select
to authenticated
using (
  author_id = auth.uid()
  or exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and status = 'active'
  )
);

drop policy if exists questions_insert_active_member on public.questions;
create policy questions_insert_active_member
on public.questions
for insert
to authenticated
with check (
  author_id = auth.uid()
  and status in ('draft', 'active')
  and exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and status = 'active'
  )
  and exists (
    select 1
    from public.world_members
    where user_id = auth.uid()
      and status = 'active'
  )
);

drop policy if exists questions_update_author_active on public.questions;
create policy questions_update_author_active
on public.questions
for update
to authenticated
using (
  author_id = auth.uid()
  and status in ('draft', 'active')
  and exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and status = 'active'
  )
  and exists (
    select 1
    from public.world_members
    where user_id = auth.uid()
      and status = 'active'
  )
)
with check (
  author_id = auth.uid()
  and status in ('draft', 'active')
  and exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and status = 'active'
  )
  and exists (
    select 1
    from public.world_members
    where user_id = auth.uid()
      and status = 'active'
  )
);

drop policy if exists questions_update_admin on public.questions;
create policy questions_update_admin
on public.questions
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and status = 'active'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and status = 'active'
  )
);
