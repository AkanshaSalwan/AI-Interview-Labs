-- Step 1: user roles (recruiter / candidate)
-- Run this once in Supabase → SQL Editor.

-- 1. Role column. NULL means the user hasn't picked a role yet (sent to /onboarding).
alter table public."Users"
  add column if not exists role text
  check (role in ('recruiter', 'candidate'));

-- 2. A role can be chosen once and never changed afterwards,
--    even if someone calls the API directly.
create or replace function public.prevent_role_change()
returns trigger
language plpgsql
as $$
begin
  if old.role is not null and new.role is distinct from old.role then
    raise exception 'Role cannot be changed once it is set';
  end if;
  return new;
end;
$$;

drop trigger if exists users_lock_role on public."Users";
create trigger users_lock_role
  before update on public."Users"
  for each row execute function public.prevent_role_change();

-- 3. Row-level security: signed-in users can only see and edit their own row.
alter table public."Users" enable row level security;

drop policy if exists "users_select_own" on public."Users";
create policy "users_select_own" on public."Users"
  for select to authenticated
  using (email = auth.jwt() ->> 'email');

drop policy if exists "users_insert_own" on public."Users";
create policy "users_insert_own" on public."Users"
  for insert to authenticated
  with check (email = auth.jwt() ->> 'email');

drop policy if exists "users_update_own" on public."Users";
create policy "users_update_own" on public."Users"
  for update to authenticated
  using (email = auth.jwt() ->> 'email')
  with check (email = auth.jwt() ->> 'email');
