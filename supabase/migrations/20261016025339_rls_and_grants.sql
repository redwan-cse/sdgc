-- Migration: rls_and_grants
-- Enables Row-Level Security on all application tables, defines granular access policies, and issues least-privilege grants.

-- 1. Enable RLS on every table
alter table public.venues enable row level security;
alter table public.events enable row level security;
alter table public.pages enable row level security;
alter table public.site_settings enable row level security;
alter table public.media_assets enable row level security;
alter table public.albums enable row level security;
alter table public.album_items enable row level security;
alter table public.legacy_mappings enable row level security;
alter table public.project_interests enable row level security;
alter table public.profiles enable row level security;
alter table public.profile_interests enable row level security;
alter table public.membership_terms enable row level security;
alter table public.memberships enable row level security;
alter table public.payments enable row level security;
alter table public.contact_messages enable row level security;
alter table public.audit_events enable row level security;
alter table public.user_roles enable row level security;

-- 2. Venues policies
create policy "venues_select_all" on public.venues
  for select to anon, authenticated using (true);

create policy "venues_manage_staff" on public.venues
  for all to authenticated
  using (public.has_capability('events.manage'))
  with check (public.has_capability('events.manage'));

-- 3. Events policies
create policy "events_select_public" on public.events
  for select to anon, authenticated
  using (status = 'published' or public.has_capability('events.manage'));

create policy "events_manage_staff" on public.events
  for all to authenticated
  using (public.has_capability('events.manage'))
  with check (public.has_capability('events.manage'));

-- 4. Pages policies
create policy "pages_select_public" on public.pages
  for select to anon, authenticated
  using (status = 'published' or public.has_capability('content.manage'));

create policy "pages_manage_staff" on public.pages
  for all to authenticated
  using (public.has_capability('content.manage'))
  with check (public.has_capability('content.manage'));

-- 5. Site Settings policies
create policy "site_settings_select_all" on public.site_settings
  for select to anon, authenticated using (true);

create policy "site_settings_manage_admin" on public.site_settings
  for all to authenticated
  using (public.has_capability('settings.manage'))
  with check (public.has_capability('settings.manage'));

-- 6. Media Assets policies
create policy "media_assets_select_public" on public.media_assets
  for select to anon, authenticated
  using (is_public = true or public.has_capability('media.manage'));

create policy "media_assets_manage_staff" on public.media_assets
  for all to authenticated
  using (public.has_capability('media.manage'))
  with check (public.has_capability('media.manage'));

-- 7. Albums policies
create policy "albums_select_public" on public.albums
  for select to anon, authenticated
  using (is_public = true or public.has_capability('media.manage'));

create policy "albums_manage_staff" on public.albums
  for all to authenticated
  using (public.has_capability('media.manage'))
  with check (public.has_capability('media.manage'));

-- 8. Album Items policies
create policy "album_items_select_public" on public.album_items
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.albums a
      where a.id = album_items.album_id
        and (a.is_public = true or public.has_capability('media.manage'))
    )
  );

create policy "album_items_manage_staff" on public.album_items
  for all to authenticated
  using (public.has_capability('media.manage'))
  with check (public.has_capability('media.manage'));

-- 9. Legacy Mappings policies
create policy "legacy_mappings_select_all" on public.legacy_mappings
  for select to anon, authenticated using (true);

create policy "legacy_mappings_manage_admin" on public.legacy_mappings
  for all to authenticated
  using (public.has_capability('settings.manage'))
  with check (public.has_capability('settings.manage'));

-- 10. Project Interests policies
create policy "project_interests_select_all" on public.project_interests
  for select to anon, authenticated using (true);

create policy "project_interests_manage_admin" on public.project_interests
  for all to authenticated
  using (public.has_capability('settings.manage'))
  with check (public.has_capability('settings.manage'));

-- 11. Profiles policies
create policy "profiles_select_permitted" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.has_capability('members.manage') or public.has_capability('dues.reconcile'));

create policy "profiles_insert_own" on public.profiles
  for insert to authenticated
  with check (id = auth.uid());

create policy "profiles_update_permitted" on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.has_capability('members.manage'))
  with check (id = auth.uid() or public.has_capability('members.manage'));

create policy "profiles_delete_admin" on public.profiles
  for delete to authenticated
  using (public.has_capability('members.manage'));

-- 12. Profile Interests policies
create policy "profile_interests_select_permitted" on public.profile_interests
  for select to authenticated
  using (user_id = auth.uid() or public.has_capability('members.manage'));

create policy "profile_interests_insert_permitted" on public.profile_interests
  for insert to authenticated
  with check (user_id = auth.uid() or public.has_capability('members.manage'));

