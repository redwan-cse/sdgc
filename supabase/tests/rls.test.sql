-- pgTAP Test: Row-Level Security enforcement for anon, member, and admin identities
begin;
select plan(12);

-- Setup isolated personas and term (year 2098)
insert into auth.users (id, email) values
  ('aaaa1111-0000-0000-0000-000000000001', 'user_a_rls@test.internal'),
  ('bbbb2222-0000-0000-0000-000000000002', 'user_b_rls@test.internal'),
  ('dddd4444-0000-0000-0000-000000000004', 'admin_rls@test.internal');

insert into public.profiles (id, username, first_name, last_name) values
  ('aaaa1111-0000-0000-0000-000000000001', 'usera_rls', 'Alice', 'Member'),
  ('bbbb2222-0000-0000-0000-000000000002', 'userb_rls', 'Bob', 'Member'),
  ('dddd4444-0000-0000-0000-000000000004', 'admin_rls', 'Admin', 'Staff');

insert into public.membership_terms (id, year, dues_cents, currency, opens_at, closes_at) values
  ('b0000000-0000-0000-0000-000000002098', 2098, 5000, 'USD', now() - interval '1 day', now() + interval '300 days');

insert into public.user_roles (user_id, role) values
  ('dddd4444-0000-0000-0000-000000000004', 'admin');

insert into public.events (slug, title, description, starts_at, ends_at, status) values
  ('rls-test-pub-1', 'Pub 1', 'Desc', now(), now() + interval '1 hour', 'published'),
  ('rls-test-pub-2', 'Pub 2', 'Desc', now(), now() + interval '1 hour', 'published'),
  ('rls-test-draft-1', 'Draft 1', 'Desc', now(), now() + interval '1 hour', 'draft');

-- ----------------------------------------------------
-- Test as Anonymous
-- ----------------------------------------------------
set local role anon;

-- 1. Anon can view published events (at least the 2 inserted)
select cmp_ok(
  (select count(*)::int from public.events where status = 'published' and slug like 'rls-test-%'),
  '>=',
  2,
  'Anon can view published events'
);

-- 2. Anon CANNOT see draft events
select is(
  (select count(*)::int from public.events where slug = 'rls-test-draft-1'),
  0,
  'Anon cannot see draft events'
);

-- 3. Anon is denied SELECT on private profiles table
select throws_ok(
  $$ select count(*) from public.profiles $$,
  '42501', -- insufficient_privilege
  null,
  'Anon has no grant to select from member profiles'
);

-- 4. Anon is denied direct INSERT on contact messages table (server action required)
select throws_ok(
  $$ insert into public.contact_messages (name, email, message)
     values ('Visitor', 'visitor@example.com', 'Hello SDGC') $$,
  '42501',
  null,
  'Anon is denied direct INSERT on contact_messages table'
);

-- 5. Anon is denied SELECT on contact messages inbox
select throws_ok(
  $$ select count(*) from public.contact_messages $$,
  '42501', -- insufficient_privilege
  null,
  'Anon has no grant to select from contact inbox'
);

-- ----------------------------------------------------
-- Test as Authenticated Member (User A)
-- ----------------------------------------------------
set local role authenticated;
set local "request.jwt.claims" to '{"sub": "aaaa1111-0000-0000-0000-000000000001", "role": "authenticated"}';

-- 6. User A can see their own profile
select is(
  (select count(*)::int from public.profiles where id = 'aaaa1111-0000-0000-0000-000000000001'),
  1,
  'User A can see their own profile'
);

-- 7. User A CANNOT see User B profile (filtered by RLS)
select is(
  (select count(*)::int from public.profiles where id = 'bbbb2222-0000-0000-0000-000000000002'),
  0,
  'User A cannot see User B profile'
);

-- 8. User A CANNOT update User B profile (blocked by RLS)
update public.profiles set first_name = 'Hacked' where id = 'bbbb2222-0000-0000-0000-000000000002';
select is(
  (select count(*)::int from public.profiles where id = 'bbbb2222-0000-0000-0000-000000000002' and first_name = 'Hacked'),
  0,
  'User A cannot update User B profile'
);

-- 9. User A can insert pending membership for themselves
select lives_ok(
  $$ insert into public.memberships (user_id, term_id, status)
     values ('aaaa1111-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000002098', 'pending') $$,
  'User A can create pending membership application for self'
);

-- 10. User A CANNOT self-approve their membership (blocked by RLS check)
update public.memberships set status = 'approved' where user_id = 'aaaa1111-0000-0000-0000-000000000001';
select is(
  (select status from public.memberships where user_id = 'aaaa1111-0000-0000-0000-000000000001'),
  'pending',
  'User A cannot approve their own membership'
);

-- 11. User A is denied direct INSERT on audit_events
select throws_ok(
  $$ insert into public.audit_events (actor_id, action, entity_type)
     values ('aaaa1111-0000-0000-0000-000000000001', 'member.approved', 'membership') $$,
  '42501',
  null,
  'User A is denied direct INSERT on audit_events'
);

-- ----------------------------------------------------
-- Test as Admin (Staff)
-- ----------------------------------------------------
set local role authenticated;
set local "request.jwt.claims" to '{"sub": "dddd4444-0000-0000-0000-000000000004", "role": "authenticated"}';

-- 12. Admin can see all profiles via RLS
select is(
  (select count(*)::int from public.profiles where id in ('aaaa1111-0000-0000-0000-000000000001', 'bbbb2222-0000-0000-0000-000000000002', 'dddd4444-0000-0000-0000-000000000004')),
  3,
  'Admin can view all member profiles'
);

select * from finish();
rollback;
