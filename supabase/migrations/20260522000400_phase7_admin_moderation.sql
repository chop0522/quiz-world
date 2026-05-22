alter table public.questions
drop constraint if exists questions_status_check;

alter table public.questions
add constraint questions_status_check
check (status in ('draft', 'active', 'review_required', 'suspended'));

create index if not exists reports_status_updated_idx
on public.reports(status, updated_at desc);

create index if not exists reports_launch_created_idx
on public.reports(launch_id, created_at desc);

create index if not exists questions_status_updated_idx
on public.questions(status, updated_at desc);

create index if not exists invites_status_created_idx
on public.invites(status, created_at desc);

create index if not exists waitlist_status_updated_idx
on public.waitlist(status, updated_at desc);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references public.profiles(id) on delete restrict,
  action text not null check (
    action in (
      'question_review_required',
      'question_suspended',
      'user_suspended',
      'invite_created',
      'waitlist_status_updated',
      'report_reviewed'
    )
  ),
  target_type text not null check (
    target_type in ('question', 'user', 'invite', 'waitlist', 'report')
  ),
  target_id uuid not null,
  reason text not null check (
    char_length(btrim(reason)) between 1 and 500
  ),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_logs_admin_created_idx
on public.admin_audit_logs(admin_user_id, created_at desc);

create index if not exists admin_audit_logs_action_created_idx
on public.admin_audit_logs(action, created_at desc);

create index if not exists admin_audit_logs_target_idx
on public.admin_audit_logs(target_type, target_id, created_at desc);

alter table public.admin_audit_logs enable row level security;

drop policy if exists admin_audit_logs_select_admin on public.admin_audit_logs;
create policy admin_audit_logs_select_admin
on public.admin_audit_logs
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and status = 'active'
  )
);

create or replace function public.is_active_admin(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = p_user_id
      and role = 'admin'
      and status = 'active'
  );
$$;

