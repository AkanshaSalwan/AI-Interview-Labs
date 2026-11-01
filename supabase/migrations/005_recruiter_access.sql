-- Step 3c: only approved people can use the recruiter workspace.
-- Run this once in Supabase → SQL Editor (safe to run again).
-- ⚠️ Change YOUR_EMAIL@gmail.com at the bottom to your own email first.

-- 1. Approved recruiters: either one exact email, or a whole company domain (e.g. 'acme.com').
create table if not exists public.recruiter_access (
  id bigint generated always as identity primary key,
  email text unique,
  domain text unique,
  note text,
  created_at timestamptz not null default now(),
  constraint recruiter_access_email_or_domain check ((email is not null) <> (domain is not null))
);

-- RLS on with no policies: the app can't read or change this list. Manage it in the Supabase dashboard.
alter table public.recruiter_access enable row level security;

-- 2. Approval check for any email (internal only; not callable from the browser).
create or replace function public.email_is_approved_recruiter(check_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(check_email, '') <> '' and exists (
    select 1 from public.recruiter_access
    where lower(email) = lower(check_email)
       or lower(domain) = lower(split_part(check_email, '@', 2))
  );
$$;
revoke execute on function public.email_is_approved_recruiter(text) from public, anon, authenticated;

-- 3. "Am I an approved recruiter?" for the signed-in user (used by the app).
create or replace function public.is_approved_recruiter()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.email_is_approved_recruiter(auth.jwt() ->> 'email');
$$;
revoke execute on function public.is_approved_recruiter() from public, anon;
grant execute on function public.is_approved_recruiter() to authenticated;

-- 4. The database refuses to give the recruiter role to anyone not approved.
create or replace function public.enforce_recruiter_access()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role = 'recruiter' and not public.email_is_approved_recruiter(new.email) then
    raise exception 'RECRUITER_NOT_APPROVED: % is not approved as a recruiter', new.email;
  end if;
  return new;
end;
$$;

drop trigger if exists users_enforce_recruiter_access on public."Users";
create trigger users_enforce_recruiter_access
  before insert or update of role on public."Users"
  for each row execute function public.enforce_recruiter_access();

-- 5. Only approved recruiters can create or manage invites.
drop policy if exists "invites_recruiter_all" on public.interview_invites;
create policy "invites_recruiter_all" on public.interview_invites
  for all to authenticated
  using (recruiter_email = auth.jwt() ->> 'email' and public.is_approved_recruiter())
  with check (recruiter_email = auth.jwt() ->> 'email' and public.is_approved_recruiter());

-- 6. Approve yourself. To approve a whole company instead: insert into public.recruiter_access (domain) values ('acme.com');
insert into public.recruiter_access (email, note)
values ('YOUR_EMAIL@gmail.com', 'Owner')
on conflict (email) do nothing;
