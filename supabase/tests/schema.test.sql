-- pgTAP Test: Schema constraints, column validations, and foreign keys
begin;
select plan(16);

-- 1. Verify primary tables exist
select has_table('public', 'venues', 'venues table exists');
select has_table('public', 'events', 'events table exists');
select has_table('public', 'pages', 'pages table exists');
select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'project_interests', 'project_interests table exists');
select has_table('public', 'profile_interests', 'profile_interests table exists');
select has_table('public', 'membership_terms', 'membership_terms table exists');
select has_table('public', 'memberships', 'memberships table exists');
select has_table('public', 'payments', 'payments table exists');
select has_table('public', 'contact_messages', 'contact_messages table exists');
select has_table('public', 'user_roles', 'user_roles table exists');
select has_table('public', 'audit_events', 'audit_events table exists');

-- 2. Verify negative dues amount is blocked
select throws_ok(
  $$ insert into public.membership_terms (year, dues_cents, currency, opens_at, closes_at)
     values (2099, -100, 'USD', now(), now() + interval '1 year') $$,
  '23514', -- check_violation
  null,
  'Negative dues amount violates check constraint'
);

-- 3. Verify event with ends_at before starts_at is blocked
select throws_ok(
  $$ insert into public.events (slug, title, description, starts_at, ends_at)
     values ('invalid-event-dates', 'Test', 'Desc', now() + interval '2 hours', now()) $$,
  '23514', -- check_violation
  null,
  'Event ends_at before starts_at violates range constraint'
);

-- 4. Verify birthday constraint rejects invalid dates (e.g. Feb 30)
-- Setup dummy user in auth.users for profile test
insert into auth.users (id, email) values ('00000000-0000-0000-0000-000000000001', 'synth1@sdgc.local');

select throws_ok(
  $$ update public.profiles
     set birth_month = 2, birth_day = 30
     where id = '00000000-0000-0000-0000-000000000001' $$,
  '23514', -- check_violation
  null,
  'February 30 is rejected by birthday check constraint'
);

-- 5. Verify February 29 IS valid (without requiring birth year)
select lives_ok(
  $$ update public.profiles
     set birth_month = 2, birth_day = 29
     where id = '00000000-0000-0000-0000-000000000001' $$,
  'February 29 validates successfully for leap year birthdays'
);

select * from finish();
rollback;
