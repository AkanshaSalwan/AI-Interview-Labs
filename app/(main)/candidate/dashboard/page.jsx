'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import moment from 'moment'
import { ArrowRight, Award, CalendarClock, ClipboardList, Gauge, History, Mic, ShieldAlert, Sparkles, X } from 'lucide-react'
import { RECRUITER_NOT_APPROVED_NOTICE } from '@/services/userProfile'
import { averageScore } from '@/services/scores'
import { usePracticeResults } from '../_components/usePracticeResults'
import PageHeader from '../../_components/PageHeader'
import StatCard from '../../_components/StatCard'
import EmptyState from '../../_components/EmptyState'
import { useAssignedInterviews } from '../_components/useAssignedInterviews'
import AssignedInterviewItem from '../_components/AssignedInterviewItem'

function scoreTone(score) {
    if (score >= 7) return 'bg-emerald-50 text-emerald-700'
    if (score >= 5) return 'bg-amber-50 text-amber-700'
    return 'bg-red-50 text-red-700'
}

function CandidateDashboard() {
    const { results, loading } = usePracticeResults()
    const { assigned, loading: assignedLoading } = useAssignedInterviews()
    const pendingInvites = assigned.filter((invite) => invite.status !== 'completed')
    const [showRecruiterNotice, setShowRecruiterNotice] = useState(false)

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        if (params.get('notice') === RECRUITER_NOT_APPROVED_NOTICE) {
            setShowRecruiterNotice(true)
            window.history.replaceState(null, '', window.location.pathname)
        }
    }, [])

    const average = averageScore(results)
    const best = results.reduce((max, row) => (row.score !== null && row.score > (max ?? -1) ? row.score : max), null)
    const lastDate = results[0]?.created_at

    return (
        <div>
            <PageHeader
                title='Your dashboard'
                description='Prepare with the AI interviewer and track how you improve.'
            />

            {showRecruiterNotice && (
                <div role='status' className='mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4'>
                    <ShieldAlert className='mt-0.5 size-5 shrink-0 text-amber-600' />
                    <div className='flex-1 text-sm'>
                        <p className='font-medium text-amber-900'>Your account isn’t approved for the recruiter workspace</p>
                        <p className='mt-0.5 text-amber-800'>
                            Recruiter access is given by your company admin. Until then, you can practice and take interviews here.
                        </p>
                    </div>
                    <button
                        type='button'
                        onClick={() => setShowRecruiterNotice(false)}
                        aria-label='Dismiss'
                        className='cursor-pointer rounded-md p-1 text-amber-600 hover:bg-amber-100'
                    >
                        <X className='size-4' />
                    </button>
                </div>
            )}

            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                <StatCard icon={ClipboardList} label='Practice sessions' value={results.length} loading={loading} />
                <StatCard icon={Gauge} label='Average score' value={average !== null ? `${average}/10` : '—'} tone='sky' loading={loading} />
                <StatCard icon={Award} label='Best score' value={best !== null ? `${best}/10` : '—'} tone='emerald' loading={loading} />
                <StatCard
                    icon={CalendarClock}
                    label='Last practice'
                    value={lastDate ? moment(lastDate).fromNow() : '—'}
                    tone='amber'
                    loading={loading}
                />
            </div>

            <div className='mt-6 grid gap-6 lg:grid-cols-5'>
                {/* Practice hero */}
                <div className='relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-700 via-violet-600 to-fuchsia-500 p-7 text-white lg:col-span-3'>
                    <div className='pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-white/10 blur-2xl' />
                    <div className='pointer-events-none absolute -bottom-20 right-24 size-48 rounded-full bg-fuchsia-300/20 blur-2xl' />
                    <span className='relative inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur'>
                        <Sparkles className='size-3.5' /> Practice mode
                    </span>
                    <h2 className='relative mt-4 text-2xl font-bold tracking-tight'>Rehearse your next interview</h2>
                    <p className='relative mt-2 max-w-md text-violet-100'>
                        Pick a role and difficulty, then talk through real questions with the AI interviewer.
                        You’ll get scored feedback the moment you finish.
                    </p>
                    <Link
                        href='/candidate/practice'
                        className='relative mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 font-medium text-violet-700 shadow-lg transition-transform hover:scale-[1.02]'
                    >
                        <Mic className='size-5' /> Start practicing
                    </Link>
                </div>

                {/* Assigned interviews */}
                <div className='rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-2'>
                    <div className='flex items-center justify-between'>
                        <h2 className='font-semibold text-slate-900'>Assigned interviews</h2>
                        <Link href='/candidate/interviews' className='text-sm font-medium text-violet-600 hover:text-violet-700'>View all</Link>
                    </div>
                    {assignedLoading ? (
                        <div className='mt-4 space-y-2'>
                            {[0, 1].map((item) => <div key={item} className='h-14 animate-pulse rounded-xl bg-slate-100' />)}
                        </div>
                    ) : pendingInvites.length ? (
                        <ul className='-mx-6 mt-2 divide-y divide-slate-100'>
                            {pendingInvites.slice(0, 3).map((invite) => (
                                <AssignedInterviewItem key={invite.id} invite={invite} compact />
                            ))}
                        </ul>
                    ) : (
                        <div className='mt-6 flex flex-col items-center py-4 text-center'>
                            <span className='flex size-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500'>
                                <CalendarClock className='size-5' />
                            </span>
                            <p className='mt-3 text-sm font-medium text-slate-700'>No pending invitations</p>
                            <p className='mt-1 text-xs text-slate-500'>When a recruiter invites you, the interview will show up here.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Recent results */}
            <div className='mt-8'>
                <div className='mb-4 flex items-center justify-between'>
                    <h2 className='text-lg font-semibold text-slate-900'>Recent practice</h2>
                    {results.length > 0 && (
                        <Link href='/candidate/progress' className='inline-flex items-center gap-1 text-sm font-medium text-violet-600 hover:text-violet-700'>
                            See progress <ArrowRight className='size-4' />
                        </Link>
                    )}
                </div>

                {loading ? (
                    <div className='space-y-3'>
                        {[0, 1, 2].map((item) => (
                            <div key={item} className='h-[72px] animate-pulse rounded-2xl border border-slate-200 bg-white' />
                        ))}
                    </div>
                ) : results.length === 0 ? (
                    <EmptyState
                        icon={History}
                        title='No practice sessions yet'
                        description='Finish a practice interview and your scores will appear here.'
                    />
                ) : (
                    <ul className='divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white'>
                        {results.slice(0, 5).map((result) => (
                            <li key={result.id}>
                                <Link href={`/interview/${result.interview_id}/completed?feedback=${result.id}`} className='flex items-center gap-4 px-5 py-4 transition-colors hover:bg-slate-50'>
                                    <span className='flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 font-semibold text-violet-600'>
                                        {result.jobPosition?.[0]?.toUpperCase() ?? 'I'}
                                    </span>
                                    <div className='min-w-0 flex-1'>
                                        <p className='truncate font-medium text-slate-900'>{result.jobPosition}</p>
                                        <p className='text-xs text-slate-500'>
                                            {result.created_at ? moment(result.created_at).format('DD MMM YYYY, h:mm A') : '—'}
                                        </p>
                                    </div>
                                    {result.score !== null && (
                                        <span className={`rounded-full px-2.5 py-1 text-sm font-semibold ${scoreTone(result.score)}`}>
                                            {result.score}/10
                                        </span>
                                    )}
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    )
}

export default CandidateDashboard
