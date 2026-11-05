'use client'
import moment from 'moment'
import { Eye } from 'lucide-react'
import { dueStatus } from '@/services/invites'
import { cn } from '@/lib/utils'
import { STAGES } from './pipeline'

const STAGE_BY_ID = Object.fromEntries(STAGES.map((stage) => [stage.id, stage]))

function scoreTone(score) {
    if (score >= 7) return 'bg-emerald-50 text-emerald-700'
    if (score >= 5) return 'bg-amber-50 text-amber-700'
    return 'bg-red-50 text-red-600'
}

// List view: one row per candidate per interview, with stage, score and quick actions.
function CandidateTable({ candidates, selectedKeys, onOpen }) {
    const rows = [...candidates].sort((a, b) => new Date(b.date) - new Date(a.date))

    return (
        <div className='surface rounded-2xl'>
            <div className='grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 border-b border-slate-100 px-5 py-3 text-xs font-semibold text-slate-700 md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_1fr_0.9fr_0.9fr_120px]'>
                <span>Candidate</span>
                <span className='hidden md:block'>Role</span>
                <span className='hidden md:block'>Stage</span>
                <span className='hidden md:block'>Interview score</span>
                <span className='hidden md:block'>Last activity</span>
                <span className='text-right'>Actions</span>
            </div>
            <ul className='divide-y divide-slate-100'>
                {rows.map((candidate) => {
                    const stage = STAGE_BY_ID[candidate.stage] ?? STAGE_BY_ID.pending
                    const displayName = candidate.name || candidate.email?.split('@')[0] || 'Candidate'
                    const due = dueStatus(candidate.dueAt)
                    const selected = selectedKeys.includes(candidate.key)
                    return (
                        <li
                            key={candidate.key}
                            className={cn(
                                'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 px-5 py-3 transition-colors hover:bg-orange-50/30 md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_1fr_0.9fr_0.9fr_120px]',
                                selected && 'bg-orange-50/50'
                            )}
                        >
                            <div className='flex min-w-0 items-center gap-3'>
                                <span className='flex size-9 shrink-0 items-center justify-center rounded-full bg-orange-50 text-sm font-semibold text-orange-600'>
                                    {displayName[0].toUpperCase()}
                                </span>
                                <div className='min-w-0'>
                                    <button type='button' onClick={() => onOpen(candidate)} className='block max-w-full cursor-pointer truncate text-left text-sm font-semibold text-slate-900 hover:text-orange-700'>
                                        {displayName}
                                    </button>
                                    <p className='truncate text-xs text-slate-500'>{candidate.email}</p>
                                </div>
                            </div>
                            <div className='hidden min-w-0 md:block'>
                                <span className='inline-block max-w-full truncate rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700'>
                                    {candidate.interview.jobPosition}
                                </span>
                            </div>
                            <div className='hidden md:block'>
                                <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium', stage.pill)}>
                                    <span className={cn('size-1.5 rounded-full', stage.dot)} /> {stage.label}
                                </span>
                            </div>
                            <div className='hidden md:block'>
                                {candidate.score !== null ? (
                                    <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums', scoreTone(candidate.score))}>
                                        {candidate.score}/10
                                    </span>
                                ) : due ? (
                                    <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', due.badge)}>{due.label}</span>
                                ) : (
                                    <span className='text-sm text-slate-400'>—</span>
                                )}
                            </div>
                            <p className='hidden text-[13px] text-slate-500 md:block'>{moment(candidate.date).fromNow()}</p>
                            <div className='flex items-center justify-end'>
                                <button
                                    type='button'
                                    onClick={() => onOpen(candidate)}
                                    aria-label={`View details of ${displayName}`}
                                    className='inline-flex h-8 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg bg-orange-50 px-3 text-[13px] font-medium text-orange-700 ring-1 ring-orange-200 transition-colors hover:bg-orange-100'
                                >
                                    <Eye className='size-3.5' /> View details
                                </button>
                            </div>
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}

export default CandidateTable
