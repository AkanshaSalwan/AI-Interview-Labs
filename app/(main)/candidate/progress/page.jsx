'use client'
import { useState } from 'react'
import Link from 'next/link'
import moment from 'moment'
import { Award, ChevronRight, ClipboardList, Gauge, Lightbulb, Mic, TrendingDown, TrendingUp } from 'lucide-react'
import { SKILLS, mean, skillScore } from '@/services/scores'
import ScoreLineChart from '@/components/charts/ScoreLineChart'
import PaperBackdrop from '../../_components/PaperBackdrop'
import { usePracticeResults } from '../_components/usePracticeResults'
import { cn } from '@/lib/utils'

const FOCUS_TIPS = {
    technicalSkills: 'Pick one core topic per session and explain it out loud end to end — definitions, an example, and trade-offs.',
    communication: 'Structure answers as situation → action → result, and pause to summarise before going deeper.',
    problemSolving: 'Say your approach before the details: restate the problem, outline options, then pick one and justify it.',
    experience: 'Prepare 3–4 project stories with concrete numbers: what you built, your role, and the outcome.',
}

const SHORT_SKILL = {
    technicalSkills: 'Tech',
    communication: 'Comm',
    problemSolving: 'Problem',
    experience: 'Exp',
}

const RECENT_COUNT = 5

// Compare the average of the latest sessions with the earliest ones.
function improvement(values) {
    const scores = values.filter((value) => Number.isFinite(value))
    if (scores.length < 2) return null
    const window = Math.min(3, Math.floor(scores.length / 2))
    return Math.round((mean(scores.slice(-window)) - mean(scores.slice(0, window))) * 10) / 10
}

function signed(value) {
    return `${value > 0 ? '+' : ''}${value}`
}

function Change({ value }) {
    if (value === null) return <span className='text-xs text-slate-400'>—</span>
    const flat = value === 0
    const up = value > 0
    const Icon = up ? TrendingUp : TrendingDown
    return (
        <span className={cn('inline-flex items-center gap-0.5 text-xs font-medium', flat ? 'text-slate-500' : up ? 'text-emerald-600' : 'text-red-500')}>
            {!flat && <Icon className='size-3.5' />}
            {signed(value)}
        </span>
    )
}

function scoreTone(score) {
    if (!Number.isFinite(score)) return 'bg-slate-50 text-slate-400'
    if (score >= 7) return 'bg-emerald-50 text-emerald-700'
    if (score >= 5) return 'bg-orange-50 text-orange-600'
    return 'bg-red-50 text-red-600'
}

function Stat({ icon: Icon, label, value, hint }) {
    return (
        <div className='card-swoosh rounded-2xl p-4'>
            <div className='flex items-center gap-2.5'>
                <span className='flex size-8 items-center justify-center rounded-lg bg-orange-50 text-orange-500'>
                    <Icon className='size-4' strokeWidth={1.75} />
                </span>
                <p className='text-[13px] text-slate-500'>{label}</p>
            </div>
            <p className='mt-2.5 text-2xl font-semibold tracking-tight text-slate-900'>{value}</p>
            {hint && <div className='mt-0.5 text-xs text-slate-400'>{hint}</div>}
        </div>
    )
}

function Header() {
    return (
        <div className='mb-6'>
            <h1 className='text-[28px] font-semibold tracking-tight text-slate-900'>Progress</h1>
            <p className='mt-1 text-sm text-slate-500'>How your practice interview scores are changing over time.</p>
        </div>
    )
}

// One plain-language sentence that explains the trend.
function trendSentence(change, latest, average) {
    if (change === null) return `Your first score is ${latest}/10. Do another session to start seeing a trend.`
    if (change > 0) return `You're improving — your recent scores are ${change} points higher than when you started.`
    if (change < 0) return `Your recent scores are ${Math.abs(change)} points lower than when you started. Your average is ${average}/10.`
    return `Your scores are steady at around ${average}/10.`
}

