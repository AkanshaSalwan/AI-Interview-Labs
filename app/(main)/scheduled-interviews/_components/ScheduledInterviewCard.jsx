'use client'

import Link from 'next/link'
import moment from 'moment/moment'
import { ArrowRight, CalendarDays, Clock3, Trophy } from 'lucide-react'
import { overallScore } from '@/services/scores'

function ScheduledInterviewCard({ interview, feedback, invites }) {
  // A candidate is anyone invited or anyone who took the interview via the shared link.
  const candidateEmails = new Set(
    [...invites.map((invite) => invite.candidate_email), ...feedback.map((row) => row.userEmail)]
      .filter(Boolean)
      .map((email) => email.toLowerCase())
  )
  const shortlisted = feedback.filter((row) => row.recruiter_status === 'shortlisted').length
  const scores = feedback.map(overallScore).filter((score) => score !== null)
  const topScore = scores.length ? Math.max(...scores) : null

  const stats = [
    { label: 'Candidates', value: candidateEmails.size },
    { label: 'Completed', value: feedback.length },
    { label: 'Shortlisted', value: shortlisted },
  ]

  return (
    <Link
      href={`/scheduled-interviews/${interview.interview_id}`}
      className='group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg hover:shadow-slate-200/70'
    >
      <div className='flex items-start justify-between gap-4'>
        <div className='flex min-w-0 items-center gap-3'>
          <span className='flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-lg font-semibold text-white'>
            {interview?.jobPosition?.[0]?.toUpperCase() ?? 'I'}
          </span>
          <div className='min-w-0'>
            <h2 className='truncate text-lg font-semibold text-slate-900'>{interview?.jobPosition || 'Interview'}</h2>
            <p className='flex items-center gap-3 text-sm text-slate-500'>
              <span className='flex items-center gap-1'><Clock3 className='size-3.5' />{interview?.duration || '—'} min</span>
              <span className='flex items-center gap-1'>
                <CalendarDays className='size-3.5' />
                {interview?.created_at ? moment(interview.created_at).format('DD MMM YYYY') : '—'}
              </span>
            </p>
          </div>
        </div>
        {topScore !== null && (
          <span className='flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700'>
            <Trophy className='size-3.5' /> Top {topScore}/10
          </span>
        )}
      </div>

      <div className='mt-5 grid grid-cols-3 divide-x divide-slate-100 rounded-xl bg-slate-50 py-3'>
        {stats.map((stat) => (
          <div key={stat.label} className='text-center'>
            <p className='text-xl font-bold text-slate-900'>{stat.value}</p>
            <p className='text-xs text-slate-500'>{stat.label}</p>
          </div>
        ))}
      </div>

      <span className='mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-violet-600'>
        Manage candidates <ArrowRight className='size-4 transition-transform group-hover:translate-x-1' />
      </span>
    </Link>
  )
}

export default ScheduledInterviewCard
