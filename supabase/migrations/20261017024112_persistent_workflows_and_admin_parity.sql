-- Work Package R4: Persistent Workflows, Real Identity Data, and Admin Parity
-- 1. Trusted Staff Member Roster RPC (joins auth.users.email without exposing raw auth table)
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
  left join public.payments pay on pay.membership_id = m.id
  order by m.id, pay.created_at desc;
end;
$$;

grant execute on function public.get_admin_member_roster() to authenticated;

-- 2. Staff Member Profile Update RPC (allows authorized staff to edit member profile with audit logging)
create or replace function public.admin_update_member_profile(
  target_user_id uuid,
  p_first_name text,
  p_last_name text,
  p_phone text,
  p_alt_phone text,
  p_address_line1 text,
  p_address_line2 text,
  p_city text,
  p_state text,
  p_postal_code text,
  p_spouse_first_name text,
  p_is_master_gardener boolean,
  p_directory_opt_out boolean,
  p_gardening_interests text,
  p_work_experience text
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
    first_name = p_first_name,
    last_name = p_last_name,
    phone = p_phone,
    secondary_phone = p_alt_phone,
    address_line1 = p_address_line1,
    address_line2 = p_address_line2,
    city = p_city,
    state = p_state,
    postal_code = p_postal_code,
    spouse_name = p_spouse_first_name,
    is_master_gardener = coalesce(p_is_master_gardener, false),
    directory_opt_out = coalesce(p_directory_opt_out, false),
    gardening_interests = p_gardening_interests,
    volunteer_experience = p_work_experience,
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
      'first_name', p_first_name,
      'last_name', p_last_name
    )
  );
end;
$$;

grant execute on function public.admin_update_member_profile(
  uuid, text, text, text, text, text, text, text, text, text, text, boolean, boolean, text, text
) to authenticated;

-- 3. Update Dues Rate RPC
create or replace function public.update_dues_rate(
  p_term_year integer,
  p_dues_cents integer
)
returns table (
  id uuid,
  year integer,
  dues_cents integer,
  currency text,
  opens_at timestamptz,
  closes_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  caller_id uuid := auth.uid();
  target_term_id uuid;
  old_cents integer;
begin
  if caller_id is null or not (
    public.has_capability('dues.reconcile', caller_id) or
    public.has_capability('members.manage', caller_id)
  ) then
    raise exception 'Access denied: requires dues.reconcile or members.manage capability'
      using errcode = '42501';
  end if;

  if p_dues_cents is null or p_dues_cents < 0 then
    raise exception 'Invalid dues amount: dues must be non-negative'
      using errcode = '22003';
  end if;

  select t.id, t.dues_cents into target_term_id, old_cents
  from public.membership_terms t
  where t.year = p_term_year;

  if target_term_id is null then
    raise exception 'Membership term year % not found', p_term_year
      using errcode = 'P0002';
  end if;

  update public.membership_terms t
  set
    dues_cents = p_dues_cents,
    updated_at = now()
  where t.id = target_term_id;

  insert into public.audit_events (
    actor_id,
    action,
    entity_type,
    entity_id,
    details
  ) values (
    caller_id,
    'dues_rate.updated',
    'membership_terms',
    target_term_id,
    jsonb_build_object(
      'year', p_term_year,
      'old_dues_cents', old_cents,
      'new_dues_cents', p_dues_cents
    )
  );

  return query
  select
    t.id,
    t.year,
    t.dues_cents,
    t.currency,
    t.opens_at,
    t.closes_at,
    t.updated_at
  from public.membership_terms t
  where t.id = target_term_id;
end;
$$;

grant execute on function public.update_dues_rate(integer, integer) to authenticated;

-- 4. Update Policy on membership_terms to include dues.reconcile (treasurer)
drop policy if exists "membership_terms_manage_admin" on public.membership_terms;
drop policy if exists "membership_terms_manage_staff" on public.membership_terms;
create policy "membership_terms_manage_staff" on public.membership_terms
  for all using (
    public.has_capability('members.manage') or
    public.has_capability('dues.reconcile')
  );

-- 5. Seed published 'home' page record for dynamic CMS rendering
insert into public.pages (slug, title, content, status, published_at, meta_description) values
  (
    'home',
    'Saugatuck Douglas Garden Club',
    'Civic landscaping, horticultural education, and community spirit since 1980 across Saugatuck and Douglas, Michigan.',
    'published',
    '2026-01-01 00:00:00-05',
    'Cultivating civic landscaping, horticultural education, and lakeshore community spirit.'
  )
on conflict (slug) do nothing;
