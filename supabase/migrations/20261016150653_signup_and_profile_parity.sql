-- Migration: signup_and_profile_parity
-- Work Package R2: Repair real signup, recovery, and profile parity
-- 1. Separates gardening interests and volunteer experience in public.profiles.
-- 2. Enforces lowercase username uniqueness index.
-- 3. Provisions unconfirmed email signups safely and idempotently via auth.users trigger.
-- 4. Provides an atomic profile and project interests update RPC.
-- 5. Updates member_directory projection view with separated interests.

-- ==============================================================================
-- 1. Profiles Schema Evolution & Username Normalization
-- ==============================================================================
alter table public.profiles
  add column if not exists gardening_interests text,
  add column if not exists volunteer_experience text;

-- Backfill existing single field into gardening_interests if empty
update public.profiles
set gardening_interests = coalesce(gardening_interests, interests_experience)
where interests_experience is not null and gardening_interests is null;

-- Case-insensitive unique index for normalized usernames
create unique index if not exists profiles_lower_username_idx on public.profiles (lower(username));

-- ==============================================================================
-- 2. Member Directory View Refresh
-- ==============================================================================
drop view if exists public.member_directory;

create view public.member_directory
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
  p.gardening_interests,
  p.volunteer_experience,
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
  (public.is_active_member() or public.has_capability('members.manage'))
  and (
    public.is_active_member(p.id)
    and coalesce(p.directory_opt_out, false) = false
  )
);

grant select on public.member_directory to authenticated;

-- ==============================================================================
-- 3. Safe, Idempotent Profile Provisioning Trigger on auth.users
-- ==============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  m_meta jsonb;
  m_username text;
  m_first_name text;
  m_last_name text;
  m_project_codes jsonb;
  m_code text;
  active_term_id uuid;
