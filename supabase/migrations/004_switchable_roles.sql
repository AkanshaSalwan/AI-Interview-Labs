-- Step 3b: roles are chosen at sign-in and can be switched at any time.
-- Users.role now means "the workspace this user is currently using".
-- Run this once in Supabase → SQL Editor (safe to run again).

drop trigger if exists users_lock_role on public."Users";
drop function if exists public.prevent_role_change();
