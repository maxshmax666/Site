-- ================
-- Manual runbook: first admin role grant
-- Execute manually in Supabase SQL Editor after applying supabase_admin.sql.
--
-- SECURITY:
-- - Do not commit production email/UUID values to repository.
-- - Operator must set values below during execution.
-- ================

begin;

-- 1) Set operator-provided params for target account.
-- Replace values in this CTE manually before execution.
with params as (
  select
    'change-me-admin@example.com'::text as target_email,
    '00000000-0000-0000-0000-000000000000'::uuid as target_user_id
),
upsert_from_email as (
  -- Optional path: grant by email (works if auth.users contains this email)
  insert into public.profiles(user_id, email, role)
  select u.id, u.email, 'admin'::app_role
  from auth.users u
  join params p on u.email = p.target_email
  on conflict (user_id) do update
  set role = excluded.role,
      email = excluded.email
  returning user_id
),
update_from_uuid as (
  -- Optional fallback: enforce role by explicit user UUID
  update public.profiles p
  set role = 'admin'::app_role
  from params prm
  where p.user_id = prm.target_user_id
  returning p.user_id
)
select
  (select count(*) from upsert_from_email) as granted_by_email,
  (select count(*) from update_from_uuid) as granted_by_uuid;

-- 2) Verification: expect at least one row with role = admin for intended user.
-- select user_id, email, role from public.profiles
-- where user_id = '00000000-0000-0000-0000-000000000000'::uuid
--    or email = 'change-me-admin@example.com';

commit;
