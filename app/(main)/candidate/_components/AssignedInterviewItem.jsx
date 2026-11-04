import Link from 'next/link'
import moment from 'moment'
import { Clock3, Play } from 'lucide-react'
import { DECISIONS } from '@/services/invites'
import { cn } from '@/lib/utils'

function AssignedInterviewItem({ invite, compact = false }) {
    const completed = invite.status === 'completed'
    const jobPosition = invite.interview?.jobPosition ?? 'Interview'
    // `decision` exists once migration 008 has run; until then a finished interview just shows "Submitted".
    const decision = invite.decision ? DECISIONS[invite.decision] : null

    return (
        <li className='flex items-center gap-3 px-5 py-3 transition-colors hover:bg-orange-50/40'>
            <span className='flex size-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-sm font-semibold text-orange-600'>
                {jobPosition[0]?.toUpperCase()}
            </span>
            <div className='min-w-0 flex-1'>
                <p className='truncate text-sm font-medium text-slate-900'>{jobPosition}</p>
                <p className='mt-0.5 flex items-center gap-2 text-xs text-slate-500'>
                    {invite.interview?.duration && (
                        <span className='flex items-center gap-1'><Clock3 className='size-3' />{invite.interview.duration} min</span>
                    )}
                    <span>
                        {completed
                            ? `Submitted ${moment(invite.completed_at).fromNow()}`
                            : `Assigned ${moment(invite.created_at).fromNow()}`}
                    </span>
                </p>
            </div>
            {completed ? (
                <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', decision?.badge ?? 'bg-emerald-50 text-emerald-700')}>
                    {decision?.candidate ?? 'Submitted'}
                </span>
            ) : (
                <Link
                    href={`/interview/${invite.interview_id}`}
                    className='btn-orange inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium text-white hover:brightness-105'
                >
                    <Play className='size-3' /> {compact ? 'Start' : 'Start interview'}
                </Link>
            )}
        </li>
    )
}

export default AssignedInterviewItem
