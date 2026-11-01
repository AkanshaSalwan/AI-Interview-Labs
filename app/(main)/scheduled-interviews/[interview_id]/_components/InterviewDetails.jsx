'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import moment from 'moment'
import { ArrowLeft, BadgeCheck, CalendarDays, Clock3, Copy, Gauge, SearchX, UsersRound, Video } from 'lucide-react'
import { createClient } from '@/services/supabaseClient'
import { useUser } from '@/app/provider'
import { toast } from '@/components/ui/toast'
import { averageScore, overallScore } from '@/services/scores'
import { interviewUrl, openInviteEmail } from '@/services/interviewLinks'
import { cn } from '@/lib/utils'
import StatCard from '../../../_components/StatCard'
import EmptyState from '../../../_components/EmptyState'
import InviteCandidateForm from './InviteCandidateForm'
import CandidateRow from './CandidateRow'

const FILTERS = [
    { id: 'all', label: 'All' },
    { id: 'completed', label: 'Completed' },
    { id: 'awaiting', label: 'Awaiting' },
    { id: 'shortlisted', label: 'Shortlisted' },
    { id: 'rejected', label: 'Rejected' },
]

function matchesFilter(candidate, filter) {
    if (filter === 'all') return true
    if (filter === 'awaiting') return !candidate.report
    if (filter === 'completed') return Boolean(candidate.report)
    return candidate.report?.recruiter_status === filter
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
                <div className='h-24 animate-pulse rounded-2xl bg-white' />
                <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
                    {[0, 1, 2, 3].map((item) => <div key={item} className='h-28 animate-pulse rounded-2xl bg-white' />)}
                </div>
                <div className='h-64 animate-pulse rounded-2xl bg-white' />
            </div>
        )
    }

    if (!interview) {
        return (
            <EmptyState
                icon={SearchX}
                title='Interview not found'
                description='It may have been deleted, or it belongs to another recruiter.'
                action={<Link href='/scheduled-interviews' className='text-sm font-medium text-violet-600'>Back to scheduled interviews</Link>}
            />
        )
    }

    const completedReports = candidates.filter((candidate) => candidate.report).map((candidate) => candidate.report)
    const average = averageScore(completedReports)
    const types = String(interview.type ?? '').split(',').map((type) => type.trim()).filter(Boolean)
    const visible = candidates.filter((candidate) => matchesFilter(candidate, filter))
    const rankOf = new Map(candidates.filter((candidate) => candidate.report).map((candidate, index) => [candidate.key, index + 1]))

    return (
        <div>
            <Link href='/scheduled-interviews' className='mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800'>
                <ArrowLeft className='size-4' /> Scheduled interviews
            </Link>

            {/* Header */}
            <div className='mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between'>
                <div className='flex items-center gap-4'>
                    <span className='flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-2xl font-semibold text-white'>
                        {interview.jobPosition?.[0]?.toUpperCase() ?? 'I'}
                    </span>
                    <div>
                        <h1 className='text-2xl font-bold tracking-tight text-slate-900'>{interview.jobPosition}</h1>
                        <div className='mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500'>
                            <span className='flex items-center gap-1'><Clock3 className='size-3.5' /> {interview.duration} min</span>
                            <span className='flex items-center gap-1'><CalendarDays className='size-3.5' /> {moment(interview.created_at).format('DD MMM YYYY')}</span>
                            {types.map((type) => (
                                <span key={type} className='rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700'>{type}</span>
                            ))}
                        </div>
                    </div>
                </div>
                <button
                    type='button'
                    onClick={copyLink}
                    className='inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50'
                >
                    <Copy className='size-4' /> Copy interview link
                </button>
            </div>

            <div className='mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                <StatCard icon={UsersRound} label='Candidates' value={candidates.length} />
                <StatCard icon={Video} label='Completed' value={completedReports.length} tone='sky' />
                <StatCard
                    icon={BadgeCheck}
                    label='Shortlisted'
                    value={completedReports.filter((report) => report.recruiter_status === 'shortlisted').length}
                    tone='emerald'
                />
                <StatCard icon={Gauge} label='Average score' value={average !== null ? `${average}/10` : '—'} tone='amber' />
            </div>

            <InviteCandidateForm
                supabase={supabase}
                interview={interview}
                recruiterEmail={user.email}
                onInvited={(invite) => setInvites((rows) => [invite, ...rows])}
            />

            {/* Candidates */}
            <div className='mt-8'>
                <div className='mb-4 flex flex-wrap items-center justify-between gap-3'>
                    <h2 className='text-lg font-semibold text-slate-900'>Candidates <span className='text-slate-400'>· ranked by score</span></h2>
                    <div className='inline-flex rounded-lg border border-slate-200 bg-white p-0.5'>
                        {FILTERS.map((item) => (
                            <button
                                key={item.id}
                                type='button'
                                onClick={() => setFilter(item.id)}
                                className={cn(
                                    'cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                                    filter === item.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                                )}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                {visible.length === 0 ? (
                    <EmptyState
                        icon={UsersRound}
                        title={candidates.length ? 'No candidates match this filter' : 'No candidates yet'}
                        description={candidates.length ? undefined : 'Invite a candidate above, or share the interview link.'}
                    />
                ) : (
                    <ul className='divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200'>
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
