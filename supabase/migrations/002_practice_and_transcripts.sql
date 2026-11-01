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
