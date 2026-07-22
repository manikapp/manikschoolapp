-- ManikSchoolApp — Super Admin schema (platform-level, above individual schools)
--
-- Design choice: rather than adding a new value to the existing user_role enum
-- (risky to use in the same script that creates it, on some Postgres versions),
-- a super admin is just a `users` row with is_super_admin = true and
-- school_id = null — they don't belong to any single school, they see all of them.

alter table users alter column school_id drop not null;

alter table users add column is_super_admin boolean not null default false;

create or replace function is_super_admin()
returns boolean
language sql
security definer
stable
as $$
  select coalesce((select is_super_admin from users where id = auth.uid()), false);
$$;

comment on function is_super_admin is
  'SECURITY DEFINER so it can read the users table regardless of the calling
   row''s own RLS policy — same pattern as current_school_id() and
   app_current_role(). Used to grant platform-wide access in RLS policies
   across every table (see the paired super-admin-rls migration).';
