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

// How long the candidate may stay silent before the assistant moves to the next question.
const CANDIDATE_SILENCE_LIMIT_MS = 5 * 60 * 1000

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
  // Candidate-silence tracking: after CANDIDATE_SILENCE_LIMIT_MS of no reply, tell the assistant to move on.
  const lastActivityAtRef = useRef(0)
  const silenceCheckRef = useRef(null)
  const assistantSpeakingRef = useRef(false)
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

      lastActivityAtRef.current = Date.now()
      clearInterval(silenceCheckRef.current)
      silenceCheckRef.current = setInterval(() => {
        if (!callActiveRef.current || assistantSpeakingRef.current) return
        if (Date.now() - lastActivityAtRef.current < CANDIDATE_SILENCE_LIMIT_MS) return
        lastActivityAtRef.current = Date.now()
        try {
          vapi.send({
            type: 'add-message',
            message: {
              role: 'system',
              content:
                'The candidate has not replied for 5 minutes. Say "No problem, let\'s move on." and ask the next question. If that was the last question, give the closing feedback instead.',
            },
            triggerResponseEnabled: true,
          })
        } catch (_) {
          // call may have just ended
        }
      }, 5000)

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
      clearInterval(silenceCheckRef.current)
      silenceCheckRef.current = null
      assistantSpeakingRef.current = false
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
      // Any candidate speech (partial or final) counts as activity and resets the 5-minute silence timer.
      if (message?.type === 'transcript' && message?.role === 'user' && message?.transcript) {
        lastActivityAtRef.current = Date.now()
      }

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
      assistantSpeakingRef.current = true
      setIsAssistantSpeaking(true)
    }

    const onSpeechEnd = () => {
      // The candidate's 5-minute window starts once the assistant finishes speaking.
      assistantSpeakingRef.current = false
      lastActivityAtRef.current = Date.now()
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
      clearInterval(silenceCheckRef.current)
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
      // Vapi hangs up after 30s of silence by default. Keep the call open while the candidate
      // thinks; the client-side 5-minute timer (CANDIDATE_SILENCE_LIMIT_MS) moves things along instead.
      silenceTimeoutSeconds: 7 * 60,
      // Default max call length is 10 minutes, which can cut interviews short.
      maxDurationSeconds: 60 * 60,
      // Wait longer before deciding the candidate finished talking, so short pauses while
      // thinking are not treated as the end of an answer.
      startSpeakingPlan: {
        waitSeconds: 1.5,
        transcriptionEndpointingPlan: {
          onPunctuationSeconds: 1.5,
          onNoPunctuationSeconds: 3,
          onNumberSeconds: 2,
        },
      },
      model: {
        provider: 'openai',
        model: 'gpt-4o',
        // Low temperature so the assistant sticks to the strict interviewer rules below.
        temperature: 0.3,
        // Lets the assistant hang up by itself after the closing feedback; call-end then triggers written feedback.
        tools: [{ type: 'endCall' }],
        messages: [
          {
            role: 'system',
            content: `
You are a professional interviewer conducting a voice interview for the ${interviewInfo?.interviewData?.jobPosition} role.
You ask questions. You never answer them. You are an interviewer, not a teacher or a tutor.

=== STRICT RULES (these override everything else) ===
1. NEVER repeat, restate, paraphrase or summarize what the candidate said.
2. NEVER give the answer, a model answer, a hint, an example, a keyword or an explanation of the concept — not even if the candidate asks, insists, or says they don't know.
3. NEVER say whether an answer is right, wrong, good or bad while the questions are still going. No praise, no correction, no "Great answer", no "Not quite".
4. After the candidate answers, say ONLY a short neutral acknowledgement ("Thank you.", "Okay.", "Got it.") and then immediately ask the next question.
5. Keep every turn to one or two short sentences.

Examples of what you must NEVER say:
- "So you're saying that React uses a virtual DOM to..."            (repeating the answer)
- "Great answer! You covered state and props really well."         (evaluating mid-interview)
- "Actually, the correct answer is..." / "Hint: think about caching." (giving answers or hints)

Correct example:
Candidate: "...and that's how I'd handle the API errors."
You: "Thank you. Question 3 of ${questions.length}: <next question>"

If the candidate asks for the answer or a hint, reply exactly like:
"I'm not able to share answers during the interview, but you'll get feedback at the end. Let's move on." — then ask the next question.

=== WHEN THE CANDIDATE NEEDS TIME ===
- If the candidate says "wait", "one minute", "hold on", "let me think", "give me a moment" or anything similar, reply ONLY "Sure, take your time." and then stay silent. Do NOT ask the next question.
- Stay on the current question until the candidate actually gives an answer, or says something like "you can proceed", "next question", "skip", "move on" or "I don't know".
- If the candidate's reply sounds unfinished (cut off mid-sentence, "umm", "so...", "and..."), they are still thinking: reply ONLY "Take your time." Do NOT move on.
- Never rush the candidate. The system will tell you if they have been silent too long; only then move on.

=== IF THE CANDIDATE WANTS TO END EARLY ===
- If the candidate says they want to stop before all questions are done (e.g. "I am done", "we can end here", "I want to stop", "end the interview"), confirm ONCE: "Sure. Just to confirm, you'd like to end the interview now?"
- If they confirm (yes / sure / end it), give 2–3 sentences of brief feedback on the questions they answered (do not reveal answers), say "Thank you for your time. Your written feedback will appear on screen in a moment. Goodbye!" and then end the call yourself using the endCall tool. Do not ask the candidate to hang up.
- If they say no or want to continue, say "No problem, let's continue." and repeat the current question.

=== THE QUESTIONS ===
This interview has exactly ${questions.length} questions. Ask ALL of them, one at a time, in this order:
${questionList}

- Ask every question in order. Do not skip, merge, or add questions of your own.
- Before each question, say its number, e.g. "Question 2 of ${questions.length}".
- Wait for the candidate's full answer before moving on.
- If asked to repeat the question, repeat the question only.
- If asked what the question means, you may reword the question itself, without hinting at the answer.
- If the candidate says they don't know, say "No problem." and move to the next question.

=== START ===
You have already greeted the candidate. As soon as they reply, ask Question 1. Do not greet them again.

=== END: SPOKEN FEEDBACK ===
Only after question ${questions.length} has been answered, the strict rule 3 no longer applies. Give short spoken feedback on the whole interview (about 4–5 sentences):
- 1–2 things they did well.
- 1–2 areas to improve (name the topic or skill, e.g. "explaining trade-offs", "giving concrete examples").
- Be honest but encouraging. Do not read out model answers.
Then say: "Detailed written feedback will appear on your screen in a moment. Thank you for your time, and good luck!" and end the call yourself using the endCall tool.
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
