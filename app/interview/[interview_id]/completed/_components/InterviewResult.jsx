'use client'
import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import moment from 'moment'
import axios from 'axios'
import {
  ArrowLeft, BarChart3, CalendarDays, CheckCircle2, ChevronDown, Clock, FileText, Gauge, Layers, ListChecks,
  Loader2, RotateCcw, Sparkles, ThumbsDown, ThumbsUp, TrendingUp,
} from 'lucide-react'
import { createClient } from '@/services/supabaseClient'
import { isRecommended, overallScore } from '@/services/scores'
import { INTERVIEW_TOPICS } from '@/services/interviewTopics'
import TranscriptView from '@/components/interview/TranscriptView'
import { QuestionItem } from '@/components/interview/DetailedFeedback'
import InterviewHeader from '@/app/interview/_components/InterviewHeader'
import ResultsHeader from './ResultsHeader'
import { cn } from '@/lib/utils'

const MAX_VISIBLE_QUESTIONS = 10

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
      className='relative flex size-[120px] shrink-0 items-center justify-center rounded-full'
      style={{ background: `conic-gradient(#f97316 ${percent * 3.6}deg, #fdf0e5 0deg)` }}
      role='img'
      aria-label={`Your score ${score ?? 'not available'} out of 10`}
    >
      <div className='flex size-[108px] flex-col items-center justify-center rounded-full bg-white'>
        <p className='leading-none text-slate-900'>
          <span className='text-[32px] font-semibold tracking-tight'>{score ?? '—'}</span>
          <span className='text-lg font-medium text-slate-700'>/10</span>
        </p>
        <span className='mt-1.5 text-[11px] text-slate-500'>Your score</span>
      </div>
    </div>
  )
}

function IconTile({ icon: Icon, className }) {
  return (
    <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500', className)}>
      <Icon className='size-[18px]' strokeWidth={1.75} />
    </span>
  )
}

function CardTitle({ icon, title, description, aside, iconClassName }) {
  return (
    <div className='flex items-start gap-3'>
      <IconTile icon={icon} className={iconClassName} />
      <div className='min-w-0 flex-1'>
        <h2 className='text-[15px] font-semibold text-slate-900'>{title}</h2>
        {description && <p className='mt-0.5 text-xs text-slate-500'>{description}</p>}
      </div>
      {aside}
    </div>
  )
}

