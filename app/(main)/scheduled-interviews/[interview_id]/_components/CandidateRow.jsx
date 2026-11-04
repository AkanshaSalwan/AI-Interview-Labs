'use client'
import { useState } from 'react'
import moment from 'moment'
import { BadgeCheck, Check, ChevronDown, Loader2, Mail, MessageSquareText, Trash2, X } from 'lucide-react'
import TranscriptView from '@/components/interview/TranscriptView'
import DetailedFeedback from '@/components/interview/DetailedFeedback'
import { isRecommended } from '@/services/scores'
import { DECISIONS } from '@/services/invites'
import { cn } from '@/lib/utils'

const RATING_LABELS = {
    technicalSkills: 'Technical skills',
    communication: 'Communication',
    problemSolving: 'Problem solving',
    experience: 'Experience',
}

// The next steps HR can take on a finished interview. Clicking the active one again undoes it.
const DECISION_BUTTONS = [
    { status: 'shortlisted', label: 'Shortlist', icon: Check, active: 'border-sky-500 bg-sky-500 text-white', idle: 'hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700' },
    { status: 'hired', label: 'Hire', icon: BadgeCheck, active: 'border-emerald-500 bg-emerald-500 text-white', idle: 'hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700' },
    { status: 'rejected', label: 'Reject', icon: X, active: 'border-red-500 bg-red-500 text-white', idle: 'hover:border-red-300 hover:bg-red-50 hover:text-red-600' },
]

function scoreTone(score) {
    if (score >= 7) return 'text-emerald-600'
    if (score >= 5) return 'text-amber-600'
    return 'text-red-600'
}

