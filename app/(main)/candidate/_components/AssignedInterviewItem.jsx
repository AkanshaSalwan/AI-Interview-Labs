import Link from 'next/link'
import moment from 'moment'
import { CheckCircle2, Clock3, Play } from 'lucide-react'

function AssignedInterviewItem({ invite, compact = false }) {
    const completed = invite.status === 'completed'
    const jobPosition = invite.interview?.jobPosition ?? 'Interview'

    return (
        <li className='flex items-center gap-4 px-5 py-4'>
            <span className='flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 font-semibold text-violet-600'>
                {jobPosition[0]?.toUpperCase()}
            </span>
            <div className='min-w-0 flex-1'>
                <p className='truncate font-medium text-slate-900'>{jobPosition}</p>
                <p className='flex items-center gap-2 text-xs text-slate-500'>
                    {invite.interview?.duration && (
                        <span className='flex items-center gap-1'><Clock3 className='size-3' />{invite.interview.duration} min</span>
                    )}
                    <span>
                        {completed
                            ? `Submitted ${moment(invite.completed_at).fromNow()}`
                            : `Invited ${moment(invite.created_at).fromNow()}`}
                    </span>
                </p>
            </div>
            {completed ? (
                <span className='flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700'>
                    <CheckCircle2 className='size-3.5' /> Submitted
                </span>
            ) : (
                <Link
                    href={`/interview/${invite.interview_id}`}
                    className='inline-flex h-9 items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-500 px-3.5 text-sm font-medium text-white shadow-sm shadow-violet-500/25 hover:opacity-90'
                >
                    <Play className='size-3.5' /> {compact ? 'Start' : 'Start interview'}
                </Link>
            )}
        </li>
    )
}

export default AssignedInterviewItem
