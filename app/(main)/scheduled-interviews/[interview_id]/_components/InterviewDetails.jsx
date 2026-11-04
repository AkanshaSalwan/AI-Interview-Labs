'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import moment from 'moment'
import { ArrowLeft, CalendarDays, ChevronDown, Clock3, Copy, ListChecks, SearchX, UsersRound } from 'lucide-react'
import { createClient } from '@/services/supabaseClient'
import { useUser } from '@/app/provider'
import { toast } from '@/components/ui/toast'
import { averageScore, overallScore } from '@/services/scores'
import { interviewUrl, openInviteEmail } from '@/services/interviewLinks'
import { cn } from '@/lib/utils'
import EmptyState from '../../../_components/EmptyState'
import InviteCandidateForm from './InviteCandidateForm'
import CandidateRow from './CandidateRow'
import { STAGES } from '../../../candidates/_components/pipeline'

// Same stages as the Candidates board: not taken yet, or HR's decision on the report.
function stageOf(candidate) {
    if (!candidate.report) return 'assigned'
    return candidate.report.recruiter_status ?? 'pending'
}

function HeaderStat({ label, value, highlight = false }) {
    return (
        <div className='px-4 pt-3 first:pl-0'>
            <p className='text-xs text-slate-500'>{label}</p>
            <p className={cn('mt-0.5 text-xl font-semibold tabular-nums', highlight ? 'text-orange-600' : 'text-slate-900')}>{value}</p>
        </div>
    )
}

// The questions the AI interviewer will ask, collapsed by default.
function QuestionsPanel({ questions }) {
    const [open, setOpen] = useState(false)
    if (!questions.length) return null

    return (
        <div className='surface mb-5 overflow-hidden rounded-2xl'>
            <button
                type='button'
                onClick={() => setOpen((value) => !value)}
                aria-expanded={open}
                className='flex w-full cursor-pointer items-center gap-3 px-5 py-3.5 text-left hover:bg-orange-50/40'
            >
                <ListChecks className='size-[18px] text-orange-500' />
                <span className='flex-1 text-[15px] font-semibold text-slate-900'>
                    Interview questions <span className='font-normal text-slate-400'>· {questions.length}</span>
                </span>
                <ChevronDown className={cn('size-4 text-slate-400 transition-transform', open && 'rotate-180')} />
            </button>
            {open && (
                <ol className='space-y-2.5 border-t border-slate-100 px-5 py-4'>
                    {questions.map((item, index) => (
                        <li key={index} className='flex gap-3 text-sm'>
                            <span className='w-5 shrink-0 text-right font-medium tabular-nums text-slate-400'>{index + 1}.</span>
                            <span className='flex-1 leading-relaxed text-slate-700'>{item.question}</span>
                            {item.type && (
                                <span className='h-fit shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600'>{item.type}</span>
                            )}
                        </li>
                    ))}
                </ol>
            )}
        </div>
    )
}

