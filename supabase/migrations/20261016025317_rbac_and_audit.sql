-- Migration: rbac_and_audit
-- Defines user roles, helper security functions, last-admin protection trigger, and append-only audit trail.

create table public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'editor', 'treasurer')),
  granted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create index user_roles_user_idx on public.user_roles(user_id);
create index user_roles_role_idx on public.user_roles(role);

-- Append-only audit events table
create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  details jsonb not null default '{}'::jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);

create index audit_events_entity_idx on public.audit_events(entity_type, entity_id);
create index audit_events_actor_idx on public.audit_events(actor_id);
create index audit_events_created_at_idx on public.audit_events(created_at desc);

-- Helper: Check if a user has a specific role
create or replace function public.has_role(role_name text, check_user_id uuid default null)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = coalesce(check_user_id, auth.uid())
      and role = role_name
  );
$$;

-- Helper: Check if a user has an administrative capability
create or replace function public.has_capability(capability_name text, check_user_id uuid default null)
returns boolean
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  target_id uuid := coalesce(check_user_id, auth.uid());
begin
  if target_id is null then
    return false;
  end if;

  -- Admin role possesses all capabilities
  if exists (select 1 from public.user_roles where user_id = target_id and role = 'admin') then
    return true;
  end if;

  -- Content / Media / Events management
  if capability_name in ('content.manage', 'events.manage', 'media.manage') then
    return exists (select 1 from public.user_roles where user_id = target_id and role in ('admin', 'editor'));
  end if;

  -- Dues reconciliation & Membership approvals
  if capability_name in ('dues.reconcile', 'memberships.approve') then
    return exists (select 1 from public.user_roles where user_id = target_id and role in ('admin', 'treasurer'));
  end if;

  -- Member management, inbox, role assignment
  if capability_name in ('members.manage', 'messages.manage', 'roles.manage', 'settings.manage', 'audit.view') then
    return exists (select 1 from public.user_roles where user_id = target_id and role = 'admin');
  end if;

  return false;
end;
$$;

-- Helper: Check if user is an approved, active member in the current term
create or replace function public.is_active_member(check_user_id uuid default null)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.memberships m
    join public.membership_terms t on m.term_id = t.id
    where m.user_id = coalesce(check_user_id, auth.uid())
      and m.status = 'approved'
      and now() >= t.opens_at
      and now() <= t.closes_at
  );
$$;

-- Trigger: Prevent removing the last administrator
create or replace function public.protect_last_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'DELETE') or (tg_op = 'UPDATE' and new.role != 'admin') then
    if (select count(*) from public.user_roles where role = 'admin' and user_id != old.user_id) < 1 then
      raise exception 'Cannot remove the last administrator';
    end if;
  end if;
  if tg_op = 'DELETE' then
    return old;
  else
    return new;
  end if;
end;
$$;

create trigger tr_protect_last_admin
before delete or update on public.user_roles
for each row
when (old.role = 'admin')
execute function public.protect_last_admin();