function ProgressPage() {
    const { results: newestFirst, loading } = usePracticeResults()
    const [showAll, setShowAll] = useState(false)
    const sessions = [...newestFirst].reverse() // chronological

    if (loading) {
        return (
            <div className='isolate pb-6'>
                <PaperBackdrop />
                <Header />
                <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
                    {[0, 1, 2, 3].map((item) => <div key={item} className='card-soft h-[108px] animate-pulse rounded-2xl' />)}
                </div>
                <div className='mt-5 grid gap-5 lg:grid-cols-5'>
                    <div className='card-soft h-72 animate-pulse rounded-2xl lg:col-span-3' />
                    <div className='card-soft h-72 animate-pulse rounded-2xl lg:col-span-2' />
                </div>
            </div>
        )
    }

    if (!sessions.length) {
        return (
            <div className='isolate pb-6'>
                <PaperBackdrop />
                <Header />
                <div className='card-soft flex flex-col items-center rounded-2xl px-6 py-14 text-center'>
                    <span className='flex size-12 items-center justify-center rounded-xl bg-orange-50 text-orange-500'>
                        <TrendingUp className='size-6' strokeWidth={1.75} />
                    </span>
                    <h3 className='mt-4 text-[15px] font-medium text-slate-900'>No practice sessions yet</h3>
                    <p className='mt-1 max-w-sm text-sm text-slate-500'>Finish your first practice interview and your progress will appear here.</p>
                    <Link href='/candidate/practice' className='btn-orange mt-6 inline-flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-medium text-white hover:brightness-105'>
                        <Mic className='size-4' /> Start practicing
                    </Link>
                </div>
            </div>
        )
    }

    const overallScores = sessions.map((session) => session.score)
    const scored = overallScores.filter((score) => Number.isFinite(score))
    const average = mean(overallScores)
    const best = scored.length ? Math.max(...scored) : null
    const latest = scored.at(-1) ?? '—'
    const overallChange = improvement(overallScores)

    const skills = SKILLS.map((skill) => {
        const values = sessions.map((session) => skillScore(session, skill.key))
        return { ...skill, average: mean(values), change: improvement(values) }
    })
    const weakest = skills
        .filter((skill) => skill.average !== null)
        .reduce((low, skill) => (low === null || skill.average < low.average ? skill : low), null)

    const visibleSessions = showAll ? newestFirst : newestFirst.slice(0, RECENT_COUNT)

    return (
        <div className='isolate pb-6'>
            <PaperBackdrop />
            <Header />

            {/* At a glance */}
            <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
                <Stat icon={ClipboardList} label='Sessions' value={sessions.length} hint='Practice interviews done' />
                <Stat icon={Gauge} label='Average score' value={average !== null ? `${average}/10` : '—'} hint='Across all sessions' />
                <Stat icon={Award} label='Best score' value={best !== null ? `${best}/10` : '—'} hint='Your highest so far' />
                <Stat
                    icon={overallChange !== null && overallChange < 0 ? TrendingDown : TrendingUp}
                    label='Improvement'
                    value={overallChange === null ? '—' : signed(overallChange)}
                    hint={overallChange === null ? 'Needs 2+ sessions' : 'Recent vs. first sessions'}
                />
            </div>

            <div className='mt-5 grid gap-5 lg:grid-cols-5'>
                {/* Score over time */}
                <section className='card-soft rounded-2xl p-5 lg:col-span-3'>
                    <div className='flex items-start justify-between gap-4'>
                        <div>
                            <h2 className='text-[15px] font-semibold text-slate-900'>Your score over time</h2>
                            <p className='mt-0.5 text-[13px] text-slate-500'>{trendSentence(overallChange, latest, average)}</p>
                        </div>
                        <span className='shrink-0 rounded-full bg-orange-50 px-2.5 py-1 text-xs text-orange-600'>Latest {latest}/10</span>
                    </div>
                    <div className='mt-4'>
                        <ScoreLineChart
                            points={sessions.map((session) => ({
                                id: session.id,
                                label: moment(session.created_at).format('D MMM'),
                                value: session.score,
                                detail: session.jobPosition,
                            }))}
                            height={220}
                            ariaLabel={`Overall practice score across ${sessions.length} sessions. Latest ${latest} out of 10, average ${average}.`}
                        />
                    </div>
                    <p className='mt-1 text-[11px] text-slate-400'>Each dot is one practice interview, scored out of 10. Hover a dot for details.</p>
                </section>

                {/* Skills + what to work on */}
                <section className='card-soft flex flex-col rounded-2xl p-5 lg:col-span-2'>
                    <h2 className='text-[15px] font-semibold text-slate-900'>Your skills</h2>
                    <p className='mt-0.5 text-[13px] text-slate-500'>Average out of 10, and the change since your first sessions.</p>

                    <ul className='mt-4 space-y-3.5'>
                        {skills.map((skill) => {
                            const isFocus = weakest?.key === skill.key
                            return (
                                <li key={skill.key}>
                                    <div className='flex items-center justify-between text-[13px]'>
                                        <span className={cn('text-slate-700', isFocus && 'font-medium text-slate-900')}>{skill.label}</span>
                                        <span className='flex items-center gap-2.5' style={{ fontVariantNumeric: 'tabular-nums' }}>
                                            <Change value={skill.change} />
                                            <span className='w-7 text-right font-medium text-slate-900'>{skill.average ?? '—'}</span>
                                        </span>
                                    </div>
                                    <div className='mt-1.5 h-2 rounded-full bg-[#f6eee6]'>
                                        <div
                                            className={cn('h-full rounded-full', isFocus ? 'bg-orange-300' : 'bg-orange-500')}
                                            style={{ width: `${(skill.average ?? 0) * 10}%` }}
                                        />
                                    </div>
                                </li>
                            )
                        })}
                    </ul>

                    {weakest && (
                        <div className='mt-5 rounded-xl bg-gradient-to-br from-orange-50 to-[#fff8f1] p-4 ring-1 ring-orange-100'>
                            <p className='flex items-center gap-1.5 text-xs font-medium text-orange-600'>
                                <Lightbulb className='size-3.5' /> Focus next: {weakest.label}
                            </p>
                            <p className='mt-1.5 text-[13px] leading-relaxed text-slate-600'>{FOCUS_TIPS[weakest.key]}</p>
                            <Link href='/candidate/practice' className='mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-orange-600 hover:text-orange-700'>
                                Practice now <ChevronRight className='size-3.5' />
                            </Link>
                        </div>
                    )}
                </section>
            </div>

            {/* Past sessions */}
            <section className='mt-5'>
                <div className='mb-3 flex items-baseline justify-between'>
                    <h2 className='text-[15px] font-semibold text-slate-900'>Past sessions</h2>
                    <span className='text-xs text-slate-400'>Open a session to see its full feedback</span>
                </div>
                <ul className='card-soft divide-y divide-orange-50 overflow-hidden rounded-2xl'>
                    {visibleSessions.map((session) => (
                        <li key={session.id}>
                            <Link
                                href={`/interview/${session.interview_id}/completed?feedback=${session.id}`}
                                className='group flex items-center gap-4 px-5 py-3 transition-colors hover:bg-orange-50/40'
                            >
                                <span className='flex size-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-sm font-medium text-orange-500'>
                                    {session.jobPosition?.[0]?.toUpperCase() ?? 'I'}
                                </span>
                                <div className='min-w-0 flex-1'>
                                    <p className='truncate text-sm font-medium text-slate-900'>{session.jobPosition}</p>
                                    <p className='text-xs text-slate-500'>
                                        {moment(session.created_at).format('DD MMM YYYY')}
                                        {session.difficulty && <> · {session.difficulty}</>}
                                    </p>
                                </div>
                                <div className='hidden items-center gap-1.5 md:flex' style={{ fontVariantNumeric: 'tabular-nums' }}>
                                    {SKILLS.map((skill) => (
                                        <span key={skill.key} title={skill.label} className='rounded-md bg-[#f8f2ec] px-2 py-0.5 text-[11px] text-slate-500'>
                                            {SHORT_SKILL[skill.key]} <span className='font-medium text-slate-700'>{skillScore(session, skill.key) ?? '—'}</span>
                                        </span>
                                    ))}
                                </div>
                                <span className={cn('rounded-full px-2.5 py-0.5 text-[13px] font-medium', scoreTone(session.score))} style={{ fontVariantNumeric: 'tabular-nums' }}>
                                    {session.score ?? '—'}/10
                                </span>
                                <span className='inline-flex h-8 shrink-0 items-center gap-1 rounded-lg bg-orange-50 px-3 text-[13px] font-medium text-orange-600 ring-1 ring-orange-100 transition-colors group-hover:bg-orange-500 group-hover:text-white group-hover:ring-orange-500'>
                                    <span className='hidden sm:inline'>View details</span>
                                    <ChevronRight className='size-3.5' />
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
                {newestFirst.length > RECENT_COUNT && (
                    <button
                        type='button'
                        onClick={() => setShowAll((value) => !value)}
                        className='mt-3 cursor-pointer text-[13px] font-medium text-orange-600 hover:text-orange-700'
                    >
                        {showAll ? 'Show fewer' : `Show all ${newestFirst.length} sessions`}
                    </button>
                )}
            </section>
        </div>
    )
}

export default ProgressPage