begin
  m_meta := coalesce(new.raw_user_meta_data, '{}'::jsonb);

  -- Determine normalized username
  m_username := lower(trim(coalesce(
    m_meta->>'username',
    split_part(new.email, '@', 1) || '_' || substr(new.id::text, 1, 4)
  )));

  m_first_name := coalesce(m_meta->>'first_name', 'Member');
  m_last_name := coalesce(m_meta->>'last_name', 'Friend');

  -- Upsert profile row idempotently
  insert into public.profiles (
    id,
    username,
    first_name,
    last_name,
    phone,
    secondary_phone,
    address_line1,
    address_line2,
    city,
    state,
    postal_code,
    birth_month,
    birth_day,
    spouse_name,
    is_master_gardener,
    directory_opt_out,
    gardening_interests,
    volunteer_experience,
    interests_experience,
    created_at,
    updated_at
  ) values (
    new.id,
    m_username,
    m_first_name,
    m_last_name,
    m_meta->>'phone',
    m_meta->>'secondary_phone',
    m_meta->>'address_line1',
    m_meta->>'address_line2',
    coalesce(m_meta->>'city', 'Saugatuck'),
    coalesce(m_meta->>'state', 'MI'),
    coalesce(m_meta->>'postal_code', '49453'),
    (m_meta->>'birth_month')::integer,
    (m_meta->>'birth_day')::integer,
    m_meta->>'spouse_name',
    coalesce((m_meta->>'is_master_gardener')::boolean, false),
    coalesce((m_meta->>'directory_opt_out')::boolean, false),
    m_meta->>'gardening_interests',
    m_meta->>'volunteer_experience',
    coalesce(m_meta->>'interests_experience', m_meta->>'gardening_interests'),
    now(),
    now()
  )
  on conflict (id) do update set
    username = coalesce(profiles.username, excluded.username),
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    phone = coalesce(excluded.phone, profiles.phone),
    secondary_phone = coalesce(excluded.secondary_phone, profiles.secondary_phone),
    address_line1 = coalesce(excluded.address_line1, profiles.address_line1),
    address_line2 = coalesce(excluded.address_line2, profiles.address_line2),
    city = coalesce(excluded.city, profiles.city),
    state = coalesce(excluded.state, profiles.state),
    postal_code = coalesce(excluded.postal_code, profiles.postal_code),
    birth_month = coalesce(excluded.birth_month, profiles.birth_month),
    birth_day = coalesce(excluded.birth_day, profiles.birth_day),
    spouse_name = coalesce(excluded.spouse_name, profiles.spouse_name),
    is_master_gardener = coalesce(excluded.is_master_gardener, profiles.is_master_gardener),
    directory_opt_out = coalesce(excluded.directory_opt_out, profiles.directory_opt_out),
    gardening_interests = coalesce(excluded.gardening_interests, profiles.gardening_interests),
    volunteer_experience = coalesce(excluded.volunteer_experience, profiles.volunteer_experience),
    interests_experience = coalesce(excluded.interests_experience, profiles.interests_experience),
    updated_at = now();

  -- Insert project interests if present in metadata array
  m_project_codes := m_meta->'project_interests';
  if m_project_codes is not null and jsonb_typeof(m_project_codes) = 'array' then
    for m_code in select jsonb_array_elements_text(m_project_codes) loop
      if exists (select 1 from public.project_interests where code = m_code) then
        insert into public.profile_interests (user_id, project_code)
        values (new.id, m_code)
        on conflict (user_id, project_code) do nothing;
      end if;
    end loop;
  end if;

  -- Look up active term or latest term to create initial pending membership
  select id into active_term_id
  from public.membership_terms
  where opens_at <= now() and closes_at >= now()
  order by year desc
  limit 1;

  if active_term_id is null then
    select id into active_term_id
    from public.membership_terms
    order by year desc
    limit 1;
  end if;

  if active_term_id is not null then
    insert into public.memberships (user_id, term_id, status, notes)
    values (new.id, active_term_id, 'pending', 'Online member registration')
    on conflict (user_id, term_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ==============================================================================
-- 4. Atomic Profile and Interests Update RPC
-- ==============================================================================
create or replace function public.update_member_profile(
  p_first_name text,
  p_last_name text,
  p_spouse_name text default null,
  p_phone text default null,
  p_secondary_phone text default null,
  p_address_line1 text default null,
  p_address_line2 text default null,
  p_city text default null,
  p_state text default null,
  p_postal_code text default null,
  p_birth_month integer default null,
  p_birth_day integer default null,
  p_is_master_gardener boolean default false,
  p_directory_opt_out boolean default false,
  p_gardening_interests text default null,
  p_volunteer_experience text default null,
  p_project_interests text[] default '{}'::text[]
)
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_user_id uuid;
  v_code text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  update public.profiles set
    first_name = p_first_name,
    last_name = p_last_name,
    spouse_name = p_spouse_name,
    phone = p_phone,
    secondary_phone = p_secondary_phone,
    address_line1 = p_address_line1,
    address_line2 = p_address_line2,
    city = p_city,
    state = p_state,
    postal_code = p_postal_code,
    birth_month = p_birth_month,
    birth_day = p_birth_day,
    is_master_gardener = coalesce(p_is_master_gardener, false),
    directory_opt_out = coalesce(p_directory_opt_out, false),
    gardening_interests = p_gardening_interests,
    volunteer_experience = p_volunteer_experience,
    interests_experience = coalesce(p_gardening_interests, p_volunteer_experience),
    updated_at = now()
  where id = v_user_id;

  delete from public.profile_interests where user_id = v_user_id;

  if p_project_interests is not null then
    foreach v_code in array p_project_interests loop
      if exists (select 1 from public.project_interests where code = v_code) then
        insert into public.profile_interests (user_id, project_code)
        values (v_user_id, v_code);
      end if;
    end loop;
  end if;
end;
$$;

grant execute on function public.update_member_profile to authenticated;
