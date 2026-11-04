-- 009: add a "hired" stage to the HR decision (pending → shortlisted → hired, or rejected).
--
-- Run this once in Supabase → SQL Editor, after 001–008 (safe to run again).

-- 008 adds this column; repeated here so this file never fails if 008 was skipped.
alter table public.interview_invites
  add column if not exists decision text not null default 'pending';

do $$
declare
  c record;
begin
  -- Drop the old check constraints, whatever Postgres named them.
  for c in
    select con.conname, rel.relname
      from pg_constraint con
      join pg_class rel on rel.oid = con.conrelid
      join pg_namespace nsp on nsp.oid = rel.relnamespace
     where nsp.nspname = 'public'
       and con.contype = 'c'
       and (
         (rel.relname = 'interview feedback' and pg_get_constraintdef(con.oid) like '%recruiter_status%')
         or (rel.relname = 'interview_invites' and pg_get_constraintdef(con.oid) like '%decision%')
       )
  loop
    execute format('alter table public.%I drop constraint %I', c.relname, c.conname);
  end loop;
end;
$$;

alter table public."interview feedback"
  add constraint interview_feedback_recruiter_status_check
  check (recruiter_status in ('pending', 'shortlisted', 'hired', 'rejected'));

alter table public.interview_invites
  add constraint interview_invites_decision_check
  check (decision in ('pending', 'shortlisted', 'hired', 'rejected'));

notify pgrst, 'reload schema';
