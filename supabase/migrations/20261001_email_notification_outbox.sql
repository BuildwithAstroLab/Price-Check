alter table public.users
  add column if not exists account_status text not null default 'active',
  add column if not exists suspended_at timestamptz,
  add column if not exists suspension_reason text,
  add column if not exists newsletter_consent_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.users'::regclass
      and conname = 'users_account_status_check'
  ) then
    alter table public.users
      add constraint users_account_status_check
      check (account_status in ('active', 'suspended'));
  end if;
end;
$$;

create table if not exists public.email_preferences (
  user_id text primary key references public.users(id) on delete cascade,
  marketing_unsubscribed_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.email_preferences enable row level security;
revoke all on table public.email_preferences from anon, authenticated;
grant select, insert, update, delete on table public.email_preferences to service_role;

alter table public.email_events
  add column if not exists event_key text,
  add column if not exists recipient_email text,
  add column if not exists payload jsonb not null default '{}'::jsonb,
  add column if not exists attempt_count integer not null default 0,
  add column if not exists next_attempt_at timestamptz not null default now(),
  add column if not exists locked_until timestamptz,
  add column if not exists last_error text;

update public.email_events events
set event_key = 'legacy:' || events.id::text,
    recipient_email = coalesce(events.recipient_email, users.email),
    status = case
      when events.status = 'queued' then 'skipped'
      else events.status
    end
from public.users
where users.id = events.user_id
  and (events.event_key is null or events.recipient_email is null);

update public.email_events
set event_key = 'legacy:' || id::text,
    status = case when status = 'queued' then 'skipped' else status end
where event_key is null;

alter table public.email_events
  alter column event_key set not null,
  alter column recipient_email drop not null;

alter table public.email_events
  drop constraint if exists email_events_user_type_unique,
  drop constraint if exists email_events_status_check,
  add constraint email_events_status_check
    check (status in ('queued', 'processing', 'sent', 'failed', 'skipped'));
grant insert, select, update, delete on table public.email_events to service_role;

create unique index if not exists email_events_event_key_unique
  on public.email_events (event_key);

create index if not exists email_events_dispatch_idx
  on public.email_events (status, next_attempt_at, created_at)
  where status in ('queued', 'processing');

create index if not exists users_marketing_eligible_idx
  on public.users (id)
  where newsletter_consent and account_status = 'active';

create or replace function public.enqueue_email_event(
  p_user_id text,
  p_email_type text,
  p_event_key text,
  p_recipient_email text,
  p_payload jsonb
)
returns public.email_events
language plpgsql
security definer
set search_path = ''
as $$
declare
  queued_event public.email_events;
begin
  if coalesce(trim(p_recipient_email), '') = ''
     or coalesce(trim(p_event_key), '') = ''
     or coalesce(trim(p_email_type), '') = '' then
    raise exception 'A recipient, event type, and idempotency key are required.';
  end if;

  insert into public.email_events (
    user_id, email_type, event_key, recipient_email, payload, status
  )
  values (
    p_user_id, p_email_type, p_event_key, lower(trim(p_recipient_email)),
    coalesce(p_payload, '{}'::jsonb), 'queued'
  )
  on conflict (event_key) do nothing;

  select * into queued_event
  from public.email_events
  where event_key = p_event_key;

  return queued_event;
end;
$$;

create or replace function public.enqueue_email_events(p_events jsonb)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  inserted_count integer;
begin
  if jsonb_typeof(p_events) <> 'array' then
    raise exception 'Email events must be provided as an array.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_events) as rows(event)
    where coalesce(trim(event->>'user_id'), '') = ''
       or coalesce(trim(event->>'event_type'), '') = ''
       or coalesce(trim(event->>'event_key'), '') = ''
       or coalesce(trim(event->>'recipient_email'), '') = ''
  ) then
    raise exception 'Every email event must contain an owner, type, key, and recipient.';
  end if;

  insert into public.email_events (
    user_id, email_type, event_key, recipient_email, payload, status
  )
  select
    event->>'user_id',
    event->>'event_type',
    event->>'event_key',
    lower(trim(event->>'recipient_email')),
    coalesce(event->'payload', '{}'::jsonb),
    'queued'
  from jsonb_array_elements(p_events) as rows(event)
  on conflict (event_key) do nothing;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