function CandidateRow({ candidate, rank, onDecision, onSaveNotes, onResendInvite, onRemoveInvite }) {
    const [open, setOpen] = useState(false)
    const [notes, setNotes] = useState(candidate.report?.recruiter_notes ?? '')
    const [savingNotes, setSavingNotes] = useState(false)

    const report = candidate.report
    const feedback = report?.feedback ?? {}
    const decision = report?.recruiter_status ?? 'pending'
    const notesChanged = notes !== (report?.recruiter_notes ?? '')

    const saveNotes = async () => {
        setSavingNotes(true)
        await onSaveNotes(report.id, notes)
        setSavingNotes(false)
    }

    return (
        <li className='bg-white'>
            <div className='flex flex-wrap items-center gap-3 px-5 py-3'>
                <span className={cn(
                    'w-7 text-center text-sm font-semibold',
                    report ? 'text-slate-400' : 'text-slate-200'
                )}>
                    {report ? `#${rank}` : '—'}
                </span>

                <span className='flex size-9 shrink-0 items-center justify-center rounded-full bg-orange-50 text-sm font-semibold text-orange-600'>
                    {(candidate.name || candidate.email || '?')[0].toUpperCase()}
                </span>

                <div className='min-w-0 flex-1'>
                    <p className='flex items-center gap-2 truncate font-medium text-slate-900'>
                        {candidate.name || candidate.email}
                        {decision !== 'pending' && (
                            <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', DECISIONS[decision]?.badge)}>
                                {DECISIONS[decision]?.hr ?? decision}
                            </span>
                        )}
                    </p>
                    <p className='truncate text-xs text-slate-500'>
                        {candidate.name && candidate.email ? `${candidate.email} · ` : ''}
                        {report
                            ? `Completed ${moment(report.created_at).fromNow()}`
                            : `Assigned ${moment(candidate.invite?.created_at).fromNow()}`}
                    </p>
                </div>

                {report ? (
                    <>
                        <div className='text-right'>
                            <p className={cn('text-lg font-semibold tabular-nums', scoreTone(candidate.score ?? 0))}>
                                {candidate.score ?? '—'}<span className='text-sm font-medium text-slate-400'>/10</span>
                            </p>
                            <p className={cn('text-xs font-medium', isRecommended(report) ? 'text-emerald-600' : 'text-slate-400')}>
                                {feedback.recommendation || '—'}
                            </p>
                        </div>
                        <div className='flex gap-1.5'>
                            {DECISION_BUTTONS.map(({ status, label, icon: Icon, active, idle }) => (
                                <button
                                    key={status}
                                    type='button'
                                    aria-pressed={decision === status}
                                    onClick={() => onDecision(report.id, decision === status ? 'pending' : status)}
                                    className={cn(
                                        'flex h-8 cursor-pointer items-center gap-1 rounded-lg border px-2.5 text-[13px] font-medium transition-colors',
                                        decision === status ? active : cn('border-slate-200 text-slate-600', idle)
                                    )}
                                >
                                    <Icon className='size-3.5' /> {label}
                                </button>
                            ))}
                            <button
                                type='button'
                                onClick={() => setOpen((value) => !value)}
                                aria-expanded={open}
                                className='flex h-8 cursor-pointer items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50'
                            >
                                Report <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} />
                            </button>
                        </div>
                    </>
                ) : (
                    <div className='flex items-center gap-1.5'>
                        <span className='rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700'>Not started</span>
                        <button
                            type='button'
                            title='Resend invite email'
                            aria-label='Resend invite email'
                            onClick={() => onResendInvite(candidate.invite)}
                            className='flex size-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-orange-600'
                        >
                            <Mail className='size-4' />
                        </button>
                        <button
                            type='button'
                            title='Remove invite'
                            aria-label='Remove invite'
                            onClick={() => onRemoveInvite(candidate.invite)}
                            className='flex size-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-red-300 hover:text-red-600'
                        >
                            <Trash2 className='size-4' />
                        </button>
                    </div>
                )}
            </div>

            {open && report && (
                <div className='grid gap-6 border-t border-slate-100 bg-orange-50/20 px-5 py-5 lg:grid-cols-2'>
                    <div className='space-y-5'>
                        <div className='space-y-3'>
                            {Object.entries(feedback.rating ?? {}).map(([key, value]) => (
                                <div key={key}>
                                    <div className='flex justify-between text-sm'>
                                        <span className='text-slate-600'>{RATING_LABELS[key] ?? key}</span>
                                        <span className='font-semibold text-slate-900'>{value}/10</span>
                                    </div>
                                    <div className='mt-1 h-1.5 rounded-full bg-slate-200'>
                                        <div
                                            className='h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-500'
                                            style={{ width: `${Math.max(0, Math.min(100, Number(value) * 10))}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        {feedback.summary && (
                            <div>
                                <h4 className='text-sm font-semibold text-slate-900'>Summary</h4>
                                <p className='mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-600'>{feedback.summary}</p>
                            </div>
                        )}
                        {feedback.recommendationMessage && (
                            <div>
                                <h4 className='text-sm font-semibold text-slate-900'>Recommendation</h4>
                                <p className='mt-1 text-sm leading-relaxed text-slate-600'>{feedback.recommendationMessage}</p>
                            </div>
                        )}
                        <DetailedFeedback feedback={feedback} />
                        <div>
                            <h4 className='text-sm font-semibold text-slate-900'>Private notes</h4>
                            <textarea
                                value={notes}
                                onChange={(event) => setNotes(event.target.value)}
                                rows={3}
                                placeholder='Only you can see these notes.'
                                className='mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-300 focus:ring-3 focus:ring-orange-100'
                            />
                            {notesChanged && (
                                <button
                                    type='button'
                                    onClick={saveNotes}
                                    disabled={savingNotes}
                                    className='btn-orange mt-2 inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-white hover:brightness-105 disabled:opacity-60'
                                >
                                    {savingNotes && <Loader2 className='size-3.5 animate-spin' />} Save notes
                                </button>
                            )}
                        </div>
                    </div>

                    <div>
                        <h4 className='mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900'>
                            <MessageSquareText className='size-4 text-orange-600' /> Transcript
                        </h4>
                        <div className='max-h-[480px] overflow-y-auto rounded-xl border border-slate-200 bg-white p-4'>
                            <TranscriptView transcript={report.transcript} candidateName={candidate.name || 'Candidate'} />
                        </div>
                    </div>
                </div>
            )}
        </li>
    )
}

export default CandidateRow
