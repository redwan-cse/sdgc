-- Migration: 20261016143005_security_and_privacy_boundaries.sql
-- Work Package R1: Closes security and privacy boundaries
-- 1. Restricts public.profiles to owner and authorized staff (denying member-to-member PII leakage)
-- 2. Creates public.member_directory secure projection view exposing only permitted directory fields for active, approved, opted-in members
-- 3. Revokes direct insert on contact_messages from anon/authenticated, adding bounded field length constraints
-- 4. Revokes direct insert on audit_events from authenticated, providing trusted audit logging function

-- ==============================================================================
-- 1. Profiles RLS Hardening (Owner & Staff Only)
-- ==============================================================================
drop policy if exists "profiles_select_permitted" on public.profiles;

create policy "profiles_select_permitted" on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or public.has_capability('members.manage')
    or public.has_capability('dues.reconcile')
  );

-- Profile Interests: owner and staff only (directory access moves to member_directory view)
drop policy if exists "profile_interests_select_permitted" on public.profile_interests;

create policy "profile_interests_select_permitted" on public.profile_interests
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.has_capability('members.manage')
  );

-- ==============================================================================
-- 2. Member Directory Secure Projection View
-- ==============================================================================
create or replace view public.member_directory
with (security_barrier = true)
as
select
  p.id,
  p.username,
  p.first_name,
  p.last_name,
  p.city,
  p.state,
  p.phone,
  p.secondary_phone,
  p.is_master_gardener,
  p.interests_experience,
  coalesce(
    (
      select jsonb_agg(pi.project_code order by pi.project_code)
      from public.profile_interests pi
      where pi.user_id = p.id
    ),
    '[]'::jsonb
  ) as project_interests
from public.profiles p
where (
  -- Requester must be active member or staff
  (public.is_active_member() or public.has_capability('members.manage'))
  -- Target member must be an active approved member
  and public.is_active_member(p.id)
  -- Target member must not have opted out
  and p.directory_opt_out = false
);

grant select on public.member_directory to authenticated;

-- ==============================================================================
-- 3. Contact Messages Write Boundary & Field Bounds
-- ==============================================================================
revoke insert on public.contact_messages from anon, authenticated;
drop policy if exists "contact_messages_insert_public" on public.contact_messages;

alter table public.contact_messages
  drop constraint if exists contact_messages_name_len,
  drop constraint if exists contact_messages_email_len,
  drop constraint if exists contact_messages_message_len;

alter table public.contact_messages
  add constraint contact_messages_name_len check (length(name) >= 1 and length(name) <= 200),
  add constraint contact_messages_email_len check (length(email) >= 3 and length(email) <= 320),
  add constraint contact_messages_message_len check (length(message) >= 1 and length(message) <= 5000);

-- ==============================================================================
-- 4. Trusted Audit Trail Enforcement
-- ==============================================================================
revoke insert on public.audit_events from anon, authenticated;
drop policy if exists "audit_events_insert_authenticated" on public.audit_events;

create or replace function public.log_audit_event(
  p_action text,
  p_entity_type text,
  p_entity_id uuid default null,
  p_details jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_actor_id uuid := auth.uid();
  v_id uuid;
begin
  if not (public.has_capability('members.manage') or public.has_capability('audit.view') or public.has_capability('dues.reconcile')) then
    raise exception 'Unauthorized to record audit events';
  end if;

  insert into public.audit_events (
    actor_id,
    action,
    entity_type,
    entity_id,
    details,
    created_at
  ) values (
    v_actor_id,
    p_action,
    p_entity_type,
    p_entity_id,
    p_details,
    now()
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.log_audit_event(text, text, uuid, jsonb) to authenticated;
