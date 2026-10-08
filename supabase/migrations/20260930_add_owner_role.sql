do $$
declare
  role_check record;
begin
  for role_check in
    select conname
    from pg_constraint
    where conrelid = 'public.user_roles'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%role%'
  loop
    execute format(
      'alter table public.user_roles drop constraint %I',
      role_check.conname
    );
  end loop;
end;
$$;

with normalized_roles as (
  select
    user_id,
    case
      when lower(replace(replace(trim(role), '_', ' '), '-', ' ')) = 'owner' then 'Owner'
      when lower(replace(replace(trim(role), '_', ' '), '-', ' ')) = 'super admin' then 'Super Admin'
      when lower(replace(replace(trim(role), '_', ' '), '-', ' ')) = 'pricing manager' then 'Pricing Manager'
      when lower(replace(replace(trim(role), '_', ' '), '-', ' ')) = 'analyst' then 'Analyst'
      when lower(replace(replace(trim(role), '_', ' '), '-', ' ')) = 'standard user' then 'Standard User'
      else role
    end as normalized_role
  from public.user_roles
)
update public.user_roles as roles
set role = normalized_roles.normalized_role
from normalized_roles
where roles.user_id = normalized_roles.user_id
  and roles.role is distinct from normalized_roles.normalized_role;

alter table public.user_roles
  add constraint user_roles_role_check
  check (role in ('Owner', 'Super Admin', 'Pricing Manager', 'Analyst', 'Standard User'));

insert into public.user_roles (user_id, role, assigned_by)
select
  users.id,
  coalesce(legacy_role.role, 'Standard User'),
  coalesce(legacy_role.assigned_by, 'role-backfill')
from public.users as users
left join public.user_roles as existing_role
  on existing_role.user_id = users.id
left join lateral (
  select role, assigned_by
  from public.user_roles
  where lower(user_id) = lower(users.email)
    and user_id <> users.id
  order by updated_at desc
  limit 1
) as legacy_role on true
where existing_role.user_id is null
on conflict (user_id) do nothing;