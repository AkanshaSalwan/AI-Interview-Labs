'use client'
import { useState } from 'react'
import Link from 'next/link'
import moment from 'moment'
import { Check, ChevronRight, Inbox, Loader2, X } from 'lucide-react'
import { isRecommended, overallScore } from '@/services/scores'
import { cn } from '@/lib/utils'

function scoreTone(score) {
    if (score >= 7) return 'bg-emerald-50 text-emerald-700'
    if (score >= 5) return 'bg-amber-50 text-amber-700'
    return 'bg-red-50 text-red-600'
}

function QueueRow({ report, jobPosition, onDecision }) {
    const [saving, setSaving] = useState(null)
    const score = overallScore(report)

    const decide = async (status) => {
        setSaving(status)
        await onDecision(report.id, status)
        setSaving(null)
    }

    return (
        <li className='flex items-center gap-3 px-5 py-3'>
            <span className='flex size-9 shrink-0 items-center justify-center rounded-full bg-orange-50 text-sm font-semibold text-orange-600'>
                {(report.userName || report.userEmail || '?')[0].toUpperCase()}
            </span>
            <Link href={`/scheduled-interviews/${report.interview_id}`} className='group min-w-0 flex-1'>
                <p className='flex items-center gap-1 truncate text-sm font-medium text-slate-900 group-hover:text-orange-700'>
                    {report.userName || report.userEmail}
                    <ChevronRight className='size-3.5 text-slate-300 transition-transform group-hover:translate-x-0.5' />
                </p>
                <p className='truncate text-xs text-slate-500'>
                    {jobPosition} · {moment(report.created_at).fromNow()}
                    {isRecommended(report) && <span className='text-emerald-600'> · AI recommends</span>}
                </p>
            </Link>
            {score !== null && (
                <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums', scoreTone(score))}>{score}/10</span>
            )}
            <div className='flex gap-1'>
                <button
                    type='button'
                    title='Shortlist for the next step'
                    aria-label='Shortlist'
                    disabled={Boolean(saving)}
                    onClick={() => decide('shortlisted')}
                    className='flex size-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-50'
                >
                    {saving === 'shortlisted' ? <Loader2 className='size-4 animate-spin' /> : <Check className='size-4' />}
                </button>
                <button
                    type='button'
                    title='Reject'
                    aria-label='Reject'
                    disabled={Boolean(saving)}
                    onClick={() => decide('rejected')}
                    className='flex size-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-50'
                >
                    {saving === 'rejected' ? <Loader2 className='size-4 animate-spin' /> : <X className='size-4' />}
                </button>
            </div>
        </li>
    )
}

// Completed interviews HR hasn't decided on yet, best AI score first.
function DecisionQueue({ interviews, reports, loading, onDecision }) {
    const jobByInterview = Object.fromEntries(interviews.map((item) => [item.interview_id, item.jobPosition]))
    const pending = reports
        .filter((report) => (report.recruiter_status ?? 'pending') === 'pending')
        .sort((a, b) => (overallScore(b) ?? -1) - (overallScore(a) ?? -1))

    return (
        <div className='surface flex flex-col overflow-hidden rounded-2xl'>
            <div className='flex items-center justify-between px-5 pb-2 pt-5'>
                <div>
                    <h2 className='flex items-center gap-2 text-[15px] font-semibold text-slate-900'>
                        Needs your decision
                        {pending.length > 0 && (
                            <span className='rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700'>{pending.length}</span>
                        )}
                    </h2>
                    <p className='text-[13px] text-slate-500'>Read the AI feedback, then shortlist or reject.</p>
                </div>
                <Link href='/scheduled-interviews' className='text-sm font-medium text-orange-600 hover:text-orange-700'>All candidates</Link>
            </div>

            {loading ? (
                <div className='space-y-2 px-5 py-3'>
                    {[0, 1, 2].map((item) => <div key={item} className='h-12 animate-pulse rounded-xl bg-orange-50/70' />)}
                </div>
            ) : pending.length ? (
                <ul className='max-h-[340px] divide-y divide-slate-100 overflow-y-auto'>
                    {pending.slice(0, 8).map((report) => (
                        <QueueRow
                            key={report.id}
                            report={report}
                            jobPosition={jobByInterview[report.interview_id] ?? 'Interview'}
                            onDecision={onDecision}
                        />
                    ))}
                </ul>
            ) : (
                <div className='flex flex-1 flex-col items-center justify-center px-6 py-10 text-center'>
                    <span className='flex size-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500'>
                        <Inbox className='size-5' strokeWidth={1.75} />
                    </span>
                    <p className='mt-3 text-sm font-medium text-slate-900'>You’re all caught up</p>
                    <p className='mt-0.5 max-w-xs text-[13px] text-slate-500'>When a candidate finishes an interview, their AI feedback lands here.</p>
                </div>
            )}
        </div>
    )
}

export default DecisionQueue
