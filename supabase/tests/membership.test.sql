-- pgTAP Test: Membership constraints and active membership rules
begin;
select plan(5);

-- Setup isolated test users and term (year 2099)
insert into auth.users (id, email) values
  ('11111111-0000-0000-0000-000000000001', 'mem_tap1@test.internal'),
  ('11111111-0000-0000-0000-000000000002', 'mem_tap2@test.internal');

insert into public.profiles (id, username, first_name, last_name) values
  ('11111111-0000-0000-0000-000000000001', 'alice_tap', 'Alice', 'Smith'),
  ('11111111-0000-0000-0000-000000000002', 'bob_tap', 'Bob', 'Jones');

insert into public.membership_terms (id, year, dues_cents, currency, opens_at, closes_at) values
  ('a0000000-0000-0000-0000-000000002099', 2099, 5000, 'USD', now() - interval '10 days', now() + interval '300 days');

-- 1. Insert valid pending membership
select lives_ok(
  $$ insert into public.memberships (user_id, term_id, status)
     values ('11111111-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000002099', 'pending') $$,
  'Can insert pending membership'
);

-- 2. Verify duplicate membership for same user/term is rejected
select throws_ok(
  $$ insert into public.memberships (user_id, term_id, status)
     values ('11111111-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000002099', 'approved') $$,
  '23505', -- unique_violation
  null,
  'Duplicate user membership in the same term violates unique constraint'
);

-- 3. Verify invalid status is rejected
select throws_ok(
  $$ insert into public.memberships (user_id, term_id, status)
     values ('11111111-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000002099', 'lifetime') $$,
  '23514', -- check_violation
  null,
  'Invalid membership status violates check constraint'
);

-- 4. Verify is_active_member returns false for pending member
select is(
  public.is_active_member('11111111-0000-0000-0000-000000000001'),
  false,
  'Pending membership is not active'
);

-- 5. Update membership to approved and verify is_active_member returns true
update public.memberships set status = 'approved', approved_at = now()
where user_id = '11111111-0000-0000-0000-000000000001';

select is(
  public.is_active_member('11111111-0000-0000-0000-000000000001'),
  true,
  'Approved membership within term dates is active'
);

select * from finish();
rollback;
