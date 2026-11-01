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
