'use client'
import { useState } from 'react'
import { Loader2, Send } from 'lucide-react'
import { assignInterview } from '@/services/invites'

function InviteCandidateForm({ supabase, interview, recruiterEmail, onInvited }) {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [sending, setSending] = useState(false)

    const sendInvite = async (event) => {
        event.preventDefault()
        setSending(true)
        const invite = await assignInterview(supabase, { interview, recruiterEmail, candidateEmail: email, candidateName: name })
        setSending(false)
        if (!invite) return

        onInvited(invite)
        setName('')
        setEmail('')
    }

    return (
        <form onSubmit={sendInvite} className='surface rounded-2xl p-5'>
            <h2 className='text-[15px] font-semibold text-slate-900'>Assign to a candidate</h2>
            <p className='mt-0.5 text-sm text-slate-500'>
                Enter their email. They’ll find this interview when they log in.
            </p>
            <div className='mt-4 grid gap-2.5 sm:grid-cols-[1fr_1.4fr_auto]'>
                <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder='Name (optional)'
                    className='field'
                />
                <input
                    type='email'
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder='candidate@email.com'
                    className='field'
                />
                <button
                    type='submit'
                    disabled={sending}
                    className='btn-orange inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-[0.625rem] px-5 text-sm font-medium text-white transition-[filter] hover:brightness-105 disabled:opacity-60'
                >
                    {sending ? <Loader2 className='size-4 animate-spin' /> : <Send className='size-4' />}
                    Assign
                </button>
            </div>
        </form>
    )
}

export default InviteCandidateForm
