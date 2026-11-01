'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { CalendarClock } from 'lucide-react'
import { createClient } from '@/services/supabaseClient'
import { useUser } from '@/app/provider'
import ScheduledInterviewCard from './_components/ScheduledInterviewCard'
import PageHeader from '../_components/PageHeader'
import EmptyState from '../_components/EmptyState'

function groupBy(rows, key) {
  return rows.reduce((groups, row) => {
    ;(groups[row[key]] ??= []).push(row)
    return groups
  }, {})
}

function ScheduledInterviews() {
  const supabase = useMemo(() => createClient(), [])
  const { user } = useUser()
  const [interviews, setInterviews] = useState([])
  const [feedbackByInterview, setFeedbackByInterview] = useState({})
  const [invitesByInterview, setInvitesByInterview] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.email) return

    const getScheduledInterviews = async () => {
      setLoading(true)
      const { data: interviewData, error: interviewError } = await supabase
        .from('interviews')
        .select('*')
        .eq('userEmail', user.email)
        .order('id', { ascending: false })

      if (interviewError) {
        console.error('Unable to load scheduled interviews:', interviewError)
        setInterviews([])
        setLoading(false)
        return
      }

      const interviewIds = (interviewData || []).map((interview) => interview.interview_id).filter(Boolean)

      const [feedbackResult, invitesResult] = interviewIds.length
        ? await Promise.all([
          supabase.from('interview feedback').select('id, interview_id, userEmail, feedback, recommended, recruiter_status').in('interview_id', interviewIds),
          supabase.from('interview_invites').select('interview_id, candidate_email, status').eq('recruiter_email', user.email),
        ])
        : [{ data: [] }, { data: [] }]

      if (feedbackResult.error) console.error('Unable to load candidate reports:', feedbackResult.error)
      if (invitesResult.error) console.error('Unable to load invites:', invitesResult.error)

      setInterviews(interviewData || [])
      setFeedbackByInterview(groupBy(feedbackResult.data || [], 'interview_id'))
      setInvitesByInterview(groupBy(invitesResult.data || [], 'interview_id'))
      setLoading(false)
    }

    getScheduledInterviews()
  }, [supabase, user?.email])

  return (
    <div>
      <PageHeader
        title='Scheduled Interviews'
        description='Invite candidates, track who has completed each interview, and review their reports.'
      />

      {loading && (
        <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className='h-[210px] animate-pulse rounded-2xl border border-slate-200 bg-white' />
          ))}
        </div>
      )}

      {!loading && !interviews.length && (
        <EmptyState
          icon={CalendarClock}
          title='No scheduled interviews'
          description='Create an interview first, then invite candidates to it from here.'
        />
      )}

      {!loading && interviews.length > 0 && (
        <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
          {interviews.map((interview) => (
            <ScheduledInterviewCard
              key={interview.interview_id}
              interview={interview}
              feedback={feedbackByInterview[interview.interview_id] ?? []}
              invites={invitesByInterview[interview.interview_id] ?? []}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default ScheduledInterviews