function InterviewDetails({ interviewId }) {
    const supabase = useMemo(() => createClient(), [])
    const { user } = useUser()
    const [interview, setInterview] = useState(null)
    const [reports, setReports] = useState([])
    const [invites, setInvites] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all')

    useEffect(() => {
        if (!user?.email) return

        const load = async () => {
            setLoading(true)
            const [interviewResult, reportsResult, invitesResult] = await Promise.all([
                supabase.from('interviews').select('*').eq('interview_id', interviewId).eq('userEmail', user.email).maybeSingle(),
                supabase.from('interview feedback').select('*').eq('interview_id', interviewId).order('id', { ascending: false }),
                supabase.from('interview_invites').select('*').eq('interview_id', interviewId).order('created_at', { ascending: false }),
            ])

            if (interviewResult.error) console.error('Unable to load interview:', interviewResult.error)
            if (reportsResult.error) console.error('Unable to load candidate reports:', reportsResult.error)
            if (invitesResult.error) console.error('Unable to load invites:', invitesResult.error)

            setInterview(interviewResult.data ?? null)
            setReports(reportsResult.data ?? [])
            setInvites(invitesResult.data ?? [])
            setLoading(false)
        }

        load()
    }, [supabase, interviewId, user?.email])

    // One row per candidate: their latest report (if any) merged with their invite (if any), best score first.
    const candidates = useMemo(() => {
        const byEmail = new Map()
        for (const report of reports) {
            const key = report.userEmail?.toLowerCase() || `report-${report.id}`
            if (!byEmail.has(key)) {
                byEmail.set(key, { key, name: report.userName, email: report.userEmail, report, score: overallScore(report) })
            }
        }
        for (const invite of invites) {
            const key = invite.candidate_email.toLowerCase()
            const existing = byEmail.get(key)
            if (existing) {
                existing.invite = invite
                existing.name ||= invite.candidate_name
            } else {
                byEmail.set(key, { key, name: invite.candidate_name, email: invite.candidate_email, invite, report: null, score: null })
            }
        }
        return [...byEmail.values()].sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
    }, [reports, invites])

    const updateReport = async (reportId, changes) => {
        const previous = reports
        setReports((rows) => rows.map((row) => (row.id === reportId ? { ...row, ...changes } : row)))
        const { error } = await supabase.from('interview feedback').update(changes).eq('id', reportId)
        if (error) {
            setReports(previous)
            toast.add({ title: 'Could not save the change', description: error.message })
            return false
        }
        return true
    }

    const onDecision = (reportId, recruiter_status) => updateReport(reportId, { recruiter_status })

    const onSaveNotes = async (reportId, recruiter_notes) => {
        if (await updateReport(reportId, { recruiter_notes })) toast.add({ title: 'Notes saved' })
    }

    const onRemoveInvite = async (invite) => {
        if (!window.confirm(`Remove the invite for ${invite.candidate_email}?`)) return
        const { error } = await supabase.from('interview_invites').delete().eq('id', invite.id)
        if (error) {
            toast.add({ title: 'Could not remove the invite', description: error.message })
            return
        }
        setInvites((rows) => rows.filter((row) => row.id !== invite.id))
    }

    const onResendInvite = (invite) => openInviteEmail({
        to: invite.candidate_email,
        candidateName: invite.candidate_name,
        jobPosition: interview?.jobPosition,
        interviewId,
    })

    const copyLink = async () => {
        await navigator.clipboard.writeText(interviewUrl(interviewId))
        toast.add({ title: 'Link Copied to Clipboard' })
    }

    if (loading) {
        return (
            <div className='space-y-4'>
                <div className='h-40 surface animate-pulse rounded-2xl' />
                <div className='h-28 surface animate-pulse rounded-2xl' />
                <div className='h-48 surface animate-pulse rounded-2xl' />
            </div>
        )
    }

    if (!interview) {
        return (
            <EmptyState
                icon={SearchX}
                title='Interview not found'
                description='It may have been deleted, or it belongs to another recruiter.'
                action={<Link href='/scheduled-interviews' className='text-sm font-medium text-orange-600'>Back to interviews</Link>}
            />
        )
    }

    const completedReports = candidates.filter((candidate) => candidate.report).map((candidate) => candidate.report)
    const average = averageScore(completedReports)
    const types = String(interview.type ?? '').split(',').map((type) => type.trim()).filter(Boolean)
    const questions = (Array.isArray(interview.questionList) ? interview.questionList : []).filter((item) => item?.question)
    const stageCounts = Object.fromEntries(STAGES.map((stage) => [stage.id, candidates.filter((candidate) => stageOf(candidate) === stage.id).length]))
    const filters = [{ id: 'all', label: 'All', count: candidates.length }, ...STAGES.map((stage) => ({ ...stage, count: stageCounts[stage.id] }))]
    const visible = candidates.filter((candidate) => filter === 'all' || stageOf(candidate) === filter)
    const rankOf = new Map(candidates.filter((candidate) => candidate.report).map((candidate, index) => [candidate.key, index + 1]))

    return (
        <div>
            <Link href='/scheduled-interviews' className='mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800'>
                <ArrowLeft className='size-4' /> Interviews
            </Link>

            {/* Header with the interview's numbers */}
            <div className='surface mb-5 rounded-2xl p-5'>
                <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
                    <div className='flex min-w-0 items-center gap-3.5'>
                        <span className='flex size-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-lg font-semibold text-orange-600'>
                            {interview.jobPosition?.[0]?.toUpperCase() ?? 'I'}
                        </span>
                        <div className='min-w-0'>
                            <h1 className='truncate text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl'>{interview.jobPosition}</h1>
                            <div className='mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-slate-500'>
                                <span className='flex items-center gap-1'><Clock3 className='size-3.5' /> {interview.duration} min</span>
                                <span className='flex items-center gap-1'><CalendarDays className='size-3.5' /> {moment(interview.created_at).format('DD MMM YYYY')}</span>
                                {types.map((type) => (
                                    <span key={type} className='rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600'>{type}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                    <button
                        type='button'
                        onClick={copyLink}
                        className='inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-[0.625rem] border border-slate-200 px-3.5 text-sm font-medium text-slate-700 hover:bg-slate-50'
                    >
                        <Copy className='size-4' /> Copy link
                    </button>
                </div>
                <div className='mt-4 grid grid-cols-2 divide-x divide-slate-100 border-t border-slate-100 sm:grid-cols-4'>
                    <HeaderStat label='Candidates' value={candidates.length} />
                    <HeaderStat label='Completed' value={completedReports.length} />
                    <HeaderStat label='To review' value={stageCounts.pending} highlight={stageCounts.pending > 0} />
                    <HeaderStat label='Average score' value={average !== null ? `${average}/10` : '—'} />
                </div>
            </div>

            <QuestionsPanel questions={questions} />

            <InviteCandidateForm
                supabase={supabase}
                interview={interview}
                recruiterEmail={user.email}
                onInvited={(invite) => setInvites((rows) => [invite, ...rows])}
            />

            {/* Candidates */}
            <div className='mt-7'>
                <div className='mb-3 flex flex-wrap items-center justify-between gap-3'>
                    <h2 className='text-base font-semibold text-slate-900'>Candidates <span className='font-normal text-slate-400'>· best score first</span></h2>
                    <div className='inline-flex flex-wrap rounded-[0.625rem] border border-slate-200 bg-white p-0.5'>
                        {filters.map((item) => (
                            <button
                                key={item.id}
                                type='button'
                                onClick={() => setFilter(item.id)}
                                className={cn(
                                    'cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                                    filter === item.id ? 'bg-orange-500 text-white shadow-sm' : item.count ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-600'
                                )}
                            >
                                {item.label}
                                <span className={cn('ml-1 tabular-nums', filter === item.id ? 'text-orange-100' : 'text-slate-400')}>{item.count}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {visible.length === 0 ? (
                    <EmptyState
                        icon={UsersRound}
                        title={candidates.length ? 'No candidates match this filter' : 'No candidates yet'}
                        description={candidates.length ? undefined : 'Assign a candidate above, or share the interview link.'}
                    />
                ) : (
                    <ul className='divide-y divide-slate-100 surface overflow-hidden rounded-2xl'>
                        {visible.map((candidate) => (
                            <CandidateRow
                                key={candidate.key}
                                candidate={candidate}
                                rank={rankOf.get(candidate.key)}
                                onDecision={onDecision}
                                onSaveNotes={onSaveNotes}
                                onResendInvite={onResendInvite}
                                onRemoveInvite={onRemoveInvite}
                            />
                        ))}
                    </ul>
                )}
            </div>
        </div>
    )
}

export default InterviewDetails
