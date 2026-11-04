-- 008: candidates see HR's decision on interviews they were assigned.
--
-- The report itself ("interview feedback") stays private to HR. Only the decision
-- (pending / shortlisted / rejected) is copied onto the candidate's invite, which the
-- candidate can already read (migration 003).
--
-- Run this once in Supabase → SQL Editor, after 001–007 (safe to run again).

-- 1. The decision as the candidate sees it.
alter table public.interview_invites
  add column if not exists decision text not null default 'pending'
  check (decision in ('pending', 'shortlisted', 'rejected'));

-- 2. Whenever HR shortlists or rejects a report, copy the decision to the matching invite.
create or replace function public.sync_invite_decision()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.interview_invites
     set decision = new.recruiter_status
   where interview_id = new.interview_id::text
     and lower(candidate_email) = lower(new."userEmail");
  return new;
end;
$$;

drop trigger if exists feedback_syncs_invite_decision on public."interview feedback";
create trigger feedback_syncs_invite_decision
  after update of recruiter_status on public."interview feedback"
  for each row execute function public.sync_invite_decision();

-- 3. Copy decisions HR already made before this migration (latest report per candidate wins).
update public.interview_invites invite
   set decision = latest.recruiter_status
  from (
    select distinct on (interview_id::text, lower("userEmail"))
           interview_id::text as interview_id, lower("userEmail") as email, recruiter_status
      from public."interview feedback"
     order by interview_id::text, lower("userEmail"), id desc
  ) latest
 where invite.interview_id = latest.interview_id
   and lower(invite.candidate_email) = latest.email;

notify pgrst, 'reload schema';
