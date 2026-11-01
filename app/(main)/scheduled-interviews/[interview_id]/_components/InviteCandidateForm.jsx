'use client'
import { useState } from 'react'
import { Loader2, Send } from 'lucide-react'
import { toast } from '@/components/ui/toast'
import { openInviteEmail } from '@/services/interviewLinks'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function InviteCandidateForm({ supabase, interview, recruiterEmail, onInvited }) {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [sending, setSending] = useState(false)

    const sendInvite = async (event) => {
        event.preventDefault()
        const candidateEmail = email.trim().toLowerCase()
        if (!EMAIL_PATTERN.test(candidateEmail)) {
            toast.add({ title: 'Enter a valid email address' })
            return
        }

        setSending(true)
        const { data, error } = await supabase
            .from('interview_invites')
            .insert([{
                interview_id: interview.interview_id,
                recruiter_email: recruiterEmail,
                candidate_email: candidateEmail,
                candidate_name: name.trim() || null,
            }])
            .select()
            .single()
        setSending(false)

        if (error) {
            toast.add({
                title: error.code === '23505' ? 'This candidate is already invited' : 'Could not create the invite',
                description: error.code === '23505' ? undefined : error.message,
            })
            return
        }

        onInvited(data)
        setName('')
        setEmail('')
        toast.add({ title: 'Invite created', description: 'Your mail app will open with the invitation.' })
        openInviteEmail({
            to: candidateEmail,
            candidateName: data.candidate_name,
            jobPosition: interview.jobPosition,
            interviewId: interview.interview_id,
        })
    }

    return (
        <form onSubmit={sendInvite} className='rounded-2xl border border-slate-200 bg-white p-5'>
            <h2 className='font-semibold text-slate-900'>Invite a candidate</h2>
            <p className='mt-0.5 text-sm text-slate-500'>
                They’ll see this interview in their dashboard when they sign in with this email.
            </p>
            <div className='mt-4 grid gap-3 sm:grid-cols-[1fr_1.4fr_auto]'>
                <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder='Name (optional)'
                    className='h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-violet-400 focus:ring-3 focus:ring-violet-100'
                />
                <input
                    type='email'
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder='candidate@email.com'
                    className='h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-violet-400 focus:ring-3 focus:ring-violet-100'
                />
                <button
                    type='submit'
                    disabled={sending}
                    className='inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 text-sm font-medium text-white shadow-md shadow-violet-500/25 hover:opacity-90 disabled:opacity-60'
                >
                    {sending ? <Loader2 className='size-4 animate-spin' /> : <Send className='size-4' />}
                    Send invite
                </button>
            </div>
        </form>
    )
}

export default InviteCandidateForm
