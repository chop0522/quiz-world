insert into public.worlds (id, name, member_limit, current_season, status)
values (
  '00000000-0000-4000-8000-000000000001',
  'クイズワールド',
  10,
  0,
  'active'
)
on conflict (id) do update
set
  name = excluded.name,
  member_limit = excluded.member_limit,
  current_season = excluded.current_season,
  status = excluded.status;

insert into public.invites (world_id, invited_by, code, status, max_uses, use_count, expires_at)
values (
  '00000000-0000-4000-8000-000000000001',
  null,
  'SEASON0-TEST-001',
  'active',
  100,
  0,
  null
)
on conflict (code) do update
set
  world_id = excluded.world_id,
  status = excluded.status,
  max_uses = excluded.max_uses,
  expires_at = excluded.expires_at;

-- Initial admin is assigned by ADMIN_EMAILS during signup.
-- Use ADMIN_EMAILS=admin@example.com in .env.local, then sign up with that email.
