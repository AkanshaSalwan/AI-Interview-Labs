'use client'

import moment from 'moment/moment'
import { CheckCircle2, Clock3, Mail, UserRound } from 'lucide-react'

function ScheduledInterviewCard({ interview, feedback }) {
  const report = feedback?.feedback
  const recommendation = report?.recommendation

  return (
    <article className='rounded-lg border border-gray-200 bg-white p-5'>
      <div className='flex items-start justify-between gap-4'>
        <div>
          <h2 className='text-lg font-bold'>{interview?.jobPosition || 'Interview'}</h2>
          <p className='mt-1 flex items-center gap-2 text-sm text-gray-500'>
            <Clock3 className='h-4 w-4' />
            {interview?.duration || '—'} minutes
          </p>
        </div>
        <p className='text-sm text-gray-500'>
          {interview?.created_at ? moment(interview.created_at).format('DD/MM/YYYY') : '—'}
        </p>
      </div>

      <div className='mt-4 rounded-md bg-gray-50 p-3'>
        <h3 className='font-semibold'>Candidate report</h3>
        {feedback ? (
          <>
            <div className='mt-2 flex flex-col gap-1 text-sm text-gray-600'>
              <span className='flex items-center gap-2'>
                <UserRound className='h-4 w-4' />
                {feedback.userName || 'Candidate name unavailable'}
              </span>
              {feedback.userEmail && (
                <span className='flex items-center gap-2'>
                  <Mail className='h-4 w-4' />
                  {feedback.userEmail}
                </span>
              )}
            </div>
            {report?.summary && (
              <p className='mt-3 whitespace-pre-line text-sm text-gray-600'>{report.summary}</p>
            )}
            {recommendation && (
              <p className='mt-3 flex items-center gap-2 text-sm font-medium text-primary'>
                <CheckCircle2 className='h-4 w-4' />
                Recommendation: {recommendation}
              </p>
            )}
          </>
        ) : (
          <p className='mt-2 text-sm text-gray-500'>Candidate has not completed this interview yet.</p>
        )}
      </div>
    </article>
  )
}

export default ScheduledInterviewCard