create or replace function public.claim_email_events(p_batch_size integer default 20)
returns setof public.email_events
language sql
security definer
set search_path = ''
as $$
  with candidates as (
    select id
    from public.email_events
    where (
      status = 'queued' and next_attempt_at <= now()
    ) or (
      status = 'processing' and locked_until < now()
    )
    order by next_attempt_at, created_at
    for update skip locked
    limit greatest(1, least(coalesce(p_batch_size, 20), 50))
  )
  update public.email_events events
  set status = 'processing',
      attempt_count = events.attempt_count + 1,
      locked_until = now() + interval '2 minutes',
      updated_at = now()
  from candidates
  where events.id = candidates.id
  returning events.*;
$$;

create or replace function public.complete_email_event(
  p_event_id bigint,
  p_result text,
  p_provider_message_id text default null,
  p_error text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  event_row public.email_events;
begin
  if p_result not in ('sent', 'skipped', 'failed') then
    raise exception 'Invalid notification result.';
  end if;

  select * into event_row
  from public.email_events
  where id = p_event_id and status = 'processing'
  for update;

  if not found then
    return false;
  end if;

  update public.email_events
  set status = case
        when p_result in ('sent', 'skipped') then p_result
        when event_row.attempt_count >= 5 then 'failed'
        else 'queued'
      end,
      provider_message_id = case
        when p_result = 'sent' then p_provider_message_id
        else provider_message_id
      end,
      sent_at = case when p_result = 'sent' then now() else sent_at end,
      next_attempt_at = case
        when p_result in ('sent', 'skipped') or event_row.attempt_count >= 5 then next_attempt_at
        else now() + make_interval(secs => least(3600, 30 * (2 ^ (event_row.attempt_count - 1))::integer))
      end,
      locked_until = null,
      last_error = case when p_result in ('sent', 'skipped') then null else left(coalesce(p_error, 'Email delivery failed.'), 1000) end,
      updated_at = now()
  where id = p_event_id;

  return true;
end;
$$;

create or replace function public.update_user_role_with_notifications(
  p_user_id text,
  p_role text,
  p_assigned_by text,
  p_expected_previous_role text,
  p_user_payload jsonb,
  p_admin_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_user public.users;
  previous_role text;
  role_event_id text := md5(random()::text || clock_timestamp()::text);
  privileged_admin record;
begin
  if p_role not in ('Owner', 'Super Admin', 'Pricing Manager', 'Analyst', 'Standard User') then
    raise exception 'Unsupported role.';
  end if;

  select * into target_user
  from public.users
  where id = p_user_id
  for update;

  if not found then
    raise exception 'The target user does not exist.';
  end if;

  select role into previous_role
  from public.user_roles
  where user_id = p_user_id
  for update;

  if previous_role is null then
    select role into previous_role
    from public.user_roles
    where lower(user_id) = lower(target_user.email)
    limit 1;
  end if;

  previous_role := coalesce(previous_role, 'Standard User');
  if previous_role <> p_expected_previous_role then
    raise exception 'The role changed concurrently. Refresh and try again.'
      using errcode = '40001';
  end if;
  if previous_role = p_role then
    return jsonb_build_object('changed', false, 'previous_role', previous_role, 'role', p_role);
  end if;

  insert into public.user_roles (user_id, role, assigned_by, updated_at)
  values (p_user_id, p_role, p_assigned_by, now())
  on conflict (user_id) do update
    set role = excluded.role,
        assigned_by = excluded.assigned_by,
        updated_at = excluded.updated_at;

  perform public.enqueue_email_event(
    p_user_id, 'role_change', 'role:' || role_event_id || ':' || p_user_id,
    target_user.email, jsonb_set(coalesce(p_user_payload, '{}'::jsonb), '{to}', to_jsonb(target_user.email), true)
  );

  if previous_role in ('Owner', 'Super Admin') or p_role in ('Owner', 'Super Admin') then
    for privileged_admin in
      select users.id, users.email
      from public.users
      join public.user_roles on user_roles.user_id = users.id
      where user_roles.role in ('Owner', 'Super Admin')
        and users.id <> p_user_id
        and users.account_status = 'active'
    loop
      perform public.enqueue_email_event(
        privileged_admin.id, 'privileged_role_change',
        'privileged-role:' || role_event_id || ':' || privileged_admin.id,
        privileged_admin.email,
        jsonb_set(coalesce(p_admin_payload, '{}'::jsonb), '{to}', to_jsonb(privileged_admin.email), true)
      );
    end loop;
  end if;

  return jsonb_build_object('changed', true, 'previous_role', previous_role, 'role', p_role);
end;
$$;

create or replace function public.set_user_suspension_with_notification(
  p_user_id text,
  p_suspended boolean,
  p_reason text,
  p_suspended_payload jsonb,
  p_restored_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_user public.users;
  previous_status text;
  event_id text := md5(random()::text || clock_timestamp()::text);
begin
  select * into target_user
  from public.users
  where id = p_user_id
  for update;

  if not found then
    raise exception 'The target user does not exist.';
  end if;

  previous_status := target_user.account_status;
  if (previous_status = 'suspended') = p_suspended then
    return jsonb_build_object('changed', false, 'account_status', previous_status);
  end if;

  update public.users
  set account_status = case when p_suspended then 'suspended' else 'active' end,
      suspended_at = case when p_suspended then now() else null end,
      suspension_reason = case when p_suspended then left(trim(coalesce(p_reason, '')), 500) else null end
  where id = p_user_id;

  perform public.enqueue_email_event(
    p_user_id,
    case when p_suspended then 'account_suspended' else 'account_restored' end,
    'account-status:' || event_id || ':' || p_user_id,
    target_user.email,
    jsonb_set(
      coalesce(case when p_suspended then p_suspended_payload else p_restored_payload end, '{}'::jsonb),
      '{to}', to_jsonb(target_user.email), true
    )
  );

  return jsonb_build_object(
    'changed', true,
    'account_status', case when p_suspended then 'suspended' else 'active' end
  );
end;
$$;

create or replace function public.set_marketing_consent(p_user_id text, p_consent boolean)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.users
  set newsletter_consent = p_consent,
      newsletter_consent_at = now()
  where id = p_user_id;

  if not found then
    return false;
  end if;

  insert into public.email_preferences (user_id, marketing_unsubscribed_at, updated_at)
  values (p_user_id, case when p_consent then null else now() end, now())
  on conflict (user_id) do update
    set marketing_unsubscribed_at = case
          when p_consent then null
          else coalesce(email_preferences.marketing_unsubscribed_at, now())
        end,
        updated_at = now();

  return true;
end;
$$;

create or replace function public.unsubscribe_email_marketing(p_user_id text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.users
  set newsletter_consent = false,
      newsletter_consent_at = now()
  where id = p_user_id;

  if not found then
    return false;
  end if;

  insert into public.email_preferences (user_id, marketing_unsubscribed_at, updated_at)
  values (p_user_id, now(), now())
  on conflict (user_id) do update
    set marketing_unsubscribed_at = coalesce(email_preferences.marketing_unsubscribed_at, now()),
        updated_at = now();

  return true;
end;
$$;

revoke all on function public.enqueue_email_event(text, text, text, text, jsonb) from public, anon, authenticated;
revoke all on function public.enqueue_email_events(jsonb) from public, anon, authenticated;
revoke all on function public.claim_email_events(integer) from public, anon, authenticated;
revoke all on function public.complete_email_event(bigint, text, text, text) from public, anon, authenticated;
revoke all on function public.update_user_role_with_notifications(text, text, text, text, jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.set_user_suspension_with_notification(text, boolean, text, jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.set_marketing_consent(text, boolean) from public, anon, authenticated;
revoke all on function public.unsubscribe_email_marketing(text) from public, anon, authenticated;

grant execute on function public.enqueue_email_event(text, text, text, text, jsonb) to service_role;
grant execute on function public.enqueue_email_events(jsonb) to service_role;
grant execute on function public.claim_email_events(integer) to service_role;
grant execute on function public.complete_email_event(bigint, text, text, text) to service_role;
grant execute on function public.update_user_role_with_notifications(text, text, text, text, jsonb, jsonb) to service_role;
grant execute on function public.set_user_suspension_with_notification(text, boolean, text, jsonb, jsonb) to service_role;
grant execute on function public.set_marketing_consent(text, boolean) to service_role;
grant execute on function public.unsubscribe_email_marketing(text) to service_role;
