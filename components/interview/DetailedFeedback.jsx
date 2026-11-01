'use client'
import { useState } from 'react'
import { ChevronDown, Lightbulb, ThumbsUp, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

function scoreTone(score) {
    if (score >= 7) return 'bg-emerald-50 text-emerald-700'
    if (score >= 5) return 'bg-amber-50 text-amber-700'
    return 'bg-red-50 text-red-700'
}

function PointList({ icon: Icon, title, items, tone }) {
    if (!items?.length) return null
    return (
        <div className='rounded-xl border border-slate-200 bg-white p-4'>
            <h4 className='flex items-center gap-2 text-sm font-semibold text-slate-900'>
                <Icon className={cn('size-4', tone)} /> {title}
            </h4>
            <ul className='mt-3 space-y-2'>
                {items.map((item, index) => (
                    <li key={index} className='flex gap-2 text-sm leading-relaxed text-slate-600'>
                        <span className='mt-2 size-1.5 shrink-0 rounded-full bg-slate-300' />
                        {item}
                    </li>
                ))}
            </ul>
        </div>
    )
}

function QuestionItem({ item, index }) {
    const [open, setOpen] = useState(false)
    const score = Number(item.score)

    return (
        <li className='rounded-xl border border-slate-200 bg-white'>
            <button
                type='button'
                onClick={() => setOpen((value) => !value)}
                aria-expanded={open}
                className='flex w-full cursor-pointer items-start gap-3 p-4 text-left'
            >
                <span className='mt-0.5 text-sm font-semibold text-slate-400'>Q{index + 1}</span>
                <span className='flex-1 text-sm font-medium text-slate-900'>{item.question}</span>
                {Number.isFinite(score) && (
                    <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold', scoreTone(score))}>
                        {score}/10
                    </span>
                )}
                <ChevronDown className={cn('mt-0.5 size-4 shrink-0 text-slate-400 transition-transform', open && 'rotate-180')} />
            </button>
            {open && (
                <div className='space-y-3 border-t border-slate-100 px-4 pb-4 pt-3 text-sm leading-relaxed'>
                    {item.answerSummary && (
                        <p className='text-slate-600'><span className='font-medium text-slate-900'>Your answer: </span>{item.answerSummary}</p>
                    )}
                    {item.whatWentWell && (
                        <p className='text-slate-600'><span className='font-medium text-emerald-700'>Went well: </span>{item.whatWentWell}</p>
                    )}
                    {item.toImprove && (
                        <p className='text-slate-600'><span className='font-medium text-amber-700'>To improve: </span>{item.toImprove}</p>
                    )}
                    {item.idealAnswer && (
                        <div className='rounded-lg bg-violet-50 p-3'>
                            <p className='flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-violet-700'>
                                <Lightbulb className='size-3.5' /> A strong answer
                            </p>
                            <p className='mt-1 text-slate-700'>{item.idealAnswer}</p>
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
        <div className='space-y-6'>
            {hasPoints ? (
                <div className='grid gap-4 md:grid-cols-2'>
                    <PointList icon={ThumbsUp} title='Strengths' items={feedback.strengths} tone='text-emerald-600' />
                    <PointList icon={TrendingUp} title='Areas to improve' items={feedback.improvements} tone='text-amber-600' />
                </div>
            ) : null}
            {questions.length > 0 && (
                <div>
                    <h4 className='mb-3 text-sm font-semibold text-slate-900'>Question-by-question</h4>
                    <ol className='space-y-2'>
                        {questions.map((item, index) => <QuestionItem key={index} item={item} index={index} />)}
                    </ol>
                </div>
            )}
        </div>
    )
}

export default DetailedFeedback
