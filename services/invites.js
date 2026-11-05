import { toast } from '@/components/ui/toast'
import { openInviteEmail } from '@/services/interviewLinks'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// HR decision on a candidate's report ("interview feedback".recruiter_status), with how each side sees it.
export const DECISIONS = {
  pending: { hr: 'Awaiting decision', candidate: 'Under review', badge: 'bg-slate-100 text-slate-600' },
  shortlisted: { hr: 'Shortlisted', candidate: 'Shortlisted', badge: 'bg-sky-50 text-sky-700' },
  hired: { hr: 'Hired', candidate: 'Selected 🎉', badge: 'bg-emerald-50 text-emerald-700' },
  rejected: { hr: 'Rejected', candidate: 'Not selected', badge: 'bg-red-50 text-red-600' },
}

const DAY = 24 * 60 * 60 * 1000

// Today's date as YYYY-MM-DD in the user's time zone (the earliest deadline a date picker allows).
export function todayInputValue() {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

// "Due in 3 days" / "Due today" / "Overdue by 2 days" for an unfinished assignment; null when there's no deadline.
export function dueStatus(dueAt, completed = false) {
  if (!dueAt || completed) return null
  const days = Math.ceil((new Date(dueAt).getTime() - Date.now()) / DAY)
  if (days < 0 || (days === 0 && new Date(dueAt) < new Date())) {
    const late = Math.max(1, -days)
    return { label: `Overdue by ${late} day${late > 1 ? 's' : ''}`, overdue: true, badge: 'bg-red-50 text-red-600' }
  }
  if (days <= 1) return { label: days === 0 ? 'Due today' : 'Due tomorrow', overdue: false, badge: 'bg-amber-50 text-amber-700' }
  return { label: `Due in ${days} days`, overdue: false, badge: 'bg-slate-100 text-slate-600' }
}

// Assigns an interview to a candidate's email, then opens the mail app with the invitation.
// `dueDate` is an optional YYYY-MM-DD from a date picker; the deadline is the end of that day.
// Returns the new invite row, or null if it could not be created (a toast explains why).
export async function assignInterview(supabase, { interview, recruiterEmail, candidateEmail, candidateName, dueDate }) {
  const email = candidateEmail.trim().toLowerCase()
  if (!EMAIL_PATTERN.test(email)) {
    toast.add({ title: 'Enter a valid email address' })
    return null
  }

  const { data, error } = await supabase
    .from('interview_invites')
    .insert([{
      interview_id: interview.interview_id,
      recruiter_email: recruiterEmail,
      candidate_email: email,
      candidate_name: candidateName?.trim() || null,
      ...(dueDate && { due_at: new Date(`${dueDate}T23:59:59`).toISOString() }),
    }])
    .select()
    .single()

  if (error) {
    const message = {
      '23505': ['This candidate is already assigned to this interview'],
      // PGRST204 = unknown column: the deadline needs migration 010.
      PGRST204: ['Deadlines need a database update', 'Run supabase/migrations/010_deadlines_and_messages.sql in Supabase, or assign without a due date.'],
    }[error.code] ?? ['Could not assign the interview', error.message]
    toast.add({ title: message[0], description: message[1] })
    return null
  }

  toast.add({ title: 'Interview assigned', description: 'It is now on the candidate’s dashboard. Your mail app will open with an invitation.' })
  openInviteEmail({
    to: email,
    candidateName: data.candidate_name,
    jobPosition: interview.jobPosition,
    interviewId: interview.interview_id,
  })
  return data
}
