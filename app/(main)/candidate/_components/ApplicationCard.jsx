import Link from 'next/link'
import moment from 'moment'
import { Check, Clock3, MessageSquareQuote, Play, X } from 'lucide-react'
import { DECISIONS, dueStatus } from '@/services/invites'
import { cn } from '@/lib/utils'

// The four steps of an assigned interview, each done / current / upcoming (or failed for a rejection).
function buildSteps(invite) {
    const completed = invite.status === 'completed'
    const decision = invite.decision ?? 'pending'
    const decided = completed && decision !== 'pending'
    const due = dueStatus(invite.due_at, completed)

    return [
        { label: 'Assigned', detail: moment(invite.created_at).format('DD MMM'), state: 'done' },
        {
            label: 'Interview',
            detail: completed ? moment(invite.completed_at).format('DD MMM') : due?.label ?? 'Not started',
            state: completed ? 'done' : 'current',
        },
        {
            label: 'HR review',
            detail: decided ? 'Done' : completed ? 'In progress' : '',
            state: decided ? 'done' : completed ? 'current' : 'upcoming',
        },
        {
            label: decided ? DECISIONS[decision]?.candidate ?? 'Decision' : 'Decision',
            detail: decided && invite.decided_at ? moment(invite.decided_at).format('DD MMM') : '',
            state: !decided ? 'upcoming' : decision === 'rejected' ? 'failed' : 'done',
        },
    ]
}

const DOT = {
    done: 'border-emerald-500 bg-emerald-500 text-white',
    current: 'border-orange-500 bg-white text-orange-500',
    upcoming: 'border-slate-200 bg-white text-slate-300',
    failed: 'border-red-400 bg-red-400 text-white',
}

function Timeline({ steps }) {
    return (
        <ol className='grid grid-cols-4'>
            {steps.map((step, index) => (
                <li key={step.label} className='relative flex flex-col items-center text-center'>
                    {index > 0 && (
                        // Line from the previous step's dot to this one.
                        <span className={cn(
                            'absolute right-1/2 top-[11px] h-0.5 w-full',
                            { upcoming: 'bg-slate-200', current: 'bg-orange-300', failed: 'bg-red-300' }[step.state] ?? 'bg-emerald-400'
                        )} />
                    )}
                    <span className={cn('relative z-10 flex size-6 items-center justify-center rounded-full border-2', DOT[step.state])}>
                        {step.state === 'done' && <Check className='size-3.5' strokeWidth={3} />}
                        {step.state === 'failed' && <X className='size-3.5' strokeWidth={3} />}
                        {step.state === 'current' && <span className='size-2 rounded-full bg-orange-500' />}
                    </span>
                    <p className={cn('mt-1.5 text-xs font-medium', step.state === 'upcoming' ? 'text-slate-400' : 'text-slate-800')}>{step.label}</p>
                    {step.detail && <p className='text-[11px] text-slate-500'>{step.detail}</p>}
                </li>
            ))}
        </ol>
    )
}

// An assigned interview on the candidate's "My Interviews" page: where it stands, plus HR's message.
function ApplicationCard({ invite }) {
    const completed = invite.status === 'completed'
    const jobPosition = invite.interview?.jobPosition ?? 'Interview'
    const due = dueStatus(invite.due_at, completed)

    return (
        <li className='surface rounded-2xl p-5'>
            <div className='flex items-center gap-3'>
                <span className='flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[15px] font-semibold text-orange-600'>
                    {jobPosition[0]?.toUpperCase()}
                </span>
                <div className='min-w-0 flex-1'>
                    <p className='truncate text-[15px] font-semibold text-slate-900'>{jobPosition}</p>
                    <p className='mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-slate-500'>
                        {invite.interview?.duration && <span className='flex items-center gap-1'><Clock3 className='size-3' />{invite.interview.duration} min</span>}
                        <span>Assigned {moment(invite.created_at).fromNow()}</span>
                    </p>
                </div>
                {!completed && (
                    <div className='flex shrink-0 items-center gap-2'>
                        {due && <span className={cn('hidden rounded-full px-2.5 py-1 text-xs font-medium sm:inline', due.badge)}>{due.label}</span>}
                        <Link
                            href={`/interview/${invite.interview_id}`}
                            className='btn-orange inline-flex h-9 items-center gap-1.5 rounded-[0.625rem] px-4 text-sm font-medium text-white hover:brightness-105'
                        >
                            <Play className='size-3.5' /> Start
                        </Link>
                    </div>
                )}
            </div>

            <div className='mt-5 rounded-xl bg-slate-50/70 px-2 py-3'>
                <Timeline steps={buildSteps(invite)} />
            </div>

            {invite.decision_message && (
                <div className='mt-3 flex gap-3 rounded-xl border border-orange-100 bg-orange-50/50 p-3.5'>
                    <MessageSquareQuote className='mt-0.5 size-4 shrink-0 text-orange-500' />
                    <div>
                        <p className='text-xs font-medium text-orange-700'>Message from HR</p>
                        <p className='mt-0.5 whitespace-pre-line text-sm leading-relaxed text-slate-700'>{invite.decision_message}</p>
                    </div>
                </div>
            )}
        </li>
    )
}

export default ApplicationCard
