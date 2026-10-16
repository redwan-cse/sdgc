-- pgTAP Test: RBAC capability mappings and last-admin protection
begin;
select plan(7);

-- Setup test users
insert into auth.users (id, email) values
  ('eeee1111-0000-0000-0000-000000000001', 'editor_roles@test.internal'),
  ('ffff2222-0000-0000-0000-000000000002', 'treasurer_roles@test.internal'),
  ('99993333-0000-0000-0000-000000000003', 'admin_roles1@test.internal');

insert into public.user_roles (user_id, role) values
  ('eeee1111-0000-0000-0000-000000000001', 'editor'),
  ('ffff2222-0000-0000-0000-000000000002', 'treasurer'),
  ('99993333-0000-0000-0000-000000000003', 'admin');

-- 1. Editor has content.manage capability
select is(
  public.has_capability('content.manage', 'eeee1111-0000-0000-0000-000000000001'),
  true,
  'Editor has content.manage capability'
);

-- 2. Editor does NOT have dues.reconcile capability
select is(
  public.has_capability('dues.reconcile', 'eeee1111-0000-0000-0000-000000000001'),
  false,
  'Editor does NOT have dues.reconcile capability'
);

-- 3. Treasurer has dues.reconcile capability
select is(
  public.has_capability('dues.reconcile', 'ffff2222-0000-0000-0000-000000000002'),
  true,
  'Treasurer has dues.reconcile capability'
);

-- 4. Treasurer does NOT have content.manage capability
select is(
  public.has_capability('content.manage', 'ffff2222-0000-0000-0000-000000000002'),
  false,
  'Treasurer does NOT have content.manage capability'
);

-- 5. Admin has all capabilities
select is(
  public.has_capability('content.manage', '99993333-0000-0000-0000-000000000003') and
  public.has_capability('dues.reconcile', '99993333-0000-0000-0000-000000000003') and
  public.has_capability('roles.manage', '99993333-0000-0000-0000-000000000003'),
  true,
  'Admin has all capabilities'
);

-- 6. Last-admin protection trigger: deleting the sole admin fails
-- Remove any non-test admins within this transaction to isolate the test
delete from public.user_roles where role = 'admin' and user_id != '99993333-0000-0000-0000-000000000003';

select throws_ok(
  $$ delete from public.user_roles where user_id = '99993333-0000-0000-0000-000000000003' and role = 'admin' $$,
  'P0001', -- raise_exception
  'Cannot remove the last administrator',
  'Trigger blocks deleting the last administrator'
);

-- 7. Add a second admin, then deleting one succeeds
insert into auth.users (id, email) values ('88884444-0000-0000-0000-000000000004', 'admin_roles2@test.internal');
insert into public.user_roles (user_id, role) values ('88884444-0000-0000-0000-000000000004', 'admin');

select lives_ok(
  $$ delete from public.user_roles where user_id = '99993333-0000-0000-0000-000000000003' and role = 'admin' $$,
  'Deleting an admin succeeds when another admin remains'
);

select * from finish();
rollback;
