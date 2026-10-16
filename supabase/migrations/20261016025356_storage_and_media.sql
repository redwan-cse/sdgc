-- Migration: storage_and_media
-- Creates the club-media storage bucket and enforces public vs private media storage policies.

-- Create storage bucket for club media (public: false ensures RLS policies are enforced on all object downloads)
insert into storage.buckets (id, name, public)
values ('club-media', 'club-media', false)
on conflict (id) do update set public = false;

-- Storage object policies

-- 1. Public can view non-private media
create policy "club_media_public_read" on storage.objects
  for select to anon, authenticated
  using (
    bucket_id = 'club-media' and
    (storage.foldername(name))[1] is distinct from 'private'
  );

-- 2. Staff can read private media
create policy "club_media_private_read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'club-media' and
    public.has_capability('media.manage')
  );

-- 3. Only staff with media.manage capability can upload media
create policy "club_media_staff_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'club-media' and
    public.has_capability('media.manage')
  );

-- 4. Only staff with media.manage capability can update media
create policy "club_media_staff_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'club-media' and
    public.has_capability('media.manage')
  )
  with check (
    bucket_id = 'club-media' and
    public.has_capability('media.manage')
  );

-- 5. Only staff with media.manage capability can delete media
create policy "club_media_staff_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'club-media' and
    public.has_capability('media.manage')
  );
