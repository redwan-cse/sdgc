-- Migration: term_editing_and_deadline_extension
-- Authorizes staff to manage terms, extend deadlines (closes_at), adjust rates, and create new membership terms.

grant select, insert, update on public.membership_terms to authenticated;

-- Function: update_membership_term
create or replace function public.update_membership_term(
  p_term_id uuid,
  p_dues_cents integer default null,
  p_opens_at timestamptz default null,
  p_closes_at timestamptz default null
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
set search_path = public
as $$
declare
  caller_id uuid := auth.uid();
  old_rec public.membership_terms%rowtype;
begin
  if caller_id is null or not (
    public.has_capability('dues.reconcile', caller_id) or
    public.has_capability('members.manage', caller_id)
  ) then
    raise exception 'Access denied: requires dues.reconcile or members.manage capability'
      using errcode = '42501';
  end if;

  select * into old_rec from public.membership_terms t where t.id = p_term_id;
  if not found then
    raise exception 'Membership term % not found', p_term_id
      using errcode = 'P0002';
  end if;

  if p_dues_cents is not null and p_dues_cents < 0 then
    raise exception 'Invalid dues amount: dues must be non-negative'
      using errcode = '22003';
  end if;

  if p_opens_at is not null and p_closes_at is not null and p_closes_at <= p_opens_at then
    raise exception 'Closing date must be after opening date'
      using errcode = '22007';
  end if;

  update public.membership_terms t
  set
    dues_cents = coalesce(p_dues_cents, t.dues_cents),
    opens_at = coalesce(p_opens_at, t.opens_at),
    closes_at = coalesce(p_closes_at, t.closes_at),
    updated_at = now()
  where t.id = p_term_id;

  insert into public.audit_events (
    actor_id,
    action,
    entity_type,
    entity_id,
    details
  ) values (
    caller_id,
    'membership_term.updated',
    'membership_terms',
    p_term_id,
    jsonb_build_object(
      'year', old_rec.year,
      'old_dues_cents', old_rec.dues_cents,
      'new_dues_cents', coalesce(p_dues_cents, old_rec.dues_cents),
      'old_closes_at', old_rec.closes_at,
      'new_closes_at', coalesce(p_closes_at, old_rec.closes_at)
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
  where t.id = p_term_id;
end;
$$;

grant execute on function public.update_membership_term(uuid, integer, timestamptz, timestamptz) to authenticated;

-- Function: create_membership_term
create or replace function public.create_membership_term(
  p_year integer,
  p_dues_cents integer,
  p_opens_at timestamptz,
  p_closes_at timestamptz,
  p_currency text default 'USD'
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
set search_path = public
as $$
declare
  caller_id uuid := auth.uid();
  new_id uuid;
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

  if p_closes_at <= p_opens_at then
    raise exception 'Closing date must be after opening date'
      using errcode = '22007';
  end if;

  insert into public.membership_terms (
    year,
    dues_cents,
    currency,
    opens_at,
    closes_at
  ) values (
    p_year,
    p_dues_cents,
    coalesce(p_currency, 'USD'),
    p_opens_at,
    p_closes_at
  ) returning public.membership_terms.id into new_id;

  insert into public.audit_events (
    actor_id,
    action,
    entity_type,
    entity_id,
    details
  ) values (
    caller_id,
    'membership_term.created',
    'membership_terms',
    new_id,
    jsonb_build_object(
      'year', p_year,
      'dues_cents', p_dues_cents,
      'opens_at', p_opens_at,
      'closes_at', p_closes_at
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
  where t.id = new_id;
end;
$$;

grant execute on function public.create_membership_term(integer, integer, timestamptz, timestamptz, text) to authenticated;
