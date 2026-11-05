'use client'
import { useState } from 'react'
import Link from 'next/link'
import moment from 'moment'
import { ArrowLeft, BadgeCheck, CalendarDays, Check, Clock3, Copy, ExternalLink, Mail, X } from 'lucide-react'
import { toast } from '@/components/ui/toast'
import DetailedFeedback from '@/components/interview/DetailedFeedback'
import TranscriptView from '@/components/interview/TranscriptView'
import { SKILLS, isRecommended, skillScore } from '@/services/scores'
import { dueStatus } from '@/services/invites'
import { interviewUrl, openInviteEmail } from '@/services/interviewLinks'
import { cn } from '@/lib/utils'
import { ReportTextField } from '../../scheduled-interviews/[interview_id]/_components/CandidateRow'
import { STAGES } from './pipeline'

const STAGE_BY_ID = Object.fromEntries(STAGES.map((stage) => [stage.id, stage]))

// Pastel until chosen, solid once it's the current decision. Clicking the current one undoes it.
const DECISIONS = [
    { stage: 'shortlisted', label: 'Shortlist', icon: Check, idle: 'border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100', active: 'border-violet-500 bg-violet-500 text-white' },
    { stage: 'hired', label: 'Hire', icon: BadgeCheck, idle: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100', active: 'border-emerald-500 bg-emerald-500 text-white' },
    { stage: 'rejected', label: 'Reject', icon: X, idle: 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100', active: 'border-red-500 bg-red-500 text-white' },
]

function scoreTone(score) {
    if (score >= 7) return 'text-emerald-600'
    if (score >= 5) return 'text-amber-600'
    return 'text-red-600'
}

// Everything about one candidate for one interview (the /candidates/[interview_id]/[email] page).
function CandidateDetails({ candidate, onMove, onUpdateReport }) {
    const [tab, setTab] = useState('report')

    const report = candidate.report
    const feedback = report?.feedback ?? {}
    const stage = STAGE_BY_ID[candidate.stage] ?? STAGE_BY_ID.pending
    const displayName = candidate.name || candidate.email?.split('@')[0] || 'Candidate'
    const due = dueStatus(candidate.invite?.due_at, Boolean(report))

    const saveField = async (changes, successTitle) => {
        const saved = await onUpdateReport(report.id, changes)
        if (saved) toast.add({ title: successTitle })
        return saved
    }

    const copyLink = async () => {
        await navigator.clipboard.writeText(interviewUrl(candidate.interview.interview_id))
        toast.add({ title: 'Link Copied to Clipboard' })
    }

    return (
        <div className='mx-auto max-w-4xl'>
            <Link href='/candidates' className='mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800'>
                <ArrowLeft className='size-4' /> Candidates
            </Link>

            <div className='surface overflow-hidden rounded-2xl'>
                {/* Header */}
                <div className='border-b border-slate-200/70 bg-white px-6 pb-4 pt-5'>
                    <div className='flex items-start gap-3.5'>
                        <span className='flex size-12 shrink-0 items-center justify-center rounded-full bg-orange-50 text-lg font-semibold text-orange-600'>
                            {displayName[0].toUpperCase()}
                        </span>
                        <div className='min-w-0 flex-1'>
                            <h1 className='truncate text-xl font-semibold tracking-tight text-slate-900'>{displayName}</h1>
                            <p className='truncate text-[13px] text-slate-500'>{candidate.email}</p>
                            <div className='mt-2 flex flex-wrap items-center gap-1.5'>
                                <span className='rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700'>{candidate.interview.jobPosition}</span>
                                <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium', stage.pill)}>
                                    <span className={cn('size-1.5 rounded-full', stage.dot)} /> {stage.label}
                                </span>
                            </div>
                        </div>
                    </div>

                    {report && (
                        <div className='mt-4 flex flex-wrap items-center gap-2'>
                            {DECISIONS.map(({ stage: target, label, icon: Icon, idle, active }) => {
                                const isActive = candidate.stage === target
                                return (
                                    <button
                                        key={target}
                                        type='button'
                                        aria-pressed={isActive}
                                        onClick={() => onMove(candidate, isActive ? 'pending' : target)}
                                        className={cn('inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border px-3 text-[13px] font-medium transition-colors', isActive ? active : idle)}
                                    >
                                        <Icon className='size-3.5' /> {label}
                                    </button>
                                )
                            })}
                            <Link
                                href={`/scheduled-interviews/${candidate.interview.interview_id}`}
                                className='ml-auto inline-flex items-center gap-1 text-[13px] font-medium text-slate-500 hover:text-orange-700'
                            >
                                Interview page <ExternalLink className='size-3.5' />
                            </Link>
                        </div>
                    )}

                    {report && (
                        <div className='-mb-4 mt-4 flex gap-5 text-sm'>
                            {[{ id: 'report', label: 'Report' }, { id: 'transcript', label: 'Transcript' }].map((item) => (
                                <button
                                    key={item.id}
                                    type='button'
                                    onClick={() => setTab(item.id)}
                                    className={cn(
                                        'cursor-pointer border-b-2 pb-2.5 font-medium transition-colors',
                                        tab === item.id ? 'border-orange-500 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'
                                    )}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

            </div>

            {/* Body */}
            <div className='mt-5'>
                    {!report ? (
                        <div className='space-y-4'>
                            <div className='surface rounded-2xl p-5'>
                                <p className='text-[15px] font-semibold text-slate-900'>Hasn’t taken the interview yet</p>
                                <div className='mt-3 space-y-2 text-[13px] text-slate-600'>
                                    <p className='flex items-center gap-2'><CalendarDays className='size-4 text-slate-400' /> Assigned {moment(candidate.date).format('DD MMM YYYY')} ({moment(candidate.date).fromNow()})</p>
                                    <p className='flex items-center gap-2'><Clock3 className='size-4 text-slate-400' /> {candidate.interview.duration} min interview</p>
                                    {due && <p className='flex items-center gap-2'><span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', due.badge)}>{due.label}</span></p>}
                                </div>
                                <div className='mt-4 flex flex-wrap gap-2'>
                                    <button
                                        type='button'
                                        onClick={() => openInviteEmail({
                                            to: candidate.email,
                                            candidateName: candidate.name,
                                            jobPosition: candidate.interview.jobPosition,
                                            interviewId: candidate.interview.interview_id,
                                        })}
                                        className='btn-orange inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[0.625rem] px-3.5 text-sm font-medium text-white hover:brightness-105'
                                    >
                                        <Mail className='size-4' /> Send reminder email
                                    </button>
                                    <button
                                        type='button'
                                        onClick={copyLink}
                                        className='inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[0.625rem] border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 hover:bg-slate-50'
                                    >
                                        <Copy className='size-4' /> Copy interview link
                                    </button>
                                </div>
                            </div>
                            <p className='text-center text-xs text-slate-400'>Their report, scores and transcript appear here once they finish.</p>
                        </div>
                    ) : tab === 'transcript' ? (
                        <div className='surface rounded-2xl p-4'>
                            <TranscriptView transcript={report.transcript} candidateName={displayName} />
                        </div>
                    ) : (
                        <div className='space-y-5'>
                            {/* Scores */}
                            <div className='surface rounded-2xl p-5'>
                                <div className='flex items-start justify-between gap-4'>
                                    <div>
                                        <p className='text-xs font-medium text-slate-500'>Overall score</p>
                                        <p className={cn('mt-0.5 text-3xl font-semibold tabular-nums', scoreTone(candidate.score ?? 0))}>
                                            {candidate.score ?? '—'}<span className='text-base font-medium text-slate-400'>/10</span>
                                        </p>
                                    </div>
                                    <div className='text-right'>
                                        <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', isRecommended(report) ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600')}>
                                            {feedback.recommendation || '—'}
                                        </span>
                                        <p className='mt-1.5 text-xs text-slate-400'>Completed {moment(report.created_at).fromNow()}</p>
                                    </div>
                                </div>
                                <div className='mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2'>
                                    {SKILLS.map(({ key, label }) => {
                                        const value = skillScore(report, key)
                                        return (
                                            <div key={key}>
                                                <div className='flex justify-between text-[13px]'>
                                                    <span className='text-slate-600'>{label}</span>
                                                    <span className='font-semibold tabular-nums text-slate-900'>{value ?? '—'}/10</span>
                                                </div>
                                                <div className='mt-1 h-1.5 rounded-full bg-slate-100'>
                                                    <div className='h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-500' style={{ width: `${Math.max(0, Math.min(100, (value ?? 0) * 10))}%` }} />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                                {feedback.summary && <p className='mt-4 whitespace-pre-line border-t border-slate-100 pt-4 text-[13px] leading-relaxed text-slate-600'>{feedback.summary}</p>}
                            </div>

                            <DetailedFeedback feedback={feedback} />

                            <div className='surface space-y-4 rounded-2xl p-5'>
                                <ReportTextField
                                    key={`message-${report.id}`}
                                    title='Message to candidate'
                                    hint='Shown on their dashboard with your decision, e.g. next-round details.'
                                    placeholder='e.g. Great interview! Our team will call you on Monday at 11 AM for the next round.'
                                    initialValue={report.candidate_message}
                                    saveLabel='Send message'
                                    onSave={(value) => saveField({ candidate_message: value.trim() || null }, 'Message sent to the candidate')}
                                />
                                <ReportTextField
                                    key={`notes-${report.id}`}
                                    title='Private notes'
                                    placeholder='Only you can see these notes.'
                                    initialValue={report.recruiter_notes}
                                    saveLabel='Save notes'
                                    onSave={(value) => saveField({ recruiter_notes: value }, 'Notes saved')}
                                />
                            </div>
                        </div>
                    )}
            </div>
        </div>
    )
}

export default CandidateDetails
