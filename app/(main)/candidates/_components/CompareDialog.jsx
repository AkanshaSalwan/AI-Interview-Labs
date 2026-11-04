'use client'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { Crown, Loader2, Sparkles, X } from 'lucide-react'
import { SKILLS, isRecommended, skillScore } from '@/services/scores'
import { cn } from '@/lib/utils'

function highest(values) {
    const numbers = values.filter((value) => value !== null)
    return numbers.length ? Math.max(...numbers) : null
}

function ScoreBar({ value, best }) {
    return (
        <div>
            <p className={cn('text-sm tabular-nums', best ? 'font-semibold text-slate-900' : 'text-slate-600')}>
                {value ?? '—'}<span className='text-xs text-slate-400'>/10</span>
            </p>
            <div className='mt-1 h-1.5 rounded-full bg-slate-100'>
                <div
                    className={cn('h-full rounded-full', best ? 'bg-orange-500' : 'bg-orange-200')}
                    style={{ width: `${Math.max(0, Math.min(100, (value ?? 0) * 10))}%` }}
                />
            </div>
        </div>
    )
}

function PointList({ items, tone }) {
    if (!items?.length) return <p className='text-sm text-slate-400'>—</p>
    return (
        <ul className='space-y-1'>
            {items.slice(0, 3).map((item, index) => (
                <li key={index} className='flex gap-1.5 text-[13px] leading-snug text-slate-600'>
                    <span className={cn('mt-1.5 size-1.5 shrink-0 rounded-full', tone)} />
                    {item}
                </li>
            ))}
        </ul>
    )
}

