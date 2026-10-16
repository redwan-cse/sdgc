-- Migration: directory_and_admin_operations
-- Adds directory opt-out, membership versioning for concurrency control,
-- directory RLS policies for active members, and atomic admin reconciliation/approval procedures.

-- 1. Schema additions
alter table public.profiles
  add column if not exists directory_opt_out boolean not null default false;

alter table public.memberships
  add column if not exists version integer not null default 1;

-- 2. Update Profiles RLS for Member Directory
drop policy if exists "profiles_select_permitted" on public.profiles;

create policy "profiles_select_permitted" on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or public.has_capability('members.manage')
    or public.has_capability('dues.reconcile')
    or (public.is_active_member() and directory_opt_out = false)
  );

-- 3. Update Profile Interests RLS for Member Directory
drop policy if exists "profile_interests_select_permitted" on public.profile_interests;

create policy "profile_interests_select_permitted" on public.profile_interests
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.has_capability('members.manage')
    or (
      public.is_active_member()
      and exists (
        select 1 from public.profiles p
        where p.id = profile_interests.user_id
          and p.directory_opt_out = false
      )
    )
  );

-- 4. Atomic Membership Approval Procedure with Optimistic Concurrency Control
create or replace function public.approve_membership(
  p_membership_id uuid,
  p_expected_version integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_membership public.memberships%rowtype;
  v_caller uuid := auth.uid();
begin
  if not (public.has_capability('members.manage') or public.has_capability('memberships.approve') or public.has_capability('dues.reconcile')) then
    raise exception 'Unauthorized to approve membership';
  end if;

  select * into v_membership
  from public.memberships
  where id = p_membership_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Membership not found');
  end if;

  if v_membership.status = 'approved' then
    return jsonb_build_object('success', false, 'error', 'Membership is already approved');
  end if;

  if p_expected_version is not null and v_membership.version != p_expected_version then
    return jsonb_build_object('success', false, 'error', 'Stale version conflict', 'current_version', v_membership.version);
  end if;

  update public.memberships
  set
    status = 'approved',
    approved_by = v_caller,
    approved_at = now(),
    version = version + 1,
    updated_at = now()
  where id = p_membership_id;

  -- Insert audit log
  insert into public.audit_events (actor_id, action, entity_type, entity_id, details)
  values (v_caller, 'membership.approved', 'membership', p_membership_id::text, jsonb_build_object(
    'user_id', v_membership.user_id,
    'term_id', v_membership.term_id,
    'previous_status', v_membership.status
  ));

  return jsonb_build_object('success', true, 'new_version', v_membership.version + 1);
end;
$$;

-- 5. Atomic Dues Reconciliation Procedure
create or replace function public.reconcile_payment(
  p_payment_id uuid,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_payment public.payments%rowtype;
  v_caller uuid := auth.uid();
begin
  if not (public.has_capability('dues.reconcile') or public.has_capability('members.manage')) then
    raise exception 'Unauthorized to reconcile dues';
  end if;

  select * into v_payment
  from public.payments
  where id = p_payment_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Payment not found');
  end if;

  if v_payment.status = 'confirmed' then
    return jsonb_build_object('success', false, 'error', 'Payment is already confirmed');
  end if;

  update public.payments
  set
    status = 'confirmed',
    reconciled_by = v_caller,
    reconciled_at = now(),
    notes = coalesce(p_notes, notes),
    updated_at = now()
  where id = p_payment_id;

  -- Insert audit log
  insert into public.audit_events (actor_id, action, entity_type, entity_id, details)
  values (v_caller, 'payment.reconciled', 'payment', p_payment_id::text, jsonb_build_object(
    'amount_cents', v_payment.amount_cents,
    'payment_method', v_payment.payment_method,
    'membership_id', v_payment.membership_id
  ));

  return jsonb_build_object('success', true);
end;
$$;

-- 6. Grants
grant execute on function public.approve_membership(uuid, integer) to authenticated;
grant execute on function public.reconcile_payment(uuid, text) to authenticated;
