'use client'
import { InterviewDataContext } from '@/context/InterviewDataContext'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { Timer, Mic, Phone } from 'lucide-react'
import Image from 'next/image'
import Vapi from '@vapi-ai/web';
import AlertConfirmation from './_components/AlertConfirmation'
import { toast } from '@/components/ui/toast'
import axios from 'axios'
import { cn } from '@/lib/utils'
import { useParams, useRouter } from 'next/navigation'


const DAILY_NOISE_PATTERNS = [
  'unsupported input processor',
  'meeting ended due to ejection',
  'meeting has ended',
  'mediastreamtrack found in props or cache',
]

function getErrorText(error) {
  try {
    return JSON.stringify(error ?? {})
  } catch {
    return String(error ?? '')
  }
}

function isBenignVapiError(error) {
  const text = getErrorText(error).toLowerCase()
  return DAILY_NOISE_PATTERNS.some((pattern) => text.includes(pattern)) ||
    text.includes('microphone preflight cancelled') ||
    text.includes('aborterror') ||
    text.includes('microphone-preflight')
}

function isDailyConsoleNoise(args) {
  const text = args
    .map((arg) => {
      if (typeof arg === 'string') return arg
      if (arg?.message) return String(arg.message)
      if (arg?.errorMsg) return String(arg.errorMsg)
      try {
        return JSON.stringify(arg)
      } catch {
        return String(arg)
      }
    })
    .join(' ')
    .toLowerCase()

  return DAILY_NOISE_PATTERNS.some((pattern) => text.includes(pattern))
}

function getMessageText(item) {
  if (!item) return ''
  if (typeof item.content === 'string') return item.content
  if (typeof item.message === 'string') return item.message
  if (typeof item.transcript === 'string') return item.transcript
  return ''
}

function normalizeConversation(items) {
  if (!Array.isArray(items)) return []

  return items
    .map((item) => {
      const content = getMessageText(item).trim()
      const rawRole = String(item?.role || '').toLowerCase()
      if (!content || !rawRole || rawRole === 'system' || rawRole === 'tool' || rawRole === 'function') {
        return null
      }

      return {
        role: rawRole === 'bot' || rawRole === 'assistant' ? 'assistant' : 'user',
        content,
      }
    })
    .filter(Boolean)
}

function conversationFromVapiMessage(message) {
  if (message?.type !== 'conversation-update') return null

  const fromOpenAI = normalizeConversation(message.messagesOpenAIFormatted)
  if (fromOpenAI.length) return fromOpenAI

  const fromMessages = normalizeConversation(message.messages || message.conversation)
  return fromMessages.length ? fromMessages : null
}

function formatDuration(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return [hours, minutes, seconds]
    .map((unit) => String(unit).padStart(2, '0'))
    .join(':')
}

