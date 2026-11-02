-- ALL-IN-ONE: migrations 002 → 006 combined. Paste this whole file into Supabase → SQL Editor and click Run.
-- Safe to run again. Before running, check the recruiter email in section 005 (search for 'Owner').


-- ════════════════ migrations/002_practice_and_transcripts.sql ════════════════
-- Step 2: practice interviews, difficulty, and saved transcripts
-- Run this once in Supabase → SQL Editor (safe to run again).

-- Practice interviews are created by candidates for themselves.
alter table public.interviews
  add column if not exists is_practice boolean not null default false;

-- Beginner / Intermediate / Advanced (optional).
alter table public.interviews
  add column if not exists difficulty text;

-- The full conversation, as [{ "role": "assistant" | "user", "content": "..." }].
alter table public."interview feedback"
  add column if not exists transcript jsonb;

-- ════════════════ migrations/003_candidate_invites.sql ════════════════
-- Step 3: candidate invites, recruiter decisions and notes
-- Run this once in Supabase → SQL Editor (safe to run again).

-- 1. Invites: a recruiter invites a candidate's email to one interview.
create table if not exists public.interview_invites (
  id bigint generated always as identity primary key,
  interview_id text not null,
  recruiter_email text not null,
  candidate_email text not null,
  candidate_name text,
  status text not null default 'invited' check (status in ('invited', 'completed')),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (interview_id, candidate_email)
);

-- Recruiters manage their own invites; candidates can see invites sent to them.
alter table public.interview_invites enable row level security;

drop policy if exists "invites_recruiter_all" on public.interview_invites;
create policy "invites_recruiter_all" on public.interview_invites
  for all to authenticated
  using (recruiter_email = auth.jwt() ->> 'email')
  with check (recruiter_email = auth.jwt() ->> 'email');

drop policy if exists "invites_candidate_read" on public.interview_invites;
create policy "invites_candidate_read" on public.interview_invites
  for select to authenticated
  using (lower(candidate_email) = lower(auth.jwt() ->> 'email'));

-- 2. When feedback is saved, mark the matching invite as completed.
--    Runs inside the database, so it works even though the feedback API has no user session.
create or replace function public.mark_invite_completed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.interview_invites
     set status = 'completed', completed_at = now()
   where interview_id = new.interview_id::text
     and lower(candidate_email) = lower(new."userEmail");
  return new;
end;
$$;

drop trigger if exists feedback_completes_invite on public."interview feedback";
create trigger feedback_completes_invite
  after insert on public."interview feedback"
  for each row execute function public.mark_invite_completed();

-- 3. Recruiter decision and private notes on each candidate's report.
alter table public."interview feedback"
  add column if not exists recruiter_status text not null default 'pending'
  check (recruiter_status in ('pending', 'shortlisted', 'rejected'));

alter table public."interview feedback"
  add column if not exists recruiter_notes text;

-- ════════════════ migrations/004_switchable_roles.sql ════════════════
-- Step 3b: roles are chosen at sign-in and can be switched at any time.
-- Users.role now means "the workspace this user is currently using".
-- Run this once in Supabase → SQL Editor (safe to run again).

drop trigger if exists users_lock_role on public."Users";
drop function if exists public.prevent_role_change();

-- ════════════════ migrations/005_recruiter_access.sql ════════════════
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
values ('akankshasalwan@gmail.com', 'Owner')
on conflict (email) do nothing;

-- ════════════════ migrations/006_interview_security.sql ════════════════
-- Step 5: row-level security for interviews and interview feedback.
-- Run this once in Supabase → SQL Editor, AFTER 001–005 (safe to run again).
--
-- Who can do what afterwards:
--   interviews          owner: full access · invited candidate: read · anyone with the link: read the
--                       public fields only, through get_interview_public()
--   interview feedback  recruiter who owns the interview: read + update decision/notes only
--                       candidate: read their own PRACTICE reports · nobody inserts directly;
--                       the feedback API saves through submit_interview_feedback()

-- ───────────────────────── interviews ─────────────────────────
alter table public.interviews enable row level security;

drop policy if exists "interviews_owner_read" on public.interviews;
create policy "interviews_owner_read" on public.interviews
  for select to authenticated
  using ("userEmail" = auth.jwt() ->> 'email');

drop policy if exists "interviews_invited_read" on public.interviews;
create policy "interviews_invited_read" on public.interviews
  for select to authenticated
  using (exists (
    select 1 from public.interview_invites invite
    where invite.interview_id = interviews.interview_id::text
      and lower(invite.candidate_email) = lower(auth.jwt() ->> 'email')
  ));

