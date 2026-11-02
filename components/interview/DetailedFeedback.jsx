'use client'
import { useState } from 'react'
import { ChevronDown, Lightbulb, ThumbsUp, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

function scoreTone(score) {
    if (score >= 7) return 'bg-emerald-50 text-emerald-700'
    if (score >= 5) return 'bg-orange-50 text-orange-600'
    return 'bg-red-50 text-red-600'
}

function PointList({ icon: Icon, title, items, iconClass, dotClass }) {
    if (!items?.length) return null
    return (
        <div className='card-soft rounded-2xl p-5'>
            <h4 className='flex items-center gap-2 text-sm font-semibold text-slate-900'>
                <span className={cn('flex size-7 items-center justify-center rounded-lg', iconClass)}>
                    <Icon className='size-3.5' />
                </span>
                {title}
            </h4>
            <ul className='mt-3.5 space-y-2.5'>
                {items.map((item, index) => (
                    <li key={index} className='flex gap-2.5 text-[13px] leading-relaxed text-slate-600'>
                        <span className={cn('mt-[7px] size-1.5 shrink-0 rounded-full', dotClass)} />
                        {item}
                    </li>
                ))}
            </ul>
        </div>
    )
}

function Detail({ label, labelClass, children }) {
    return (
        <div>
            <p className={cn('text-[11px] font-medium uppercase tracking-wider', labelClass)}>{label}</p>
            <p className='mt-1 text-[13px] leading-relaxed text-slate-600'>{children}</p>
        </div>
    )
}

export function QuestionItem({ item, index }) {
    const [open, setOpen] = useState(false)
    const score = Number(item.score)

    return (
        <li className={cn('transition-colors', open && 'bg-[#fffaf6]')}>
            <button
                type='button'
                onClick={() => setOpen((value) => !value)}
                aria-expanded={open}
                className='flex w-full cursor-pointer items-start gap-3 px-5 py-3 text-left transition-colors hover:bg-orange-50/40'
            >
                <span className='mt-px flex size-6 shrink-0 items-center justify-center rounded-full bg-orange-50 text-xs font-medium text-orange-600'>
                    {index + 1}
                </span>
                <span className='flex-1 text-[13px] leading-relaxed text-slate-800'>{item.question}</span>
                {Number.isFinite(score) && (
                    <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-xs font-medium', scoreTone(score))} style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {score}/10
                    </span>
                )}
                <ChevronDown className={cn('mt-0.5 size-4 shrink-0 text-slate-400 transition-transform', open && 'rotate-180 text-orange-500')} />
            </button>
            {open && (
                <div className='space-y-3.5 pb-5 pl-14 pr-5'>
                    {item.answerSummary && <Detail label='Your answer' labelClass='text-slate-400'>{item.answerSummary}</Detail>}
                    {(item.whatWentWell || item.toImprove) && (
                        <div className='grid gap-3.5 sm:grid-cols-2'>
                            {item.whatWentWell && <Detail label='Went well' labelClass='text-emerald-600'>{item.whatWentWell}</Detail>}
                            {item.toImprove && <Detail label='To improve' labelClass='text-orange-600'>{item.toImprove}</Detail>}
                        </div>
                    )}
                    {item.idealAnswer && (
                        <div className='rounded-xl bg-orange-50/70 p-3.5 ring-1 ring-orange-100'>
                            <p className='flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-orange-600'>
                                <Lightbulb className='size-3.5' /> A strong answer
                            </p>
                            <p className='mt-1 text-[13px] leading-relaxed text-slate-700'>{item.idealAnswer}</p>
                        </div>
                    )}
                </div>
            )}
        </li>
    )
}

// Strengths, areas to improve and per-question feedback. Renders nothing for older reports without them.
function DetailedFeedback({ feedback }) {
    const questions = Array.isArray(feedback?.questionFeedback)
        ? feedback.questionFeedback.filter((item) => item?.question)
        : []
    const hasPoints = feedback?.strengths?.length || feedback?.improvements?.length

    if (!hasPoints && !questions.length) return null

    return (
        <div className='space-y-5'>
            {hasPoints ? (
                <div className='grid gap-5 md:grid-cols-2'>
                    <PointList icon={ThumbsUp} title='Strengths' items={feedback.strengths} iconClass='bg-emerald-50 text-emerald-600' dotClass='bg-emerald-400' />
                    <PointList icon={TrendingUp} title='Areas to improve' items={feedback.improvements} iconClass='bg-orange-50 text-orange-500' dotClass='bg-orange-400' />
                </div>
            ) : null}
            {questions.length > 0 && (
                <div>
                    <div className='mb-2.5 flex items-baseline justify-between'>
                        <h4 className='text-sm font-semibold text-slate-900'>Question by question</h4>
                        <span className='text-xs text-slate-400'>{questions.length} questions</span>
                    </div>
                    <ol className='card-soft divide-y divide-orange-50 overflow-hidden rounded-2xl'>
                        {questions.map((item, index) => <QuestionItem key={index} item={item} index={index} />)}
                    </ol>
                </div>
            )}
        </div>
    )
}

export default DetailedFeedback