function StartInterview() {
  const { interviewInfo } = useContext(InterviewDataContext)
  const { interview_id: interviewId } = useParams()
  const router = useRouter()
  const vapiRef = useRef(null)
  const interviewInfoRef = useRef(interviewInfo)
  const callActiveRef = useRef(false)
  const conversationRef = useRef([])
  const feedbackInProgressRef = useRef(false)
  const feedbackSavedRef = useRef(false)
  const generateFeedbackRef = useRef(async () => {})
  const timerIntervalRef = useRef(null)
  const timerStartedAtRef = useRef(null)
  const [callActive, setCallActive] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [statusText, setStatusText] = useState('Ready to begin')
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false)
  const [isCandidateSpeaking, setIsCandidateSpeaking] = useState(false)
  const [feedback, setFeedback] = useState(null)

  interviewInfoRef.current = interviewInfo


  if (!vapiRef.current && process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY) {
    vapiRef.current = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY)
  }

  useEffect(() => {
    const originalError = console.error
    console.error = (...args) => {
      if (isDailyConsoleNoise(args)) return
      originalError.apply(console, args)
    }


    return () => {
      console.error = originalError
    }
  }, [])

  useEffect(() => {
    const vapi = vapiRef.current
    if (!vapi) return

    const onCallStart = () => {
      callActiveRef.current = true
      conversationRef.current = []
      feedbackInProgressRef.current = false
      feedbackSavedRef.current = false
      setFeedback(null)
      timerStartedAtRef.current = Date.now()
      setElapsedSeconds(0)
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = setInterval(() => {
        const startedAt = timerStartedAtRef.current
        if (startedAt) {
          setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000))
        }
      }, 1000)
      setCallActive(true)
      setIsStarting(false)
      setStatusText('Interview in Progress....')
      toast.add({ title: 'Call has started.' })
    }

    const onCallEnd = () => {
      window.setTimeout(() => {
        void generateFeedbackRef.current()
      }, 1500)
      callActiveRef.current = false
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
      timerStartedAtRef.current = null
      setCallActive(false)
      setIsStarting(false)
      setIsAssistantSpeaking(false)
      setIsCandidateSpeaking(false)
      setStatusText((current) =>
        current.startsWith('Ended:') ? current : 'Interview ended'
      )
      toast.add({ title: 'Call has ended.' })
    }

    const onMessage = (message) => {
      if (
        message?.type === 'transcript' &&
        message?.role &&
        message?.transcript &&
        (!message.transcriptType || message.transcriptType === 'final')
      ) {
        conversationRef.current.push({
          role: message.role === 'bot' ? 'assistant' : message.role,
          content: message.transcript,
        })
      }

      const updatedConversation = conversationFromVapiMessage(message)
      if (updatedConversation) {
        conversationRef.current = updatedConversation
      }

      if (message?.type === 'status-update' && message?.status === 'ended') {
        const reason = message?.endedReason || 'unknown'
        setStatusText(`Ended: ${reason}`)
      }
    }

    const onError = (error) => {
      if (isBenignVapiError(error)) return
      console.error('Vapi error:', getErrorText(error))
      setIsStarting(false)
      setStatusText('Unable to start interview. Please try again.')
    }

    const onSpeechStart = () => {
      setIsAssistantSpeaking(true)
    }

    const onSpeechEnd = () => {
      setIsAssistantSpeaking(false)
    }

    const onLocalVolumeLevel = (volume) => {
      setIsCandidateSpeaking(volume > 0.02)
    }

    vapi.on('call-start', onCallStart)
    vapi.on('call-end', onCallEnd)
    vapi.on('message', onMessage)
    vapi.on('error', onError)
    vapi.on('speech-start', onSpeechStart)
    vapi.on('speech-end', onSpeechEnd)
    vapi.on('local-volume-level', onLocalVolumeLevel)

    return () => {
      clearInterval(timerIntervalRef.current)
      vapi.removeListener('call-start', onCallStart)
      vapi.removeListener('call-end', onCallEnd)
      vapi.removeListener('message', onMessage)
      vapi.removeListener('error', onError)
      vapi.removeListener('speech-start', onSpeechStart)
      vapi.removeListener('speech-end', onSpeechEnd)
      vapi.removeListener('local-volume-level', onLocalVolumeLevel)
      // Do not call vapi.stop() here — Strict Mode remounts would eject the meeting.
    }
  }, [])

  const startCall = async () => {
    const vapi = vapiRef.current
    if (!vapi || !interviewInfo || callActiveRef.current || isStarting) return

    // Numbered, one per line: questions often contain commas, so a comma-separated list blurs them together.
    const questions = (interviewInfo?.interviewData?.questionList ?? [])
      .map((item) => item?.question?.trim())
      .filter(Boolean)
    const questionList = questions.map((question, index) => `${index + 1}. ${question}`).join('\n')

    const assistantOptions = {
      name: 'AI Recruiter',
      firstMessage:
        'Hi ' +
        interviewInfo?.userName +
        ', how are you? Ready for your interview on ' +
        interviewInfo?.interviewData?.jobPosition +
        '?',
      transcriber: {
        provider: 'deepgram',
        model: 'nova-2',
        language: 'en-US',
      },
      // Built-in Vapi voice (Jennifer is not a valid Vapi voiceId).
      voice: {
        provider: 'vapi',
        voiceId: 'Emma',
        version: 2,
      },
      model: {
        provider: 'openai',
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `
You are an AI voice assistant conducting interviews.
Your job is to ask candidates provided interview questions, assess their responses.
Begin the conversation with a friendly introduction, setting a relaxed yet professional tone. Example:
"Hey there! Welcome to your ${interviewInfo?.interviewData?.jobPosition} interview. Let's get started with a few questions!"
This interview has exactly ${questions.length} questions. Ask ALL of them, one at a time, in this order:
${questionList}
Rules for the questions:
- Ask every question above, in order. Do not skip any, merge two into one, or add new questions of your own.
- Ask each question in its original meaning; you may say it naturally, but keep its content.
- Wait for the candidate's full answer before moving on. Before each one, say which it is, e.g. "Question 3 of ${questions.length}".
- If the candidate asks you to repeat a question, repeat it. If they say they don't know, accept that and move to the next question.
If the candidate struggles, offer hints or rephrase the question without giving away the answer. Example:
"Need a hint? Think about the main trade-offs involved here!"
Provide brief, encouraging feedback after each answer. Example:
"Nice! That's a solid answer."
"Hmm, not quite! Want to try again?"
Keep the conversation natural and engaging—use casual phrases like "Alright, next up..." or "Let's tackle a tricky one!"
Only after the last question (question ${questions.length}) has been answered, wrap up the interview smoothly by summarizing their performance. Example:
"That was great! You handled some tough questions well. Keep sharpening your skills!"
End on a positive note:
"Thanks for chatting! Hope to see you crushing projects soon!"
Key Guidelines:
✅ Be friendly, engaging, and witty 🎤
✅ Keep responses short and natural, like a real conversation
✅ Adapt based on the candidate's confidence level
✅ Ensure the interview remains focused on the ${interviewInfo?.interviewData?.jobPosition} role
`.trim(),
          },
        ],
      },
    }

    setIsStarting(true)
    setStatusText('Connecting...')

    try {
      await vapi.start(assistantOptions)
    } catch (error) {
      if (!isBenignVapiError(error)) {
        console.error('Vapi start failed:', getErrorText(error))
        setStatusText('Unable to start interview. Please try again.')
      }
      setIsStarting(false)
    }
  }

  const stopInterview = () => {
    const vapi = vapiRef.current
    if (!vapi) return

    try {
      vapi.stop()
    } catch (_) {
      // ignore — meeting may already be ended
    }
    callActiveRef.current = false
    clearInterval(timerIntervalRef.current)
    timerIntervalRef.current = null
    timerStartedAtRef.current = null
    setCallActive(false)
    setIsStarting(false)
    setIsAssistantSpeaking(false)
    setIsCandidateSpeaking(false)
    setStatusText('Interview ended')
    window.setTimeout(() => {
      void generateFeedbackRef.current()
    }, 1500)
  }

  const generateFeedback = async () => {
    if (feedbackInProgressRef.current || feedbackSavedRef.current) return

    feedbackInProgressRef.current = true
    setStatusText('Generating interview feedback...')

    try {
      let conversation = normalizeConversation(conversationRef.current)
      for (let attempt = 0; attempt < 6 && conversation.length === 0; attempt += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 500))
        conversation = normalizeConversation(conversationRef.current)
      }

      if (!conversation.length) {
        throw new Error('No interview transcript was captured.')
      }

      // Nothing to score if the candidate never spoke (call ended early, or the mic didn't pick them up).
      if (!conversation.some((message) => message.role === 'user')) {
        setStatusText('Interview ended before any answers were recorded.')
        toast.add({
          title: 'No answers were recorded',
          description: 'We didn’t hear you answer any question, so there is no report. Check your microphone and start the interview again.',
        })
        return
      }

      const currentInterviewInfo = interviewInfoRef.current
      const result = await axios.post('/api/ai-feedback', {
        conversation,
        interview_id: interviewId,
        userName: currentInterviewInfo?.userName,
        userEmail: currentInterviewInfo?.userEmail,
      })
      const content = result.data?.content
      if (!content) throw new Error(result.data?.error || 'Empty feedback response')

      const cleanedContent = content
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim()
      let generatedFeedback

      try {
        generatedFeedback = JSON.parse(cleanedContent)
      } catch {
        const objectMatch = cleanedContent.match(/\{[\s\S]*\}/)
        if (!objectMatch) {
          throw new Error('AI did not return valid JSON feedback.')
        }

        try {
          generatedFeedback = JSON.parse(objectMatch[0])
        } catch {
          throw new Error('AI returned malformed JSON feedback.')
        }
      }

      const feedbackData = generatedFeedback.feedback || generatedFeedback
      if (!feedbackData || typeof feedbackData !== 'object') {
        throw new Error('AI returned an invalid feedback structure.')
      }

      if (result.data?.error) {
        throw new Error(result.data.error)
      }

      feedbackSavedRef.current = true

      setFeedback(feedbackData)
      setStatusText('Interview feedback is ready')
      toast.add({ title: 'Interview feedback generated.' })

      const savedId = result.data?.saved?.[0]?.id
      if (savedId) {
        router.push(`/interview/${interviewId}/completed?feedback=${savedId}`)
      }
    } catch (error) {
      // A 4xx is a known, explained problem (shown in the toast), not a crash.
      const status = error?.response?.status
      if (status >= 400 && status < 500) console.warn('Interview feedback was not generated:', error?.response?.data?.error)
      else console.error('Unable to generate interview feedback:', error)
      setStatusText('Interview ended, but feedback could not be generated.')
      toast.add({
        title: error?.response?.data?.error || error?.message || 'Unable to generate feedback.',
      })
    } finally {
      feedbackInProgressRef.current = false
    }
  }

  generateFeedbackRef.current = generateFeedback

  const candidateName = interviewInfo?.userName || 'You'
  const jobPosition = interviewInfo?.interviewData?.jobPosition

  return (
    <main className='mx-auto w-full max-w-5xl px-4 pb-14 pt-6 md:px-8'>
      <div className='flex flex-wrap items-end justify-between gap-3'>
        <div>
          <p className='text-xs font-medium text-orange-600'>AI interview session</p>
          <h1 className='mt-1 text-[24px] font-semibold tracking-tight text-slate-900'>{jobPosition || 'Interview'}</h1>
        </div>
        <span className='inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm text-slate-700 ring-1 ring-orange-100' style={{ fontVariantNumeric: 'tabular-nums' }}>
          {callActive && <span className='size-2 animate-pulse rounded-full bg-red-500' />}
          <Timer className='size-4 text-orange-500' />
          {formatDuration(elapsedSeconds)}
        </span>
      </div>

      <div className='mt-5 grid grid-cols-1 gap-4 md:grid-cols-2'>
        <div className={cn('card-soft flex h-[340px] flex-col items-center justify-center gap-3 rounded-2xl transition-colors', isAssistantSpeaking && 'bg-orange-50/50 ring-2 ring-orange-200')}>
          <div className='relative'>
            {isAssistantSpeaking && <span className='absolute inset-0 animate-ping rounded-full bg-orange-400 opacity-60' />}
            <Image src={'/ai.png'} alt='AI interviewer'
              width={100}
              height={100}
              className='relative size-[72px] rounded-full object-cover ring-4 ring-white'
            />
          </div>
          <p className='text-sm font-medium text-slate-900'>AI Interviewer</p>
          <p className='text-xs text-slate-400'>{isAssistantSpeaking ? 'Speaking…' : callActive ? 'Listening' : 'Waiting to start'}</p>
        </div>
        <div className={cn('card-soft flex h-[340px] flex-col items-center justify-center gap-3 rounded-2xl transition-colors', isCandidateSpeaking && 'bg-emerald-50/40 ring-2 ring-emerald-200')}>
          <div className='relative'>
            {isCandidateSpeaking && <span className='absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-60' />}
            <span className='relative flex size-[72px] items-center justify-center rounded-full bg-orange-500 text-2xl font-medium text-white ring-4 ring-white'>
              {candidateName[0]?.toUpperCase()}
            </span>
          </div>
          <p className='text-sm font-medium text-slate-900'>{candidateName}</p>
          <p className='text-xs text-slate-400'>{isCandidateSpeaking ? 'Speaking…' : callActive ? 'Mic on' : 'Ready'}</p>
        </div>
      </div>

      {!callActive && (
        <div className='mt-6 flex justify-center'>
          <button
            type='button'
            onClick={startCall}
            disabled={!interviewInfo || isStarting}
            className='btn-orange inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl px-6 text-sm font-medium text-white transition-[filter,transform] hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50'
          >
            <Mic className='size-4' />
            {isStarting ? 'Connecting…' : 'Start interview'}
          </button>
        </div>
      )}

      {callActive && (
        <div className='mt-6 flex items-center justify-center gap-4'>
          <span className='flex size-12 items-center justify-center rounded-full bg-white text-orange-500 ring-1 ring-orange-100' title='Microphone on'>
            <Mic className='size-5' />
          </span>
          <AlertConfirmation stopInterview={stopInterview}>
            <span className='flex size-12 cursor-pointer items-center justify-center rounded-full bg-red-500 text-white shadow-md shadow-red-500/30 transition-colors hover:bg-red-600' title='End interview'>
              <Phone className='size-5 rotate-[135deg]' />
            </span>
          </AlertConfirmation>
        </div>
      )}

      {statusText && <p className='mt-4 text-center text-[13px] text-slate-500'>{statusText}</p>}
      {feedback?.summary && (
        <div className='card-soft mx-auto mt-5 max-w-2xl rounded-2xl p-5'>
          <h3 className='text-[15px] font-semibold text-slate-900'>Interview feedback</h3>
          <p className='mt-2 whitespace-pre-line text-[13px] leading-relaxed text-slate-600'>{feedback.summary}</p>
        </div>
      )}
    </main>
  )
}

export default StartInterview
