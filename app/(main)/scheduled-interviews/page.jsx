'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Loader2Icon, Video } from 'lucide-react'
import { createClient } from '@/services/supabaseClient'
import { useUser } from '@/app/provider'
import ScheduledInterviewCard from './_components/ScheduledInterviewCard'
import PageHeader from '../_components/PageHeader'

function ScheduledInterviews() {
  const supabase = useMemo(() => createClient(), [])
  const { user } = useUser()
  const [interviews, setInterviews] = useState([])
  const [feedbackByInterview, setFeedbackByInterview] = useState({})
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
        setFeedbackByInterview({})
        setLoading(false)
        return
      }

      const interviewIds = (interviewData || [])
        .map((interview) => interview.interview_id)
        .filter(Boolean)

      if (!interviewIds.length) {
        setInterviews([])
        setFeedbackByInterview({})
        setLoading(false)
        return
      }

      const { data: feedbackData, error: feedbackError } = await supabase
        .from('interview feedback')
        .select('*')
        .in('interview_id', interviewIds)

      if (feedbackError) {
        console.error('Unable to load candidate reports:', feedbackError)
      }

      const reports = (feedbackData || []).reduce((result, feedback) => {
        result[feedback.interview_id] = feedback
        return result
      }, {})

      setInterviews(interviewData || [])
      setFeedbackByInterview(reports)
      setLoading(false)
    }

    getScheduledInterviews()
  }, [supabase, user?.email])

  return (
    <div>
      <PageHeader
        title='Scheduled Interviews'
        description='Interview details and candidate reports.'
      />

      {loading && (
        <div className='mt-5 flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white p-5'>
          <Loader2Icon className='h-5 w-5 animate-spin text-primary' />
          <p className='text-sm text-gray-500'>Loading scheduled interviews...</p>
        </div>
      )}

      {!loading && !interviews.length && (
        <div className='mt-5 flex flex-col items-center gap-3 rounded-lg border border-gray-200 bg-white p-5'>
          <Video className='h-8 w-8 text-primary' />
          <h2 className='text-2xl font-bold'>No scheduled interviews</h2>
        </div>
      )}

      {!loading && interviews.length > 0 && (
        <div className='mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2'>
          {interviews.map((interview) => (
            <ScheduledInterviewCard
              key={interview.interview_id}
              interview={interview}
              feedback={feedbackByInterview[interview.interview_id]}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default ScheduledInterviews