create policy "profile_interests_delete_permitted" on public.profile_interests
  for delete to authenticated
  using (user_id = auth.uid() or public.has_capability('members.manage'));

-- 13. Membership Terms policies
create policy "membership_terms_select_all" on public.membership_terms
  for select to anon, authenticated using (true);

create policy "membership_terms_manage_admin" on public.membership_terms
  for all to authenticated
  using (public.has_capability('settings.manage'))
  with check (public.has_capability('settings.manage'));

-- 14. Memberships policies
create policy "memberships_select_permitted" on public.memberships
  for select to authenticated
  using (user_id = auth.uid() or public.has_capability('members.manage') or public.has_capability('dues.reconcile'));

-- A user may only apply for themselves in pending status without forged approvals
create policy "memberships_insert_permitted" on public.memberships
  for insert to authenticated
  with check (
    (user_id = auth.uid() and status = 'pending' and approved_by is null and approved_at is null)
    or public.has_capability('members.manage')
  );

-- Only treasurer or admin can approve or alter membership status
create policy "memberships_update_staff" on public.memberships
  for update to authenticated
  using (public.has_capability('dues.reconcile') or public.has_capability('members.manage'))
  with check (public.has_capability('dues.reconcile') or public.has_capability('members.manage'));

create policy "memberships_delete_admin" on public.memberships
  for delete to authenticated
  using (public.has_capability('members.manage'));

-- 15. Payments policies
create policy "payments_select_permitted" on public.payments
  for select to authenticated
  using (user_id = auth.uid() or public.has_capability('dues.reconcile'));

create policy "payments_insert_permitted" on public.payments
  for insert to authenticated
  with check (
    (user_id = auth.uid() and status = 'pending' and reconciled_by is null and reconciled_at is null)
    or public.has_capability('dues.reconcile')
  );

-- Only treasurer/admin can reconcile or mark payments confirmed/refunded
create policy "payments_update_treasurer" on public.payments
  for update to authenticated
  using (public.has_capability('dues.reconcile'))
  with check (public.has_capability('dues.reconcile'));

create policy "payments_delete_admin" on public.payments
  for delete to authenticated
  using (public.has_capability('members.manage'));

-- 16. Contact Messages policies
-- Public may insert submissions without reading inbox
create policy "contact_messages_insert_public" on public.contact_messages
  for insert to anon, authenticated
  with check (true);

create policy "contact_messages_select_admin" on public.contact_messages
  for select to authenticated
  using (public.has_capability('messages.manage'));

create policy "contact_messages_update_admin" on public.contact_messages
  for update to authenticated
  using (public.has_capability('messages.manage'))
  with check (public.has_capability('messages.manage'));

create policy "contact_messages_delete_admin" on public.contact_messages
  for delete to authenticated
  using (public.has_capability('messages.manage'));

-- 17. Audit Events policies (append-only)
create policy "audit_events_select_admin" on public.audit_events
  for select to authenticated
  using (public.has_capability('audit.view'));

create policy "audit_events_insert_authenticated" on public.audit_events
  for insert to authenticated
  with check (actor_id = auth.uid() or public.has_capability('members.manage'));

-- 18. User Roles policies
create policy "user_roles_select_permitted" on public.user_roles
  for select to authenticated
  using (user_id = auth.uid() or public.has_capability('roles.manage'));

create policy "user_roles_manage_admin" on public.user_roles
  for all to authenticated
  using (public.has_capability('roles.manage'))
  with check (public.has_capability('roles.manage'));

-- 19. Schema Grants
grant usage on schema public to anon, authenticated;

grant select on public.venues to anon, authenticated;
grant select on public.events to anon, authenticated;
grant select on public.pages to anon, authenticated;
grant select on public.site_settings to anon, authenticated;
grant select on public.media_assets to anon, authenticated;
grant select on public.albums to anon, authenticated;
grant select on public.album_items to anon, authenticated;
grant select on public.legacy_mappings to anon, authenticated;
grant select on public.project_interests to anon, authenticated;
grant select on public.membership_terms to anon, authenticated;

grant insert on public.contact_messages to anon, authenticated;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, delete on public.profile_interests to authenticated;
grant select, insert, update, delete on public.memberships to authenticated;
grant select, insert, update, delete on public.payments to authenticated;
grant select, update, delete on public.contact_messages to authenticated;
grant select, insert on public.audit_events to authenticated;
grant select, insert, delete, update on public.user_roles to authenticated;
grant all on public.venues, public.events, public.pages, public.site_settings, public.media_assets, public.albums, public.album_items, public.legacy_mappings to authenticated;

-- Service role administrative access
grant all on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all routines in schema public to service_role;
grant all on all sequences in schema public to service_role;

