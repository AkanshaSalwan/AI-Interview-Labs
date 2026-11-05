-- 010: deadlines on assigned interviews, and a message from HR the candidate can read.
--
-- Run this once in Supabase → SQL Editor, after 001–009 (safe to run again).

-- 1. Optional "complete by" date, set by HR when assigning.
alter table public.interview_invites
  add column if not exists due_at timestamptz;

-- 2. HR's note to the candidate (e.g. "Next round on Monday at 11 AM"), kept on the report…
alter table public."interview feedback"
  add column if not exists candidate_message text;

-- HR may change their decision, private notes and this message — never scores or transcripts.
grant update (recruiter_status, recruiter_notes, candidate_message) on public."interview feedback" to authenticated;

-- …and copied onto the invite, which the candidate can read (the report itself stays private).
alter table public.interview_invites
  add column if not exists decision_message text;
alter table public.interview_invites
  add column if not exists decided_at timestamptz;

-- 3. Copy decision, message and decision time to the candidate's invite (replaces the 008 version).
create or replace function public.sync_invite_decision()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.interview_invites
     set decision = new.recruiter_status,
         decision_message = nullif(trim(new.candidate_message), ''),
         decided_at = case
           when new.recruiter_status is distinct from old.recruiter_status then
             case when new.recruiter_status = 'pending' then null else now() end
           else decided_at
         end
   where interview_id = new.interview_id::text
     and lower(candidate_email) = lower(new."userEmail");
  return new;
end;
$$;

drop trigger if exists feedback_syncs_invite_decision on public."interview feedback";
create trigger feedback_syncs_invite_decision
  after update of recruiter_status, candidate_message on public."interview feedback"
  for each row execute function public.sync_invite_decision();

notify pgrst, 'reload schema';
