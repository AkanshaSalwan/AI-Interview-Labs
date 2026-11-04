'use client'
import Link from 'next/link'
import moment from 'moment'
import { Check, GripVertical, Sparkles } from 'lucide-react'
import { isRecommended } from '@/services/scores'
import { cn } from '@/lib/utils'

function scoreTone(score) {
    if (score >= 7) return 'bg-emerald-50 text-emerald-700'
    if (score >= 5) return 'bg-amber-50 text-amber-700'
    return 'bg-red-50 text-red-600'
}

// One candidate on the pipeline board. Finished interviews can be dragged and picked for comparison.
function CandidateCard({ candidate, selected, selectable, onToggleSelect, onDragStart, onDragEnd, dragging }) {
    const draggable = Boolean(candidate.report)
    const displayName = candidate.name || candidate.email?.split('@')[0] || 'Candidate'

    return (
        <li
            draggable={draggable}
            onDragStart={(event) => onDragStart(event, candidate)}
            onDragEnd={onDragEnd}
            className={cn(
                'group relative rounded-xl border bg-white p-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition-[box-shadow,opacity,border-color]',
                draggable && 'cursor-grab active:cursor-grabbing hover:shadow-[0_8px_20px_-12px_rgba(154,72,20,0.35)]',
                selected ? 'border-orange-400 ring-2 ring-orange-100' : 'border-slate-200/80',
                dragging && 'opacity-40'
            )}
        >
            <div className='flex items-start gap-2.5'>
                <span className='flex size-8 shrink-0 items-center justify-center rounded-full bg-orange-50 text-xs font-semibold text-orange-600'>
                    {displayName[0].toUpperCase()}
                </span>
                <div className='min-w-0 flex-1'>
                    <Link
                        href={`/scheduled-interviews/${candidate.interview.interview_id}`}
                        className='block truncate text-[13px] font-medium text-slate-900 hover:text-orange-700'
                        title={`${candidate.email ?? ''} · open full report`}
                    >
                        {displayName}
                    </Link>
                    <p className='truncate text-xs text-slate-500'>{candidate.interview.jobPosition}</p>
                </div>
                {selectable && (
                    <button
                        type='button'
                        onClick={() => onToggleSelect(candidate)}
                        aria-pressed={selected}
                        aria-label={selected ? 'Remove from comparison' : 'Add to comparison'}
                        title={selected ? 'Remove from comparison' : 'Compare'}
                        className={cn(
                            'flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-md border transition-colors',
                            selected ? 'border-orange-500 bg-orange-500 text-white' : 'border-slate-300 bg-white text-transparent hover:border-orange-400'
                        )}
                    >
                        <Check className='size-3' strokeWidth={3} />
                    </button>
                )}
            </div>

            <div className='mt-2.5 flex items-center gap-1.5'>
                {candidate.score !== null ? (
                    <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums', scoreTone(candidate.score))}>
                        {candidate.score}/10
                    </span>
                ) : (
                    <span className='rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500'>Not taken</span>
                )}
                {candidate.report && isRecommended(candidate.report) && (
                    <span className='flex items-center gap-0.5 rounded-full bg-orange-50 px-1.5 py-0.5 text-[11px] font-medium text-orange-700'>
                        <Sparkles className='size-3' /> Recommended
                    </span>
                )}
                <span className='ml-auto text-[11px] text-slate-400'>{moment(candidate.date).fromNow(true)}</span>
                {draggable && <GripVertical className='size-3.5 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100' />}
            </div>
        </li>
    )
}

export default CandidateCard
