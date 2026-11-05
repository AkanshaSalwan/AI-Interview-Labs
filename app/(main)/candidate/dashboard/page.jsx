'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import moment from 'moment'
import { ArrowRight, Award, BellRing, CalendarDays, ChartNoAxesColumnIncreasing, History, Mic, Play, ShieldAlert, Sparkles, Video, X } from 'lucide-react'
import { RECRUITER_NOT_APPROVED_NOTICE } from '@/services/userProfile'
import { dueStatus } from '@/services/invites'
import { averageScore } from '@/services/scores'
import { usePracticeResults } from '../_components/usePracticeResults'
import { useAssignedInterviews } from '../_components/useAssignedInterviews'
import AssignedInterviewItem from '../_components/AssignedInterviewItem'

function scoreTone(score) {
    if (score >= 7) return 'bg-emerald-50 text-emerald-700'
    return 'bg-orange-50 text-orange-600'
}

function IconTile({ icon: Icon, className = 'size-10' }) {
    return (
        <span className={`flex shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500 ${className}`}>
            <Icon className='size-5' strokeWidth={1.75} />
        </span>
    )
}

function DashboardStat({ icon, label, value, loading }) {
    return (
        <div className='surface rounded-2xl p-4'>
            <div className='flex items-center justify-between gap-3'>
                <p className='text-[13px] font-medium text-slate-500'>{label}</p>
                <IconTile icon={icon} className='size-8 [&_svg]:size-4' />
            </div>
            {loading ? (
                <div className='mt-2 h-7 w-16 animate-pulse rounded-md bg-orange-50' />
            ) : (
                <p className='mt-1.5 truncate text-2xl font-semibold tracking-tight text-slate-900'>{value}</p>
            )}
        </div>
    )
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
            <div className='mb-6'>
                <h1 className='text-2xl font-semibold tracking-tight text-slate-900 sm:text-[28px]'>Your dashboard</h1>
                <p className='mt-1 text-[15px] text-slate-500'>Take assigned interviews, practice with the AI and track how you improve.</p>
            </div>

            {/* Assigned-interview alert */}
            {pendingInvites.length > 0 && (
                <div className='paper-lift mb-5'>
                    <div className='fold-card flex flex-col gap-4 rounded-2xl border border-orange-200/70 bg-gradient-to-r from-orange-50 via-[#fff7f0] to-white p-5 sm:flex-row sm:items-center'>
                        <span className='flex size-11 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm shadow-orange-500/30'>
                            <BellRing className='size-5' />
                        </span>
                        <div className='min-w-0 flex-1'>
                            <p className='text-[15px] font-semibold text-slate-900'>
                                You have {pendingInvites.length} assigned interview{pendingInvites.length > 1 ? 's' : ''}
                            </p>
                            <p className='mt-0.5 truncate text-sm text-slate-600'>
                                {pendingInvites[0].interview?.jobPosition ?? 'Interview'}
                                {pendingInvites[0].interview?.duration ? ` · ${pendingInvites[0].interview.duration} min` : ''}
                                {' · '}assigned {moment(pendingInvites[0].created_at).fromNow()}
                                {dueStatus(pendingInvites[0].due_at) && (
                                    <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${dueStatus(pendingInvites[0].due_at).badge}`}>
                                        {dueStatus(pendingInvites[0].due_at).label}
                                    </span>
                                )}
                            </p>
                        </div>
                        <div className='flex shrink-0 gap-2 sm:pr-6'>
                            {pendingInvites.length > 1 && (
                                <Link
                                    href='/candidate/interviews'
                                    className='inline-flex h-9 items-center rounded-[0.625rem] border border-orange-200 bg-white px-3.5 text-sm font-medium text-orange-700 hover:bg-orange-50'
                                >
                                    View all
                                </Link>
                            )}
                            <Link
                                href={`/interview/${pendingInvites[0].interview_id}`}
                                className='btn-orange inline-flex h-9 items-center gap-1.5 rounded-[0.625rem] px-4 text-sm font-medium text-white hover:brightness-105'
                            >
                                <Play className='size-3.5' /> Start interview
                            </Link>
                        </div>
                    </div>
                </div>
            )}

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

            <div className='grid grid-cols-2 gap-3 xl:grid-cols-4'>
                <DashboardStat icon={Video} label='Practice sessions' value={results.length} loading={loading} />
                <DashboardStat icon={ChartNoAxesColumnIncreasing} label='Average score' value={average !== null ? `${average}/10` : '—'} loading={loading} />
                <DashboardStat icon={Award} label='Best score' value={best !== null ? `${best}/10` : '—'} loading={loading} />
                <DashboardStat icon={CalendarDays} label='Last practice' value={lastDate ? moment(lastDate).fromNow() : '—'} loading={loading} />
            </div>

            <div className='mt-5 grid gap-5 lg:grid-cols-[1.6fr_1fr]'>
                {/* Practice hero */}
                <div className='hero-peach relative overflow-hidden rounded-2xl border border-orange-100/60 p-6 sm:p-7'>
                    <div className='relative z-10 max-w-[400px]'>
                        <span className='inline-flex items-center gap-1.5 rounded-full bg-white/70 px-2.5 py-1 text-xs font-medium text-orange-600 ring-1 ring-orange-100'>
                            <Sparkles className='size-3.5' /> Practice mode
                        </span>
                        <h2 className='mt-3 text-xl font-semibold tracking-tight text-slate-900'>Rehearse your next interview</h2>
                        <p className='mt-2 text-[15px] leading-relaxed text-slate-500'>
                            Pick a role and difficulty, then talk through real questions with the AI interviewer.
                            You’ll get scored feedback the moment you finish.
                        </p>
                        <Link
                            href='/candidate/practice'
                            className='btn-orange mt-5 inline-flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-medium text-white transition-[filter,transform] hover:brightness-105 active:scale-[0.99]'
                        >
                            <Mic className='size-4' /> Start practicing <ArrowRight className='size-4' />
                        </Link>
                    </div>
                    <Image
                        src='/Cheerful Robot Workspace Cutout.png'
                        alt=''
                        width={1536}
                        height={1024}
                        priority
                        className='pointer-events-none absolute -right-6 bottom-0 hidden h-auto w-[260px] md:block lg:w-[240px] xl:w-[280px]'
                    />
                </div>

                {/* Assigned interviews */}
                <div className='surface flex flex-col rounded-2xl p-5'>
                    <div className='flex items-center justify-between'>
                        <h2 className='text-[15px] font-semibold text-slate-900'>Assigned interviews</h2>
                        <Link href='/candidate/interviews' className='inline-flex items-center gap-1 text-sm font-medium text-orange-500 hover:text-orange-600'>
                            View all <ArrowRight className='size-4' />
                        </Link>
                    </div>
                    {assignedLoading ? (
                        <div className='mt-5 space-y-2'>
                            {[0, 1].map((item) => <div key={item} className='h-14 animate-pulse rounded-xl bg-orange-50' />)}
                        </div>
                    ) : assigned.length ? (
                        <ul className='-mx-5 mt-2 divide-y divide-orange-50'>
                            {assigned.slice(0, 4).map((invite) => (
                                <AssignedInterviewItem key={invite.id} invite={invite} compact />
                            ))}
                        </ul>
                    ) : (
                        <div className='flex flex-1 flex-col items-center justify-center py-6 text-center'>
                            <IconTile icon={CalendarDays} className='size-12 [&_svg]:size-6' />
                            <p className='mt-3 text-sm font-medium text-slate-900'>No assigned interviews</p>
                            <p className='mt-1 max-w-xs text-sm text-slate-500'>When HR assigns you an interview, it shows up here.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Recent results */}
            <div className='mt-8'>
                <div className='mb-4 flex items-center justify-between'>
                    <h2 className='text-base font-semibold text-slate-900'>Recent practice</h2>
                    {results.length > 0 && (
                        <Link href='/candidate/progress' className='inline-flex items-center gap-1 text-sm font-medium text-orange-500 hover:text-orange-600'>
                            See progress <ArrowRight className='size-4' />
                        </Link>
                    )}
                </div>

                {loading ? (
                    <div className='space-y-3'>
                        {[0, 1, 2].map((item) => (
                            <div key={item} className='surface h-[72px] animate-pulse rounded-2xl' />
                        ))}
                    </div>
                ) : results.length === 0 ? (
                    <div className='surface flex flex-col items-center rounded-2xl px-6 py-12 text-center'>
                        <IconTile icon={History} className='size-12' />
                        <h3 className='mt-4 font-medium text-slate-900'>No practice sessions yet</h3>
                        <p className='mt-1 max-w-sm text-sm text-slate-500'>Finish a practice interview and your scores will appear here.</p>
                    </div>
                ) : (
                    <ul className='space-y-2'>
                        {results.slice(0, 5).map((result) => (
                            <li key={result.id}>
                                <Link
                                    href={`/interview/${result.interview_id}/completed?feedback=${result.id}`}
                                    className='surface flex items-center gap-4 rounded-2xl px-5 py-3.5 transition-colors hover:bg-orange-50/40'
                                >
                                    <span className='flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[15px] font-medium text-orange-500'>
                                        {result.jobPosition?.[0]?.toUpperCase() ?? 'I'}
                                    </span>
                                    <div className='min-w-0 flex-1'>
                                        <p className='truncate text-[15px] font-medium text-slate-900'>{result.jobPosition}</p>
                                        <p className='text-xs text-slate-500'>
                                            {result.created_at ? moment(result.created_at).format('DD MMM YYYY, h:mm A') : '—'}
                                        </p>
                                    </div>
                                    {result.score !== null && (
                                        <span className={`rounded-full px-3 py-1 text-sm font-medium ${scoreTone(result.score)}`}>
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
