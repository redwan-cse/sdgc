-- Migration: Admin Member Privacy, Notes Persistence, and Financial State Machine Guards
-- Addresses findings A01 (Privacy overwrite & dropped notes) and A02 (Invalid approval/reconciliation state transitions)

-- 1. Add admin_notes column to profiles
alter table public.profiles
  add column if not exists admin_notes text;

-- 2. Staff Member Profile Update RPC: Support Partial Updates and Notes Persistence
drop function if exists public.admin_update_member_profile(uuid, text, text, text, text, text, text, text, text, text, text, boolean, boolean, text, text);
drop function if exists public.admin_update_member_profile(uuid, text, text, text, text, text, text, text, text, text, text, boolean, boolean, text, text, text);

create or replace function public.admin_update_member_profile(
  target_user_id uuid,
  p_first_name text default null,
  p_last_name text default null,
  p_phone text default null,
  p_alt_phone text default null,
  p_address_line1 text default null,
  p_address_line2 text default null,
  p_city text default null,
  p_state text default null,
  p_postal_code text default null,
  p_spouse_first_name text default null,
  p_is_master_gardener boolean default null,
  p_directory_opt_out boolean default null,
  p_gardening_interests text default null,
  p_work_experience text default null,
  p_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  caller_id uuid := auth.uid();
begin
  if caller_id is null or not public.has_capability('members.manage', caller_id) then
    raise exception 'Access denied: requires members.manage capability'
      using errcode = '42501';
  end if;

  update public.profiles
  set
    first_name = coalesce(p_first_name, first_name),
    last_name = coalesce(p_last_name, last_name),
    phone = coalesce(p_phone, phone),
    secondary_phone = coalesce(p_alt_phone, secondary_phone),
    address_line1 = coalesce(p_address_line1, address_line1),
    address_line2 = coalesce(p_address_line2, address_line2),
    city = coalesce(p_city, city),
    state = coalesce(p_state, state),
    postal_code = coalesce(p_postal_code, postal_code),
    spouse_name = coalesce(p_spouse_first_name, spouse_name),
    is_master_gardener = coalesce(p_is_master_gardener, is_master_gardener),
    directory_opt_out = coalesce(p_directory_opt_out, directory_opt_out),
    gardening_interests = coalesce(p_gardening_interests, gardening_interests),
    volunteer_experience = coalesce(p_work_experience, volunteer_experience),
    admin_notes = coalesce(p_notes, admin_notes),
    updated_at = now()
  where id = target_user_id;

  if not found then
    raise exception 'Member profile not found for user %', target_user_id
      using errcode = 'P0002';
  end if;

  insert into public.audit_events (
    actor_id,
    action,
    entity_type,
    entity_id,
    details
  ) values (
    caller_id,
    'member.profile_updated_by_admin',
    'profiles',
    target_user_id,
    jsonb_build_object(
      'updated_by', caller_id,
      'first_name', coalesce(p_first_name, (select first_name from public.profiles where id = target_user_id)),
      'last_name', coalesce(p_last_name, (select last_name from public.profiles where id = target_user_id)),
      'directory_opt_out_updated', (p_directory_opt_out is not null),
      'notes_updated', (p_notes is not null)
    )
  );
end;
$$;

grant execute on function public.admin_update_member_profile(
  uuid, text, text, text, text, text, text, text, text, text, text, boolean, boolean, text, text, text
) to authenticated;

-- 3. Administrative Member Roster RPC: Include admin notes and opt-out
drop function if exists public.get_admin_member_roster();

create or replace function public.get_admin_member_roster()
returns table (
  id uuid,
  user_id uuid,
  username text,
  first_name text,
  last_name text,
  email text,
  phone text,
  alt_phone text,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  birth_month integer,
  birth_day integer,
  spouse_first_name text,
  is_master_gardener boolean,
  directory_opt_out boolean,
  gardening_interests text,
  work_experience text,
  admin_notes text,
  term_year integer,
  dues_cents integer,
  status text,
  version integer,
  payment_status text,
  payment_method text,
  payment_amount_cents integer,
  applied_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  caller_id uuid := auth.uid();
begin
  if caller_id is null or not (
    public.has_capability('members.manage', caller_id) or
    public.has_capability('memberships.approve', caller_id) or
    public.has_capability('dues.reconcile', caller_id)
  ) then
    raise exception 'Access denied: insufficient capabilities to view administrative member roster'
      using errcode = '42501';
  end if;

  return query
  select distinct on (m.id)
    m.id,
    m.user_id,
    p.username,
    p.first_name,
    p.last_name,
    coalesce(u.email::text, p.username || '@unknown.local') as email,
    p.phone,
    p.secondary_phone as alt_phone,
    p.address_line1,
    p.address_line2,
    p.city,
    p.state,
    p.postal_code,
    p.birth_month,
    p.birth_day,
    p.spouse_name as spouse_first_name,
    p.is_master_gardener,
    p.directory_opt_out,
    p.gardening_interests,
    p.volunteer_experience as work_experience,
    coalesce(p.admin_notes, m.notes) as admin_notes,
    t.year as term_year,
    t.dues_cents,
    m.status::text,
    m.version,
    pay.status::text as payment_status,
    pay.payment_method::text as payment_method,
    pay.amount_cents as payment_amount_cents,
    m.created_at as applied_at,
    m.updated_at
  from public.memberships m
  join public.profiles p on p.id = m.user_id
  join public.membership_terms t on t.id = m.term_id
  left join auth.users u on u.id = m.user_id
  left join lateral (
    select pay_inner.status, pay_inner.payment_method, pay_inner.amount_cents
    from public.payments pay_inner
    where pay_inner.membership_id = m.id
    order by pay_inner.created_at desc
    limit 1
  ) pay on true
  order by m.id, m.created_at desc;
end;
$$;

grant execute on function public.get_admin_member_roster() to authenticated;

-- 4. Atomic Membership Approval Procedure: Payment or Audited Waiver Enforced
drop function if exists public.approve_membership(uuid, integer);
drop function if exists public.approve_membership(uuid, integer, boolean, text);

create or replace function public.approve_membership(
  p_membership_id uuid,
  p_expected_version integer default null,
  p_waive_dues boolean default false,
  p_waiver_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_membership public.memberships%rowtype;
  v_caller uuid := auth.uid();
  v_has_confirmed_payment boolean;
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

  if v_membership.status not in ('pending') then
    return jsonb_build_object('success', false, 'error', 'Cannot approve membership in status: ' || v_membership.status);
  end if;

  if p_expected_version is not null and v_membership.version != p_expected_version then
    return jsonb_build_object('success', false, 'error', 'Stale version conflict', 'current_version', v_membership.version);
  end if;

  -- Payment / Waiver verification
  if p_waive_dues then
    if not public.has_capability('members.manage', v_caller) then
      return jsonb_build_object('success', false, 'error', 'Only administrators can waive membership dues');
    end if;
    if p_waiver_reason is null or length(trim(p_waiver_reason)) = 0 then
      return jsonb_build_object('success', false, 'error', 'A documented reason is required to waive membership dues');
    end if;
  else
    select exists (
      select 1
      from public.payments
      where membership_id = p_membership_id
        and status = 'confirmed'
    ) into v_has_confirmed_payment;

    if not v_has_confirmed_payment then
      return jsonb_build_object(
        'success', false,
        'error', 'Cannot approve membership: dues payment must be confirmed before manual approval'
      );
    end if;
  end if;

  update public.memberships
  set
    status = 'approved',
    approved_by = v_caller,
    approved_at = now(),
    notes = case
      when p_waive_dues then coalesce(notes || E'\n', '') || 'Dues waived by admin: ' || trim(p_waiver_reason)
      else notes
    end,
    version = version + 1,
    updated_at = now()
  where id = p_membership_id;

  -- Insert audit log
  insert into public.audit_events (actor_id, action, entity_type, entity_id, details)
  values (v_caller, 'membership.approved', 'membership', p_membership_id::text, jsonb_build_object(
    'user_id', v_membership.user_id,
    'term_id', v_membership.term_id,
    'previous_status', v_membership.status,
    'dues_waived', p_waive_dues,
    'waiver_reason', p_waiver_reason
  ));

  return jsonb_build_object('success', true, 'new_version', v_membership.version + 1);
end;
$$;

grant execute on function public.approve_membership(uuid, integer, boolean, text) to authenticated;

-- 5. Atomic Dues Reconciliation Procedure: Enforce check payment method and pending status
drop function if exists public.reconcile_payment(uuid, text);

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

  if v_payment.payment_method != 'check' then
    return jsonb_build_object(
      'success', false,
      'error', 'Only paper-check payments can be manually reconciled (current method: ' || coalesce(v_payment.payment_method, 'unknown') || ')'
    );
  end if;

  if v_payment.status != 'pending' then
    return jsonb_build_object(
      'success', false,
      'error', 'Only pending check payments can be reconciled (current status: ' || v_payment.status || ')'
    );
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

grant execute on function public.reconcile_payment(uuid, text) to authenticated;
