'use client'
import { useState } from 'react'
import moment from 'moment'
import { BadgeCheck, Check, ChevronDown, Loader2, Mail, MessageSquareText, Trash2, X } from 'lucide-react'
import TranscriptView from '@/components/interview/TranscriptView'
import DetailedFeedback from '@/components/interview/DetailedFeedback'
import { isRecommended } from '@/services/scores'
import { DECISIONS, dueStatus } from '@/services/invites'
import { cn } from '@/lib/utils'

const RATING_LABELS = {
    technicalSkills: 'Technical skills',
    communication: 'Communication',
    problemSolving: 'Problem solving',
    experience: 'Experience',
}

// The next steps HR can take on a finished interview. Clicking the active one again undoes it.
const DECISION_BUTTONS = [
    { status: 'shortlisted', label: 'Shortlist', icon: Check, active: 'border-sky-500 bg-sky-500 text-white', idle: 'border-sky-200 bg-sky-50 text-sky-700 hover:border-sky-300 hover:bg-sky-100' },
    { status: 'hired', label: 'Hire', icon: BadgeCheck, active: 'border-emerald-500 bg-emerald-500 text-white', idle: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100' },
    { status: 'rejected', label: 'Reject', icon: X, active: 'border-red-500 bg-red-500 text-white', idle: 'border-red-200 bg-red-50 text-red-600 hover:border-red-300 hover:bg-red-100' },
]

function scoreTone(score) {
    if (score >= 7) return 'text-emerald-600'
    if (score >= 5) return 'text-amber-600'
    return 'text-red-600'
}

// A text box saved to one column of the report, with a Save button that appears once it changes.
export function ReportTextField({ title, hint, placeholder, initialValue, saveLabel, onSave }) {
    const [value, setValue] = useState(initialValue ?? '')
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(initialValue ?? '')

    const save = async () => {
        setSaving(true)
        if (await onSave(value)) setSaved(value)
        setSaving(false)
    }

    return (
        <div>
            <h4 className='text-sm font-semibold text-slate-900'>{title}</h4>
            {hint && <p className='text-xs text-slate-500'>{hint}</p>}
            <textarea
                value={value}
                onChange={(event) => setValue(event.target.value)}
                rows={3}
                placeholder={placeholder}
                className='mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-300 focus:ring-3 focus:ring-orange-100'
            />
            {value !== saved && (
                <button
                    type='button'
                    onClick={save}
                    disabled={saving}
                    className='btn-orange mt-2 inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-white hover:brightness-105 disabled:opacity-60'
                >
                    {saving && <Loader2 className='size-3.5 animate-spin' />} {saveLabel}
                </button>
            )}
        </div>
    )
}

function CandidateRow({ candidate, rank, onDecision, onSaveField, onResendInvite, onRemoveInvite }) {
    const [open, setOpen] = useState(false)

    const report = candidate.report
    const feedback = report?.feedback ?? {}
    const decision = report?.recruiter_status ?? 'pending'

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
                                        decision === status ? active : idle
                                    )}
                                >
                                    <Icon className='size-3.5' /> {label}
                                </button>
                            ))}
                            <button
                                type='button'
                                onClick={() => setOpen((value) => !value)}
                                aria-expanded={open}
                                className='btn-orange flex h-8 cursor-pointer items-center gap-1 rounded-lg px-3 text-[13px] font-medium text-white transition-[filter] hover:brightness-105'
                            >
                                Report <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} />
                            </button>
                        </div>
                    </>
                ) : (
                    <div className='flex items-center gap-1.5'>
                        <span className='rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600'>Not started</span>
                        {dueStatus(candidate.invite?.due_at) && (
                            <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', dueStatus(candidate.invite.due_at).badge)}>
                                {dueStatus(candidate.invite.due_at).label}
                            </span>
                        )}
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
                        <ReportTextField
                            title='Message to candidate'
                            hint='Shown on their dashboard with your decision, e.g. next-round details.'
                            placeholder='e.g. Great interview! Our team will call you on Monday at 11 AM for the next round.'
                            initialValue={report.candidate_message}
                            saveLabel='Send message'
                            onSave={(value) => onSaveField(report.id, { candidate_message: value.trim() || null }, 'Message sent to the candidate')}
                        />
                        <ReportTextField
                            title='Private notes'
                            placeholder='Only you can see these notes.'
                            initialValue={report.recruiter_notes}
                            saveLabel='Save notes'
                            onSave={(value) => onSaveField(report.id, { recruiter_notes: value }, 'Notes saved')}
                        />
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
