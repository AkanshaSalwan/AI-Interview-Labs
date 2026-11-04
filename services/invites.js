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

// Assigns an interview to a candidate's email, then opens the mail app with the invitation.
// Returns the new invite row, or null if it could not be created (a toast explains why).
export async function assignInterview(supabase, { interview, recruiterEmail, candidateEmail, candidateName }) {
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
    }])
    .select()
    .single()

  if (error) {
    toast.add({
      title: error.code === '23505' ? 'This candidate is already assigned to this interview' : 'Could not assign the interview',
      description: error.code === '23505' ? undefined : error.message,
    })
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
