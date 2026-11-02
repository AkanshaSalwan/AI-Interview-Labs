-- 007: rewrite old practice reports so they speak to the candidate ("you") instead of about them.
--
-- Practice reports are read by the candidate. Older ones were written in the third person
-- ("The candidate greeted..."). /api/practice-feedback/rewrite asks the AI to reword them and
-- saves the result through this function.
--
-- Safety:
--   * only the candidate who owns a PRACTICE report can rewrite it;
--   * only wording changes: rating, recommendation, questions and scores are kept from the old report;
--   * the report is marked "voice": "you", so it is rewritten at most once.
--
-- Run this once in the Supabase SQL editor (after 001–006).

create or replace function public.rewrite_practice_feedback(p_feedback_id bigint, p_texts jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(nullif(auth.jwt() ->> 'email', ''));
  v_old jsonb;
  v_questions jsonb;
  v_new jsonb;
begin
  select f.feedback
    into v_old
    from public."interview feedback" f
    join public.interviews i on i.interview_id::text = f.interview_id::text
   where f.id = p_feedback_id
     and i.is_practice
     and lower(f."userEmail") = v_email;

  if not found or v_email is null then
    raise exception 'NOT_YOUR_PRACTICE_REPORT';
  end if;

  if v_old ->> 'voice' = 'you' then
    return v_old; -- already rewritten
  end if;

  -- Per question: keep question + score from the old report, take only the reworded text fields.
  select coalesce(jsonb_agg(
           o.q || jsonb_strip_nulls(jsonb_build_object(
             'answerSummary', case when jsonb_typeof(n.q -> 'answerSummary') = 'string' then n.q -> 'answerSummary' end,
             'whatWentWell',  case when jsonb_typeof(n.q -> 'whatWentWell')  = 'string' then n.q -> 'whatWentWell'  end,
             'toImprove',     case when jsonb_typeof(n.q -> 'toImprove')     = 'string' then n.q -> 'toImprove'     end
           ))
           order by o.i
         ), '[]'::jsonb)
    into v_questions
    from jsonb_array_elements(case when jsonb_typeof(v_old -> 'questionFeedback') = 'array' then v_old -> 'questionFeedback' else '[]'::jsonb end)
         with ordinality as o(q, i)
    left join jsonb_array_elements(case when jsonb_typeof(p_texts -> 'questionFeedback') = 'array' then p_texts -> 'questionFeedback' else '[]'::jsonb end)
         with ordinality as n(q, i) on n.i = o.i;

  v_new := v_old
    || jsonb_strip_nulls(jsonb_build_object(
         'summary',               case when jsonb_typeof(p_texts -> 'summary') = 'string' then p_texts -> 'summary' end,
         'recommendationMessage', case when jsonb_typeof(p_texts -> 'recommendationMessage') = 'string' then p_texts -> 'recommendationMessage' end,
         'strengths',             case when jsonb_typeof(p_texts -> 'strengths') = 'array' then p_texts -> 'strengths' end,
         'improvements',          case when jsonb_typeof(p_texts -> 'improvements') = 'array' then p_texts -> 'improvements' end
       ))
    || jsonb_build_object('voice', 'you');

  if jsonb_typeof(v_old -> 'questionFeedback') = 'array' then
    v_new := v_new || jsonb_build_object('questionFeedback', v_questions);
  end if;

  update public."interview feedback" set feedback = v_new where id = p_feedback_id;
  return v_new;
end;
$$;

revoke execute on function public.rewrite_practice_feedback(bigint, jsonb) from public;
grant execute on function public.rewrite_practice_feedback(bigint, jsonb) to authenticated;

notify pgrst, 'reload schema';
