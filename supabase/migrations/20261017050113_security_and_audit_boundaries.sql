-- Migration: security_and_audit_boundaries
-- Implements V11 review corrections for storage object privacy, transactional audit logging,
-- contact form abuse rate limiting, and real curated gallery media assets.

-- 1. Storage Object Privacy (V11-05)
-- Tie storage object readability strictly to whether media_assets.is_public = true or caller has media.manage
create or replace function public.is_media_object_public(object_name text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select case
    -- Any object under private/ is never public
    when (storage.foldername(object_name))[1] = 'private' then false
    -- If tracked in media_assets, strictly follow is_public flag
    when exists (select 1 from public.media_assets where storage_path = object_name) then
      coalesce((select is_public from public.media_assets where storage_path = object_name), false)
    -- If not tracked in media_assets, allow legacy public/ prefix
    when (storage.foldername(object_name))[1] = 'public' then true
    else false
  end;
$$;

drop policy if exists "club_media_public_read" on storage.objects;

create policy "club_media_public_read" on storage.objects
  for select to anon, authenticated
  using (
    bucket_id = 'club-media' and
    (
      public.is_media_object_public(name) or
      public.has_capability('media.manage')
    )
  );

-- 2. Financial Simulation & Webhook Boundaries (V11-01)
-- Separate provider_session_id from provider_transaction_id to distinguish checkout sessions from payment intents/charges
alter table public.payments add column if not exists provider_session_id text;
create index if not exists payments_provider_session_idx on public.payments(provider_session_id);
create index if not exists payments_provider_tx_idx on public.payments(provider_transaction_id);

-- 3. Truthful & Transactional Role Mutations with Atomic Audit Logging (V11-08)
-- Revoke arbitrary log_audit_event so untrusted/cross-domain staff cannot fabricate fake audit logs
revoke execute on function public.log_audit_event(text, text, uuid, jsonb) from authenticated;

create or replace function public.set_user_roles(
  p_target_user_id uuid,
  p_new_roles text[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_role text;
begin
  -- Strict authorization: only admins with members.manage capability can mutate roles
  if not public.has_capability('members.manage') then
    raise exception 'Unauthorized to manage member roles';
  end if;

  if p_target_user_id is null then
    raise exception 'Target user id cannot be null';
  end if;

  -- Atomic transactional replacement of roles
  delete from public.user_roles where user_id = p_target_user_id;

  if p_new_roles is not null and array_length(p_new_roles, 1) > 0 then
    foreach v_role in array p_new_roles loop
      if v_role in ('admin', 'editor', 'treasurer') then
        insert into public.user_roles (user_id, role)
        values (p_target_user_id, v_role);
      else
        raise exception 'Invalid role name: %', v_role;
      end if;
    end loop;
  end if;

  -- Truthful, transactional audit log insertion within the same transaction
  insert into public.audit_events (
    actor_id,
    action,
    entity_type,
    entity_id,
    details,
    created_at
  ) values (
    v_actor_id,
    'roles.updated',
    'user',
    p_target_user_id,
    jsonb_build_object('roles', p_new_roles),
    now()
  );
end;
$$;

grant execute on function public.set_user_roles(uuid, text[]) to authenticated;

-- 3. Contact Form Durable Rate Limiting (V11-10)
create table if not exists public.contact_rate_limits (
  ip text primary key,
  submission_count integer not null default 1,
  window_start timestamp with time zone not null default now(),
  last_submitted_at timestamp with time zone not null default now()
);

alter table public.contact_rate_limits enable row level security;

-- Function to check and record contact rate limits atomically
create or replace function public.check_contact_rate_limit(
  p_client_ip text,
  p_max_submissions integer default 5,
  p_window_seconds integer default 300
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamp with time zone := now();
  v_record record;
begin
  if p_client_ip is null or length(trim(p_client_ip)) = 0 then
    return true; -- Allow if IP cannot be detected
  end if;

  select * into v_record from public.contact_rate_limits where ip = p_client_ip for update;

  if not found then
    insert into public.contact_rate_limits (ip, submission_count, window_start, last_submitted_at)
    values (p_client_ip, 1, v_now, v_now);
    return true;
  end if;

  -- Check if existing window has expired
  if v_now > (v_record.window_start + (p_window_seconds || ' seconds')::interval) then
    update public.contact_rate_limits
    set submission_count = 1,
        window_start = v_now,
        last_submitted_at = v_now
    where ip = p_client_ip;
    return true;
  end if;

  -- Within current window: check limit
  if v_record.submission_count >= p_max_submissions then
    return false; -- Rate limited
  end if;

  update public.contact_rate_limits
  set submission_count = submission_count + 1,
      last_submitted_at = v_now
  where ip = p_client_ip;

  return true;
end;
$$;

grant execute on function public.check_contact_rate_limit(text, integer, integer) to anon, authenticated;

-- 4. Seed Curated Gallery Media Assets into Database (V11-06)
-- Convert static array items into managed database records with valid UUIDs
insert into public.albums (id, slug, title, description, year, is_public) values
  ('a1111111-1111-1111-1111-111111111111', 'garden-walk-highlights', 'Garden Walk Highlights', 'Select photos from recent Saugatuck Douglas Garden Walks.', 2025, true),
  ('a2222222-2222-2222-2222-222222222222', 'civic-beautification', 'Civic Beautification Projects', 'Community planting and municipal flower installations.', 2025, true)
on conflict (id) do nothing;

insert into public.media_assets (id, storage_path, mime_type, size_bytes, width, height, alt_text, caption, is_public) values
  ('c5555555-5555-5555-5555-555555555501', '/images/gallery/garden-walk-2025.jpeg', 'image/jpeg', 1085659, 1200, 800, 'Tourists exploring private shade garden on Garden Walk', 'Visitors enjoying lush hostas, Japanese maples, and woodland perennials during the annual Garden Walk.', true),
  ('c5555555-5555-5555-5555-555555555502', '/images/gallery/garden-walk-tourists.jpeg', 'image/jpeg', 1067403, 1200, 800, 'Garden tour attendees strolling along woodland pathway', 'Stone garden pathway flanked by native ferns and summer blooms.', true),
  ('c5555555-5555-5555-5555-555555555503', '/images/gallery/plant-sale-perennials.jpeg', 'image/jpeg', 782417, 1200, 800, 'Membership Perennial Plant Sale at the Old School House', 'Hardy perennial divisions and garden treasures at the Old School House in Douglas.', true),
  ('c5555555-5555-5555-5555-555555555504', '/images/gallery/community-beautification-pots.jpeg', 'image/jpeg', 947561, 1200, 800, 'Downtown sidewalk planters planted by club volunteers', 'Civic planters bringing vibrant seasonal colors to Saugatuck downtown sidewalks.', true),
  ('c5555555-5555-5555-5555-555555555505', '/images/gallery/volunteers-watering.jpeg', 'image/jpeg', 839532, 1200, 800, 'Garden Club volunteers tending civic garden bump-outs', 'Dedicated ''Water Girls'' team caring for Douglas City Hall corner plots throughout the summer.', true),
  ('c5555555-5555-5555-5555-555555555506', '/images/gallery/downtown-planters.jpeg', 'image/jpeg', 866247, 1200, 800, 'Lush flowering urns outside public library', 'Douglas Library flower displays maintained through volunteer garden workbees.', true),
  ('c5555555-5555-5555-5555-555555555507', '/images/gallery/garden-awards.jpeg', 'image/jpeg', 992480, 1200, 800, 'Local Garden Recognition Award winning garden', 'Residential award winner recognized for exceptional landscaping and native pollinator design.', true),
  ('c5555555-5555-5555-5555-555555555508', '/images/gallery/educational-programs.jpeg', 'image/jpeg', 756263, 1200, 800, 'Monthly educational presentation and workshop', 'Guest lecture on organic soil health and native Michigan perennials.', true),
  ('c5555555-5555-5555-5555-555555555509', '/images/gallery/new-members-party.jpeg', 'image/jpeg', 964935, 1200, 800, 'Annual New Member Reception and social celebration', 'Welcoming new garden lovers into the Saugatuck Douglas Garden Club family.', true)
on conflict (id) do update set
  storage_path = excluded.storage_path,
  is_public = excluded.is_public,
  alt_text = excluded.alt_text,
  caption = excluded.caption;

-- Associate with albums
insert into public.album_items (album_id, media_asset_id, sort_order) values
  ('a1111111-1111-1111-1111-111111111111', 'c5555555-5555-5555-5555-555555555501', 1),
  ('a1111111-1111-1111-1111-111111111111', 'c5555555-5555-5555-5555-555555555502', 2),
  ('a1111111-1111-1111-1111-111111111111', 'c5555555-5555-5555-5555-555555555503', 3),
  ('a1111111-1111-1111-1111-111111111111', 'c5555555-5555-5555-5555-555555555508', 4),
  ('a2222222-2222-2222-2222-222222222222', 'c5555555-5555-5555-5555-555555555504', 1),
  ('a2222222-2222-2222-2222-222222222222', 'c5555555-5555-5555-5555-555555555505', 2),
  ('a2222222-2222-2222-2222-222222222222', 'c5555555-5555-5555-5555-555555555506', 3),
  ('a2222222-2222-2222-2222-222222222222', 'c5555555-5555-5555-5555-555555555507', 4),
  ('a2222222-2222-2222-2222-222222222222', 'c5555555-5555-5555-5555-555555555509', 5)
on conflict (album_id, media_asset_id) do update set sort_order = excluded.sort_order;
