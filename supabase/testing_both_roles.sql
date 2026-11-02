-- TESTING ONLY: let akankshasalwan@gmail.com use BOTH roles (candidate + recruiter).
-- Paste this whole file into Supabase → SQL Editor and click Run.

-- 1. Confirm the login (if the account exists and is not confirmed yet).
update auth.users
set email_confirmed_at = coalesce(email_confirmed_at, now())
where lower(email) = 'akankshasalwan@gmail.com';

-- 2. Approve it for the recruiter workspace.
insert into public.recruiter_access (email, note)
values ('akankshasalwan@gmail.com', 'Owner - testing both roles')
on conflict (email) do nothing;

-- 3. Remove the other test email from the recruiter list.
delete from public.recruiter_access
where lower(email) = 'vinayambatkar57@gmail.com';

-- 4. Check.
select 'LOGIN ACCOUNT' as list, email,
       case when email_confirmed_at is null then 'NOT confirmed' else 'confirmed' end as info
from auth.users where lower(email) = 'akankshasalwan@gmail.com'
union all
select 'APPROVED RECRUITER', email, note from public.recruiter_access
order by list;
