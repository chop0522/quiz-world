create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin')),
  status text not null default 'active' check (status in ('active', 'suspended')),
  answer_rank integer not null default 0,
  answer_score integer not null default 0,
  questioner_rank integer not null default 0,
  questioner_score integer not null default 0,
  notification_mode text not null default 'normal' check (notification_mode in ('normal', 'focus', 'rest', 'night')),
  quiet_hours_start time not null default '22:00',
  quiet_hours_end time not null default '08:00',
  max_daily_notifications integer not null default 5 check (max_daily_notifications between 0 and 50),
  deep_night_notifications_enabled boolean not null default false,
  age_confirmed_at timestamptz not null,
  terms_accepted_at timestamptz not null,
  privacy_accepted_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.worlds (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  member_limit integer not null default 10 check (member_limit > 0),
  current_season integer not null default 0 check (current_season >= 0),
  status text not null default 'active' check (status in ('active', 'paused', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.world_members (
  id uuid primary key default gen_random_uuid(),
  world_id uuid not null references public.worlds(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('member', 'world_admin')),
  status text not null default 'active' check (status in ('active', 'suspended')),
  joined_at timestamptz not null default now(),
  unique (world_id, user_id)
);

create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  world_id uuid not null references public.worlds(id) on delete cascade,
  invited_by uuid references public.profiles(id) on delete set null,
  code text not null unique,
  status text not null default 'active' check (status in ('active', 'used', 'expired', 'revoked')),
  max_uses integer not null default 1 check (max_uses > 0),
  use_count integer not null default 0 check (use_count >= 0),
  used_by uuid references public.profiles(id) on delete set null,
  used_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (use_count <= max_uses)
);

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  display_name text not null check (char_length(display_name) between 1 and 40),
  status text not null default 'waiting' check (status in ('waiting', 'invited', 'joined', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_role_status_idx on public.profiles(role, status);
create index if not exists world_members_world_status_idx on public.world_members(world_id, status);
create index if not exists world_members_user_idx on public.world_members(user_id);
create index if not exists invites_code_status_idx on public.invites(code, status);
create index if not exists waitlist_status_created_idx on public.waitlist(status, created_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists worlds_set_updated_at on public.worlds;
create trigger worlds_set_updated_at
before update on public.worlds
for each row execute function public.set_updated_at();

drop trigger if exists invites_set_updated_at on public.invites;
create trigger invites_set_updated_at
before update on public.invites
for each row execute function public.set_updated_at();

drop trigger if exists waitlist_set_updated_at on public.waitlist;
create trigger waitlist_set_updated_at
before update on public.waitlist
for each row execute function public.set_updated_at();

create or replace function public.complete_signup(
  p_user_id uuid,
  p_email text,
  p_display_name text,
  p_invite_code text,
  p_is_admin boolean,
  p_age_confirmed boolean,
  p_terms_accepted boolean,
  p_privacy_accepted boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.invites%rowtype;
  v_world public.worlds%rowtype;
  v_active_count integer;
  v_normalized_code text;
  v_role text;
begin
  if not p_age_confirmed or not p_terms_accepted or not p_privacy_accepted then
    return jsonb_build_object('status', 'validation_error');
  end if;

  if p_user_id is null or p_email is null or p_display_name is null or p_invite_code is null then
    return jsonb_build_object('status', 'validation_error');
  end if;

  v_normalized_code := upper(trim(p_invite_code));
  v_role := case when p_is_admin then 'admin' else 'user' end;

  select *
  into v_invite
  from public.invites
  where upper(code) = v_normalized_code
  for update;

  if not found then
    return jsonb_build_object('status', 'invalid_invite');
  end if;

  if v_invite.status <> 'active'
    or (v_invite.expires_at is not null and v_invite.expires_at <= now())
    or v_invite.use_count >= v_invite.max_uses then
    return jsonb_build_object('status', 'invalid_invite');
  end if;

  select *
  into v_world
  from public.worlds
  where id = v_invite.world_id
  for update;

  if not found or v_world.status <> 'active' then
    return jsonb_build_object('status', 'world_unavailable');
  end if;

  if exists (select 1 from public.profiles where id = p_user_id) then
    return jsonb_build_object('status', 'profile_exists');
  end if;

  select count(*)::integer
  into v_active_count
  from public.world_members
  where world_id = v_world.id and status = 'active';

  if v_active_count >= v_world.member_limit then
    return jsonb_build_object(
      'status', 'waitlist_required',
      'worldId', v_world.id,
      'memberLimit', v_world.member_limit,
      'activeMemberCount', v_active_count
    );
  end if;

  insert into public.profiles (
    id,
    display_name,
    role,
    status,
    age_confirmed_at,
    terms_accepted_at,
    privacy_accepted_at
  )
  values (
    p_user_id,
    trim(p_display_name),
    v_role,
    'active',
    now(),
    now(),
    now()
  );

  insert into public.world_members (world_id, user_id, role, status)
  values (v_world.id, p_user_id, 'member', 'active');

  update public.invites
  set
    use_count = use_count + 1,
    status = case when use_count + 1 >= max_uses then 'used' else status end,
    used_by = p_user_id,
    used_at = now()
  where id = v_invite.id;

  return jsonb_build_object(
    'status', 'joined',
    'worldId', v_world.id,
    'role', v_role,
    'memberLimit', v_world.member_limit,
    'activeMemberCount', v_active_count + 1
  );
end;
$$;

revoke execute on function public.complete_signup(uuid, text, text, text, boolean, boolean, boolean, boolean) from public;
revoke execute on function public.complete_signup(uuid, text, text, text, boolean, boolean, boolean, boolean) from anon;
revoke execute on function public.complete_signup(uuid, text, text, text, boolean, boolean, boolean, boolean) from authenticated;
grant execute on function public.complete_signup(uuid, text, text, text, boolean, boolean, boolean, boolean) to service_role;

alter table public.profiles enable row level security;
alter table public.worlds enable row level security;
alter table public.world_members enable row level security;
alter table public.invites enable row level security;
alter table public.waitlist enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists worlds_select_active on public.worlds;
create policy worlds_select_active
on public.worlds
for select
to anon, authenticated
using (status = 'active');

drop policy if exists world_members_select_own on public.world_members;
create policy world_members_select_own
on public.world_members
for select
to authenticated
using (user_id = auth.uid());
