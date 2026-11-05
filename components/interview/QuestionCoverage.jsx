import { CheckCircle2, CircleDashed, CircleMinus } from 'lucide-react'
import { cn } from '@/lib/utils'

const STATUS = {
    answered: { label: 'Answered', icon: CheckCircle2, iconClass: 'text-emerald-500', badge: 'bg-emerald-50 text-emerald-700' },
    not_answered: { label: 'Asked, not answered', icon: CircleMinus, iconClass: 'text-amber-500', badge: 'bg-amber-50 text-amber-700' },
    not_asked: { label: 'Not asked', icon: CircleDashed, iconClass: 'text-slate-300', badge: 'bg-slate-100 text-slate-500' },
}

// Which of the interview's planned questions were asked and answered. Renders nothing for older reports.
function QuestionCoverage({ coverage }) {
    if (!Array.isArray(coverage) || !coverage.length) return null

    const asked = coverage.filter((item) => item.status !== 'not_asked').length
    const answered = coverage.filter((item) => item.status === 'answered').length
    const complete = answered === coverage.length

    return (
        <div>
            <div className='mb-2.5 flex flex-wrap items-baseline justify-between gap-2'>
                <h4 className='text-sm font-semibold text-slate-900'>Question coverage</h4>
                <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', complete ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700')}>
                    {asked} of {coverage.length} asked · {answered} answered
                </span>
            </div>
            <ol className='surface divide-y divide-slate-100 overflow-hidden rounded-2xl'>
                {coverage.map((item, index) => {
                    const status = STATUS[item.status] ?? STATUS.not_asked
                    const Icon = status.icon
                    return (
                        <li key={index} className='flex items-start gap-2.5 px-4 py-2.5'>
                            <Icon className={cn('mt-0.5 size-4 shrink-0', status.iconClass)} />
                            <p className={cn('min-w-0 flex-1 text-[13px] leading-snug', item.status === 'not_asked' ? 'text-slate-400' : 'text-slate-700')}>
                                <span className='mr-1 tabular-nums text-slate-400'>{index + 1}.</span>
                                {item.question}
                            </p>
                            <span className={cn('shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium', status.badge)}>
                                {status.label}{item.score !== null && item.score !== undefined ? ` · ${item.score}/10` : ''}
                            </span>
                        </li>
                    )
                })}
            </ol>
        </div>
    )
}

export default QuestionCoverage