function PointsCard({ icon, title, items, iconClassName, dotClassName }) {
  if (!items?.length) return null
  return (
    <section className='card-soft rounded-2xl p-5'>
      <div className='flex items-start gap-3'>
        <IconTile icon={icon} className={iconClassName} />
        <div className='min-w-0 flex-1'>
          <h2 className='text-[15px] font-semibold text-slate-900'>{title}</h2>
          <ul className='mt-2 space-y-1.5'>
            {items.map((item, index) => (
              <li key={index} className='flex gap-2.5 text-[13px] leading-relaxed text-slate-600'>
                <span className={cn('mt-[7px] size-1.5 shrink-0 rounded-full', dotClassName)} />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

function InterviewResult({ interviewId, feedbackId }) {
  const supabase = useMemo(() => createClient(), [])
  const [result, setResult] = useState(null)
  const [interview, setInterview] = useState(null)
  const [loading, setLoading] = useState(Boolean(feedbackId))
  const [showTranscript, setShowTranscript] = useState(false)
  const [personalising, setPersonalising] = useState(false)

  useEffect(() => {
    if (!feedbackId) return
    let cancelled = false

    // Older practice reports talk about "the candidate"; reword them once to talk to "you".
    const personalise = async (feedbackRow) => {
      setPersonalising(true)
      try {
        const { data } = await axios.post('/api/practice-feedback/rewrite', { feedback_id: feedbackRow.id })
        if (!cancelled && data?.feedback) setResult((current) => ({ ...current, feedback: data.feedback }))
      } catch (error) {
        console.error('Unable to personalise this report:', error?.response?.data?.error || error.message)
      } finally {
        if (!cancelled) setPersonalising(false)
      }
    }

    const load = async () => {
      const [{ data: feedbackRow, error: feedbackError }, { data: interviewRow }] = await Promise.all([
        supabase.from('interview feedback').select('*').eq('id', feedbackId).eq('interview_id', interviewId).maybeSingle(),
        supabase.rpc('get_interview_public', { p_interview_id: interviewId }),
      ])
      if (cancelled) return
      if (feedbackError) console.error('Unable to load interview result:', feedbackError)
      setResult(feedbackRow ?? null)
      setInterview(interviewRow ?? null)
      setLoading(false)

      if (feedbackRow?.feedback && interviewRow?.is_practice && feedbackRow.feedback.voice !== 'you') {
        personalise(feedbackRow)
      }
    }

    load()
    return () => { cancelled = true }
  }, [supabase, feedbackId, interviewId])

  if (loading) {
    return (
      <>
        <InterviewHeader />
        <div className='flex min-h-[60vh] items-center justify-center gap-2 text-sm text-slate-500'>
          <Loader2 className='size-5 animate-spin text-orange-500' /> Loading your results…
        </div>
      </>
    )
  }

  // Recruiter interviews: the candidate only sees a confirmation; the recruiter reviews the report.
  if (!result || !interview?.is_practice) {
    return (
      <>
        <InterviewHeader />
        <main className='flex min-h-[80vh] items-center justify-center px-4 py-12'>
          <div className='card-soft w-full max-w-md rounded-2xl p-8 text-center'>
            <span className='mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-50'>
              <CheckCircle2 className='size-7 text-emerald-500' strokeWidth={1.75} />
            </span>
            <h1 className='mt-5 text-xl font-semibold text-slate-900'>Interview submitted</h1>
            <p className='mt-2 text-sm leading-relaxed text-slate-500'>
              Thanks for completing{interview?.jobPosition ? ` the ${interview.jobPosition} interview` : ' your interview'}.
              The recruiter will review your responses and get back to you.
            </p>
            <p className='mt-6 text-xs text-slate-400'>You can close this window now.</p>
          </div>
        </main>
      </>
    )
  }

  const feedback = result.feedback ?? {}
  const score = overallScore(result)
  const recommended = isRecommended(result)
  const ratings = Object.entries(feedback.rating ?? {})
  const questions = Array.isArray(feedback.questionFeedback) ? feedback.questionFeedback.filter((item) => item?.question) : []
  const transcriptCount = Array.isArray(result.transcript) ? result.transcript.filter((message) => message?.content?.trim()).length : 0
  const TopicIcon = INTERVIEW_TOPICS.find((topic) => topic.jobPosition === interview.jobPosition)?.icon ?? Sparkles

  const meta = [
    { icon: Clock, text: `${interview.duration} min` },
    ...(interview.difficulty ? [{ icon: Gauge, text: interview.difficulty }] : []),
    ...(result.created_at ? [{ icon: CalendarDays, text: moment(result.created_at).format('DD MMM YYYY, h:mm A') }] : []),
  ]

  return (
    <>
      <ResultsHeader />
      <main className='isolate mx-auto w-full max-w-[1420px] px-4 pb-14 pt-6 md:px-10'>
        {/* Folded paper corner at the bottom-left of the page */}
        <div aria-hidden className='pointer-events-none absolute inset-0 -z-10 overflow-hidden'>
          <div className='paper-lift absolute inset-0'>
            <div className='fold-corner-bl bottom-0 left-0 h-[150px] w-[110px] opacity-90' />
          </div>
        </div>

        {/* Page header */}
        <div className='relative flex flex-wrap items-end justify-between gap-4'>
          <div>
            <Link href='/candidate/progress' className='inline-flex items-center gap-1.5 text-[13px] text-slate-500 transition-colors hover:text-orange-600'>
              <ArrowLeft className='size-3.5' /> Progress
            </Link>
            <h1 className='mt-2 text-[28px] font-semibold tracking-tight text-slate-900'>Practice Results</h1>
            <p className='mt-0.5 text-[13px] text-slate-500'>How you did in this practice interview, with personal feedback and tips from your AI coach.</p>
          </div>
          <div className='flex items-center gap-2'>
            <Link href='/candidate/progress' className='card-soft inline-flex h-9 items-center gap-1.5 rounded-xl px-3.5 text-[13px] font-medium text-slate-700 transition-colors hover:bg-orange-50'>
              <BarChart3 className='size-3.5' /> View progress
            </Link>
            <Link href='/candidate/practice' className='btn-orange inline-flex h-9 items-center gap-1.5 rounded-xl px-3.5 text-[13px] font-medium text-white hover:brightness-105'>
              <RotateCcw className='size-3.5' /> Practice again
            </Link>
          </div>
        </div>

        {/* Summary */}
        <section className='card-soft mt-5 rounded-2xl p-5'>
          <div className='flex flex-col gap-5 lg:flex-row lg:items-center'>
            <div className='flex min-w-0 flex-1 items-center gap-5'>
              <div className='relative hidden h-[124px] w-[200px] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#fff6ee] via-orange-50 to-[#ffe9d6] ring-1 ring-orange-100 sm:flex'>
                <span aria-hidden className='absolute -bottom-10 -right-6 size-32 rounded-full bg-orange-200/40 blur-2xl' />
                <Image
                  src='/laptop.png'
                  alt=''
                  width={707}
                  height={353}
                  priority
                  className='relative h-auto w-[180px]'
                />
              </div>
              <div className='min-w-0'>
                <p className='flex items-center gap-1.5 text-xs font-medium text-orange-600'>
                  <TopicIcon className='size-3.5' strokeWidth={2} /> Your practice interview
                </p>
                <h2 className='mt-1 text-xl font-semibold tracking-tight text-slate-900'>{interview.jobPosition}</h2>
                <div className='mt-2 flex flex-wrap gap-1.5'>
                  {meta.map(({ icon: Icon, text }) => (
                    <span key={text} className='inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-0.5 text-xs text-slate-600 ring-1 ring-orange-100'>
                      <Icon className='size-3.5 text-orange-500' /> {text}
                    </span>
                  ))}
                </div>
                {feedback.summary && (
                  <p className='mt-3 max-w-3xl whitespace-pre-line text-[13px] leading-relaxed text-slate-600'>{feedback.summary}</p>
                )}
                {personalising && (
                  <p className='mt-2 inline-flex items-center gap-1.5 text-xs text-orange-600'>
                    <Loader2 className='size-3.5 animate-spin' /> Personalising this report for you…
                  </p>
                )}
              </div>
            </div>

            <div className='flex items-center justify-around gap-6 border-orange-100 lg:w-[400px] lg:border-l lg:pl-6'>
              <ScoreRing score={score} />
              <span className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium',
                recommended ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' : 'bg-orange-50 text-orange-600 ring-1 ring-orange-100'
              )}>
                {recommended ? <ThumbsUp className='size-4' /> : <ThumbsDown className='size-4' />}
                {recommended ? 'Interview ready' : 'Not interview-ready yet'}
              </span>
            </div>
          </div>
        </section>

        {/* Skill breakdown + verdict */}
        <div className='mt-4 grid gap-4 lg:grid-cols-[1.15fr_1fr]'>
          <section className='card-soft rounded-2xl p-5'>
            <CardTitle icon={Layers} title='Your skills' description='How you scored in each area, out of 10.' />
            <ul className='mt-4 space-y-3 sm:pl-12'>
              {ratings.map(([key, value]) => (
                <li key={key} className='grid grid-cols-[110px_1fr_40px] items-center gap-4 text-[13px]'>
                  <span className='text-slate-600'>{RATING_LABELS[key] ?? key}</span>
                  <span className='h-1.5 rounded-full bg-[#f6eee6]'>
                    <span
                      className='block h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-500'
                      style={{ width: `${Math.max(0, Math.min(100, Number(value) * 10))}%` }}
                    />
                  </span>
                  <span className='text-right font-medium text-slate-800' style={{ fontVariantNumeric: 'tabular-nums' }}>{value}/10</span>
                </li>
              ))}
            </ul>
          </section>

          <section className='card-soft relative overflow-hidden rounded-2xl p-5'>
            <span aria-hidden className='fold-corner-tr right-0 top-0 h-24 w-24 opacity-70' />
            <CardTitle icon={Sparkles} title='The verdict' description='How a real interviewer would likely see your answers.' />
            <div className='relative mt-4 rounded-xl bg-orange-50/60 p-4 pl-11'>
              <span aria-hidden className='absolute left-4 top-2.5 font-serif text-3xl leading-none text-orange-400'>“</span>
              <p className='text-[13px] italic leading-relaxed text-slate-700'>
                {feedback.recommendationMessage || 'No verdict was written for this session.'}
              </p>
            </div>
          </section>
        </div>

        {/* Strengths + improvements */}
        {(feedback.strengths?.length || feedback.improvements?.length) ? (
          <div className='mt-4 grid gap-4 lg:grid-cols-2'>
            <PointsCard icon={ThumbsUp} title='What you did well' items={feedback.strengths} iconClassName='bg-emerald-50 text-emerald-600' dotClassName='bg-emerald-400' />
            <PointsCard icon={TrendingUp} title='What to work on' items={feedback.improvements} dotClassName='bg-orange-400' />
          </div>
        ) : null}

        {/* Questions + transcript */}
        <div className='mt-4 grid gap-4'>
          {questions.length > 0 && (
            <section className='card-soft overflow-hidden rounded-2xl'>
              <div className='p-5 pb-3'>
                <CardTitle
                  icon={ListChecks}
                  title='Question by question'
                  description='Open a question to see your answer, tips and a strong example.'
                  aside={<span className='shrink-0 text-xs text-slate-400'>{questions.length} questions</span>}
                />
              </div>
              <ol className={cn(
                'divide-y divide-orange-50 border-t border-orange-50',
                // Past 10 questions the list scrolls inside the card (10 rows ≈ 480px).
                questions.length > MAX_VISIBLE_QUESTIONS && 'max-h-[480px] overflow-y-auto overscroll-contain'
              )}>
                {questions.map((item, index) => <QuestionItem key={index} item={item} index={index} />)}
              </ol>
            </section>
          )}

          <section className='card-soft overflow-hidden rounded-2xl'>
            <button
              type='button'
              onClick={() => setShowTranscript((value) => !value)}
              aria-expanded={showTranscript}
              className='flex w-full cursor-pointer items-center gap-3 p-5 text-left transition-colors hover:bg-orange-50/30'
            >
              <IconTile icon={FileText} />
              <div className='min-w-0 flex-1'>
                <h2 className='text-[15px] font-semibold text-slate-900'>Interview transcript</h2>
                <p className='mt-0.5 text-xs text-slate-500'>
                  {transcriptCount ? `${transcriptCount} messages · read back your answers` : 'Read back your answers to see what to improve.'}
                </p>
              </div>
              <span className='inline-flex items-center gap-1 text-[13px] font-medium text-orange-600'>
                {showTranscript ? 'Hide' : 'Show'}
                <ChevronDown className={cn('size-4 transition-transform', showTranscript && 'rotate-180')} />
              </span>
            </button>
            {showTranscript && (
              <div className='max-h-[520px] overflow-y-auto overscroll-contain border-t border-orange-50 p-5'>
                <TranscriptView transcript={result.transcript} candidateName={result.userName || 'You'} />
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  )
}

export default InterviewResult
