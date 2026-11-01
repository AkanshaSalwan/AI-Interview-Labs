'use client'
import Link from 'next/link'
import moment from 'moment'
import { Award, ClipboardList, Gauge, Mic, Target, TrendingDown, TrendingUp } from 'lucide-react'
import { SKILLS, mean, skillScore } from '@/services/scores'
import ScoreLineChart from '@/components/charts/ScoreLineChart'
import PageHeader from '../../_components/PageHeader'
import StatCard from '../../_components/StatCard'
import EmptyState from '../../_components/EmptyState'
import { usePracticeResults } from '../_components/usePracticeResults'
import { cn } from '@/lib/utils'

const FOCUS_TIPS = {
    technicalSkills: 'Pick one core topic per session and explain it out loud end to end — definitions, an example, and trade-offs.',
    communication: 'Structure answers as situation → action → result, and pause to summarise before going deeper.',
    problemSolving: 'Say your approach before the details: restate the problem, outline options, then pick one and justify it.',
    experience: 'Prepare 3–4 project stories with concrete numbers: what you built, your role, and the outcome.',
}

// Compare the average of the latest sessions with the earliest ones.
function improvement(values) {
    const scores = values.filter((value) => Number.isFinite(value))
    if (scores.length < 2) return null
    const window = Math.min(3, Math.floor(scores.length / 2))
    return Math.round((mean(scores.slice(-window)) - mean(scores.slice(0, window))) * 10) / 10
}

function Delta({ value }) {
    if (value === null) return <span className='text-xs text-slate-400'>Not enough sessions yet</span>
    const up = value > 0
    const flat = value === 0
    const Icon = up ? TrendingUp : TrendingDown
    return (
        <span className={cn('inline-flex items-center gap-1 text-xs font-medium', flat ? 'text-slate-500' : up ? 'text-emerald-600' : 'text-red-600')}>
            {!flat && <Icon className='size-3.5' />}
            {up ? '+' : ''}{value} vs. your first sessions
        </span>
    )
}

