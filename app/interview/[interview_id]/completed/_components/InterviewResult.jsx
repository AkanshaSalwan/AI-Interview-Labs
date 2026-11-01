'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, CheckCircle2, Loader2, MessageSquareText, RotateCcw, ThumbsDown, ThumbsUp } from 'lucide-react'
import { createClient } from '@/services/supabaseClient'
import { isRecommended, overallScore } from '@/services/scores'
import TranscriptView from '@/components/interview/TranscriptView'
import DetailedFeedback from '@/components/interview/DetailedFeedback'
import { cn } from '@/lib/utils'

const RATING_LABELS = {
  technicalSkills: 'Technical skills',
  communication: 'Communication',
  problemSolving: 'Problem solving',
  experience: 'Experience',
}

function ScoreRing({ score }) {
  const percent = Math.max(0, Math.min(100, (score ?? 0) * 10))
  return (
    <div
      className='relative flex size-32 items-center justify-center rounded-full'
      style={{ background: `conic-gradient(#7c3aed ${percent * 3.6}deg, #ede9fe 0deg)` }}
    >
      <div className='flex size-[104px] flex-col items-center justify-center rounded-full bg-white'>
        <span className='text-3xl font-bold text-slate-900'>{score ?? '—'}</span>
        <span className='text-xs text-slate-500'>out of 10</span>
      </div>
    </div>
  )
}

function InterviewResult({ interviewId, feedbackId }) {
  const supabase = useMemo(() => createClient(), [])
  const [result, setResult] = useState(null)
  const [interview, setInterview] = useState(null)
  const [loading, setLoading] = useState(Boolean(feedbackId))

  useEffect(() => {
    if (!feedbackId) return

    const load = async () => {
      const [{ data: feedbackRow, error: feedbackError }, { data: interviewRow }] = await Promise.all([
        supabase.from('interview feedback').select('*').eq('id', feedbackId).eq('interview_id', interviewId).maybeSingle(),
        supabase.rpc('get_interview_public', { p_interview_id: interviewId }),
      ])
      if (feedbackError) console.error('Unable to load interview result:', feedbackError)
      setResult(feedbackRow ?? null)
      setInterview(interviewRow ?? null)
      setLoading(false)
    }

    load()
  }, [supabase, feedbackId, interviewId])

  if (loading) {
    return (
      <div className='flex min-h-[60vh] items-center justify-center gap-2 text-slate-500'>
        <Loader2 className='size-5 animate-spin text-violet-600' /> Loading your results…
      </div>
    )
  }

  // Recruiter interviews: the candidate only sees a confirmation; the recruiter reviews the report.
  if (!result || !interview?.is_practice) {
    return (
      <main className='flex min-h-[80vh] items-center justify-center px-4 py-12'>
        <div className='w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm'>
          <span className='mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-50'>
            <CheckCircle2 className='size-9 text-emerald-500' />
          </span>
          <h1 className='mt-5 text-2xl font-bold text-slate-900'>Interview submitted</h1>
          <p className='mt-2 text-slate-500'>
            Thanks for completing{interview?.jobPosition ? ` the ${interview.jobPosition} interview` : ' your interview'}.
            The recruiter will review your responses and get back to you.
          </p>
          <p className='mt-6 text-sm text-slate-400'>You can close this window now.</p>
        </div>
      </main>
    )
  }

  const feedback = result.feedback ?? {}
  const score = overallScore(result)
  const recommended = isRecommended(result)

  return (
    <main className='mx-auto max-w-5xl px-4 py-10'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <p className='text-sm font-medium text-violet-600'>Practice results</p>
          <h1 className='text-3xl font-bold tracking-tight text-slate-900'>{interview.jobPosition}</h1>
          <p className='mt-1 text-sm text-slate-500'>
            {interview.duration} minutes{interview.difficulty ? ` · ${interview.difficulty}` : ''}
          </p>
        </div>
        <div className='flex gap-2'>
          <Link href='/candidate/dashboard' className='inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50'>
            <ArrowLeft className='size-4' /> Dashboard
          </Link>
          <Link href='/candidate/practice' className='inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 text-sm font-medium text-white shadow-md shadow-violet-500/25 hover:opacity-90'>
            <RotateCcw className='size-4' /> Practice again
          </Link>
        </div>
      </div>

      <div className='mt-8 grid gap-6 lg:grid-cols-3'>
        {/* Score */}
        <section className='flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-6 text-center'>
          <h2 className='self-start font-semibold text-slate-900'>Overall score</h2>
          <div className='my-6'><ScoreRing score={score} /></div>
          <span className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium',
            recommended ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
          )}>
            {recommended ? <ThumbsUp className='size-4' /> : <ThumbsDown className='size-4' />}
            {feedback.recommendation || (recommended ? 'Recommended' : 'Not recommended yet')}
          </span>
        </section>

        {/* Ratings */}
        <section className='rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-2'>
          <h2 className='font-semibold text-slate-900'>Skill breakdown</h2>
          <div className='mt-5 space-y-4'>
            {Object.entries(feedback.rating ?? {}).map(([key, value]) => (
              <div key={key}>
                <div className='flex justify-between text-sm'>
                  <span className='text-slate-600'>{RATING_LABELS[key] ?? key}</span>
                  <span className='font-semibold text-slate-900'>{value}/10</span>
                </div>
                <div className='mt-1.5 h-2 rounded-full bg-slate-100'>
                  <div
                    className='h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500'
                    style={{ width: `${Math.max(0, Math.min(100, Number(value) * 10))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          {feedback.summary && (
            <div className='mt-6 rounded-xl bg-slate-50 p-4'>
              <h3 className='text-sm font-semibold text-slate-900'>Summary</h3>
              <p className='mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-600'>{feedback.summary}</p>
            </div>
          )}
          {feedback.recommendationMessage && (
            <p className='mt-4 text-sm leading-relaxed text-slate-600'>{feedback.recommendationMessage}</p>
          )}
        </section>
      </div>

      {(feedback.strengths?.length || feedback.questionFeedback?.length) ? (
        <section className='mt-6 rounded-2xl border border-slate-200 bg-slate-50/60 p-6'>
          <h2 className='mb-4 font-semibold text-slate-900'>Detailed feedback</h2>
          <DetailedFeedback feedback={feedback} />
        </section>
      ) : null}

      {/* Transcript */}
      <section className='mt-6 rounded-2xl border border-slate-200 bg-white p-6'>
        <div className='mb-6 flex items-center gap-3'>
          <span className='flex size-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600'>
            <MessageSquareText className='size-5' />
          </span>
          <div>
            <h2 className='font-semibold text-slate-900'>Interview transcript</h2>
            <p className='text-xs text-slate-500'>Read back your answers to see what to improve.</p>
          </div>
        </div>
        <TranscriptView transcript={result.transcript} candidateName={result.userName || 'You'} />
      </section>

      <div className='mt-10 flex justify-center'>
        <Image src='/AI Interview Voice Agent Logo.png' alt='AI Interview' width={2172} height={724} className='h-auto w-[120px] opacity-60' />
      </div>
    </main>
  )
}

export default InterviewResult
