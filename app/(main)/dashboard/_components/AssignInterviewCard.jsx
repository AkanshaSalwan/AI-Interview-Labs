'use client'
import { useState } from 'react'
import Link from 'next/link'
import moment from 'moment'
import { CheckCircle2, Clock3, Loader2, Plus, Send, UserRoundPlus } from 'lucide-react'
import { assignInterview } from '@/services/invites'

// The HR portal's main action: send one of your interviews to a candidate's dashboard.
function AssignInterviewCard({ supabase, recruiterEmail, interviews, invites, loading, onAssigned }) {
    const [interviewId, setInterviewId] = useState('')
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [sending, setSending] = useState(false)

    const jobByInterview = Object.fromEntries(interviews.map((item) => [item.interview_id, item.jobPosition]))
    const recent = invites.slice(0, 3)

    // Default to the newest interview until HR picks another.
    const selected = interviews.find((item) => item.interview_id === interviewId) ?? interviews[0]

    const onSubmit = async (event) => {
        event.preventDefault()
        if (!selected) return
        setSending(true)
        const invite = await assignInterview(supabase, { interview: selected, recruiterEmail, candidateEmail: email, candidateName: name })
        setSending(false)
        if (!invite) return

        onAssigned(invite)
        setName('')
        setEmail('')
    }

    return (
        <div className='paper-lift'>
            <form onSubmit={onSubmit} className='fold-card surface rounded-2xl p-5'>
                <div className='flex items-center gap-3'>
                    <span className='flex size-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600'>
                        <UserRoundPlus className='size-[18px]' />
                    </span>
                    <div>
                        <h2 className='text-[15px] font-semibold text-slate-900'>Assign an interview</h2>
                        <p className='text-[13px] text-slate-500'>Choose an interview and enter the candidate’s email. They’ll find it when they log in.</p>
                    </div>
                </div>

                {loading ? (
                    <div className='mt-5 space-y-2.5'>
                        {[0, 1, 2].map((item) => <div key={item} className='h-10 animate-pulse rounded-[0.625rem] bg-orange-50/70' />)}
                    </div>
                ) : !interviews.length ? (
                    <div className='mt-5 rounded-xl bg-orange-50/60 px-4 py-5 text-center'>
                        <p className='text-sm text-slate-600'>Create an interview first, then assign it here.</p>
                        <Link
                            href='/dashboard/create-interview'
                            className='btn-orange mt-3 inline-flex h-9 items-center gap-1.5 rounded-[0.625rem] px-4 text-sm font-medium text-white hover:brightness-105'
                        >
                            <Plus className='size-4' /> New interview
                        </Link>
                    </div>
                ) : (
                    <div className='mt-5 space-y-2.5'>
                        <label className='block'>
                            <span className='mb-1 block text-xs font-medium text-slate-500'>Interview</span>
                            <select
                                value={selected?.interview_id ?? ''}
                                onChange={(event) => setInterviewId(event.target.value)}
                                className='field cursor-pointer'
                            >
                                {interviews.map((item) => (
                                    <option key={item.interview_id} value={item.interview_id}>
                                        {item.jobPosition} · {item.duration} min · {moment(item.created_at).format('DD MMM, h:mm A')}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <div className='grid gap-2.5 sm:grid-cols-2'>
                            <label className='block'>
                                <span className='mb-1 block text-xs font-medium text-slate-500'>Candidate name</span>
                                <input value={name} onChange={(event) => setName(event.target.value)} placeholder='Optional' className='field' />
                            </label>
                            <label className='block'>
                                <span className='mb-1 block text-xs font-medium text-slate-500'>Candidate email</span>
                                <input
                                    type='email'
                                    required
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    placeholder='candidate@email.com'
                                    className='field'
                                />
                            </label>
                        </div>
                        <button
                            type='submit'
                            disabled={sending}
                            className='btn-orange mt-1 inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-[0.625rem] text-sm font-medium text-white transition-[filter] hover:brightness-105 disabled:opacity-60'
                        >
                            {sending ? <Loader2 className='size-4 animate-spin' /> : <Send className='size-4' />}
                            Assign interview
                        </button>
                    </div>
                )}

                {recent.length > 0 && (
                    <div className='mt-5 border-t border-slate-100 pt-4'>
                        <p className='mb-2 text-xs font-medium text-slate-500'>Recently assigned</p>
                        <ul className='space-y-2'>
                            {recent.map((invite) => {
                                const done = invite.status === 'completed'
                                return (
                                    <li key={invite.id} className='flex items-center gap-2.5'>
                                        <span className='flex size-7 shrink-0 items-center justify-center rounded-full bg-orange-50 text-[11px] font-semibold text-orange-600'>
                                            {(invite.candidate_name || invite.candidate_email)[0].toUpperCase()}
                                        </span>
                                        <div className='min-w-0 flex-1'>
                                            <p className='truncate text-[13px] font-medium text-slate-800'>{invite.candidate_name || invite.candidate_email}</p>
                                            <p className='truncate text-[11px] text-slate-500'>
                                                {jobByInterview[invite.interview_id] ?? 'Interview'} · {moment(invite.created_at).fromNow()}
                                            </p>
                                        </div>
                                        <span className={done
                                            ? 'flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700'
                                            : 'flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600'}
                                        >
                                            {done ? <CheckCircle2 className='size-3' /> : <Clock3 className='size-3' />}
                                            {done ? 'Completed' : 'Not started'}
                                        </span>
                                    </li>
                                )
                            })}
                        </ul>
                    </div>
                )}
            </form>
        </div>
    )
}

export default AssignInterviewCard