// Side-by-side view of 2–3 finished candidates, with an optional AI recommendation.
function CompareDialog({ candidates, onClose }) {
    const [ai, setAi] = useState(null)
    const [asking, setAsking] = useState(false)
    const [aiError, setAiError] = useState(null)

    useEffect(() => {
        const onKey = (event) => event.key === 'Escape' && onClose()
        document.addEventListener('keydown', onKey)
        document.body.style.overflow = 'hidden'
        return () => {
            document.removeEventListener('keydown', onKey)
            document.body.style.overflow = ''
        }
    }, [onClose])

    const askAi = async () => {
        setAsking(true)
        setAiError(null)
        try {
            const { data } = await axios.post('/api/compare-candidates', { reportIds: candidates.map((item) => item.report.id) })
            setAi(data)
        } catch (error) {
            setAiError(error?.response?.data?.error || 'Could not get an AI recommendation. Try again.')
        } finally {
            setAsking(false)
        }
    }

    const topOverall = highest(candidates.map((item) => item.score))
    const bestSkill = Object.fromEntries(SKILLS.map(({ key }) => [key, highest(candidates.map((item) => skillScore(item.report, key)))]))
    const aiPick = candidates.find((item) => item.report.id === ai?.bestId)
    const columns = { gridTemplateColumns: `140px repeat(${candidates.length}, minmax(0, 1fr))` }

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 p-4 backdrop-blur-sm' onClick={onClose}>
            <div
                role='dialog'
                aria-modal='true'
                aria-label='Compare candidates'
                onClick={(event) => event.stopPropagation()}
                className='flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl shadow-orange-950/10'
            >
                <div className='flex items-center justify-between border-b border-slate-100 px-6 py-4'>
                    <div>
                        <h2 className='text-[17px] font-semibold text-slate-900'>Compare candidates</h2>
                        <p className='text-[13px] text-slate-500'>Best value in each row is highlighted.</p>
                    </div>
                    <button type='button' onClick={onClose} aria-label='Close' className='cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700'>
                        <X className='size-5' />
                    </button>
                </div>

                <div className='overflow-y-auto px-6 pb-6'>
                    {/* AI recommendation */}
                    <div className='mt-5 rounded-2xl border border-orange-100 bg-gradient-to-r from-orange-50 to-[#fffaf5] p-4'>
                        {ai ? (
                            <div className='flex items-start gap-3'>
                                <span className='flex size-9 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white'>
                                    <Crown className='size-[18px]' />
                                </span>
                                <div>
                                    <p className='text-sm font-semibold text-slate-900'>AI pick: {aiPick?.name || aiPick?.email}</p>
                                    <p className='mt-0.5 text-sm leading-relaxed text-slate-600'>{ai.verdict}</p>
                                </div>
                            </div>
                        ) : (
                            <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                                <div className='flex items-center gap-3'>
                                    <span className='flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-orange-500 ring-1 ring-orange-100'>
                                        <Sparkles className='size-[18px]' />
                                    </span>
                                    <div>
                                        <p className='text-sm font-semibold text-slate-900'>Not sure who to pick?</p>
                                        <p className='text-[13px] text-slate-500'>{aiError || 'The AI reads every report and recommends one candidate.'}</p>
                                    </div>
                                </div>
                                <button
                                    type='button'
                                    onClick={askAi}
                                    disabled={asking}
                                    className='btn-orange inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-[0.625rem] px-4 text-sm font-medium text-white hover:brightness-105 disabled:opacity-60'
                                >
                                    {asking ? <Loader2 className='size-4 animate-spin' /> : <Sparkles className='size-4' />}
                                    {asking ? 'Comparing…' : 'Ask AI who to pick'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Comparison grid */}
                    <div className='mt-5 text-sm'>
                        <div className='grid items-end gap-x-5 border-b border-slate-100 pb-3' style={columns}>
                            <span />
                            {candidates.map((item) => (
                                <div key={item.key} className='min-w-0'>
                                    <div className='flex items-center gap-2'>
                                        <span className={cn(
                                            'flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                                            ai?.bestId === item.report.id ? 'bg-orange-500 text-white' : 'bg-orange-50 text-orange-600'
                                        )}>
                                            {ai?.bestId === item.report.id ? <Crown className='size-4' /> : (item.name || item.email || '?')[0].toUpperCase()}
                                        </span>
                                        <div className='min-w-0'>
                                            <p className='truncate font-semibold text-slate-900'>{item.name || item.email}</p>
                                            <p className='truncate text-xs text-slate-500'>{item.interview.jobPosition}</p>
                                        </div>
                                    </div>
                                    {ai?.notes?.[item.report.id] && <p className='mt-2 text-xs leading-snug text-slate-500'>{ai.notes[item.report.id]}</p>}
                                </div>
                            ))}
                        </div>

                        <div className='grid items-center gap-x-5 border-b border-slate-100 py-3' style={columns}>
                            <span className='text-[13px] font-medium text-slate-500'>Overall</span>
                            {candidates.map((item) => (
                                <p key={item.key} className={cn('text-xl tabular-nums', item.score !== null && item.score === topOverall ? 'font-bold text-orange-600' : 'font-semibold text-slate-700')}>
                                    {item.score ?? '—'}<span className='text-xs font-medium text-slate-400'>/10</span>
                                </p>
                            ))}
                        </div>

                        {SKILLS.map(({ key, label }) => (
                            <div key={key} className='grid items-center gap-x-5 border-b border-slate-100 py-2.5' style={columns}>
                                <span className='text-[13px] font-medium text-slate-500'>{label}</span>
                                {candidates.map((item) => {
                                    const value = skillScore(item.report, key)
                                    return <ScoreBar key={item.key} value={value} best={value !== null && value === bestSkill[key]} />
                                })}
                            </div>
                        ))}

                        <div className='grid items-center gap-x-5 border-b border-slate-100 py-3' style={columns}>
                            <span className='text-[13px] font-medium text-slate-500'>Interviewer says</span>
                            {candidates.map((item) => (
                                <span key={item.key} className={cn('w-fit rounded-full px-2 py-0.5 text-xs font-medium', isRecommended(item.report) ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600')}>
                                    {item.report.feedback?.recommendation || '—'}
                                </span>
                            ))}
                        </div>

                        <div className='grid gap-x-5 border-b border-slate-100 py-3' style={columns}>
                            <span className='text-[13px] font-medium text-slate-500'>Strengths</span>
                            {candidates.map((item) => <PointList key={item.key} items={item.report.feedback?.strengths} tone='bg-emerald-400' />)}
                        </div>

                        <div className='grid gap-x-5 py-3' style={columns}>
                            <span className='text-[13px] font-medium text-slate-500'>To improve</span>
                            {candidates.map((item) => <PointList key={item.key} items={item.report.feedback?.improvements} tone='bg-orange-400' />)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CompareDialog
