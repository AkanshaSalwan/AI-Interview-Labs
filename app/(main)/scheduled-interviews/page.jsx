'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import moment from 'moment'
import { CalendarClock, ChevronRight, Copy, Plus, Search, SearchX } from 'lucide-react'
import { toast } from '@/components/ui/toast'
import { interviewUrl } from '@/services/interviewLinks'
import { overallScore } from '@/services/scores'
import { cn } from '@/lib/utils'
import { useRecruiterOverview } from '../dashboard/_components/useRecruiterOverview'
import PageHeader from '../_components/PageHeader'
import EmptyState from '../_components/EmptyState'

const COLUMNS = 'md:grid-cols-[minmax(0,2fr)_repeat(4,0.8fr)_0.9fr_132px]'

function groupBy(rows, key) {
  return rows.reduce((groups, row) => {
    ;(groups[row[key]] ??= []).push(row)
    return groups
  }, {})
}

function scoreTone(score) {
  if (score >= 7) return 'bg-emerald-50 text-emerald-700'
  if (score >= 5) return 'bg-amber-50 text-amber-700'
  return 'bg-red-50 text-red-600'
}

function ScheduledRow({ interview, feedback, invites }) {
  // A candidate is anyone assigned or anyone who took the interview via the shared link.
  const candidates = new Set(
    [...invites.map((invite) => invite.candidate_email), ...feedback.map((row) => row.userEmail)]
      .filter(Boolean)
      .map((email) => email.toLowerCase())
  ).size
  const awaiting = feedback.filter((row) => (row.recruiter_status ?? 'pending') === 'pending').length
  const shortlisted = feedback.filter((row) => row.recruiter_status === 'shortlisted').length
  const scores = feedback.map(overallScore).filter((score) => score !== null)
  const topScore = scores.length ? Math.max(...scores) : null

  const href = `/scheduled-interviews/${interview.interview_id}`
  const copyLink = async () => {
    await navigator.clipboard.writeText(interviewUrl(interview.interview_id))
    toast.add({ title: 'Link Copied to Clipboard' })
  }

  return (
    <li className={cn('grid grid-cols-[1fr_auto] items-center gap-x-4 px-5 py-3 transition-colors hover:bg-orange-50/40', COLUMNS)}>
        <Link href={href} className='group flex min-w-0 items-center gap-3'>
          <span className='flex size-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-sm font-semibold text-orange-600'>
            {interview.jobPosition?.[0]?.toUpperCase() ?? 'I'}
          </span>
          <div className='min-w-0'>
            <p className='truncate text-sm font-medium text-slate-900 group-hover:text-orange-700'>{interview.jobPosition || 'Interview'}</p>
            <p className='truncate text-xs text-slate-500'>
              {interview.duration || '—'} min · {interview.created_at ? moment(interview.created_at).format('DD MMM YYYY') : '—'}
            </p>
          </div>
        </Link>
        <p className='hidden text-sm text-slate-700 md:block'>{candidates}</p>
        <p className='hidden text-sm text-slate-700 md:block'>{feedback.length}</p>
        <p className='hidden md:block'>
          {awaiting > 0
            ? <span className='rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700'>{awaiting}</span>
            : <span className='text-sm text-slate-400'>0</span>}
        </p>
        <p className='hidden text-sm text-slate-700 md:block'>{shortlisted}</p>
        <p className='hidden md:block'>
          {topScore !== null
            ? <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums', scoreTone(topScore))}>{topScore}/10</span>
            : <span className='text-sm text-slate-400'>—</span>}
        </p>
        <div className='flex items-center justify-end gap-1.5'>
          <button
            type='button'
            onClick={copyLink}
            title='Copy interview link'
            aria-label='Copy interview link'
            className='flex size-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:text-orange-600'
          >
            <Copy className='size-3.5' />
          </button>
          <Link
            href={href}
            className='inline-flex h-8 items-center gap-0.5 rounded-lg bg-orange-50 px-2.5 text-[13px] font-medium text-orange-700 transition-colors hover:bg-orange-100'
          >
            Manage <ChevronRight className='size-3.5' />
          </Link>
        </div>
    </li>
  )
}

function ScheduledInterviews() {
  const { loading, interviews, invites, reports } = useRecruiterOverview()
  const [query, setQuery] = useState('')

  const feedbackByInterview = useMemo(() => groupBy(reports, 'interview_id'), [reports])
  const invitesByInterview = useMemo(() => groupBy(invites, 'interview_id'), [invites])
  const visible = interviews.filter((interview) => interview.jobPosition?.toLowerCase().includes(query.trim().toLowerCase()))

  return (
    <div>
      <PageHeader
        title='Interviews'
        description='Every interview you created, who has taken it, and who is waiting for your decision.'
        action={
          <Link
            href='/dashboard/create-interview'
            className='btn-orange inline-flex h-9 items-center gap-1.5 rounded-[0.625rem] px-3.5 text-sm font-medium text-white hover:brightness-105'
          >
            <Plus className='size-4' /> New interview
          </Link>
        }
      />

      {loading ? (
        <div className='surface space-y-2 rounded-2xl p-4'>
          {[0, 1, 2, 3, 4].map((item) => <div key={item} className='h-12 animate-pulse rounded-xl bg-orange-50/70' />)}
        </div>
      ) : !interviews.length ? (
        <EmptyState
          icon={CalendarClock}
          title='No interviews yet'
          description='Create an interview first, then assign candidates to it.'
        />
      ) : (
        <div className='surface overflow-hidden rounded-2xl'>
          <div className='flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3'>
            <label className='relative w-full max-w-xs'>
              <Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400' />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder='Search by job position'
                className='field h-9 pl-9'
              />
            </label>
            <p className='shrink-0 text-xs text-slate-500'>{visible.length} of {interviews.length}</p>
          </div>

          <div className={cn('hidden gap-x-4 bg-slate-50/70 px-5 py-2 text-[11px] font-medium uppercase tracking-wider text-slate-400 md:grid', COLUMNS)}>
            <span>Position</span>
            <span>Candidates</span>
            <span>Completed</span>
            <span>To decide</span>
            <span>Shortlisted</span>
            <span>Top score</span>
            <span />
          </div>

          {visible.length ? (
            <ul className='divide-y divide-slate-100'>
              {visible.map((interview) => (
                <ScheduledRow
                  key={interview.interview_id}
                  interview={interview}
                  feedback={feedbackByInterview[interview.interview_id] ?? []}
                  invites={invitesByInterview[interview.interview_id] ?? []}
                />
              ))}
            </ul>
          ) : (
            <div className='flex flex-col items-center px-6 py-10 text-center'>
              <SearchX className='size-5 text-slate-400' />
              <p className='mt-2 text-sm text-slate-500'>No interviews match “{query}”.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ScheduledInterviews