create or replace function public.insert_admin_audit_log(
  p_admin_user_id uuid,
  p_action text,
  p_target_type text,
  p_target_id uuid,
  p_reason text,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_log_id uuid;
  v_reason text;
begin
  v_reason := btrim(coalesce(p_reason, ''));

  if not public.is_active_admin(p_admin_user_id) then
    raise exception 'active admin is required';
  end if;

  if v_reason = '' or char_length(v_reason) > 500 then
    raise exception 'reason is required';
  end if;

  insert into public.admin_audit_logs (
    admin_user_id,
    action,
    target_type,
    target_id,
    reason,
    metadata
  )
  values (
    p_admin_user_id,
    p_action,
    p_target_type,
    p_target_id,
    v_reason,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_log_id;

  return v_log_id;
end;
$$;

create or replace function public.admin_update_report_status(
  p_admin_user_id uuid,
  p_report_id uuid,
  p_status text,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_report public.reports%rowtype;
  v_old_status text;
  v_reason text;
  v_audit_id uuid;
begin
  v_reason := btrim(coalesce(p_reason, ''));

  if not public.is_active_admin(p_admin_user_id) then
    return jsonb_build_object('status', 'admin_forbidden');
  end if;

  if p_report_id is null
    or p_status not in ('reviewing', 'resolved', 'dismissed')
    or v_reason = ''
    or char_length(v_reason) > 500 then
    return jsonb_build_object('status', 'validation_error');
  end if;

  select *
  into v_report
  from public.reports
  where id = p_report_id
  for update;

  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;

  if v_report.status = p_status then
    return jsonb_build_object('status', 'conflict');
  end if;

  v_old_status := v_report.status;

  update public.reports
  set status = p_status
  where id = v_report.id
  returning * into v_report;

  v_audit_id := public.insert_admin_audit_log(
    p_admin_user_id,
    'report_reviewed',
    'report',
    v_report.id,
    v_reason,
    jsonb_build_object(
      'statusBefore', v_old_status,
      'statusAfter', v_report.status,
      'questionId', v_report.question_id,
      'launchId', v_report.launch_id,
      'reporterId', v_report.reporter_id
    )
  );

  return jsonb_build_object(
    'status', 'updated',
    'reportId', v_report.id,
    'reportStatus', v_report.status,
    'auditLogId', v_audit_id
  );
end;
$$;

create or replace function public.admin_moderate_question(
  p_admin_user_id uuid,
  p_question_id uuid,
  p_status text,
  p_reason text,
  p_report_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_question public.questions%rowtype;
  v_report public.reports%rowtype;
  v_old_status text;
  v_reason text;
  v_report_count integer;
  v_action text;
  v_audit_id uuid;
begin
  v_reason := btrim(coalesce(p_reason, ''));

  if not public.is_active_admin(p_admin_user_id) then
    return jsonb_build_object('status', 'admin_forbidden');
  end if;

  if p_question_id is null
    or p_status not in ('review_required', 'suspended')
    or v_reason = ''
    or char_length(v_reason) > 500 then
    return jsonb_build_object('status', 'validation_error');
  end if;

  select *
  into v_question
  from public.questions
  where id = p_question_id
  for update;

  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;

  if p_report_id is not null then
    select *
    into v_report
    from public.reports
    where id = p_report_id;

    if not found or v_report.question_id <> v_question.id then
      return jsonb_build_object('status', 'validation_error');
    end if;
  end if;

  if v_question.status = p_status then
    return jsonb_build_object('status', 'conflict');
  end if;

  select count(*)::integer
  into v_report_count
  from public.reports
  where question_id = v_question.id;

  v_old_status := v_question.status;

  update public.questions
  set status = p_status
  where id = v_question.id
  returning * into v_question;

  v_action := case
    when p_status = 'review_required' then 'question_review_required'
    else 'question_suspended'
  end;

  v_audit_id := public.insert_admin_audit_log(
    p_admin_user_id,
    v_action,
    'question',
    v_question.id,
    v_reason,
    jsonb_build_object(
      'statusBefore', v_old_status,
      'statusAfter', v_question.status,
      'authorId', v_question.author_id,
      'reportId', p_report_id,
      'reportCount', v_report_count
    )
  );

  return jsonb_build_object(
    'status', 'updated',
    'questionId', v_question.id,
    'questionStatus', v_question.status,
    'auditLogId', v_audit_id
  );
end;
$$;

create or replace function public.admin_suspend_user(
  p_admin_user_id uuid,
  p_target_user_id uuid,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles%rowtype;
  v_reason text;
  v_suspended_world_members integer := 0;
  v_audit_id uuid;
begin
  v_reason := btrim(coalesce(p_reason, ''));

  if not public.is_active_admin(p_admin_user_id) then
    return jsonb_build_object('status', 'admin_forbidden');
  end if;

  if p_target_user_id is null
    or v_reason = ''
    or char_length(v_reason) > 500 then
    return jsonb_build_object('status', 'validation_error');
  end if;

  if p_target_user_id = p_admin_user_id then
    return jsonb_build_object('status', 'self_suspend_forbidden');
  end if;

  select *
  into v_profile
  from public.profiles
  where id = p_target_user_id
  for update;

  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;

  if v_profile.status = 'suspended' then
    return jsonb_build_object('status', 'conflict');
  end if;

  update public.profiles
  set status = 'suspended'
  where id = v_profile.id
  returning * into v_profile;

  update public.world_members
  set status = 'suspended'
  where user_id = v_profile.id
    and status <> 'suspended';

  get diagnostics v_suspended_world_members = row_count;

  v_audit_id := public.insert_admin_audit_log(
    p_admin_user_id,
    'user_suspended',
    'user',
    v_profile.id,
    v_reason,
    jsonb_build_object(
      'displayName', v_profile.display_name,
      'worldMembersSuspended', v_suspended_world_members
    )
  );

  return jsonb_build_object(
    'status', 'updated',
    'userId', v_profile.id,
    'userStatus', v_profile.status,
    'worldMembersSuspended', v_suspended_world_members,
    'auditLogId', v_audit_id
  );
end;
$$;

create or replace function public.admin_update_waitlist_status(
  p_admin_user_id uuid,
  p_waitlist_id uuid,
  p_status text,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_waitlist public.waitlist%rowtype;
  v_old_status text;
  v_reason text;
  v_audit_id uuid;
begin
  v_reason := btrim(coalesce(p_reason, ''));

  if not public.is_active_admin(p_admin_user_id) then
    return jsonb_build_object('status', 'admin_forbidden');
  end if;

  if p_waitlist_id is null
    or p_status not in ('waiting', 'invited', 'joined', 'rejected')
    or char_length(v_reason) > 500 then
    return jsonb_build_object('status', 'validation_error');
  end if;

  if p_status = 'rejected' and v_reason = '' then
    return jsonb_build_object('status', 'validation_error');
  end if;

  if v_reason = '' then
    v_reason := 'waitlist status updated';
  end if;

  select *
  into v_waitlist
  from public.waitlist
  where id = p_waitlist_id
  for update;

  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;

  if v_waitlist.status = p_status then
    return jsonb_build_object('status', 'conflict');
  end if;

  v_old_status := v_waitlist.status;

  update public.waitlist
  set status = p_status
  where id = v_waitlist.id
  returning * into v_waitlist;

  v_audit_id := public.insert_admin_audit_log(
    p_admin_user_id,
    'waitlist_status_updated',
    'waitlist',
    v_waitlist.id,
    v_reason,
    jsonb_build_object(
      'statusBefore', v_old_status,
      'statusAfter', v_waitlist.status,
      'email', v_waitlist.email
    )
  );

  return jsonb_build_object(
    'status', 'updated',
    'waitlistId', v_waitlist.id,
    'waitlistStatus', v_waitlist.status,
    'auditLogId', v_audit_id
  );
end;
$$;

create or replace function public.admin_create_invite(
  p_admin_user_id uuid,
  p_world_id uuid,
  p_code text,
  p_max_uses integer,
  p_expires_at timestamptz,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_world public.worlds%rowtype;
  v_invite public.invites%rowtype;
  v_reason text;
  v_code text;
  v_input_code boolean;
  v_attempt integer;
  v_audit_id uuid;
begin
  v_reason := btrim(coalesce(p_reason, ''));
  v_input_code := btrim(coalesce(p_code, '')) <> '';
  v_code := upper(btrim(coalesce(p_code, '')));

  if not public.is_active_admin(p_admin_user_id) then
    return jsonb_build_object('status', 'admin_forbidden');
  end if;

  if v_reason = ''
    or char_length(v_reason) > 500
    or coalesce(p_max_uses, 1) < 1
    or (p_expires_at is not null and p_expires_at <= now()) then
    return jsonb_build_object('status', 'validation_error');
  end if;

  if p_world_id is null then
    select *
    into v_world
    from public.worlds
    where status = 'active'
    order by created_at asc
    limit 1;
  else
    select *
    into v_world
    from public.worlds
    where id = p_world_id;
  end if;

  if not found or v_world.status <> 'active' then
    return jsonb_build_object('status', 'world_not_found');
  end if;

  if v_input_code and (v_code = '' or char_length(v_code) > 80) then
    return jsonb_build_object('status', 'validation_error');
  end if;

  for v_attempt in 1..10 loop
    if not v_input_code then
      v_code := 'SEASON0-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    end if;

    begin
      insert into public.invites (
        world_id,
        invited_by,
        code,
        status,
        max_uses,
        expires_at
      )
      values (
        v_world.id,
        p_admin_user_id,
        v_code,
        'active',
        coalesce(p_max_uses, 1),
        p_expires_at
      )
      returning * into v_invite;

      exit;
    exception
      when unique_violation then
        if v_input_code then
          return jsonb_build_object('status', 'code_conflict');
        end if;
    end;
  end loop;

  if v_invite.id is null then
    return jsonb_build_object('status', 'code_conflict');
  end if;

  v_audit_id := public.insert_admin_audit_log(
    p_admin_user_id,
    'invite_created',
    'invite',
    v_invite.id,
    v_reason,
    jsonb_build_object(
      'worldId', v_invite.world_id,
      'code', v_invite.code,
      'maxUses', v_invite.max_uses,
      'expiresAt', v_invite.expires_at
    )
  );

  return jsonb_build_object(
    'status', 'created',
    'inviteId', v_invite.id,
    'code', v_invite.code,
    'auditLogId', v_audit_id
  );
end;
$$;

revoke execute on function public.is_active_admin(uuid) from public;
revoke execute on function public.insert_admin_audit_log(uuid, text, text, uuid, text, jsonb) from public;
revoke execute on function public.admin_update_report_status(uuid, uuid, text, text) from public;
revoke execute on function public.admin_moderate_question(uuid, uuid, text, text, uuid) from public;
revoke execute on function public.admin_suspend_user(uuid, uuid, text) from public;
revoke execute on function public.admin_update_waitlist_status(uuid, uuid, text, text) from public;
revoke execute on function public.admin_create_invite(uuid, uuid, text, integer, timestamptz, text) from public;

revoke execute on function public.is_active_admin(uuid) from anon, authenticated;
revoke execute on function public.insert_admin_audit_log(uuid, text, text, uuid, text, jsonb) from anon, authenticated;
revoke execute on function public.admin_update_report_status(uuid, uuid, text, text) from anon, authenticated;
revoke execute on function public.admin_moderate_question(uuid, uuid, text, text, uuid) from anon, authenticated;
revoke execute on function public.admin_suspend_user(uuid, uuid, text) from anon, authenticated;
revoke execute on function public.admin_update_waitlist_status(uuid, uuid, text, text) from anon, authenticated;
revoke execute on function public.admin_create_invite(uuid, uuid, text, integer, timestamptz, text) from anon, authenticated;

grant execute on function public.is_active_admin(uuid) to service_role;
grant execute on function public.insert_admin_audit_log(uuid, text, text, uuid, text, jsonb) to service_role;
grant execute on function public.admin_update_report_status(uuid, uuid, text, text) to service_role;
grant execute on function public.admin_moderate_question(uuid, uuid, text, text, uuid) to service_role;
grant execute on function public.admin_suspend_user(uuid, uuid, text) to service_role;
grant execute on function public.admin_update_waitlist_status(uuid, uuid, text, text) to service_role;
grant execute on function public.admin_create_invite(uuid, uuid, text, integer, timestamptz, text) to service_role;