-- Anyone signed in can create practice interviews; only approved recruiters can create real ones.
drop policy if exists "interviews_insert" on public.interviews;
create policy "interviews_insert" on public.interviews
  for insert to authenticated
  with check ("userEmail" = auth.jwt() ->> 'email' and (is_practice or public.is_approved_recruiter()));

drop policy if exists "interviews_owner_update" on public.interviews;
create policy "interviews_owner_update" on public.interviews
  for update to authenticated
  using ("userEmail" = auth.jwt() ->> 'email')
  with check ("userEmail" = auth.jwt() ->> 'email' and (is_practice or public.is_approved_recruiter()));

drop policy if exists "interviews_owner_delete" on public.interviews;
create policy "interviews_owner_delete" on public.interviews
  for delete to authenticated
  using ("userEmail" = auth.jwt() ->> 'email');

-- Interview links work without signing in: return only what the candidate needs, by exact id.
-- (Listing or searching interviews is impossible; you must already know the id.)
create or replace function public.get_interview_public(p_interview_id text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'interview_id', interview_id,
    'jobPosition', "jobPosition",
    'jobDescription', "jobDescription",
    'duration', duration,
    'type', type,
    'questionList', "questionList",
    'is_practice', is_practice,
    'difficulty', difficulty
  )
  from public.interviews
  where interview_id::text = p_interview_id
  limit 1;
$$;
grant execute on function public.get_interview_public(text) to anon, authenticated;

-- ───────────────────── interview feedback ─────────────────────
alter table public."interview feedback" enable row level security;

drop policy if exists "feedback_recruiter_read" on public."interview feedback";
create policy "feedback_recruiter_read" on public."interview feedback"
  for select to authenticated
  using (exists (
    select 1 from public.interviews i
    where i.interview_id::text = "interview feedback".interview_id::text
      and i."userEmail" = auth.jwt() ->> 'email'
  ));

-- Candidates see their own reports for practice interviews only (recruiter reports stay private).
drop policy if exists "feedback_candidate_practice_read" on public."interview feedback";
create policy "feedback_candidate_practice_read" on public."interview feedback"
  for select to authenticated
  using (
    lower("userEmail") = lower(auth.jwt() ->> 'email')
    and exists (
      select 1 from public.interviews i
      where i.interview_id::text = "interview feedback".interview_id::text
        and i.is_practice
    )
  );

drop policy if exists "feedback_recruiter_update" on public."interview feedback";
create policy "feedback_recruiter_update" on public."interview feedback"
  for update to authenticated
  using (exists (
    select 1 from public.interviews i
    where i.interview_id::text = "interview feedback".interview_id::text
      and i."userEmail" = auth.jwt() ->> 'email'
  ))
  with check (exists (
    select 1 from public.interviews i
    where i.interview_id::text = "interview feedback".interview_id::text
      and i."userEmail" = auth.jwt() ->> 'email'
  ));

-- Recruiters may only change their decision and notes — never scores, transcripts or names.
revoke update on public."interview feedback" from anon, authenticated;
grant update (recruiter_status, recruiter_notes) on public."interview feedback" to authenticated;

-- The only way to save a report. Called by /api/ai-feedback after the AI has scored the interview.
create or replace function public.submit_interview_feedback(
  p_interview_id text,
  p_user_name text,
  p_user_email text,
  p_feedback jsonb,
  p_transcript jsonb,
  p_recommended boolean
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_interview record;
  v_signed_in_email text := nullif(auth.jwt() ->> 'email', '');
  v_email text := nullif(trim(p_user_email), '');
  v_id bigint;
begin
  select interview_id, is_practice, "userEmail" as owner_email
    into v_interview
    from public.interviews
   where interview_id::text = p_interview_id;

  if not found then
    raise exception 'INTERVIEW_NOT_FOUND';
  end if;

  -- Signed-in candidates are identified by their verified login, not by what they typed.
  if v_signed_in_email is not null then
    v_email := v_signed_in_email;
  end if;

  -- Practice interviews can only be scored for the candidate who created them.
  if v_interview.is_practice and lower(coalesce(v_signed_in_email, '')) <> lower(v_interview.owner_email) then
    raise exception 'NOT_YOUR_PRACTICE_INTERVIEW';
  end if;

  insert into public."interview feedback" (interview_id, "userName", "userEmail", feedback, transcript, recommended)
  values (v_interview.interview_id, left(nullif(trim(p_user_name), ''), 120), lower(v_email), p_feedback, p_transcript, p_recommended)
  returning id into v_id;

  return v_id;
end;
$$;
revoke execute on function public.submit_interview_feedback(text, text, text, jsonb, jsonb, boolean) from public;
grant execute on function public.submit_interview_feedback(text, text, text, jsonb, jsonb, boolean) to anon, authenticated;

-- Refresh the API so the app sees the new tables and functions right away.
notify pgrst, 'reload schema';