function ProgressPage() {
    const { results: newestFirst, loading } = usePracticeResults()
    const sessions = [...newestFirst].reverse() // chronological

    if (loading) {
        return (
            <div>
                <PageHeader title='Progress' description='See how your scores improve over time.' />
                <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                    {[0, 1, 2, 3].map((item) => <div key={item} className='h-28 animate-pulse rounded-2xl border border-slate-200 bg-white' />)}
                </div>
                <div className='mt-6 h-72 animate-pulse rounded-2xl border border-slate-200 bg-white' />
            </div>
        )
    }

    if (!sessions.length) {
        return (
            <div>
                <PageHeader title='Progress' description='See how your scores improve over time.' />
                <EmptyState
                    icon={TrendingUp}
                    title='No practice sessions yet'
                    description='Finish your first practice interview and your progress charts will appear here.'
                    action={
                        <Link href='/candidate/practice' className='inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 text-sm font-medium text-white shadow-md shadow-violet-500/25 hover:opacity-90'>
                            <Mic className='size-4' /> Start practicing
                        </Link>
                    }
                />
            </div>
        )
    }

    const overallScores = sessions.map((session) => session.score)
    const average = mean(overallScores)
    const best = Math.max(...overallScores.filter((score) => Number.isFinite(score)))
    const overallChange = improvement(overallScores)

    const skills = SKILLS.map((skill) => {
        const values = sessions.map((session) => skillScore(session, skill.key))
        return { ...skill, values, average: mean(values), change: improvement(values) }
    })
    const ratedSkills = skills.filter((skill) => skill.average !== null)
    const weakest = ratedSkills.reduce((low, skill) => (low === null || skill.average < low.average ? skill : low), null)

    const chartPoint = (session, value) => ({
        id: session.id,
        label: moment(session.created_at).format('D MMM'),
        value,
        detail: session.jobPosition,
    })

    const topics = Object.values(sessions.reduce((groups, session) => {
        const group = (groups[session.jobPosition] ??= { name: session.jobPosition, scores: [], last: null })
        group.scores.push(session.score)
        group.last = session.created_at
        return groups
    }, {})).sort((a, b) => b.scores.length - a.scores.length)

    return (
        <div>
            <PageHeader title='Progress' description='See how your scores improve over time.' />

            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                <StatCard icon={ClipboardList} label='Practice sessions' value={sessions.length} />
                <StatCard icon={Gauge} label='Average score' value={average !== null ? `${average}/10` : '—'} tone='sky' />
                <StatCard icon={Award} label='Best score' value={Number.isFinite(best) ? `${best}/10` : '—'} tone='emerald' />
                <div className='rounded-2xl border border-slate-200 bg-white p-5'>
                    <p className='text-sm font-medium text-slate-500'>Improvement</p>
                    <p className='mt-3 text-3xl font-bold tracking-tight text-slate-900'>
                        {overallChange === null ? '—' : `${overallChange > 0 ? '+' : ''}${overallChange}`}
                    </p>
                    <div className='mt-1'><Delta value={overallChange} /></div>
                </div>
            </div>

            {/* Overall trend */}
            <section className='mt-6 rounded-2xl border border-slate-200 bg-white p-6'>
                <h2 className='font-semibold text-slate-900'>Overall score per session</h2>
                <p className='text-sm text-slate-500'>Each point is one practice interview, scored out of 10.</p>
                <div className='mt-4'>
                    <ScoreLineChart
                        points={sessions.map((session) => chartPoint(session, session.score))}
                        height={240}
                        ariaLabel={`Overall practice score across ${sessions.length} sessions. Latest ${overallScores.at(-1)} out of 10, average ${average}.`}
                    />
                </div>
            </section>

            <div className='mt-6 grid gap-6 lg:grid-cols-5'>
                {/* Skill averages */}
                <section className='rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-3'>
                    <h2 className='font-semibold text-slate-900'>Average by skill</h2>
                    <p className='text-sm text-slate-500'>Across all your practice sessions, out of 10.</p>
                    <ul className='mt-5 space-y-4'>
                        {skills.map((skill) => (
                            <li key={skill.key}>
                                <div className='flex items-center justify-between text-sm'>
                                    <span className='flex items-center gap-2 text-slate-700'>
                                        {skill.label}
                                        {weakest?.key === skill.key && (
                                            <span className='inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700'>
                                                <Target className='size-3' /> Focus area
                                            </span>
                                        )}
                                    </span>
                                    <span className='font-semibold text-slate-900' style={{ fontVariantNumeric: 'tabular-nums' }}>
                                        {skill.average ?? '—'}
                                    </span>
                                </div>
                                <div className='mt-1.5 h-3 rounded-r-[4px] bg-slate-100'>
                                    <div
                                        className='h-full rounded-r-[4px] bg-violet-600'
                                        style={{ width: `${(skill.average ?? 0) * 10}%` }}
                                        title={`${skill.label}: ${skill.average ?? '—'} / 10`}
                                    />
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Focus next */}
                <section className='relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-700 via-violet-600 to-fuchsia-500 p-6 text-white lg:col-span-2'>
                    <div className='pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-white/10 blur-2xl' />
                    <span className='relative inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium'>
                        <Target className='size-3.5' /> Focus next
                    </span>
                    {weakest ? (
                        <>
                            <h2 className='relative mt-4 text-2xl font-bold'>{weakest.label}</h2>
                            <p className='relative mt-1 text-violet-100'>Your lowest skill at {weakest.average}/10 on average.</p>
                            <p className='relative mt-4 text-sm leading-relaxed text-violet-50'>{FOCUS_TIPS[weakest.key]}</p>
                        </>
                    ) : (
                        <p className='relative mt-4 text-violet-100'>Complete a session to see which skill to work on.</p>
                    )}
                    <Link href='/candidate/practice' className='relative mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-medium text-violet-700 shadow-lg hover:scale-[1.02]'>
                        <Mic className='size-4' /> Practice now
                    </Link>
                </section>
            </div>

            {/* Skill trends: small multiples, one series each */}
            <section className='mt-6'>
                <h2 className='mb-3 font-semibold text-slate-900'>Skill trends</h2>
                <div className='grid gap-4 md:grid-cols-2'>
                    {skills.map((skill) => (
                        <div key={skill.key} className='rounded-2xl border border-slate-200 bg-white p-5'>
                            <div className='flex items-start justify-between gap-3'>
                                <div>
                                    <h3 className='text-sm font-semibold text-slate-900'>{skill.label}</h3>
                                    <Delta value={skill.change} />
                                </div>
                                <span className='text-sm text-slate-500'>avg <span className='font-semibold text-slate-900'>{skill.average ?? '—'}</span></span>
                            </div>
                            <div className='mt-3'>
                                <ScoreLineChart
                                    compact
                                    height={130}
                                    points={sessions.map((session, index) => chartPoint(session, skill.values[index]))}
                                    ariaLabel={`${skill.label} score across sessions. Average ${skill.average ?? 'not available'} out of 10.`}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* By topic */}
            <section className='mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white'>
                <h2 className='px-6 pt-5 font-semibold text-slate-900'>By topic</h2>
                <div className='overflow-x-auto'>
                    <table className='mt-3 w-full text-sm'>
                        <thead className='border-y border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500'>
                            <tr>
                                <th className='px-6 py-2.5 font-medium'>Topic</th>
                                <th className='px-4 py-2.5 text-right font-medium'>Sessions</th>
                                <th className='px-4 py-2.5 text-right font-medium'>Average</th>
                                <th className='px-4 py-2.5 text-right font-medium'>Best</th>
                                <th className='px-6 py-2.5 text-right font-medium'>Last practiced</th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-slate-100' style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {topics.map((topic) => {
                                const scored = topic.scores.filter((score) => Number.isFinite(score))
                                return (
                                    <tr key={topic.name}>
                                        <td className='px-6 py-3 font-medium text-slate-900'>{topic.name}</td>
                                        <td className='px-4 py-3 text-right text-slate-600'>{topic.scores.length}</td>
                                        <td className='px-4 py-3 text-right text-slate-600'>{mean(topic.scores) ?? '—'}</td>
                                        <td className='px-4 py-3 text-right text-slate-600'>{scored.length ? Math.max(...scored) : '—'}</td>
                                        <td className='px-6 py-3 text-right text-slate-500'>{moment(topic.last).fromNow()}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Table view of every value in the charts */}
            <section className='mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white'>
                <h2 className='px-6 pt-5 font-semibold text-slate-900'>Session history</h2>
                <div className='overflow-x-auto'>
                    <table className='mt-3 w-full text-sm'>
                        <thead className='border-y border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500'>
                            <tr>
                                <th className='px-6 py-2.5 font-medium'>Date</th>
                                <th className='px-4 py-2.5 font-medium'>Topic</th>
                                <th className='px-4 py-2.5 text-right font-medium'>Overall</th>
                                {SKILLS.map((skill) => (
                                    <th key={skill.key} className='whitespace-nowrap px-4 py-2.5 text-right font-medium'>{skill.label}</th>
                                ))}
                                <th className='px-6 py-2.5' />
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-slate-100' style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {newestFirst.map((session) => (
                                <tr key={session.id}>
                                    <td className='whitespace-nowrap px-6 py-3 text-slate-500'>{moment(session.created_at).format('DD MMM YYYY')}</td>
                                    <td className='px-4 py-3 text-slate-900'>
                                        {session.jobPosition}
                                        {session.difficulty && <span className='ml-2 text-xs text-slate-400'>{session.difficulty}</span>}
                                    </td>
                                    <td className='px-4 py-3 text-right font-semibold text-slate-900'>{session.score ?? '—'}</td>
                                    {SKILLS.map((skill) => (
                                        <td key={skill.key} className='px-4 py-3 text-right text-slate-600'>{skillScore(session, skill.key) ?? '—'}</td>
                                    ))}
                                    <td className='px-6 py-3 text-right'>
                                        <Link href={`/interview/${session.interview_id}/completed?feedback=${session.id}`} className='text-sm font-medium text-violet-600 hover:text-violet-700'>
                                            View
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    )
}

export default ProgressPage
