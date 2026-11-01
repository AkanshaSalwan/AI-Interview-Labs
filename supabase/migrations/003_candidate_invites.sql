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
